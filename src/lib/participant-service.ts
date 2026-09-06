import {
  studentsCol,
  teamsCol,
  programsCol,
  programRegistrationsCol,
  approvedResultsCol,
  pendingResultsCol,
  docsToData,
} from "./models";
import type {
  Student,
  Team,
  Program,
  ProgramRegistration,
  ResultRecord,
} from "./types";

export interface ParticipantProfile {
  student: Student;
  team: Team;
  registrations: (ProgramRegistration & {
    program: Program;
    status: "registered" | "pending_result" | "completed" | "no_result";
    result?: {
      position?: 1 | 2 | 3;
      grade?: "A" | "B" | "C" | "none";
      score: number;
      programName: string;
      submittedAt: string;
    };
    penalty?: {
      points: number;
      reason?: string;
    };
  })[];
  totalPoints: number;
  stats: {
    totalPrograms: number;
    completedPrograms: number;
    pendingPrograms: number;
    registeredPrograms: number;
    wins: {
      first: number;
      second: number;
      third: number;
    };
    grades: {
      A: number;
      B: number;
      C: number;
    };
    totalPenalties: number;
    pointsByCategory: {
      position: number;
      grade: number;
      penalty: number;
    };
  };
}

export async function searchParticipant(query: string): Promise<Student[]> {
  const searchTerm = query.trim().toLowerCase();
  if (!searchTerm) return [];

  const snap = await studentsCol.get();
  const allStudents = docsToData<Student>(snap);

  return allStudents
    .filter(
      (s) =>
        s.chest_no.toLowerCase().includes(searchTerm) ||
        s.name.toLowerCase().includes(searchTerm)
    )
    .slice(0, 20);
}

export async function getParticipantProfile(
  identifier: string,
): Promise<ParticipantProfile | null> {
  const snap = await studentsCol.get();
  const allStudents = docsToData<Student>(snap);

  const student = allStudents.find(
    (s) => s.id === identifier || s.chest_no.toLowerCase() === identifier.toLowerCase()
  );

  if (!student) return null;

  const teamDoc = await teamsCol.doc(student.team_id).get();
  if (!teamDoc.exists) return null;
  const team = teamDoc.data() as Team;

  const regsSnap = await programRegistrationsCol.where("studentId", "==", student.id).get();
  const registrations = docsToData<ProgramRegistration>(regsSnap);

  const programsSnap = await programsCol.get();
  const programs = docsToData<Program>(programsSnap);
  const programMap = new Map(programs.map((p) => [p.id, p]));

  const [approvedSnap, pendingSnap] = await Promise.all([
    approvedResultsCol.get(),
    pendingResultsCol.get(),
  ]);

  const approvedResults = docsToData<ResultRecord>(approvedSnap);
  const pendingResults = docsToData<ResultRecord>(pendingSnap);

  const resultMap = new Map<string, ResultRecord>();
  approvedResults.forEach((r) => resultMap.set(r.program_id, r));

  const enrichedRegistrations: ParticipantProfile["registrations"] = registrations.map((reg) => {
    const program = programMap.get(reg.programId) || ({ id: reg.programId, name: reg.programName } as Program);
    const result = resultMap.get(reg.programId);
    const isApproved = approvedResults.some((r) => r.program_id === reg.programId);
    const isPending = pendingResults.some((r) => r.program_id === reg.programId);

    let status: "registered" | "pending_result" | "completed" | "no_result";
    if (isApproved) {
      status = "completed";
    } else if (isPending) {
      status = "pending_result";
    } else {
      status = "registered";
    }

    let resultEntry: {
      position?: 1 | 2 | 3;
      grade?: "A" | "B" | "C" | "none";
      score: number;
    } | undefined;

    let penaltyEntry: { points: number; reason?: string } | undefined;

    if (result) {
      const entry = result.entries.find((e) => e.student_id === student.id);
      if (entry) {
        resultEntry = {
          position: entry.position,
          grade: entry.grade,
          score: entry.score,
        };
      }

      const penalty = result.penalties?.find((p) => p.student_id === student.id);
      if (penalty) {
        penaltyEntry = {
          points: penalty.points,
          reason: penalty.reason,
        };
      }
    }

    return {
      ...reg,
      program,
      status,
      result: resultEntry
        ? {
            ...resultEntry,
            programName: program.name,
            submittedAt: result?.submitted_at || "",
          }
        : undefined,
      penalty: penaltyEntry,
    };
  });

  const stats = {
    totalPrograms: enrichedRegistrations.length,
    completedPrograms: enrichedRegistrations.filter((r) => r.status === "completed").length,
    pendingPrograms: enrichedRegistrations.filter((r) => r.status === "pending_result").length,
    registeredPrograms: enrichedRegistrations.filter((r) => r.status === "registered").length,
    wins: {
      first: enrichedRegistrations.filter((r) => r.result?.position === 1).length,
      second: enrichedRegistrations.filter((r) => r.result?.position === 2).length,
      third: enrichedRegistrations.filter((r) => r.result?.position === 3).length,
    },
    grades: {
      A: enrichedRegistrations.filter((r) => r.result?.grade === "A").length,
      B: enrichedRegistrations.filter((r) => r.result?.grade === "B").length,
      C: enrichedRegistrations.filter((r) => r.result?.grade === "C").length,
    },
    totalPenalties: enrichedRegistrations.reduce(
      (sum, r) => sum + (r.penalty?.points || 0),
      0,
    ),
    pointsByCategory: {
      position: enrichedRegistrations.reduce(
        (sum, r) => sum + (r.result?.score || 0),
        0,
      ),
      grade: 0,
      penalty: enrichedRegistrations.reduce(
        (sum, r) => sum + (r.penalty?.points || 0),
        0,
      ),
    },
  };

  return {
    student,
    team,
    registrations: enrichedRegistrations,
    totalPoints: student.total_points,
    stats,
  };
}
