import { connectDB } from "./db";
import {
  StudentModel,
  TeamModel,
  ProgramModel,
  ProgramRegistrationModel,
  ApprovedResultModel,
  PendingResultModel,
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

/**
 * Search for a participant by chest number or name
 */
export async function searchParticipant(
  query: string,
): Promise<Student[]> {
  await connectDB();
  
  const searchTerm = query.trim().toLowerCase();
  if (!searchTerm) return [];

  const students = await StudentModel.find({
    $or: [
      { chest_no: { $regex: searchTerm, $options: "i" } },
      { name: { $regex: searchTerm, $options: "i" } },
    ],
  })
    .limit(20)
    .lean<Student[]>();

  return students.map((s) => JSON.parse(JSON.stringify(s)));
}

/**
 * Get complete participant profile by student ID or chest number
 */
export async function getParticipantProfile(
  identifier: string,
): Promise<ParticipantProfile | null> {
  await connectDB();

  // Find student by ID or chest number
  const student = await StudentModel.findOne({
    $or: [{ id: identifier }, { chest_no: identifier }],
  }).lean<Student>();

  if (!student) return null;

  // Get team
  const team = await TeamModel.findOne({ id: student.team_id }).lean<Team>();
  if (!team) return null;

  // Get all registrations for this student
  const registrations = await ProgramRegistrationModel.find({
    studentId: student.id,
  }).lean<ProgramRegistration[]>();

  // Get all programs
  const programs = await ProgramModel.find().lean<Program[]>();
  const programMap = new Map(programs.map((p) => [p.id, p]));

  // Get all approved results
  const approvedResults = await ApprovedResultModel.find().lean<ResultRecord[]>();
  
  // Get pending results (for status checking)
  const pendingResults = await PendingResultModel.find().lean<ResultRecord[]>();

  // Create a map of program_id -> result
  const resultMap = new Map<string, ResultRecord>();
  approvedResults.forEach((r) => resultMap.set(r.program_id, r));
  pendingResults.forEach((r) => {
    if (!resultMap.has(r.program_id)) {
      resultMap.set(r.program_id, r);
    }
  });

  // Build enriched registrations
  const enrichedRegistrations = registrations.map((reg) => {
    const program = programMap.get(reg.programId);
    if (!program) {
      return {
        ...reg,
        program: { id: reg.programId, name: reg.programName } as Program,
        status: "registered" as const,
      };
    }

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

    // Find student's result entry
    let resultEntry: {
      position?: 1 | 2 | 3;
      grade?: "A" | "B" | "C" | "none";
      score: number;
    } | undefined;

    let penaltyEntry: { points: number; reason?: string } | undefined;

    if (result) {
      // Find entry for this student
      const entry = result.entries.find((e) => e.student_id === student.id);
      if (entry) {
        resultEntry = {
          position: entry.position,
          grade: entry.grade,
          score: entry.score,
        };
      }

      // Find penalty for this student
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

  // Calculate statistics
  const stats = {
    totalPrograms: enrichedRegistrations.length,
    completedPrograms: enrichedRegistrations.filter((r) => r.status === "completed").length,
    pendingPrograms: enrichedRegistrations.filter((r) => r.status === "pending_result").length,
    registeredPrograms: enrichedRegistrations.filter((r) => r.status === "registered").length,
    wins: {
      first: enrichedRegistrations.filter((r) => "result" in r && r.result?.position === 1).length,
      second: enrichedRegistrations.filter((r) => "result" in r && r.result?.position === 2).length,
      third: enrichedRegistrations.filter((r) => "result" in r && r.result?.position === 3).length,
    },
    grades: {
      A: enrichedRegistrations.filter((r) => "result" in r && r.result?.grade === "A").length,
      B: enrichedRegistrations.filter((r) => "result" in r && r.result?.grade === "B").length,
      C: enrichedRegistrations.filter((r) => "result" in r && r.result?.grade === "C").length,
    },
    totalPenalties: enrichedRegistrations.reduce(
      (sum, r) => sum + ("penalty" in r && r.penalty?.points || 0),
      0,
    ),
    pointsByCategory: {
      position: enrichedRegistrations.reduce(
        (sum, r) => sum + ("result" in r && r.result?.score || 0),
        0,
      ),
      grade: 0, // Grade points are included in position score
      penalty: enrichedRegistrations.reduce(
        (sum, r) => sum + ("penalty" in r && r.penalty?.points || 0),
        0,
      ),
    },
  };

  return {
    student: JSON.parse(JSON.stringify(student)),
    team: JSON.parse(JSON.stringify(team)),
    registrations: enrichedRegistrations,
    totalPoints: student.total_points,
    stats,
  };
}

