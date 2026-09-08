import { cache } from "react";
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
      position?: number;
      grade?: "A" | "B" | "C" | "none";
      position_points?: number;
      grade_points?: number;
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

let cachedStudents: { timestamp: number; data: Student[] } | null = null;
const CACHE_TTL = 30000; // 30s cache for fast search

async function getAllStudentsCached(): Promise<Student[]> {
  const now = Date.now();
  if (cachedStudents && now - cachedStudents.timestamp < CACHE_TTL) {
    return cachedStudents.data;
  }
  const snap = await studentsCol.get();
  const data = docsToData<Student>(snap);
  cachedStudents = { timestamp: now, data };
  return data;
}

export async function searchParticipant(query: string): Promise<Student[]> {
  const searchTerm = query.trim().toLowerCase();
  if (!searchTerm) return [];

  const allStudents = await getAllStudentsCached();

  return allStudents
    .filter(
      (s) =>
        s.chest_no.toLowerCase().includes(searchTerm) ||
        s.name.toLowerCase().includes(searchTerm)
    )
    .slice(0, 20);
}

export const getParticipantProfile = cache(async (
  identifier: string,
): Promise<ParticipantProfile | null> => {
  const cleanId = identifier.trim();
  let student: Student | null = null;

  // Direct lookup by ID first
  const byId = await studentsCol.doc(cleanId).get();
  if (byId.exists) {
    student = { id: byId.id, ...byId.data() } as Student;
  } else {
    // Direct lookup by chest_no (case-insensitive search)
    const byChest = await studentsCol
      .where("chest_no", "==", cleanId.toUpperCase())
      .limit(1)
      .get();
    if (!byChest.empty) {
      student = { id: byChest.docs[0].id, ...byChest.docs[0].data() } as Student;
    } else {
      // Fallback in case of case differences
      const allStudents = await getAllStudentsCached();
      student = allStudents.find(
        (s) => s.id === cleanId || s.chest_no.toLowerCase() === cleanId.toLowerCase()
      ) || null;
    }
  }

  if (!student) return null;

  // Execute all required queries in parallel instead of sequentially
  const [teamDoc, regsSnap, programsSnap, approvedSnap, pendingSnap] = await Promise.all([
    teamsCol.doc(student.team_id).get(),
    programRegistrationsCol.where("studentId", "==", student.id).get(),
    programsCol.get(),
    approvedResultsCol.get(),
    pendingResultsCol.get(),
  ]);

  if (!teamDoc.exists) return null;
  const team = { id: teamDoc.id, ...teamDoc.data() } as Team;

  const registrations = docsToData<ProgramRegistration>(regsSnap);
  const programs = docsToData<Program>(programsSnap);
  const programMap = new Map(programs.map((p) => [p.id, p]));

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
      position?: number;
      grade?: "A" | "B" | "C" | "none";
      position_points?: number;
      grade_points?: number;
      score: number;
    } | undefined;

    let penaltyEntry: { points: number; reason?: string } | undefined;

    if (result) {
      const entry = result.entries.find((e) => e.student_id === student.id);
      if (entry) {
        resultEntry = {
          position: entry.position,
          grade: entry.grade,
          position_points: entry.position_points ?? entry.score,
          grade_points: entry.grade_points ?? 0,
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
        (sum, r) => sum + (r.result?.position_points ?? r.result?.score ?? 0),
        0,
      ),
      grade: enrichedRegistrations.reduce(
        (sum, r) => sum + (r.result?.grade_points ?? 0),
        0,
      ),
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
});
