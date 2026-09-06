/**
 * Pusher Migration Stub:
 * Real-time updates are now handled automatically via Firebase Firestore onSnapshot listeners.
 * Emitting functions are no-ops to maintain compatibility with existing service calls.
 */

export const CHANNELS = {
  RESULTS: "results",
  ASSIGNMENTS: "assignments",
  REGISTRATIONS: "registrations",
  STUDENTS: "students",
  SCOREBOARD: "scoreboard",
  POLLS: "polls",
  PREDICTIONS: "predictions",
  FESTORY: "festory",
} as const;

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
  POLL_UPDATED: "poll-updated",
  PREDICTION_OPENED: "prediction-opened",
  PREDICTION_CLOSED: "prediction-closed",
  LEADERBOARD_UPDATED: "leaderboard-updated",
  FESTORY_POST_CREATED: "festory-post-created",
  FESTORY_AUDIO_BOMB: "festory-audio-bomb",
  FESTORY_ANNOUNCEMENT: "festory-announcement",
  FESTORY_POST_DELETED: "festory-post-deleted",
  FESTORY_POST_UPDATED: "festory-post-updated",
} as const;

export async function emitFestoryPostUpdated(_post?: any) {}
export async function emitFestoryPostCreated(_post?: any) {}
export async function emitFestoryAudioBomb(_payload?: any) {}
export async function emitFestoryAnnouncement(_payload?: any) {}
export async function emitFestoryPostDeleted(_postId?: string) {}
export async function emitResultApproved(_data?: any) {}
export async function emitResultRejected(_data?: any) {}
export async function emitResultSubmitted(_data?: any) {}
export async function emitResultUpdated(_data?: any) {}
export async function emitScoreboardUpdated(_data?: any) {}
export async function emitAssignmentCreated(_data?: any) {}
export async function emitAssignmentDeleted(_data?: any) {}
export async function emitRegistrationCreated(_data?: any) {}
export async function emitRegistrationDeleted(_data?: any) {}
export async function emitStudentCreated(_data?: any) {}
export async function emitStudentUpdated(_data?: any) {}
export async function emitStudentDeleted(_data?: any) {}
export async function emitNotificationCreated(_data?: any) {}
export async function emitPollUpdated(_poll?: any) {}
export async function emitPredictionOpened(_event?: any) {}
export async function emitPredictionClosed(_event?: any) {}
export async function emitLeaderboardUpdated() {}
