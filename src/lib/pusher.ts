// Channel names (kept for backward compatibility)
export const CHANNELS = {
  RESULTS: "results",
  ASSIGNMENTS: "assignments",
  REGISTRATIONS: "registrations",
  STUDENTS: "students",
  SCOREBOARD: "scoreboard",
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
} as const;

// Safe bridge functions - Firestore onSnapshot handles updates natively
export async function emitResultApproved(resultId: string, programId: string) {}
export async function emitResultRejected(resultId: string, programId: string) {}
export async function emitResultSubmitted(resultId: string, programId: string, juryId: string) {}
export async function emitResultUpdated(resultId: string, programId: string) {}
export async function emitAssignmentCreated(programId: string, juryId: string) {}
export async function emitAssignmentDeleted(programId: string, juryId: string) {}
export async function emitRegistrationCreated(registrationId: string, programId: string, teamId: string) {}
export async function emitRegistrationDeleted(registrationId: string, programId: string, teamId: string) {}
export async function emitStudentCreated(studentId: string, teamId: string) {}
export async function emitStudentUpdated(studentId: string, teamId: string) {}
export async function emitStudentDeleted(studentId: string, teamId: string) {}
export async function emitNotificationCreated(notification: any) {}
