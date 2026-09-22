import { randomUUID } from "node:crypto";
import { connectDB } from "./db";
import { NotificationModel, ProgramModel } from "./models";
import type { Notification } from "./types";
import { emitNotificationCreated } from "./pusher";

export async function createResultPublishedNotification(
  resultId: string,
  programId: string,
): Promise<Notification> {
  await connectDB();
  
  const program = await ProgramModel.findOne({ id: programId }).lean();
  if (!program) {
    throw new Error("Program not found");
  }

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

  await NotificationModel.create(notification);
  
  // Emit real-time event for all users
  await emitNotificationCreated(notification);

  return notification;
}

export async function getNotifications(limit: number = 50): Promise<Notification[]> {
  await connectDB();
  const notifications = await NotificationModel.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean<Notification[]>();
  return notifications;
}

export async function getUnreadNotificationCount(): Promise<number> {
  await connectDB();
  return await NotificationModel.countDocuments({ read: false });
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  await connectDB();
  await NotificationModel.updateOne({ id: notificationId }, { read: true });
}

export async function markAllNotificationsAsRead(): Promise<void> {
  await connectDB();
  await NotificationModel.updateMany({ read: false }, { read: true });
}

