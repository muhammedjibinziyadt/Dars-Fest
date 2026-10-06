import { SystemMetaModel } from "./models";

// Channel names (kept for backward compatibility)
export const CHANNELS = {
  RESULTS: "results",
  ASSIGNMENTS: "assignments",
  REGISTRATIONS: "registrations",
  STUDENTS: "students",
  SCOREBOARD: "scoreboard",
  NOTIFICATIONS: "notifications",
} as const;

// Event names (kept for backward compatibility)
export const EVENTS = {
  RESULT_APPROVED: "result-approved",
  RESULT_REJECTED: "result-rejected",
  RESULT_SUBMITTED: "result-submitted",
  RESULT_UPDATED: "result-updated",
  ASSIGNMENT_CREATED: "assignment-created",
  ASSIGNMENT_DELETED: "assignment-deleted",
  REGISTRATION_CREATED: "registration-created",
  REGISTRATION_DELETED: "registration-deleted",
  STUDENT_CREATED: "student-created",
  STUDENT_UPDATED: "student-updated",
  STUDENT_DELETED: "student-deleted",
  SCOREBOARD_UPDATED: "scoreboard-updated",
  NOTIFICATION_CREATED: "notification-created",
} as const;

/**
 * Emits a lightweight pulse to MongoDB SystemMeta collection.
 * Clients poll this lightweight endpoint instead of hammering database.
 */
export async function emitRealtimePulse(channel: string, event: string, payload: Record<string, any> = {}) {
  try {
    const data = {
      channel,
      event,
      timestamp: Date.now(),
      data: payload,
    };
    await Promise.all([
      SystemMetaModel.updateOne({ key: "pulse" }, { $set: { key: "pulse", ...data } }, { upsert: true }),
      SystemMetaModel.updateOne({ key: channel }, { $set: { key: channel, ...data } }, { upsert: true }),
    ]);
  } catch (err: any) {
    console.warn(`[RealtimePulse] Failed to emit pulse for ${channel}:${event}:`, err?.message || err);
  }
}

export async function emitResultApproved(resultId: string, programId: string) {
  await emitRealtimePulse(CHANNELS.RESULTS, EVENTS.RESULT_APPROVED, { resultId, programId });
  await emitRealtimePulse(CHANNELS.SCOREBOARD, EVENTS.SCOREBOARD_UPDATED);
}

export async function emitResultRejected(resultId: string, programId: string) {
  await emitRealtimePulse(CHANNELS.RESULTS, EVENTS.RESULT_REJECTED, { resultId, programId });
}

export async function emitResultSubmitted(resultId: string, programId: string, juryId: string) {
  await emitRealtimePulse(CHANNELS.RESULTS, EVENTS.RESULT_SUBMITTED, { resultId, programId, juryId });
}

export async function emitResultUpdated(resultId: string, programId: string) {
  await emitRealtimePulse(CHANNELS.RESULTS, EVENTS.RESULT_UPDATED, { resultId, programId });
  await emitRealtimePulse(CHANNELS.SCOREBOARD, EVENTS.SCOREBOARD_UPDATED);
}

export async function emitAssignmentCreated(programId: string, juryId: string) {
  await emitRealtimePulse(CHANNELS.ASSIGNMENTS, EVENTS.ASSIGNMENT_CREATED, { programId, juryId });
}

export async function emitAssignmentDeleted(programId: string, juryId: string) {
  await emitRealtimePulse(CHANNELS.ASSIGNMENTS, EVENTS.ASSIGNMENT_DELETED, { programId, juryId });
}

export async function emitRegistrationCreated(registrationId: string, programId: string, teamId: string) {
  await emitRealtimePulse(CHANNELS.REGISTRATIONS, EVENTS.REGISTRATION_CREATED, { registrationId, programId, teamId });
}

export async function emitRegistrationDeleted(registrationId: string, programId: string, teamId: string) {
  await emitRealtimePulse(CHANNELS.REGISTRATIONS, EVENTS.REGISTRATION_DELETED, { registrationId, programId, teamId });
}

export async function emitStudentCreated(studentId: string, teamId: string) {
  await emitRealtimePulse(CHANNELS.STUDENTS, EVENTS.STUDENT_CREATED, { studentId, teamId });
}

export async function emitStudentUpdated(studentId: string, teamId: string) {
  await emitRealtimePulse(CHANNELS.STUDENTS, EVENTS.STUDENT_UPDATED, { studentId, teamId });
}

export async function emitStudentDeleted(studentId: string, teamId: string) {
  await emitRealtimePulse(CHANNELS.STUDENTS, EVENTS.STUDENT_DELETED, { studentId, teamId });
}

export async function emitScoreboardUpdated() {
  await emitRealtimePulse(CHANNELS.SCOREBOARD, EVENTS.SCOREBOARD_UPDATED);
}

export async function emitNotificationCreated(notification: any) {
  await emitRealtimePulse(CHANNELS.NOTIFICATIONS, EVENTS.NOTIFICATION_CREATED, {
    notificationId: notification?.id,
    title: notification?.title,
  });
}
