import { getAdminDb } from "./firebase-admin";

/**
 * Firebase Firestore database connection initializer.
 * Provides backward compatibility for previous connectDB() calls.
 */
export async function connectDB() {
  return getAdminDb();
}

export function getDb() {
  return getAdminDb();
}
