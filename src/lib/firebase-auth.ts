import { getAuth as getAdminAuthInstance, type Auth } from "firebase-admin/auth";
import { getFirebaseAdminApp } from "./firebase-admin";

let adminAuthInstance: Auth | null = null;

export function getAdminAuth(): Auth {
  if (!adminAuthInstance) {
    const app = getFirebaseAdminApp();
    adminAuthInstance = getAdminAuthInstance(app);
  }
  return adminAuthInstance;
}

export function getTeamFirebaseEmail(teamId: string, customEmail?: string): string {
  if (customEmail && customEmail.includes("@")) {
    return customEmail.trim().toLowerCase();
  }
  const cleanId = teamId.toLowerCase().replace(/[^a-z0-9_-]/g, "");
  return `team.${cleanId}@maerika.com`;
}

export function getJuryFirebaseEmail(juryId: string, customEmail?: string): string {
  if (customEmail && customEmail.includes("@")) {
    return customEmail.trim().toLowerCase();
  }
  const cleanId = juryId.toLowerCase().replace(/[^a-z0-9_-]/g, "");
  return `jury.${cleanId}@maerika.com`;
}

export function getAdminFirebaseEmail(): string {
  return process.env.ADMIN_EMAIL || "admin@maerika.com";
}

/**
 * Verifies email & password directly against Firebase Authentication via REST API.
 */
export async function verifyPasswordWithFirebaseAuth(email: string, password: string) {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) {
    throw new Error("NEXT_PUBLIC_FIREBASE_API_KEY is not configured.");
  }

  const cleanEmail = email.trim().toLowerCase();
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: cleanEmail,
      password,
      returnSecureToken: true,
    }),
  });

  const data = await res.json();
  if (!res.ok || data.error) {
    const errorMsg = data.error?.message || "Authentication failed.";
    if (
      errorMsg.includes("EMAIL_NOT_FOUND") ||
      errorMsg.includes("INVALID_PASSWORD") ||
      errorMsg.includes("INVALID_LOGIN_CREDENTIALS")
    ) {
      throw new Error("Invalid email or password.");
    }
    if (errorMsg.includes("USER_DISABLED")) {
      throw new Error("This account has been disabled.");
    }
    if (errorMsg.includes("TOO_MANY_ATTEMPTS_TRY_LATER")) {
      throw new Error("Too many failed attempts. Please try again later.");
    }
    throw new Error(errorMsg);
  }

  return {
    idToken: data.idToken as string,
    refreshToken: data.refreshToken as string,
    localId: data.localId as string,
    email: data.email as string,
  };
}

/**
 * Creates or updates a user in Firebase Auth with custom claims.
 */
export async function createOrUpdateFirebaseUser(options: {
  uid?: string;
  email: string;
  password?: string;
  displayName?: string;
  role: "admin" | "team" | "jury";
  metadata?: Record<string, any>;
}) {
  const auth = getAdminAuth();
  const cleanEmail = options.email.trim().toLowerCase();
  let userRecord;

  if (options.uid) {
    try {
      userRecord = await auth.getUser(options.uid);
    } catch {}
  }

  if (!userRecord) {
    try {
      userRecord = await auth.getUserByEmail(cleanEmail);
    } catch {}
  }

  if (userRecord) {
    const updatePayload: any = {};
    if (options.displayName) updatePayload.displayName = options.displayName;
    if (options.password) updatePayload.password = options.password;
    if (userRecord.email !== cleanEmail) updatePayload.email = cleanEmail;

    if (Object.keys(updatePayload).length > 0) {
      userRecord = await auth.updateUser(userRecord.uid, updatePayload);
    }
  } else {
    userRecord = await auth.createUser({
      uid: options.uid,
      email: cleanEmail,
      password: options.password,
      displayName: options.displayName,
    });
  }

  await auth.setCustomUserClaims(userRecord.uid, {
    role: options.role,
    ...options.metadata,
  });

  return userRecord;
}

/**
 * Deletes a user from Firebase Auth.
 */
export async function deleteFirebaseUser(uidOrEmail: string) {
  const auth = getAdminAuth();
  try {
    let uid = uidOrEmail;
    if (uidOrEmail.includes("@")) {
      const user = await auth.getUserByEmail(uidOrEmail.trim().toLowerCase());
      uid = user.uid;
    }
    await auth.deleteUser(uid);
  } catch (err: any) {
    if (err.code !== "auth/user-not-found") {
      console.warn("Could not delete Firebase Auth user:", err.message);
    }
  }
}
