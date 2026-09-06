import { adminDb } from "./firebase-admin";

/**
 * Migration helper: Returns the Firestore Admin Database instance.
 * Replaces former Mongoose connectDB logic.
 */
export async function connectDB() {
  return adminDb;
}
