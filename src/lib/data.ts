import { randomUUID } from "node:crypto";
import { hash } from "bcryptjs";
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
import { adminDb } from "./firebase-admin";
import {
  teamsCol,
  studentsCol,
  programsCol,
  juriesCol,
  assignedProgramsCol,
  pendingResultsCol,
  approvedResultsCol,
  liveScoresCol,
  docsToData,
  docToData,
} from "./models";

export async function getTeams(): Promise<Team[]> {
  try {
    const snap = await teamsCol.get();
    if (snap.empty) return [];
    const teams = docsToData<Team>(snap);
    return teams.map((t) => {
      const { portal_password, ...rest } = t;
      return { ...rest, portal_password: "" } as Team;
    });
  } catch (error) {
    console.error("Error fetching teams from Firestore:", error);
    return [];
  }
}

export async function getLiveScores(): Promise<LiveScore[]> {
  try {
    const snap = await liveScoresCol.get();
    if (snap.empty) return [];
    return docsToData<LiveScore>(snap);
  } catch (error) {
    console.error("Error fetching live scores from Firestore:", error);
    return [];
  }
}

export async function getStudents(): Promise<Student[]> {
  try {
    const snap = await studentsCol.get();
    if (snap.empty) return [];
    return docsToData<Student>(snap);
  } catch (error) {
    console.error("Error fetching students from Firestore:", error);
    return [];
  }
}

export async function getPrograms(): Promise<Program[]> {
  try {
    const snap = await programsCol.get();
    if (snap.empty) return [];
    return docsToData<Program>(snap);
  } catch (error) {
    console.error("Error fetching programs from Firestore:", error);
    return [];
  }
}

export async function getJuries(): Promise<Jury[]> {
  try {
    const snap = await juriesCol.get();
    if (snap.empty) return [];
    const juries = docsToData<Jury>(snap);

    const juriesWithAvatars = await Promise.all(
      juries.map(async (jury) => {
        const updatedJury = { ...jury };
        if (!jury.avatar) {
          const avatar = getRandomJuryAvatar();
          try {
            await juriesCol.doc(jury.id).update({ avatar });
          } catch (e) {}
          updatedJury.avatar = avatar;
        }
        updatedJury.password = "";
        return updatedJury;
      })
    );

    return juriesWithAvatars;
  } catch (error) {
    console.error("Error fetching juries from Firestore:", error);
    return [];
  }
}

export async function getAssignments(): Promise<AssignedProgram[]> {
  try {
    const snap = await assignedProgramsCol.get();
    if (snap.empty) return [];
    return docsToData<AssignedProgram>(snap);
  } catch (error) {
    console.error("Error fetching assignments from Firestore:", error);
    return [];
  }
}

export async function getPendingResults(): Promise<ResultRecord[]> {
  try {
    const snap = await pendingResultsCol.get();
    if (snap.empty) return [];
    return docsToData<ResultRecord>(snap);
  } catch (error) {
    console.error("Error fetching pending results from Firestore:", error);
    return [];
  }
}

export async function getApprovedResults(): Promise<ResultRecord[]> {
  try {
    const snap = await approvedResultsCol.get();
    if (snap.empty) return [];
    return docsToData<ResultRecord>(snap);
  } catch (error) {
    console.error("Error fetching approved results from Firestore:", error);
    return [];
  }
}

export async function isProgramResultApproved(programId: string): Promise<boolean> {
  try {
    const snap = await approvedResultsCol.where("program_id", "==", programId).limit(1).get();
    return !snap.empty;
  } catch (error) {
    return false;
  }
}

export async function getPendingResultById(id: string): Promise<ResultRecord | null> {
  try {
    const doc = await pendingResultsCol.doc(id).get();
    if (doc.exists) return docToData<ResultRecord>(doc);

    const snap = await pendingResultsCol.where("id", "==", id).limit(1).get();
    if (snap.empty) return null;
    return docToData<ResultRecord>(snap.docs[0]);
  } catch (error) {
    return null;
  }
}

export async function getApprovedResultById(id: string): Promise<ResultRecord | null> {
  try {
    const doc = await approvedResultsCol.doc(id).get();
    if (doc.exists) return docToData<ResultRecord>(doc);

    const snap = await approvedResultsCol.where("id", "==", id).limit(1).get();
    if (snap.empty) return null;
    return docToData<ResultRecord>(snap.docs[0]);
  } catch (error) {
    return null;
  }
}

export async function createProgram(input: Omit<Program, "id">): Promise<Program> {
  const id = randomUUID();
  const program: Program = { ...input, id };
  await programsCol.doc(id).set(program);
  return program;
}

export async function updateProgramById(
  id: string,
  data: Partial<Omit<Program, "id">>,
) {
  await programsCol.doc(id).set(data, { merge: true });
}

export async function deleteProgramById(id: string) {
  await programsCol.doc(id).delete();
}

export async function createStudent(input: Omit<Student, "id" | "total_points">) {
  const normalizedChestNo = input.chest_no.trim().toUpperCase();

  const snap = await studentsCol.where("chest_no", "==", normalizedChestNo).limit(1).get();
  if (!snap.empty) {
    const existing = snap.docs[0].data() as Student;
    throw new Error(`Chest number "${input.chest_no}" is already registered to student "${existing.name}".`);
  }

  const studentId = randomUUID();
  const student: Student = {
    ...input,
    chest_no: normalizedChestNo,
    id: studentId,
    total_points: 0,
  };
  await studentsCol.doc(studentId).set(student);
}

export async function updateStudentById(
  id: string,
  data: Partial<Omit<Student, "id">>,
) {
  if (data.chest_no) {
    const normalizedChestNo = data.chest_no.trim().toUpperCase();

    const snap = await studentsCol.where("chest_no", "==", normalizedChestNo).get();
    const existing = snap.docs.find((d: any) => d.id !== id);

    if (existing) {
      const studentData = existing.data() as Student;
      throw new Error(`Chest number "${data.chest_no}" is already registered to student "${studentData.name}".`);
    }

    data.chest_no = normalizedChestNo;
  }

  await studentsCol.doc(id).set(data, { merge: true });
}

export async function deleteStudentById(id: string) {
  await studentsCol.doc(id).delete();
}

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
  const avatar = input.avatar || getRandomJuryAvatar();
  const hashedPassword = await hash(input.password, 10);
  const id = `jury-${randomUUID().slice(0, 8)}`;

  await juriesCol.doc(id).set({
    ...input,
    id,
    password: hashedPassword,
    avatar,
  });
}

export async function updateJuryById(id: string, data: Partial<Omit<Jury, "id">>) {
  const { avatar, password, ...updateData } = data;
  const updatePayload: any = { ...updateData };

  if (password) {
    updatePayload.password = await hash(password, 10);
  }

  await juriesCol.doc(id).set(updatePayload, { merge: true });
}

export async function deleteJuryById(id: string) {
  await juriesCol.doc(id).delete();
}

export async function getOrCreateAdminJury(): Promise<Jury> {
  const adminJuryId = "jury-admin";
  try {
    const doc = await juriesCol.doc(adminJuryId).get();

    if (!doc.exists) {
      const hashedPassword = await hash("admin@jury", 10);
      const adminJury: Jury = {
        id: adminJuryId,
        name: "Admin",
        password: hashedPassword,
        avatar: "/img/jury.webp",
      };
      await juriesCol.doc(adminJuryId).set(adminJury);
      return { ...adminJury, password: "" };
    }

    const jury = doc.data() as Jury;
    return { ...jury, password: "" };
  } catch (error) {
    return { id: adminJuryId, name: "Admin", password: "", avatar: "/img/jury.webp" };
  }
}

export async function assignProgramToJury(programId: string, juryId: string) {
  const approvedSnap = await approvedResultsCol.where("program_id", "==", programId).limit(1).get();
  if (!approvedSnap.empty) {
    throw new Error("This program is already published. Cannot assign published programs to juries.");
  }

  const docId = `${programId}_${juryId}`;
  const docRef = assignedProgramsCol.doc(docId);
  const doc = await docRef.get();

  if (doc.exists) {
    const existing = doc.data() as AssignedProgram;
    if (existing.status !== "pending") {
      await docRef.update({ status: "pending" });
    }
    return;
  }

  await docRef.set({
    program_id: programId,
    jury_id: juryId,
    status: "pending",
  });
}

export async function updateAssignmentStatus(
  programId: string,
  juryId: string,
  status: AssignedProgram["status"],
) {
  const docId = `${programId}_${juryId}`;
  await assignedProgramsCol.doc(docId).set({ status }, { merge: true });
}

export async function deleteAssignment(programId: string, juryId: string) {
  const docId = `${programId}_${juryId}`;
  await assignedProgramsCol.doc(docId).delete();
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
  const { FieldValue } = await import("firebase-admin/firestore");
  
  const scoreRef = liveScoresCol.doc(teamId);
  await scoreRef.set(
    { team_id: teamId, total_points: FieldValue.increment(delta) },
    { merge: true }
  );

  await updateTeamTotals(teamId, delta);
}

export async function updateStudentScore(studentId: string, delta: number) {
  const { FieldValue } = await import("firebase-admin/firestore");
  await studentsCol.doc(studentId).set(
    { total_points: FieldValue.increment(delta) },
    { merge: true }
  );
}

async function updateTeamTotals(teamId: string, delta: number) {
  const { FieldValue } = await import("firebase-admin/firestore");
  await teamsCol.doc(teamId).set(
    { total_points: FieldValue.increment(delta) },
    { merge: true }
  );
}

export async function resetLiveScores() {
  const batch = adminDb.batch();

  const [scoresSnap, teamsSnap, studentsSnap] = await Promise.all([
    liveScoresCol.get(),
    teamsCol.get(),
    studentsCol.get(),
  ]);

  scoresSnap.docs.forEach((doc: any) => batch.update(doc.ref, { total_points: 0 }));
  teamsSnap.docs.forEach((doc: any) => batch.update(doc.ref, { total_points: 0 }));
  studentsSnap.docs.forEach((doc: any) => batch.update(doc.ref, { total_points: 0 }));

  await batch.commit();
}
