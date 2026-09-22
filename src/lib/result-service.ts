import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import {
  calculateScore,
  updateAssignmentStatus,
  updateLiveScore,
  updateStudentScore,
} from "./data";
import { connectDB } from "./db";
import {
  ApprovedResultModel,
  JuryModel,
  PendingResultModel,
  ProgramModel,
  StudentModel,
  TeamModel,
} from "./models";
import type { PenaltyEntry, ResultEntry, ResultRecord } from "./types";

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
  if (program.section === "single") {
    const ids = winners.map((winner) => winner.id);
    const students = await StudentModel.find({ id: { $in: ids } }).lean();
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
        ),
      };
    });
  }

  const ids = winners.map((winner) => winner.id);
  const teams = await TeamModel.find({ id: { $in: ids } }).lean();
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

  const [students, teams] = await Promise.all([
    studentIds.length > 0 ? StudentModel.find({ id: { $in: studentIds } }).lean() : [],
    teamIds.length > 0 ? TeamModel.find({ id: { $in: teamIds } }).lean() : [],
  ]);
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
  await connectDB();
  const [program, jury] = await Promise.all([
    ProgramModel.findOne({ id: programId }).lean(),
    JuryModel.findOne({ id: juryId }).lean(),
  ]);

  if (!program) throw new Error("Program not found");
  if (!jury) throw new Error("Jury not found");

  // Check for existing results (pending or approved) for this program
  const [pendingResult, approvedResult] = await Promise.all([
    PendingResultModel.findOne({ program_id: programId }).lean(),
    ApprovedResultModel.findOne({ program_id: programId }).lean(),
  ]);
  
  if (pendingResult) {
    const existingJury = await JuryModel.findOne({ id: pendingResult.jury_id }).lean();
    const juryName = existingJury?.name || "Unknown Jury";
    throw new Error(
      `A pending result already exists for program "${program.name}" submitted by ${juryName}. Please wait for admin approval or contact support.`
    );
  }
  
  if (approvedResult) {
    // Return specific error message for published/approved programs
    throw new Error("Program already published");
  }

  const entries = await buildEntries(program, winners);
  const penalties = await buildPenaltyEntries(penaltyPayloads);

  const record: ResultRecord = {
    id: randomUUID(),
    program_id: program.id,
    jury_id: jury.id,
    submitted_by: jury.name,
    submitted_at: new Date().toISOString(),
    entries,
    penalties,
    status: "pending",
  };

  try {
    await PendingResultModel.create(record);
    await updateAssignmentStatus(program.id, jury.id, "submitted");
    
    // Emit real-time event
    const { emitResultSubmitted } = await import("./pusher");
    await emitResultSubmitted(record.id, program.id, jury.id);
  } catch (error: any) {
    // Handle MongoDB duplicate key error (code 11000) for program_id unique index
    if (error.code === 11000 && error.keyPattern?.program_id) {
      throw new Error(
        `A result for program "${program.name}" already exists. This may have been submitted by another jury. Please refresh and check.`
      );
    }
    throw error;
  }

  revalidatePath("/admin/pending-results");
  revalidatePath("/jury/programs");
}

export async function approveResult(resultId: string) {
  await connectDB();
  const record = await PendingResultModel.findOne({ id: resultId }).lean();
  if (!record) {
    throw new Error("Result not found");
  }

  await PendingResultModel.deleteOne({ id: resultId });
  const approvedRecord: ResultRecord = {
    ...record,
    status: "approved",
    submitted_at: new Date().toISOString(),
  };
  await ApprovedResultModel.create(approvedRecord);

  await applyEntryScores(record.entries, 1);
  await applyPenalties(record.penalties, 1);

  await updateAssignmentStatus(record.program_id, record.jury_id, "completed");

  // Create notification for all users
  const { createResultPublishedNotification } = await import("./notification-service");
  await createResultPublishedNotification(resultId, record.program_id);

  // Emit real-time event
  const { emitResultApproved } = await import("./pusher");
  await emitResultApproved(resultId, record.program_id);

  revalidatePath("/");
  revalidatePath("/scoreboard");
  revalidatePath("/results");
  revalidatePath("/admin/pending-results");
  revalidatePath("/admin/approved-results");
}

export async function rejectResult(resultId: string) {
  await connectDB();
  const record = await PendingResultModel.findOne({ id: resultId }).lean();
  if (!record) return;
  await PendingResultModel.deleteOne({ id: resultId });
  await updateAssignmentStatus(record.program_id, record.jury_id, "pending");

  // Emit real-time event
  const { emitResultRejected } = await import("./pusher");
  await emitResultRejected(resultId, record.program_id);

  revalidatePath("/admin/pending-results");
  revalidatePath("/jury/programs");
}

export async function updatePendingResultEntries(
  resultId: string,
  winners: WinnerPayload[],
  penaltiesPayload?: PenaltyPayload[] | null,
) {
  await connectDB();
  const record = await PendingResultModel.findOne({ id: resultId }).lean();
  if (!record) {
    throw new Error("Pending result not found");
  }
  const program = await ProgramModel.findOne({ id: record.program_id }).lean();
  if (!program) throw new Error("Program not found");
  const entries = await buildEntries(program, winners);
  const penalties = await buildPenaltyEntries(penaltiesPayload);

  await PendingResultModel.updateOne(
    { id: resultId },
    {
      entries,
      penalties,
      submitted_at: new Date().toISOString(),
    },
  );
  
  // Emit real-time event for pending result update
  const { emitResultSubmitted } = await import("./pusher");
  await emitResultSubmitted(resultId, record.program_id, record.jury_id);
  
  revalidatePath("/admin/pending-results");
}

export async function updateApprovedResult(
  resultId: string,
  winners: WinnerPayload[],
  penaltiesPayload?: PenaltyPayload[] | null,
) {
  await connectDB();
  const record = await ApprovedResultModel.findOne({ id: resultId }).lean();
  if (!record) {
    throw new Error("Approved result not found");
  }
  const program = await ProgramModel.findOne({ id: record.program_id }).lean();
  if (!program) throw new Error("Program not found");
  const entries = await buildEntries(program, winners);
  const penalties = await buildPenaltyEntries(penaltiesPayload);
  await applyEntryScores(record.entries, -1);
  await applyPenalties(record.penalties, -1);
  await ApprovedResultModel.updateOne(
    { id: resultId },
    {
      entries,
      penalties,
      submitted_at: new Date().toISOString(),
    },
  );
  await applyEntryScores(entries, 1);
  await applyPenalties(penalties, 1);
  revalidatePath("/");
  revalidatePath("/scoreboard");
  revalidatePath("/results");
  revalidatePath("/admin/approved-results");
}

export async function deleteApprovedResult(resultId: string) {
  await connectDB();
  const record = await ApprovedResultModel.findOne({ id: resultId }).lean();
  if (!record) return;
  await applyEntryScores(record.entries, -1);
  await applyPenalties(record.penalties, -1);
  await ApprovedResultModel.deleteOne({ id: resultId });
  await updateAssignmentStatus(record.program_id, record.jury_id, "submitted");
  revalidatePath("/");
  revalidatePath("/scoreboard");
  revalidatePath("/results");
  revalidatePath("/admin/approved-results");
}

