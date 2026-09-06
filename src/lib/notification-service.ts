import { randomUUID } from "node:crypto";
import { notificationsCol, programsCol, docsToData } from "./models";
import { adminDb } from "./firebase-admin";
import type { Notification, Program } from "./types";

export async function createResultPublishedNotification(
  resultId: string,
  programId: string,
): Promise<Notification> {
  const doc = await programsCol.doc(programId).get();
  if (!doc.exists) {
    throw new Error("Program not found");
  }
  const program = doc.data() as Program;

  const notification: Notification = {
    id: `notif-${randomUUID().slice(0, 8)}`,
    type: "result_published",
    title: "New Result Published!",
    message: `Results for "${program.name}" have been published. Click to view details.`,
    programId: program.id,
    programName: program.name,
    resultId,
    read: false,
    createdAt: new Date().toISOString(),
  };

  await notificationsCol.doc(notification.id).set(notification);

  return notification;
}

export async function getNotifications(limit: number = 50): Promise<Notification[]> {
  const snap = await notificationsCol.orderBy("createdAt", "desc").limit(limit).get();
  return docsToData<Notification>(snap);
}

export async function getUnreadNotificationCount(): Promise<number> {
  const snap = await notificationsCol.where("read", "==", false).get();
  return snap.size;
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  await notificationsCol.doc(notificationId).update({ read: true });
}

export async function markAllNotificationsAsRead(): Promise<void> {
  const snap = await notificationsCol.where("read", "==", false).get();
  const batch = adminDb.batch();
  snap.docs.forEach((doc) => batch.update(doc.ref, { read: true }));
  await batch.commit();
}
