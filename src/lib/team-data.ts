import { randomUUID } from "node:crypto";
import {
  PortalStudent,
  PortalTeam,
  Program,
  ProgramRegistration,
  RegistrationSchedule,
  ReplacementRequest,
} from "@/lib/types";
import {
  ProgramModel,
  ProgramRegistrationModel,
  RegistrationScheduleModel,
  ReplacementRequestModel,
  StudentModel,
  TeamModel,
} from "./models";
import { connectDB } from "./db";

function sanitizeColor(color?: string) {
  if (!color) return "#0ea5e9";
  return /^#([0-9A-F]{3}){1,2}$/i.test(color) ? color : "#0ea5e9";
}

export async function getPortalTeams(): Promise<PortalTeam[]> {
  await connectDB();
  const teams = await TeamModel.find().lean();
  return teams.map((team) => ({
    id: team.id,
    teamName: team.name,
    password: team.portal_password ?? "",
    leaderName: team.leader,
    themeColor: sanitizeColor(team.color),
  }));
}

export async function savePortalTeam(team: PortalTeam) {
  await connectDB();
  await TeamModel.updateOne(
    { id: team.id },
    {
      $set: {
        name: team.teamName,
        leader: team.leaderName,
        color: sanitizeColor(team.themeColor),
        portal_password: team.password,
      },
      $setOnInsert: {
        leader_photo: team.leaderName,
        description: `${team.teamName} squad`,
        contact: `${team.teamName.toLowerCase().replace(/\s+/g, "")}@fest.edu`,
        total_points: 0,
      },
    },
    { upsert: true },
  );
}

export async function deletePortalTeam(teamId: string) {
  await connectDB();
  await TeamModel.deleteOne({ id: teamId });
  await StudentModel.deleteMany({ team_id: teamId });
  await ProgramRegistrationModel.deleteMany({ teamId });
}

export async function getPortalStudents(): Promise<PortalStudent[]> {
  await connectDB();
  const [students, teams] = await Promise.all([
    StudentModel.find().lean(),
    TeamModel.find().lean(),
  ]);
  const teamMap = new Map(teams.map((team) => [team.id, team.name]));
  return students.map((student) => ({
    id: student.id,
    name: student.name,
    chestNumber: student.chest_no,
    teamId: student.team_id,
    teamName: teamMap.get(student.team_id) ?? "Unknown",
    score: student.total_points ?? 0,
  }));
}

export async function upsertPortalStudent(input: {
  id?: string;
  name: string;
  chestNumber: string;
  teamId: string;
}) {
  await connectDB();
  const chestNumber = input.chestNumber.trim().toUpperCase();
  const duplicate = await StudentModel.findOne({
    chest_no: chestNumber,
    ...(input.id ? { id: { $ne: input.id } } : {}),
  })
    .lean()
    .exec();
  if (duplicate) {
    throw new Error(`Chest number "${input.chestNumber}" is already registered to student "${duplicate.name}".`);
  }

  const studentId = input.id ?? randomUUID();
  const isNew = !input.id;
  
  try {
    await StudentModel.updateOne(
      { id: studentId },
      {
        $set: {
          name: input.name,
          chest_no: chestNumber,
          team_id: input.teamId,
        },
        $setOnInsert: { total_points: 0 },
      },
      { upsert: true },
    );
    
    // Emit real-time event
    const { emitStudentCreated, emitStudentUpdated } = await import("./pusher");
    if (isNew) {
      await emitStudentCreated(studentId, input.teamId);
    } else {
      await emitStudentUpdated(studentId, input.teamId);
    }
  } catch (error: any) {
    // Handle MongoDB duplicate key error (code 11000) for chest_no unique index
    if (error.code === 11000 && error.keyPattern?.chest_no) {
      throw new Error(`Chest number "${input.chestNumber}" is already registered.`);
    }
    throw error;
  }
}

export async function deletePortalStudent(studentId: string) {
  await connectDB();
  const student = await StudentModel.findOne({ id: studentId }).lean();
  await StudentModel.deleteOne({ id: studentId });
  await ProgramRegistrationModel.deleteMany({ studentId });
  
  // Emit real-time event
  if (student?.team_id) {
    const { emitStudentDeleted } = await import("./pusher");
    await emitStudentDeleted(studentId, student.team_id);
  }
}

export async function getProgramsWithLimits(): Promise<Program[]> {
  await connectDB();
  const programs = await ProgramModel.find().lean();
  return programs.map((program) => ({
    ...program,
    candidateLimit: program.candidateLimit ?? 1,
  }));
}

export async function getProgramRegistrations(): Promise<ProgramRegistration[]> {
  await connectDB();
  const registrations = await ProgramRegistrationModel.find().lean();
  return registrations.map((registration) => ({
    id: registration.id,
    programId: registration.programId,
    programName: registration.programName,
    studentId: registration.studentId,
    studentName: registration.studentName,
    studentChest: registration.studentChest,
    teamId: registration.teamId,
    teamName: registration.teamName,
    timestamp: registration.timestamp,
  }));
}

export async function registerCandidate(entry: {
  programId: string;
  programName: string;
  studentId: string;
  studentName: string;
  studentChest: string;
  teamId: string;
  teamName: string;
}) {
  await connectDB();
  const record: ProgramRegistration = {
    id: randomUUID(),
    ...entry,
    timestamp: new Date().toISOString(),
  };
  
  try {
    await ProgramRegistrationModel.create(record);
    return record;
  } catch (error: any) {
    // Handle MongoDB duplicate key error (code 11000) for programId + studentId unique index
    if (error.code === 11000 && error.keyPattern?.programId && error.keyPattern?.studentId) {
      throw new Error(`Student "${entry.studentName}" is already registered for program "${entry.programName}".`);
    }
    throw error;
  }
}

export async function removeProgramRegistration(registrationId: string) {
  await connectDB();
  const registration = await ProgramRegistrationModel.findOne({ id: registrationId }).lean();
  await ProgramRegistrationModel.deleteOne({ id: registrationId });
  
  // Emit real-time event
  if (registration) {
    const { emitRegistrationDeleted } = await import("./pusher");
    await emitRegistrationDeleted(registrationId, registration.programId, registration.teamId);
  }
}

export async function removeRegistrationsByProgram(programId: string) {
  await connectDB();
  await ProgramRegistrationModel.deleteMany({ programId });
}

export async function getRegistrationSchedule(): Promise<RegistrationSchedule> {
  await connectDB();
  const doc = await RegistrationScheduleModel.findOne().lean();
  if (doc) {
    return { startDateTime: doc.startDateTime, endDateTime: doc.endDateTime };
  }
  const schedule = {
    startDateTime: new Date().toISOString(),
    endDateTime: new Date(Date.now() + 3600_000).toISOString(),
  };
  await RegistrationScheduleModel.create({ key: "global", ...schedule });
  return schedule;
}

export async function updateRegistrationSchedule(schedule: RegistrationSchedule) {
  await connectDB();
  await RegistrationScheduleModel.updateOne(
    { key: "global" },
    { $set: schedule, $setOnInsert: { key: "global" } },
    { upsert: true },
  );
}

export async function isRegistrationOpen(now: Date = new Date()): Promise<boolean> {
  const schedule = await getRegistrationSchedule();
  return now >= new Date(schedule.startDateTime) && now <= new Date(schedule.endDateTime);
}

/**
 * Check participation limits with full program context
 * Limits:
 * - Maximum 3 individual on-stage events (section: "single", stage: true)
 * - Maximum 3 individual off-stage events (section: "single", stage: false)
 * - Maximum 3 group events (section: "group")
 * - No limit on general events (section: "general")
 */
export function validateParticipationLimit(
  studentId: string,
  program: Program,
  allPrograms: Program[],
  registrations: ProgramRegistration[],
): { allowed: boolean; reason?: string; currentCount?: number; maxCount?: number } {
  // General events have no limit
  if (program.section === "general") {
    return { allowed: true };
  }

  // Get all registrations for this student
  const studentRegistrations = registrations.filter((reg) => reg.studentId === studentId);

  // Create a map of programId -> Program for quick lookup
  const programMap = new Map(allPrograms.map((p) => [p.id, p]));

  if (program.section === "single") {
    // Individual events: check based on stage (on-stage vs off-stage)
    const sameStageRegistrations = studentRegistrations.filter((reg) => {
      const regProgram = programMap.get(reg.programId);
      return (
        regProgram?.section === "single" &&
        regProgram?.stage === program.stage &&
        reg.programId !== program.id // Exclude current program if already registered
      );
    });

    const maxCount = 3;
    const currentCount = sameStageRegistrations.length;

    if (currentCount >= maxCount) {
      const stageType = program.stage ? "on-stage" : "off-stage";
      return {
        allowed: false,
        reason: `Maximum limit of ${maxCount} individual ${stageType} events reached.`,
        currentCount,
        maxCount,
      };
    }

    return { allowed: true, currentCount, maxCount };
  }

  if (program.section === "group") {
    // Group events: maximum 3
    const groupRegistrations = studentRegistrations.filter((reg) => {
      const regProgram = programMap.get(reg.programId);
      return regProgram?.section === "group" && reg.programId !== program.id;
    });

    const maxCount = 3;
    const currentCount = groupRegistrations.length;

    if (currentCount >= maxCount) {
      return {
        allowed: false,
        reason: `Maximum limit of ${maxCount} group events reached.`,
        currentCount,
        maxCount,
      };
    }

    return { allowed: true, currentCount, maxCount };
  }

  return { allowed: true };
}

export async function getReplacementRequests(teamId?: string): Promise<ReplacementRequest[]> {
  await connectDB();
  const query = teamId ? { teamId } : {};
  const requests = await ReplacementRequestModel.find(query).lean().sort({ submittedAt: -1 });
  return requests.map((request) => ({
    id: request.id,
    programId: request.programId,
    programName: request.programName,
    oldStudentId: request.oldStudentId,
    oldStudentName: request.oldStudentName,
    oldStudentChest: request.oldStudentChest,
    newStudentId: request.newStudentId,
    newStudentName: request.newStudentName,
    newStudentChest: request.newStudentChest,
    teamId: request.teamId,
    teamName: request.teamName,
    reason: request.reason,
    status: request.status,
    submittedAt: request.submittedAt,
    reviewedAt: request.reviewedAt,
    reviewedBy: request.reviewedBy,
  }));
}

export async function createReplacementRequest(request: {
  programId: string;
  programName: string;
  oldStudentId: string;
  oldStudentName: string;
  oldStudentChest: string;
  newStudentId: string;
  newStudentName: string;
  newStudentChest: string;
  teamId: string;
  teamName: string;
  reason: string;
}): Promise<ReplacementRequest> {
  await connectDB();
  const record: ReplacementRequest = {
    id: randomUUID(),
    ...request,
    status: "pending",
    submittedAt: new Date().toISOString(),
  };
  
  try {
    await ReplacementRequestModel.create(record);
    return record;
  } catch (error: any) {
    // Handle MongoDB duplicate key error (code 11000) for duplicate pending replacement requests
    if (error.code === 11000 && error.keyPattern?.programId && error.keyPattern?.oldStudentId && error.keyPattern?.status) {
      throw new Error(`A pending replacement request already exists for "${request.oldStudentName}" in program "${request.programName}".`);
    }
    throw error;
  }
}

export async function approveReplacementRequest(
  requestId: string,
  reviewedBy: string,
): Promise<void> {
  await connectDB();
  const request = await ReplacementRequestModel.findOne({ id: requestId }).lean();
  if (!request) {
    throw new Error("Replacement request not found");
  }
  if (request.status !== "pending") {
    throw new Error("Request has already been processed");
  }

  // Update the registration
  await ProgramRegistrationModel.updateOne(
    {
      programId: request.programId,
      studentId: request.oldStudentId,
    },
    {
      $set: {
        studentId: request.newStudentId,
        studentName: request.newStudentName,
        studentChest: request.newStudentChest,
      },
    },
  );

  // Update request status
  await ReplacementRequestModel.updateOne(
    { id: requestId },
    {
      $set: {
        status: "approved",
        reviewedAt: new Date().toISOString(),
        reviewedBy,
      },
    },
  );
}

export async function rejectReplacementRequest(
  requestId: string,
  reviewedBy: string,
): Promise<void> {
  await connectDB();
  await ReplacementRequestModel.updateOne(
    { id: requestId },
    {
      $set: {
        status: "rejected",
        reviewedAt: new Date().toISOString(),
        reviewedBy,
      },
    },
  );
}

