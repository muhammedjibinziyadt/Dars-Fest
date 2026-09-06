"use server";

import {
  teamsCol,
  studentsCol,
  programsCol,
  juriesCol,
  assignedProgramsCol,
  programRegistrationsCol,
  registrationSchedulesCol,
  pendingResultsCol,
  approvedResultsCol,
  liveScoresCol,
  replacementRequestsCol,
  notificationsCol,
  adminSettingsCol,
} from "@/lib/models";
import { adminDb } from "@/lib/firebase-admin";
import { isAdminAuthenticated } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getDatabaseStats() {
  if (!(await isAdminAuthenticated())) {
    throw new Error("Unauthorized");
  }

  const [
    teamsSnap,
    studentsSnap,
    programsSnap,
    juriesSnap,
    assignedSnap,
    regsSnap,
    schedSnap,
    pendingSnap,
    approvedSnap,
    scoresSnap,
    reqsSnap,
    notifsSnap,
  ] = await Promise.all([
    teamsCol.get(),
    studentsCol.get(),
    programsCol.get(),
    juriesCol.get(),
    assignedProgramsCol.get(),
    programRegistrationsCol.get(),
    registrationSchedulesCol.get(),
    pendingResultsCol.get(),
    approvedResultsCol.get(),
    liveScoresCol.get(),
    replacementRequestsCol.get(),
    notificationsCol.get(),
  ]);

  return {
    teams: teamsSnap.size,
    students: studentsSnap.size,
    programs: programsSnap.size,
    juries: juriesSnap.size,
    assignedPrograms: assignedSnap.size,
    programRegistrations: regsSnap.size,
    registrationSchedules: schedSnap.size,
    pendingResults: pendingSnap.size,
    approvedResults: approvedSnap.size,
    liveScores: scoresSnap.size,
    replacementRequests: reqsSnap.size,
    notifications: notifsSnap.size,
  };
}

export async function restoreDatabase(data: any) {
  if (!(await isAdminAuthenticated())) {
    throw new Error("Unauthorized");
  }

  if (!data || typeof data !== "object") {
    throw new Error("Invalid backup file format");
  }

  const restoreCollection = async (collectionRef: FirebaseFirestore.CollectionReference, items: any[]) => {
    if (Array.isArray(items)) {
      const snap = await collectionRef.get();
      const batch = adminDb.batch();
      snap.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();

      if (items.length > 0) {
        const insertBatch = adminDb.batch();
        for (const item of items) {
          const id = item.id || crypto.randomUUID();
          insertBatch.set(collectionRef.doc(id), item);
        }
        await insertBatch.commit();
      }
    }
  };

  try {
    await restoreCollection(teamsCol, data.teams);
    await restoreCollection(studentsCol, data.students);
    await restoreCollection(programsCol, data.programs);
    await restoreCollection(juriesCol, data.juries);
    await restoreCollection(assignedProgramsCol, data.assignedPrograms);
    await restoreCollection(programRegistrationsCol, data.programRegistrations);
    await restoreCollection(registrationSchedulesCol, data.registrationSchedules);
    await restoreCollection(pendingResultsCol, data.pendingResults);
    await restoreCollection(approvedResultsCol, data.approvedResults);
    await restoreCollection(liveScoresCol, data.liveScores);
    await restoreCollection(replacementRequestsCol, data.replacementRequests);
    await restoreCollection(notificationsCol, data.notifications);
    if (data.adminSettings) await restoreCollection(adminSettingsCol, data.adminSettings);

    revalidatePath("/");
    return { success: true, message: "Database restored successfully" };
  } catch (error: any) {
    console.error("Restore failed:", error);
    return { success: false, message: error.message || "Restore failed" };
  }
}
