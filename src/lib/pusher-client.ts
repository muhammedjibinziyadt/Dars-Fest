"use client";

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

// Safe client stub
export function getPusherClient(): any {
  return {
    subscribe: () => ({
      bind: () => {},
      unbind: () => {},
    }),
    unsubscribe: () => {},
    disconnect: () => {},
    connection: {
      bind: () => {},
      state: "connected",
    },
  };
}
