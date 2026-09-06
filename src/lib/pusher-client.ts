"use client";

/**
 * Migration Stub for Client Real-Time connections.
 * Firebase Firestore onSnapshot listeners handle real-time sync automatically.
 */

const dummyChannel = {
  bind: (_event?: string, _callback?: any) => {},
  unbind: (_event?: string, _callback?: any) => {},
  unbind_all: () => {},
  unsubscribe: () => {},
};

export const pusherClient: any = {
  subscribe: (_channelName?: string) => dummyChannel,
  unsubscribe: (_channelName?: string) => {},
  disconnect: () => {},
  connection: {
    bind: (_event?: string, _callback?: any) => {},
    state: "connected",
  },
};

export function getPusherClient(): any {
  return pusherClient;
}

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
} as const;
