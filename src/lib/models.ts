import { adminDb } from "./firebase-admin";

export const COLLECTIONS = {
  TEAMS: "teams",
  STUDENTS: "students",
  PROGRAMS: "programs",
  JURIES: "juries",
  ASSIGNED_PROGRAMS: "assigned_programs",
  RESULTS_PENDING: "results_pending",
  RESULTS_APPROVED: "results_approved",
  LIVE_SCORES: "live_scores",
  PROGRAM_REGISTRATIONS: "program_registrations",
  REGISTRATION_SCHEDULES: "registration_schedules",
  REPLACEMENT_REQUESTS: "replacement_requests",
  NOTIFICATIONS: "notifications",
  ADMIN_SETTINGS: "admin_settings",
  POLLS: "polls",
  VOTES: "votes",
  PREDICTION_EVENTS: "prediction_events",
  PREDICTIONS: "predictions",
  USER_SCORES: "user_scores",
  FESTORY_POSTS: "festory_posts",
  FESTORY_COMMENTS: "festory_comments",
  FESTORY_USERS: "festory_users",
} as const;

// Firestore Collection References (Server Side)
export const teamsCol = adminDb.collection(COLLECTIONS.TEAMS);
export const studentsCol = adminDb.collection(COLLECTIONS.STUDENTS);
export const programsCol = adminDb.collection(COLLECTIONS.PROGRAMS);
export const juriesCol = adminDb.collection(COLLECTIONS.JURIES);
export const assignedProgramsCol = adminDb.collection(COLLECTIONS.ASSIGNED_PROGRAMS);
export const pendingResultsCol = adminDb.collection(COLLECTIONS.RESULTS_PENDING);
export const approvedResultsCol = adminDb.collection(COLLECTIONS.RESULTS_APPROVED);
export const liveScoresCol = adminDb.collection(COLLECTIONS.LIVE_SCORES);
export const programRegistrationsCol = adminDb.collection(COLLECTIONS.PROGRAM_REGISTRATIONS);
export const registrationSchedulesCol = adminDb.collection(COLLECTIONS.REGISTRATION_SCHEDULES);
export const replacementRequestsCol = adminDb.collection(COLLECTIONS.REPLACEMENT_REQUESTS);
export const notificationsCol = adminDb.collection(COLLECTIONS.NOTIFICATIONS);
export const adminSettingsCol = adminDb.collection(COLLECTIONS.ADMIN_SETTINGS);
export const pollsCol = adminDb.collection(COLLECTIONS.POLLS);
export const votesCol = adminDb.collection(COLLECTIONS.VOTES);
export const predictionEventsCol = adminDb.collection(COLLECTIONS.PREDICTION_EVENTS);
export const predictionsCol = adminDb.collection(COLLECTIONS.PREDICTIONS);
export const userScoresCol = adminDb.collection(COLLECTIONS.USER_SCORES);
export const festoryPostsCol = adminDb.collection(COLLECTIONS.FESTORY_POSTS);
export const festoryCommentsCol = adminDb.collection(COLLECTIONS.FESTORY_COMMENTS);
export const festoryUsersCol = adminDb.collection(COLLECTIONS.FESTORY_USERS);

/**
 * Helper converter for Firestore snapshot documents to plain JS objects with string id.
 */
export function docToData<T>(doc: FirebaseFirestore.DocumentSnapshot): T | null {
  if (!doc.exists) return null;
  const data = doc.data() as T;
  return { ...data, id: doc.id };
}

export function docsToData<T>(snapshot: FirebaseFirestore.QuerySnapshot): T[] {
  return snapshot.docs.map((doc) => ({
    ...(doc.data() as T),
    id: doc.id,
  }));
}
