import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { hash, compare } from "bcryptjs";
import { ADMIN_COOKIE, JURY_COOKIE, TEAM_COOKIE, JWT_SECRET } from "./config";
import { juriesCol, teamsCol, docsToData } from "./models";
import { adminAuth } from "./firebase-admin";
import type { Jury, PortalTeam, Team } from "./types";

const SECRET_KEY = new TextEncoder().encode(JWT_SECRET);
const ALG = "HS256";

export async function hashPassword(plain: string): Promise<string> {
  return await hash(plain, 10);
}

export async function verifyPassword(plain: string, hashed: string): Promise<boolean> {
  return await compare(plain, hashed);
}

export async function createSessionToken(payload: any): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime("6h")
    .sign(SECRET_KEY);
}

export async function verifySessionToken<T>(token: string): Promise<T | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload as T;
  } catch (error) {
    return null;
  }
}

/**
 * Verifies a Firebase Auth ID token string from client side.
 */
export async function verifyFirebaseAuthToken(idToken: string) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    return null;
  }
}

/**
 * Resolves an identifier (either username or email) to a Firebase Auth email.
 */
export async function resolveAdminEmail(identifier: string): Promise<string> {
  const clean = identifier.trim().toLowerCase();
  if (clean.includes("@")) {
    return clean;
  }

  try {
    // Query Firebase Auth users to find matching displayName or email prefix
    const list = await adminAuth.listUsers(100);
    const match = list.users.find(
      (u) =>
        u.displayName?.toLowerCase() === clean ||
        u.email?.split("@")[0].toLowerCase() === clean
    );
    if (match?.email) {
      return match.email;
    }
  } catch (e) {
    console.warn("Could not query Firebase Auth for email resolution:", e);
  }

  return `${clean.replace(/[^a-z0-9]/g, "") || "admin"}@darsfest.com`;
}

/**
 * Attempts to sign in with Firebase Authentication via REST API.
 */
export async function signInAdminWithFirebaseAuth(email: string, password: string): Promise<{
  success: boolean;
  user?: { uid: string; email: string; displayName?: string };
  error?: string;
}> {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) {
    return { success: false, error: "Firebase API key is not configured in .env" };
  }

  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
      }
    );

    const data = await res.json();
    if (!res.ok || data.error) {
      const errCode = data.error?.message;
      if (errCode === "OPERATION_NOT_ALLOWED") {
        return {
          success: false,
          error: "Email/Password provider is not enabled in Firebase Console. Please enable it in Firebase Console -> Authentication -> Sign-in method.",
        };
      }
      return { success: false, error: "INVALID_CREDENTIALS" };
    }

    return {
      success: true,
      user: {
        uid: data.localId,
        email: data.email,
        displayName: data.displayName,
      },
    };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to reach Firebase Authentication." };
  }
}

/**
 * Stores and updates the Admin account directly in Firebase Authentication.
 */
export async function syncAdminToFirebaseAuth(usernameOrEmail: string, password: string): Promise<{
  uid: string;
  email: string;
  displayName: string;
}> {
  const isEmail = usernameOrEmail.includes("@");
  const email = isEmail
    ? usernameOrEmail.trim().toLowerCase()
    : `${usernameOrEmail.toLowerCase().replace(/[^a-z0-9]/g, "") || "admin"}@darsfest.com`;
  const displayName = isEmail
    ? usernameOrEmail.split("@")[0].trim()
    : usernameOrEmail.trim();

  // Look for existing user in Firebase Auth
  let existingUser = await adminAuth.getUserByEmail(email).catch(() => null);

  if (!existingUser) {
    try {
      const list = await adminAuth.listUsers(50);
      existingUser =
        list.users.find(
          (u) =>
            u.email?.toLowerCase() === email ||
            u.displayName?.toLowerCase() === displayName.toLowerCase() ||
            (u.customClaims as any)?.role === "admin"
        ) || null;
    } catch (e) {}
  }

  let uid: string;
  if (existingUser) {
    await adminAuth.updateUser(existingUser.uid, {
      email,
      password,
      displayName,
    });
    uid = existingUser.uid;
  } else {
    const newUser = await adminAuth.createUser({
      email,
      password,
      displayName,
    });
    uid = newUser.uid;
  }

  // Set admin custom claims
  try {
    await adminAuth.setCustomUserClaims(uid, { role: "admin", admin: true });
  } catch (claimErr) {
    console.warn("Could not set admin custom claims:", claimErr);
  }

  return { uid, email, displayName };
}

export async function authenticateAdmin(
  identifier: string,
  password: string
): Promise<{ success: boolean; username?: string; email?: string; error?: string }> {
  const targetEmail = await resolveAdminEmail(identifier);

  // Sign in directly with Firebase Authentication
  const fbResult = await signInAdminWithFirebaseAuth(targetEmail, password);

  if (fbResult.success && fbResult.user) {
    try {
      await adminAuth.setCustomUserClaims(fbResult.user.uid, { role: "admin", admin: true });
    } catch (e) {}

    return {
      success: true,
      username: fbResult.user.displayName || identifier,
      email: fbResult.user.email || targetEmail,
    };
  }

  // If Firebase rejected due to configuration (e.g. email/password not enabled)
  if (fbResult.error && fbResult.error.includes("Firebase Console")) {
    return {
      success: false,
      error: fbResult.error,
    };
  }

  return {
    success: false,
    error: "Invalid username/email or password.",
  };
}

export async function getCurrentAdmin(): Promise<{ role: string; username: string; email?: string } | null> {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  if (!token) return null;

  const payload = await verifySessionToken<{ role: string; username: string; email?: string }>(token);
  if (payload?.role !== "admin") return null;
  return payload;
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  if (!token) return false;

  const payload = await verifySessionToken<{ role: string; username: string }>(token);
  return payload?.role === "admin";
}

export async function findJury(identifier: string): Promise<Jury | undefined> {
  const lower = identifier.trim().toLowerCase();

  try {
    const doc = await juriesCol.doc(identifier).get();
    if (doc.exists) {
      return doc.data() as Jury;
    }

    const snap = await juriesCol.get();
    const juries = docsToData<Jury>(snap);

    return juries.find(
      (j) => j.id.toLowerCase() === lower || j.name.toLowerCase() === lower
    );
  } catch (e) {
    return undefined;
  }
}

export async function authenticateJury(identifier: string, password: string): Promise<Jury | undefined> {
  const jury = await findJury(identifier);
  if (!jury) return undefined;

  const isHashed = jury.password.startsWith("$2");
  if (isHashed) {
    if (await verifyPassword(password, jury.password)) return jury;
  } else {
    if (jury.password === password) {
      return jury;
    }
  }
  return undefined;
}

export async function getCurrentJury(): Promise<Jury | undefined> {
  const store = await cookies();
  const token = store.get(JURY_COOKIE)?.value;
  if (!token) return undefined;

  const payload = await verifySessionToken<{ role: string; id: string }>(token);
  if (!payload || payload.role !== "jury") return undefined;

  const jury = await findJury(payload.id);
  return jury;
}

export async function authenticateTeam(teamName: string, password: string): Promise<PortalTeam | undefined> {
  const lower = teamName.trim().toLowerCase();
  try {
    const snap = await teamsCol.get();
    const teams = docsToData<Team>(snap);

    const teamDoc = teams.find((t) => t.name.toLowerCase() === lower);
    if (!teamDoc) return undefined;

    const team: PortalTeam = {
      id: teamDoc.id,
      teamName: teamDoc.name,
      password: teamDoc.portal_password ?? "",
      leaderName: teamDoc.leader,
      themeColor: teamDoc.color,
    };

    const isHashed = team.password.startsWith("$2");
    if (isHashed) {
      if (await verifyPassword(password, team.password)) {
        return team;
      }
    } else {
      if (team.password === password) return team;
    }

    return undefined;
  } catch (e) {
    return undefined;
  }
}

export async function logoutTeam() {
  const store = await cookies();
  store.delete(TEAM_COOKIE);
}

export async function getCurrentTeam(): Promise<PortalTeam | undefined> {
  const store = await cookies();
  const token = store.get(TEAM_COOKIE)?.value;
  if (!token) return undefined;

  const payload = await verifySessionToken<{ role: string; id: string }>(token);
  if (!payload || payload.role !== "team") return undefined;

  try {
    const doc = await teamsCol.doc(payload.id).get();
    if (!doc.exists) return undefined;
    const teamDoc = doc.data() as Team;

    return {
      id: teamDoc.id,
      teamName: teamDoc.name,
      password: teamDoc.portal_password ?? "",
      leaderName: teamDoc.leader,
      themeColor: teamDoc.color,
    };
  } catch (e) {
    return undefined;
  }
}
