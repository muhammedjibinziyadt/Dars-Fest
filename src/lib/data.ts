import { randomUUID } from "node:crypto";
import type {
  AssignedProgram,
  CategoryType,
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

let seedPromise: Promise<void> | null = null;

async function seedCollection<T>(
  count: number,
  insertFn: () => Promise<T>,
): Promise<void> {
  if (count === 0) {
    await insertFn();
  }
}

async function updateTeamNames() {
  await connectDB();
  // Update existing teams with new names and colors from defaultTeams
  for (const team of defaultTeams) {
    await TeamModel.updateOne(
      { id: team.id },
      { $set: { name: team.name, color: team.color } },
      { upsert: false }
    );
  }
}

async function seedDatabase() {
  await connectDB();

  const [teamCount, studentCount, programCount, juryCount, liveScoreCount, assignmentCount] =
    await Promise.all([
      TeamModel.countDocuments(),
      StudentModel.countDocuments(),
      ProgramModel.countDocuments(),
      JuryModel.countDocuments(),
      LiveScoreModel.countDocuments(),
      AssignedProgramModel.countDocuments(),
    ]);

  // Always update team names to ensure they match the current defaults
  await updateTeamNames();

  await seedCollection(teamCount, async () => {
    await TeamModel.insertMany(defaultTeams);
  });

  await seedCollection(liveScoreCount, async () => {
    await LiveScoreModel.insertMany(
      defaultTeams.map((team) => ({
        team_id: team.id,
        total_points: team.total_points,
      })),
    );
  });

  await seedCollection(studentCount, async () => {
    await StudentModel.insertMany(defaultStudents);
  });

  await seedCollection(programCount, async () => {
    await ProgramModel.insertMany(defaultPrograms);
  });

  await seedCollection(juryCount, async () => {
    await JuryModel.insertMany(defaultJury);
  });

  await seedCollection(assignmentCount, async () => {
    await AssignedProgramModel.insertMany(defaultAssignments);
  });
}

async function ensureSeedData() {
  if (!seedPromise) {
    seedPromise = seedDatabase();
  }
  await seedPromise;
}

function normalize<T>(docs: T[]): T[] {
  return docs.map((doc) => JSON.parse(JSON.stringify(doc)));
}

export async function getTeams(): Promise<Team[]> {
  await ensureSeedData();
  const teams = await TeamModel.find().lean<Team[]>();
  return normalize(teams);
}

export async function getLiveScores(): Promise<LiveScore[]> {
  await ensureSeedData();
  const scores = await LiveScoreModel.find().lean<LiveScore[]>();
  return normalize(scores);
}

export async function getStudents(): Promise<Student[]> {
  await ensureSeedData();
  const students = await StudentModel.find().lean<Student[]>();
  return normalize(students);
}

export async function getPrograms(): Promise<Program[]> {
  await ensureSeedData();
  const programs = await ProgramModel.find().lean<Program[]>();
  return normalize(programs);
}

export async function getJuries(): Promise<Jury[]> {
  await ensureSeedData();
  const juries = await JuryModel.find().lean<Jury[]>();
  const normalized = normalize(juries);
  
  // Ensure all juries have an avatar - assign and persist if missing (only once)
  // Once set, avatar is never changed
  const juriesWithAvatars = await Promise.all(
    normalized.map(async (jury) => {
      if (!jury.avatar) {
        // Assign random avatar only if missing - this will be saved permanently
        const avatar = getRandomJuryAvatar();
        await connectDB();
        await JuryModel.updateOne({ id: jury.id }, { $set: { avatar } });
        return { ...jury, avatar };
      }
      // Avatar already exists - return as-is (never change it)
      return jury;
    })
  );
  
  return juriesWithAvatars;
}

export async function getAssignments(): Promise<AssignedProgram[]> {
  await ensureSeedData();
  const assignments = await AssignedProgramModel.find().lean<AssignedProgram[]>();
  return normalize(assignments);
}

export async function getPendingResults(): Promise<ResultRecord[]> {
  await ensureSeedData();
  const results = await PendingResultModel.find().lean<ResultRecord[]>();
  return normalize(results);
}

export async function getApprovedResults(): Promise<ResultRecord[]> {
  await ensureSeedData();
  const results = await ApprovedResultModel.find().lean<ResultRecord[]>();
  return normalize(results);
}

/**
 * Check if a program result is already approved/published
 * @param programId - The program ID to check
 * @returns true if the program has an approved result, false otherwise
 */
export async function isProgramResultApproved(programId: string): Promise<boolean> {
  await ensureSeedData();
  const approvedResult = await ApprovedResultModel.findOne({ program_id: programId }).lean();
  return !!approvedResult;
}

export async function getPendingResultById(
  id: string,
): Promise<ResultRecord | null> {
  await ensureSeedData();
  const result = await PendingResultModel.findOne({ id }).lean<ResultRecord | null>();
  return result ? JSON.parse(JSON.stringify(result)) : null;
}

export async function getApprovedResultById(
  id: string,
): Promise<ResultRecord | null> {
  await ensureSeedData();
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
  // Assign random avatar if not provided - once set, it never changes
  const avatar = input.avatar || getRandomJuryAvatar();
  await JuryModel.create({ 
    ...input, 
    id: `jury-${randomUUID().slice(0, 8)}`,
    avatar, // Avatar is set once at creation and never changes
  });
}

export async function updateJuryById(id: string, data: Partial<Omit<Jury, "id">>) {
  await connectDB();
  // Explicitly exclude avatar from updates - avatars are immutable once set
  const { avatar, ...updateData } = data;
  await JuryModel.updateOne({ id }, updateData);
}

export async function deleteJuryById(id: string) {
  await connectDB();
  await JuryModel.deleteOne({ id });
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

const CATEGORY_SCORES: Record<
  Exclude<CategoryType, "none">,
  Record<1 | 2 | 3, number>
> = {
  A: { 1: 10, 2: 7, 3: 5 },
  B: { 1: 7, 2: 5, 3: 3 },
  C: { 1: 5, 2: 3, 3: 1 },
};

const GRADE_BONUS: Record<Exclude<CategoryType, "none">, number> = {
  A: 5,
  B: 3,
  C: 1,
};

const GROUP_SCORES: Record<1 | 2 | 3, number> = {
  1: 20,
  2: 15,
  3: 10,
};

const GENERAL_SCORES: Record<1 | 2 | 3, number> = {
  1: 25,
  2: 20,
  3: 15,
};

export function calculateScore(
  section: SectionType,
  category: CategoryType,
  position: 1 | 2 | 3,
  grade: CategoryType = "none",
): number {
  if (section === "single") {
    const base = category !== "none" ? CATEGORY_SCORES[category][position] : 0;
    const bonus = grade !== "none" ? GRADE_BONUS[grade] : 0;
    return base + bonus;
  }

  if (section === "group") {
    return GROUP_SCORES[position];
  }

  return GENERAL_SCORES[position];
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

const defaultTeams: Team[] = [
  {
    id: "team-cosmos",
    name: "SAMARQAND",
    leader: "Mira Lopes",
    leader_photo: "https://images.unsplash.com/photo-1544723795-3fb6469f5b39",
    color: "#D72638",
    description: "Fine arts and installations with a cosmic narrative.",
    contact: "cosmos@artsfest.edu",
    total_points: 0,
    portal_password: "cosmos@123",
  },
  {
    id: "team-dynamo",
    name: "NAHAVAND",
    leader: "Ritvik Sen",
    leader_photo: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518",
    color: "#1E3A8A",
    description: "Theatre and stagecraft enthusiasts.",
    contact: "dynamo@artsfest.edu",
    total_points: 0,
    portal_password: "dynamo@123",
  },
  {
    id: "team-blaze",
    name: "YAMAMA",
    leader: "Kabir Varma",
    leader_photo: "https://images.unsplash.com/photo-1504593811423-6dd665756598",
    color: "#7C3AED",
    description: "Dance collective known for explosive choreography.",
    contact: "blaze@artsfest.edu",
    total_points: 0,
    portal_password: "blaze@123",
  },
  {
    id: "team-ember",
    name: "QURTUBA",
    leader: "Salma Aziz & Ahmed Hassan",
    leader_photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e",
    color: "#FACC15",
    description: "Literary arts champions with spoken word mastery.",
    contact: "ember@artsfest.edu",
    total_points: 0,
    portal_password: "ember@123",
  },
  {
    id: "team-aurora",
    name: "MUQADDAS",
    leader: "Anaya Joseph",
    leader_photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
    color: "#059669",
    description: "Music & rhythm powerhouse representing the senior batch.",
    contact: "aurora@artsfest.edu",
    total_points: 0,
    portal_password: "aurora@123",
  },
  {
    id: "team-flux",
    name: "BUKHARA",
    leader: "Levi D'Souza",
    leader_photo: "https://images.unsplash.com/photo-1546456073-92b9f0a8d1d6",
    color: "#FB923C",
    description: "Media & film crew pushing experimental visuals.",
    contact: "flux@artsfest.edu",
    total_points: 0,
    portal_password: "flux@123",
  },
];

const defaultStudents: Student[] = [
  {
    id: "stu-aurora-1",
    name: "Neha Dominic",
    team_id: "team-aurora",
    chest_no: "A101",
    avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1",
    total_points: 0,
  },
  {
    id: "stu-aurora-2",
    name: "Arjun Prakash",
    team_id: "team-aurora",
    chest_no: "A102",
    avatar: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df",
    total_points: 0,
  },
  {
    id: "stu-blaze-1",
    name: "Sana Mathew",
    team_id: "team-blaze",
    chest_no: "B201",
    avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1",
    total_points: 0,
  },
  {
    id: "stu-cosmos-1",
    name: "Joel Francis",
    team_id: "team-cosmos",
    chest_no: "C301",
    avatar: "https://images.unsplash.com/photo-1504593811423-6dd665756598",
    total_points: 0,
  },
  {
    id: "stu-dynamo-1",
    name: "Veda Krish",
    team_id: "team-dynamo",
    chest_no: "D401",
    avatar: "https://images.unsplash.com/photo-1544723795-3fb6469f5b39",
    total_points: 0,
  },
  {
    id: "stu-ember-1",
    name: "Kiran Nair",
    team_id: "team-ember",
    chest_no: "E501",
    avatar: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518",
    total_points: 0,
  },
  {
    id: "stu-flux-1",
    name: "Maya Iqbal",
    team_id: "team-flux",
    chest_no: "F601",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
    total_points: 0,
  },
];

const defaultPrograms: Program[] = [
  {
    id: "prog-solo-vocals",
    name: "Solo Vocals",
    section: "single",
    stage: true,
    category: "A",
    candidateLimit: 2,
  },
  {
    id: "prog-duet-dance",
    name: "Duet Dance",
    section: "group",
    stage: true,
    category: "none",
    candidateLimit: 3,
  },
  {
    id: "prog-live-paint",
    name: "Live Canvas Painting",
    section: "single",
    stage: false,
    category: "B",
    candidateLimit: 1,
  },
  {
    id: "prog-shortfilm",
    name: "Short Film",
    section: "group",
    stage: false,
    category: "none",
    candidateLimit: 4,
  },
  {
    id: "prog-quiz",
    name: "General Quiz",
    section: "general",
    stage: true,
    category: "none",
    candidateLimit: 5,
  },
];

const defaultAssignments: AssignedProgram[] = [
  { program_id: "prog-solo-vocals", jury_id: "jury-anika", status: "pending" },
  { program_id: "prog-duet-dance", jury_id: "jury-dev", status: "pending" },
  { program_id: "prog-live-paint", jury_id: "jury-sahana", status: "pending" },
];

const defaultJury: Jury[] = [
  { id: "jury-anika", name: "Anika Raman", password: "anika@jury", avatar: "/img/jury.webp" },
  { id: "jury-dev", name: "Dev Jain", password: "dev@jury", avatar: "/img/jury1.webp" },
  { id: "jury-sahana", name: "Sahana Biju", password: "sahana@jury", avatar: "/img/jury2.webp" },
];
