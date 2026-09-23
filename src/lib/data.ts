import { randomUUID } from "node:crypto";
import type {
  AssignedProgram,
  GradeType,
  Jury,
  LiveScore,
  Program,
  ResultRecord,
  SectionType,
  Student,
  Team,
} from "./types";
import { connectDB } from "./db";
import {
  ApprovedResultModel,
  AssignedProgramModel,
  JuryModel,
  LiveScoreModel,
  PendingResultModel,
  ProgramModel,
  StudentModel,
  TeamModel,
} from "./models";
import {
  createOrUpdateFirebaseUser,
  deleteFirebaseUser,
  getJuryFirebaseEmail,
} from "./firebase-auth";

function normalize<T>(docs: T[]): T[] {
  return docs.map((doc) => JSON.parse(JSON.stringify(doc)));
}

export async function getTeams(): Promise<Team[]> {
  await connectDB();
  const teams = await TeamModel.find().lean<Team[]>();
  return normalize(teams);
}

export async function getLiveScores(): Promise<LiveScore[]> {
  await connectDB();
  const scores = await LiveScoreModel.find().lean<LiveScore[]>();
  return normalize(scores);
}

export async function getStudents(): Promise<Student[]> {
  await connectDB();
  const students = await StudentModel.find().lean<Student[]>();
  return normalize(students);
}

export async function getPrograms(): Promise<Program[]> {
  await connectDB();
  const programs = await ProgramModel.find().lean<Program[]>();
  return normalize(programs);
}

export async function getJuries(): Promise<Jury[]> {
  await connectDB();
  const juries = await JuryModel.find().lean<Jury[]>();
  const normalized = normalize(juries);
  
  // Ensure all juries have an avatar - assign and persist if missing (only once)
  // Once set, avatar is never changed
  const juriesWithAvatars = await Promise.all(
    normalized.map(async (jury) => {
      if (!jury.avatar) {
        const avatar = getRandomJuryAvatar();
        await JuryModel.updateOne({ id: jury.id }, { $set: { avatar } });
        return { ...jury, avatar };
      }
      return jury;
    })
  );
  
  return juriesWithAvatars;
}

export async function getAssignments(): Promise<AssignedProgram[]> {
  await connectDB();
  const assignments = await AssignedProgramModel.find().lean<AssignedProgram[]>();
  return normalize(assignments);
}

export async function getPendingResults(): Promise<ResultRecord[]> {
  await connectDB();
  const results = await PendingResultModel.find().lean<ResultRecord[]>();
  return normalize(results);
}

export async function getApprovedResults(): Promise<ResultRecord[]> {
  await connectDB();
  const results = await ApprovedResultModel.find().lean<ResultRecord[]>();
  return normalize(results);
}

/**
 * Check if a program result is already approved/published
 * @param programId - The program ID to check
 * @returns true if the program has an approved result, false otherwise
 */
export async function isProgramResultApproved(programId: string): Promise<boolean> {
  await connectDB();
  const approvedResult = await ApprovedResultModel.findOne({ program_id: programId }).lean();
  return !!approvedResult;
}

export async function getPendingResultById(
  id: string,
): Promise<ResultRecord | null> {
  await connectDB();
  const result = await PendingResultModel.findOne({ id }).lean<ResultRecord | null>();
  return result ? JSON.parse(JSON.stringify(result)) : null;
}

export async function getApprovedResultById(
  id: string,
): Promise<ResultRecord | null> {
  await connectDB();
  const result = await ApprovedResultModel.findOne({ id }).lean<ResultRecord | null>();
  return result ? JSON.parse(JSON.stringify(result)) : null;
}

export async function createProgram(input: Omit<Program, "id">): Promise<Program> {
  await connectDB();
  const created = await ProgramModel.create({ ...input, id: randomUUID() });
  return JSON.parse(JSON.stringify(created)) as Program;
}

export async function updateProgramById(
  id: string,
  data: Partial<Omit<Program, "id">>,
) {
  await connectDB();
  await ProgramModel.updateOne({ id }, data);
}

export async function deleteProgramById(id: string) {
  await connectDB();
  await ProgramModel.deleteOne({ id });
}

export async function createStudent(input: Omit<Student, "id" | "total_points">) {
  await connectDB();
  
  // Normalize chest number to uppercase for consistent comparison
  const normalizedChestNo = input.chest_no.trim().toUpperCase();
  
  // Check for duplicate chest number
  const existing = await StudentModel.findOne({ 
    chest_no: normalizedChestNo 
  }).lean();
  
  if (existing) {
    throw new Error(`Chest number "${input.chest_no}" is already registered to student "${existing.name}".`);
  }
  
  try {
    const studentId = randomUUID();
    await StudentModel.create({
      ...input,
      chest_no: normalizedChestNo,
      id: studentId,
      total_points: 0,
    });
    
    // Emit real-time event
    const { emitStudentCreated } = await import("./pusher");
    await emitStudentCreated(studentId, input.team_id);
  } catch (error: any) {
    // Handle MongoDB duplicate key error (code 11000)
    if (error.code === 11000) {
      throw new Error(`Chest number "${input.chest_no}" is already registered.`);
    }
    throw error;
  }
}

export async function updateStudentById(
  id: string,
  data: Partial<Omit<Student, "id">>,
) {
  await connectDB();
  
  // If chest_no is being updated, check for duplicates
  if (data.chest_no) {
    const normalizedChestNo = data.chest_no.trim().toUpperCase();
    
    // Check for duplicate chest number (excluding current student)
    const existing = await StudentModel.findOne({ 
      chest_no: normalizedChestNo,
      id: { $ne: id }
    }).lean();
    
    if (existing) {
      throw new Error(`Chest number "${data.chest_no}" is already registered to student "${existing.name}".`);
    }
    
    // Normalize the chest number in the update data
    data.chest_no = normalizedChestNo;
  }
  
  try {
    // Get team_id before update
    const student = await StudentModel.findOne({ id }).lean();
    const teamId = student?.team_id || data.team_id || "";
    
    await StudentModel.updateOne({ id }, data);
    
    // Emit real-time event
    if (teamId) {
      const { emitStudentUpdated } = await import("./pusher");
      await emitStudentUpdated(id, teamId);
    }
  } catch (error: any) {
    // Handle MongoDB duplicate key error (code 11000)
    if (error.code === 11000) {
      throw new Error(`Chest number "${data.chest_no}" is already registered.`);
    }
    throw error;
  }
}

export async function deleteStudentById(id: string) {
  await connectDB();
  const student = await StudentModel.findOne({ id }).lean();
  await StudentModel.deleteOne({ id });
  
  // Emit real-time event
  if (student?.team_id) {
    const { emitStudentDeleted } = await import("./pusher");
    await emitStudentDeleted(id, student.team_id);
  }
}

// Available jury avatar images
const JURY_AVATARS = [
  "/img/jury.webp",
  "/img/jury1.webp",
  "/img/jury2.webp",
  "/img/jury3.webp",
  "/img/jury4.webp",
];

function getRandomJuryAvatar(): string {
  return JURY_AVATARS[Math.floor(Math.random() * JURY_AVATARS.length)];
}

export async function createJury(input: Omit<Jury, "id">) {
  await connectDB();
  const juryId = `jury-${randomUUID().slice(0, 8)}`;
  // Assign random avatar if not provided - once set, it never changes
  const avatar = input.avatar || getRandomJuryAvatar();
  await JuryModel.create({ 
    ...input, 
    id: juryId,
    avatar, // Avatar is set once at creation and never changes
  });

  // Sync to Firebase Authentication
  try {
    await createOrUpdateFirebaseUser({
      uid: juryId,
      email: getJuryFirebaseEmail(juryId),
      password: input.password,
      displayName: input.name,
      role: "jury",
      metadata: { juryId },
    });
  } catch (err: any) {
    console.error("Failed to sync jury to Firebase Auth:", err?.message || err);
  }
}

export async function updateJuryById(id: string, data: Partial<Omit<Jury, "id">>) {
  await connectDB();
  // Explicitly exclude avatar from updates - avatars are immutable once set
  const { avatar, ...updateData } = data;
  await JuryModel.updateOne({ id }, updateData);

  // Sync to Firebase Authentication
  try {
    await createOrUpdateFirebaseUser({
      uid: id,
      email: getJuryFirebaseEmail(id),
      password: data.password,
      displayName: data.name,
      role: "jury",
      metadata: { juryId: id },
    });
  } catch (err: any) {
    console.error("Failed to update jury in Firebase Auth:", err?.message || err);
  }
}

export async function deleteJuryById(id: string) {
  await connectDB();
  await JuryModel.deleteOne({ id });

  // Remove from Firebase Authentication
  try {
    await deleteFirebaseUser(id);
  } catch (err: any) {
    console.error("Failed to delete jury from Firebase Auth:", err?.message || err);
  }
}

export async function getOrCreateAdminJury(): Promise<Jury> {
  await connectDB();
  const adminJuryId = "jury-admin";

  let adminJury = await JuryModel.findOne({ id: adminJuryId }).lean<Jury>().exec();

  if (!adminJury) {
    await JuryModel.create({
      id: adminJuryId,
      name: "Admin",
      password: "admin@jury",
      avatar: "/img/jury.webp",
    });

    adminJury = await JuryModel.findOne({ id: adminJuryId }).lean<Jury>().exec();
  }

  return adminJury!; // safe because we just created it if missing
}

export async function assignProgramToJury(programId: string, juryId: string) {
  await connectDB();
  
  // Check if program is already approved/published
  const approvedResult = await ApprovedResultModel.findOne({ program_id: programId }).lean();
  if (approvedResult) {
    throw new Error("This program is already published. Cannot assign published programs to juries.");
  }
  
  // Check if assignment already exists
  const existing = await AssignedProgramModel.findOne({
    program_id: programId,
    jury_id: juryId,
  }).lean();
  
  if (existing) {
    // Assignment already exists - update status to pending if needed
    if (existing.status !== "pending") {
      await AssignedProgramModel.updateOne(
        { program_id: programId, jury_id: juryId },
        { status: "pending" },
      );
    }
    // Silently succeed if already assigned (idempotent operation)
    return;
  }
  
  try {
    await AssignedProgramModel.updateOne(
      { program_id: programId, jury_id: juryId },
      { program_id: programId, jury_id: juryId, status: "pending" },
      { upsert: true },
    );
    
    // Emit real-time event only if assignment was newly created
    if (!existing) {
      const { emitAssignmentCreated } = await import("./pusher");
      await emitAssignmentCreated(programId, juryId);
    }
  } catch (error: any) {
    // Handle MongoDB duplicate key error (code 11000) for program_id + jury_id unique index
    if (error.code === 11000 && error.keyPattern?.program_id && error.keyPattern?.jury_id) {
      throw new Error(`Program is already assigned to this jury.`);
    }
    throw error;
  }
}

export async function updateAssignmentStatus(
  programId: string,
  juryId: string,
  status: AssignedProgram["status"],
) {
  await connectDB();
  await AssignedProgramModel.updateOne({ program_id: programId, jury_id: juryId }, { status });
}

export async function deleteAssignment(programId: string, juryId: string) {
  await connectDB();
  await AssignedProgramModel.deleteOne({ program_id: programId, jury_id: juryId });
  
  // Emit real-time event
  const { emitAssignmentDeleted } = await import("./pusher");
  await emitAssignmentDeleted(programId, juryId);
}

const SINGLE_SCORES: Record<number, number> = {
  1: 10,
  2: 7,
  3: 5,
};

const GRADE_BONUS: Record<Exclude<GradeType, "none">, number> = {
  A: 5,
  B: 3,
  C: 1,
};

const GROUP_SCORES: Record<number, number> = {
  1: 20,
  2: 15,
  3: 10,
};

const GENERAL_SCORES: Record<number, number> = {
  1: 25,
  2: 20,
  3: 15,
};

export function calculateScore(
  section: SectionType,
  position: number,
  grade: GradeType = "none",
): number {
  if (section === "single") {
    const base = SINGLE_SCORES[position] || 0;
    const bonus = grade !== "none" ? GRADE_BONUS[grade] || 0 : 0;
    return base + bonus;
  }

  if (section === "group") {
    return GROUP_SCORES[position] || 0;
  }

  return GENERAL_SCORES[position] || 0;
}

export async function updateLiveScore(teamId: string, delta: number) {
  await connectDB();
  await LiveScoreModel.updateOne(
    { team_id: teamId },
    { $inc: { total_points: delta } },
    { upsert: true },
  );
  await updateTeamTotals(teamId, delta);
}

export async function updateStudentScore(studentId: string, delta: number) {
  await connectDB();
  await StudentModel.updateOne(
    { id: studentId },
    { $inc: { total_points: delta } },
    { upsert: false },
  );
}

async function updateTeamTotals(teamId: string, delta: number) {
  await connectDB();
  await TeamModel.updateOne({ id: teamId }, { $inc: { total_points: delta } });
}

export async function resetLiveScores() {
  await connectDB();
  await Promise.all([
    LiveScoreModel.updateMany({}, { $set: { total_points: 0 } }),
    TeamModel.updateMany({}, { $set: { total_points: 0 } }),
    StudentModel.updateMany({}, { $set: { total_points: 0 } }),
  ]);
}
