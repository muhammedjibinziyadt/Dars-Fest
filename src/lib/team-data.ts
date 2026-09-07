import { randomUUID } from "node:crypto";
import { hash } from "bcryptjs";
import {
  PortalStudent,
  PortalTeam,
  Program,
  ProgramRegistration,
  RegistrationSchedule,
  ReplacementRequest,
  Student,
  Team,
} from "@/lib/types";
import {
  teamsCol,
  studentsCol,
  programsCol,
  programRegistrationsCol,
  registrationSchedulesCol,
  replacementRequestsCol,
  docsToData,
} from "./models";
import { adminDb } from "./firebase-admin";

function sanitizeColor(color?: string) {
  if (!color) return "#0ea5e9";
  return /^#([0-9A-F]{3}){1,2}$/i.test(color) ? color : "#0ea5e9";
}

export async function getPortalTeams(): Promise<PortalTeam[]> {
  const snap = await teamsCol.get();
  const teams = docsToData<Team>(snap);
  return teams.map((team) => ({
    id: team.id,
    teamName: team.name,
    password: "", // SECURITY: Do not leak password
    leaderName: team.leader,
    themeColor: sanitizeColor(team.color),
  }));
}

export async function savePortalTeam(team: PortalTeam) {
  const ref = teamsCol.doc(team.id);
  const doc = await ref.get();

  const updateData: any = {
    name: team.teamName,
    leader: team.leaderName,
    color: sanitizeColor(team.themeColor),
  };

  if (team.password && team.password.trim() !== "") {
    if (!team.password.startsWith("$2")) {
      updateData.portal_password = await hash(team.password, 10);
    }
  }

  if (!doc.exists) {
    updateData.leader_photo = "/img/jury.webp";
    updateData.description = `${team.teamName} squad`;
    updateData.contact = `${team.teamName.toLowerCase().replace(/\s+/g, "")}@fest.edu`;
    updateData.total_points = 0;
  }

  await ref.set(updateData, { merge: true });
}

export async function deletePortalTeam(teamId: string) {
  const batch = adminDb.batch();

  batch.delete(teamsCol.doc(teamId));

  const [studentsSnap, regsSnap] = await Promise.all([
    studentsCol.where("team_id", "==", teamId).get(),
    programRegistrationsCol.where("teamId", "==", teamId).get(),
  ]);

  studentsSnap.docs.forEach((doc: any) => batch.delete(doc.ref));
  regsSnap.docs.forEach((doc: any) => batch.delete(doc.ref));

  await batch.commit();
}

export async function getPortalStudents(): Promise<PortalStudent[]> {
  const [studentsSnap, teamsSnap] = await Promise.all([
    studentsCol.get(),
    teamsCol.get(),
  ]);

  const students = docsToData<Student>(studentsSnap);
  const teams = docsToData<Team>(teamsSnap);
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
  const chestNumber = input.chestNumber.trim().toUpperCase();

  const snap = await studentsCol.where("chest_no", "==", chestNumber).get();
  const duplicate = snap.docs.find((d: any) => !input.id || d.id !== input.id);

  if (duplicate) {
    const student = duplicate.data() as Student;
    throw new Error(`Chest number "${input.chestNumber}" is already registered to student "${student.name}".`);
  }

  const studentId = input.id ?? randomUUID();
  const ref = studentsCol.doc(studentId);
  const doc = await ref.get();

  const updateData: any = {
    name: input.name,
    chest_no: chestNumber,
    team_id: input.teamId,
  };

  if (!doc.exists) {
    updateData.total_points = 0;
  }

  await ref.set(updateData, { merge: true });
}

export async function deletePortalStudent(studentId: string) {
  const batch = adminDb.batch();

  batch.delete(studentsCol.doc(studentId));

  const regsSnap = await programRegistrationsCol.where("studentId", "==", studentId).get();
  regsSnap.docs.forEach((doc: any) => batch.delete(doc.ref));

  await batch.commit();
}

export async function getProgramsWithLimits(): Promise<Program[]> {
  const snap = await programsCol.get();
  const programs = docsToData<Program>(snap);
  return programs.map((program) => ({
    ...program,
    candidateLimit: program.candidateLimit ?? 1,
  }));
}

export async function getProgramRegistrations(): Promise<ProgramRegistration[]> {
  const snap = await programRegistrationsCol.get();
  return docsToData<ProgramRegistration>(snap);
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
  const existingSnap = await programRegistrationsCol
    .where("programId", "==", entry.programId)
    .where("studentId", "==", entry.studentId)
    .limit(1)
    .get();

  if (!existingSnap.empty) {
    throw new Error(`Student "${entry.studentName}" is already registered for program "${entry.programName}".`);
  }

  const id = randomUUID();
  const record: ProgramRegistration = {
    id,
    ...entry,
    timestamp: new Date().toISOString(),
  };

  await programRegistrationsCol.doc(id).set(record);
  return record;
}

export async function removeProgramRegistration(registrationId: string) {
  await programRegistrationsCol.doc(registrationId).delete();
}

export async function removeRegistrationsByProgram(programId: string) {
  const snap = await programRegistrationsCol.where("programId", "==", programId).get();
  const batch = adminDb.batch();
  snap.docs.forEach((doc: any) => batch.delete(doc.ref));
  await batch.commit();
}

export async function getRegistrationSchedule(): Promise<RegistrationSchedule> {
  const doc = await registrationSchedulesCol.doc("global").get();
  if (doc.exists) {
    const data = doc.data() as RegistrationSchedule;
    return { startDateTime: data.startDateTime, endDateTime: data.endDateTime };
  }
  const schedule = {
    startDateTime: new Date().toISOString(),
    endDateTime: new Date(Date.now() + 3600_000).toISOString(),
  };
  await registrationSchedulesCol.doc("global").set(schedule);
  return schedule;
}

export async function updateRegistrationSchedule(schedule: RegistrationSchedule) {
  await registrationSchedulesCol.doc("global").set(schedule, { merge: true });
}

export async function isRegistrationOpen(now: Date = new Date()): Promise<boolean> {
  const schedule = await getRegistrationSchedule();
  return now >= new Date(schedule.startDateTime) && now <= new Date(schedule.endDateTime);
}

export function validateParticipationLimit(
  studentId: string,
  program: Program,
  allPrograms: Program[],
  registrations: ProgramRegistration[],
): { allowed: boolean; reason?: string; currentCount?: number; maxCount?: number } {
  if (program.section === "general") {
    return { allowed: true };
  }

  const studentRegistrations = registrations.filter((reg) => reg.studentId === studentId);
  const programMap = new Map(allPrograms.map((p) => [p.id, p]));

  if (program.section === "single") {
    const sameStageRegistrations = studentRegistrations.filter((reg) => {
      const regProgram = programMap.get(reg.programId);
      return (
        regProgram?.section === "single" &&
        regProgram?.stage === program.stage &&
        reg.programId !== program.id
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
  let snap;
  if (teamId) {
    snap = await replacementRequestsCol.where("teamId", "==", teamId).get();
  } else {
    snap = await replacementRequestsCol.get();
  }
  const requests = docsToData<ReplacementRequest>(snap);
  return requests.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
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
  const pendingSnap = await replacementRequestsCol
    .where("programId", "==", request.programId)
    .where("oldStudentId", "==", request.oldStudentId)
    .where("status", "==", "pending")
    .limit(1)
    .get();

  if (!pendingSnap.empty) {
    throw new Error(`A pending replacement request already exists for "${request.oldStudentName}" in program "${request.programName}".`);
  }

  const id = randomUUID();
  const record: ReplacementRequest = {
    id,
    ...request,
    status: "pending",
    submittedAt: new Date().toISOString(),
  };

  await replacementRequestsCol.doc(id).set(record);
  return record;
}

export async function approveReplacementRequest(
  requestId: string,
  reviewedBy: string,
): Promise<void> {
  const doc = await replacementRequestsCol.doc(requestId).get();
  if (!doc.exists) {
    throw new Error("Replacement request not found");
  }
  const request = doc.data() as ReplacementRequest;

  if (request.status !== "pending") {
    throw new Error("Request has already been processed");
  }

  const regSnap = await programRegistrationsCol
    .where("programId", "==", request.programId)
    .where("oldStudentId", "==", request.oldStudentId)
    .limit(1)
    .get();

  const batch = adminDb.batch();

  if (!regSnap.empty) {
    batch.update(regSnap.docs[0].ref, {
      studentId: request.newStudentId,
      studentName: request.newStudentName,
      studentChest: request.newStudentChest,
    });
  }

  batch.update(replacementRequestsCol.doc(requestId), {
    status: "approved",
    reviewedAt: new Date().toISOString(),
    reviewedBy,
  });

  await batch.commit();
}

export async function rejectReplacementRequest(
  requestId: string,
  reviewedBy: string,
): Promise<void> {
  await replacementRequestsCol.doc(requestId).update({
    status: "rejected",
    reviewedAt: new Date().toISOString(),
    reviewedBy,
  });
}
