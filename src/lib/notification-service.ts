import { randomUUID } from "node:crypto";
import { connectDB } from "./db";
import { NotificationModel, ProgramModel, TeamModel, StudentModel } from "./models";
import type { Notification } from "./types";
import { emitNotificationCreated } from "./pusher";

/**
 * Creates and broadcasts a Result Published notification (In-app + Email to all team leaders)
 */
export async function createResultPublishedNotification(
  resultId: string,
  programId: string,
  winnersList?: { position: number; studentName?: string; teamName?: string; grade?: string }[],
): Promise<Notification> {
  await connectDB();

  const program = await ProgramModel.findOne({ id: programId }).lean();
  if (!program) {
    throw new Error("Program not found");
  }

  const notification: Notification = {
    id: `notif-${randomUUID().slice(0, 8)}`,
    type: "result_published",
    title: `Result Announced: ${program.name}`,
    message: `Official results for "${program.name}" have been announced and approved. Check the scoreboard for standings.`,
    programId: program.id,
    programName: program.name,
    resultId,
    link: `/results/${program.id}`,
    read: false,
    createdAt: new Date().toISOString(),
  };

  await NotificationModel.create(notification);

  // Emit real-time event for connected clients
  try {
    await emitNotificationCreated(notification);
  } catch (e) {
    console.warn("Real-time notification emit skipped:", e);
  }

  // Send official results email to all Team Leaders
  try {
    const { sendResultPublishedEmail, getAllTeamLeaderEmails } = await import("./email-service");
    const leaderEmails = await getAllTeamLeaderEmails();
    if (leaderEmails.length > 0) {
      sendResultPublishedEmail({
        to: leaderEmails,
        programName: program.name,
        programId: program.id,
        winners: winnersList || [],
      }).catch((err) => console.error("Result published email skipped/failed:", err));
    }
  } catch (err) {
    console.error("Failed to dispatch result published emails:", err);
  }

  return notification;
}

/**
 * Creates and broadcasts a New Program Announcement (In-app + Email to all team leaders)
 */
export async function createProgramCreatedNotification(program: {
  id?: string;
  name: string;
  section: string;
  stage: boolean;
  candidateLimit?: number;
}): Promise<Notification> {
  await connectDB();

  const notification: Notification = {
    id: `notif-${randomUUID().slice(0, 8)}`,
    type: "program_created",
    title: `New Program: ${program.name}`,
    message: `A new program "${program.name}" (${program.section}) has been added. Register your team members now.`,
    programId: program.id,
    programName: program.name,
    link: "/team/program-register",
    read: false,
    createdAt: new Date().toISOString(),
  };

  await NotificationModel.create(notification);

  try {
    await emitNotificationCreated(notification);
  } catch (e) {
    console.warn("Real-time notification emit skipped:", e);
  }

  // Email all team leaders
  try {
    const { sendNewProgramsEmail } = await import("./email-service");
    sendNewProgramsEmail({
      programs: [
        {
          name: program.name,
          section: program.section,
          stage: program.stage,
          candidateLimit: program.candidateLimit ?? 1,
        },
      ],
    }).catch((err) => console.error("New program email dispatch failed:", err));
  } catch (err) {
    console.error("Failed to load email service for new program:", err);
  }

  return notification;
}

/**
 * Creates and broadcasts a Registration Schedule Update (In-app + Email to all team leaders)
 */
export async function createScheduleUpdatedNotification(
  startDateTime: string,
  endDateTime: string,
  note?: string,
): Promise<Notification> {
  await connectDB();

  const notification: Notification = {
    id: `notif-${randomUUID().slice(0, 8)}`,
    type: "schedule_updated",
    title: "Registration Schedule Updated",
    message: `Team registration timeline has been revised. Deadline: ${new Date(endDateTime).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" })}.`,
    link: "/team/dashboard",
    read: false,
    createdAt: new Date().toISOString(),
  };

  await NotificationModel.create(notification);

  try {
    await emitNotificationCreated(notification);
  } catch (e) {
    console.warn("Real-time notification emit skipped:", e);
  }

  // Email all team leaders
  try {
    const { sendScheduleUpdatedEmail } = await import("./email-service");
    sendScheduleUpdatedEmail({
      startDateTime,
      endDateTime,
      note,
    }).catch((err) => console.error("Schedule update email dispatch failed:", err));
  } catch (err) {
    console.error("Failed to load email service for schedule:", err);
  }

  return notification;
}

/**
 * Creates and broadcasts a general fest notification (In-app + Email to all team leaders)
 */
export async function createBroadcastNotification(options: {
  title: string;
  message: string;
  link?: string;
}): Promise<Notification> {
  await connectDB();

  const notification: Notification = {
    id: `notif-${randomUUID().slice(0, 8)}`,
    type: "announcement",
    title: options.title,
    message: options.message,
    link: options.link || "/team/dashboard",
    read: false,
    createdAt: new Date().toISOString(),
  };

  await NotificationModel.create(notification);

  try {
    await emitNotificationCreated(notification);
  } catch (e) {
    console.warn("Real-time notification emit skipped:", e);
  }

  // Email all team leaders
  try {
    const { sendBroadcastNotificationEmail } = await import("./email-service");
    sendBroadcastNotificationEmail({
      title: options.title,
      message: options.message,
      link: options.link,
    }).catch((err) => console.error("Broadcast notification email failed:", err));
  } catch (err) {
    console.error("Failed to load email service for broadcast:", err);
  }

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
