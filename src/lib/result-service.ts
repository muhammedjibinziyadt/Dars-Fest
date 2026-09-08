import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import {
  calculateScore,
  getScoringRules,
  updateAssignmentStatus,
  updateLiveScore,
  updateStudentScore,
} from "./data";
import {
  programsCol,
  juriesCol,
  studentsCol,
  teamsCol,
  pendingResultsCol,
  approvedResultsCol,
  docsToData,
  docToData,
} from "./models";
import { adminDb } from "./firebase-admin";
import type { PenaltyEntry, ResultEntry, ResultRecord, Student, Team, Program, Jury } from "./types";

type WinnerPayload = {
  position: 1 | 2 | 3;
  id: string;
  grade: "A" | "B" | "C" | "none";
};

type PenaltyPayload = {
  id: string;
  type: "student" | "team";
  points: number;
  reason?: string;
};

function sanitizeGrade(grade: string | undefined): "A" | "B" | "C" | "none" {
  if (grade === "A" || grade === "B" || grade === "C" || grade === "none") {
    return grade;
  }
  return "none";
}

async function buildEntries(
  program: { id: string; section: string; category: string },
  winners: WinnerPayload[],
) {
  const scoringRules = await getScoringRules();

  if (program.section === "single") {
    const ids = winners.map((winner) => winner.id);
    const studentsSnap = await studentsCol.get();
    const students = docsToData<Student>(studentsSnap).filter((s) => ids.includes(s.id));
    const studentMap = new Map(students.map((student) => [student.id, student]));

    return winners.map((winner) => {
      const student = studentMap.get(winner.id);
      if (!student) {
        throw new Error("Invalid student selected");
      }
      const grade = sanitizeGrade(winner.grade);
      return {
        position: winner.position,
        student_id: student.id,
        team_id: student.team_id,
        grade,
        score: calculateScore(
          program.section as "single",
          program.category as "A" | "B" | "C" | "none",
          winner.position,
          grade,
          scoringRules,
        ),
      };
    });
  }

  const ids = winners.map((winner) => winner.id);
  const teamsSnap = await teamsCol.get();
  const teams = docsToData<Team>(teamsSnap).filter((t) => ids.includes(t.id));
  const teamMap = new Map(teams.map((team) => [team.id, team]));

  return winners.map((winner) => {
    const team = teamMap.get(winner.id);
    if (!team) {
      throw new Error("Invalid team selected");
    }
    return {
      position: winner.position,
      team_id: team.id,
      grade: "none" as const,
      score: calculateScore(
        program.section as "group" | "general",
        "none",
        winner.position,
        "none",
        scoringRules,
      ),
    };
  });
}

async function applyEntryScores(entries: ResultEntry[], direction: 1 | -1) {
  for (const entry of entries) {
    const delta = entry.score * direction;
    if (entry.student_id) {
      await updateStudentScore(entry.student_id, delta);
    }
    if (entry.team_id) {
      await updateLiveScore(entry.team_id, delta);
    }
  }
}

async function buildPenaltyEntries(penalties?: PenaltyPayload[] | null) {
  if (!penalties || penalties.length === 0) {
    return [] as PenaltyEntry[];
  }

  const studentIds = Array.from(
    new Set(
      penalties
        .filter((penalty) => penalty.type === "student")
        .map((penalty) => penalty.id),
    ),
  );
  const teamIds = Array.from(
    new Set(
      penalties
        .filter((penalty) => penalty.type === "team")
        .map((penalty) => penalty.id),
    ),
  );

  const [studentsSnap, teamsSnap] = await Promise.all([
    studentIds.length > 0 ? studentsCol.get() : null,
    teamIds.length > 0 ? teamsCol.get() : null,
  ]);

  const students = studentsSnap ? docsToData<Student>(studentsSnap).filter((s) => studentIds.includes(s.id)) : [];
  const teams = teamsSnap ? docsToData<Team>(teamsSnap).filter((t) => teamIds.includes(t.id)) : [];

  const studentMap = new Map(students.map((student) => [student.id, student]));
  const teamMap = new Map(teams.map((team) => [team.id, team]));

  return penalties.map((penalty) => {
    if (penalty.type === "student") {
      const student = studentMap.get(penalty.id);
      if (!student) {
        throw new Error("Invalid student selected for minus points.");
      }
      return {
        student_id: student.id,
        team_id: student.team_id,
        points: penalty.points,
        reason: penalty.reason,
      };
    }

    const team = teamMap.get(penalty.id);
    if (!team) {
      throw new Error("Invalid team selected for minus points.");
    }
    return {
      team_id: team.id,
      points: penalty.points,
      reason: penalty.reason,
    };
  });
}

async function applyPenalties(
  penalties: PenaltyEntry[] | undefined,
  direction: 1 | -1,
) {
  if (!penalties || penalties.length === 0) return;

  for (const penalty of penalties) {
    const delta = penalty.points * direction;
    if (penalty.team_id) {
      await updateLiveScore(penalty.team_id, -delta);
    }
  }
}

export async function submitResultToPending({
  programId,
  juryId,
  winners,
  penalties: penaltyPayloads,
}: {
  programId: string;
  juryId: string;
  winners: WinnerPayload[];
  penalties?: PenaltyPayload[] | null;
}) {
  const [programDoc, juryDoc] = await Promise.all([
    programsCol.doc(programId).get(),
    juriesCol.doc(juryId).get(),
  ]);

  if (!programDoc.exists) throw new Error("Program not found");
  if (!juryDoc.exists) throw new Error("Jury not found");

  const program = programDoc.data() as Program;
  const jury = juryDoc.data() as Jury;

  const [pendingSnap, approvedSnap] = await Promise.all([
    pendingResultsCol.where("program_id", "==", programId).limit(1).get(),
    approvedResultsCol.where("program_id", "==", programId).limit(1).get(),
  ]);

  if (!pendingSnap.empty) {
    const pendingResult = pendingSnap.docs[0].data() as ResultRecord;
    const existingJuryDoc = await juriesCol.doc(pendingResult.jury_id).get();
    const juryName = existingJuryDoc.exists ? (existingJuryDoc.data() as Jury).name : "Unknown Jury";
    throw new Error(
      `A pending result already exists for program "${program.name}" submitted by ${juryName}. Please wait for admin approval or contact support.`
    );
  }

  if (!approvedSnap.empty) {
    throw new Error("Program already published");
  }

  const entries = await buildEntries(program, winners);
  const penalties = await buildPenaltyEntries(penaltyPayloads);

  const id = randomUUID();
  const record: ResultRecord = {
    id,
    program_id: program.id,
    jury_id: jury.id,
    submitted_by: jury.name,
    submitted_at: new Date().toISOString(),
    entries,
    penalties,
    status: "pending",
  };

  await pendingResultsCol.doc(id).set(record);
  await updateAssignmentStatus(program.id, jury.id, "submitted");

  revalidatePath("/admin/pending-results");
  revalidatePath("/jury/programs");
}

export async function approveResult(resultId: string) {
  const doc = await pendingResultsCol.doc(resultId).get();
  let record: ResultRecord | null = null;

  if (doc.exists) {
    record = doc.data() as ResultRecord;
  } else {
    const snap = await pendingResultsCol.where("id", "==", resultId).limit(1).get();
    if (!snap.empty) {
      record = snap.docs[0].data() as ResultRecord;
    }
  }

  if (!record) {
    throw new Error("Result not found");
  }

  await pendingResultsCol.doc(record.id).delete();

  const approvedRecord: ResultRecord = {
    ...record,
    status: "approved",
    submitted_at: new Date().toISOString(),
  };

  await approvedResultsCol.doc(record.id).set(approvedRecord);

  await applyEntryScores(record.entries, 1);
  await applyPenalties(record.penalties, 1);

  await updateAssignmentStatus(record.program_id, record.jury_id, "completed");

  try {
    const { createResultPublishedNotification } = await import("./notification-service");
    await createResultPublishedNotification(resultId, record.program_id);
  } catch (err) {
    console.error("Failed to create notification:", err);
  }

  try {
    const { evaluatePredictionsForProgram } = await import("./prediction-service");
    await evaluatePredictionsForProgram(record.program_id, record.entries);
  } catch (error) {
    console.error("Failed to auto-evaluate predictions:", error);
  }

  revalidatePath("/");
  revalidatePath("/scoreboard");
  revalidatePath("/results");
  revalidatePath("/admin/pending-results");
  revalidatePath("/admin/approved-results");
}

export async function rejectResult(resultId: string) {
  const doc = await pendingResultsCol.doc(resultId).get();
  if (!doc.exists) return;
  const record = doc.data() as ResultRecord;

  await pendingResultsCol.doc(resultId).delete();
  await updateAssignmentStatus(record.program_id, record.jury_id, "pending");

  revalidatePath("/admin/pending-results");
  revalidatePath("/jury/programs");
}

export async function updatePendingResultEntries(
  resultId: string,
  winners: WinnerPayload[],
  penaltiesPayload?: PenaltyPayload[] | null,
) {
  const doc = await pendingResultsCol.doc(resultId).get();
  if (!doc.exists) {
    throw new Error("Pending result not found");
  }
  const record = doc.data() as ResultRecord;

  const programDoc = await programsCol.doc(record.program_id).get();
  if (!programDoc.exists) throw new Error("Program not found");
  const program = programDoc.data() as Program;

  const entries = await buildEntries(program, winners);
  const penalties = await buildPenaltyEntries(penaltiesPayload);

  await pendingResultsCol.doc(resultId).update({
    entries,
    penalties,
    submitted_at: new Date().toISOString(),
  });

  revalidatePath("/admin/pending-results");
}

export async function updateApprovedResult(
  resultId: string,
  winners: WinnerPayload[],
  penaltiesPayload?: PenaltyPayload[] | null,
) {
  const doc = await approvedResultsCol.doc(resultId).get();
  if (!doc.exists) {
    throw new Error("Approved result not found");
  }
  const record = doc.data() as ResultRecord;

  const programDoc = await programsCol.doc(record.program_id).get();
  if (!programDoc.exists) throw new Error("Program not found");
  const program = programDoc.data() as Program;

  const entries = await buildEntries(program, winners);
  const penalties = await buildPenaltyEntries(penaltiesPayload);

  await applyEntryScores(record.entries, -1);
  await applyPenalties(record.penalties, -1);

  await approvedResultsCol.doc(resultId).update({
    entries,
    penalties,
    submitted_at: new Date().toISOString(),
  });

  await applyEntryScores(entries, 1);
  await applyPenalties(penalties, 1);

  revalidatePath("/");
  revalidatePath("/scoreboard");
  revalidatePath("/results");
  revalidatePath("/admin/approved-results");
}

export async function deleteApprovedResult(resultId: string) {
  const doc = await approvedResultsCol.doc(resultId).get();
  if (!doc.exists) return;
  const record = doc.data() as ResultRecord;

  await applyEntryScores(record.entries, -1);
  await applyPenalties(record.penalties, -1);
  await approvedResultsCol.doc(resultId).delete();
  await updateAssignmentStatus(record.program_id, record.jury_id, "submitted");

  revalidatePath("/");
  revalidatePath("/scoreboard");
  revalidatePath("/results");
  revalidatePath("/admin/approved-results");
}
