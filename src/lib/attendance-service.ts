import { connectDB } from "./db";
import { AttendanceModel } from "./models";
import type { AttendanceRecord } from "./types";

export function normalize<T>(docs: T[]): T[] {
  if (!docs || !Array.isArray(docs)) return [];
  return docs.map((doc) => JSON.parse(JSON.stringify(doc)));
}

/**
 * Get attendance records for a specific program
 */
export async function getProgramAttendance(programId: string): Promise<AttendanceRecord[]> {
  await connectDB();
  const records = await AttendanceModel.find({ programId }).lean<AttendanceRecord[]>();
  return normalize(records);
}

/**
 * Get all attendance records
 */
export async function getAllAttendance(): Promise<AttendanceRecord[]> {
  await connectDB();
  const records = await AttendanceModel.find().lean<AttendanceRecord[]>();
  return normalize(records);
}

/**
 * Mark a student's attendance for a program
 */
export async function markStudentAttendance(input: {
  programId: string;
  studentId: string;
  studentChest: string;
  studentName?: string;
  teamId?: string;
  teamName?: string;
  status?: "present" | "absent";
  markedBy?: string;
}): Promise<AttendanceRecord> {
  await connectDB();
  const recordId = `${input.programId}_${input.studentId}`;
  const now = new Date().toISOString();
  const status = input.status || "present";

  const record: AttendanceRecord = {
    id: recordId,
    programId: input.programId,
    studentId: input.studentId,
    studentChest: input.studentChest.trim().toUpperCase(),
    studentName: input.studentName,
    teamId: input.teamId,
    teamName: input.teamName,
    status,
    markedAt: now,
    markedBy: input.markedBy || "Admin",
  };

  await AttendanceModel.updateOne(
    { id: recordId },
    { $set: record },
    { upsert: true }
  );

  return record;
}

/**
 * Toggle student attendance (present <-> absent)
 */
export async function toggleStudentAttendance(input: {
  programId: string;
  studentId: string;
  studentChest: string;
  studentName?: string;
  teamId?: string;
  teamName?: string;
}): Promise<AttendanceRecord> {
  await connectDB();
  const recordId = `${input.programId}_${input.studentId}`;
  const existing = await AttendanceModel.findOne({ id: recordId }).lean<AttendanceRecord | null>();

  const newStatus: "present" | "absent" = existing?.status === "present" ? "absent" : "present";

  return markStudentAttendance({
    ...input,
    status: newStatus,
  });
}

/**
 * Mark all students for a program (batch)
 */
export async function markAllProgramAttendance(
  programId: string,
  students: Array<{
    studentId: string;
    studentChest: string;
    studentName?: string;
    teamId?: string;
    teamName?: string;
  }>,
  status: "present" | "absent" = "present"
): Promise<void> {
  await connectDB();
  const now = new Date().toISOString();

  await Promise.all(
    students.map((s) => {
      const recordId = `${programId}_${s.studentId}`;
      const record: AttendanceRecord = {
        id: recordId,
        programId,
        studentId: s.studentId,
        studentChest: s.studentChest.trim().toUpperCase(),
        studentName: s.studentName,
        teamId: s.teamId,
        teamName: s.teamName,
        status,
        markedAt: now,
        markedBy: "Admin",
      };
      return AttendanceModel.updateOne(
        { id: recordId },
        { $set: record },
        { upsert: true }
      );
    })
  );
}

/**
 * Clear attendance records for a program
 */
export async function clearProgramAttendance(programId: string): Promise<void> {
  await connectDB();
  await AttendanceModel.deleteMany({ programId });
}
