import { cookies } from "next/headers";
import { ADMIN_COOKIE, JURY_COOKIE, TEAM_COOKIE, SESSION_MAX_AGE } from "./config";
import { getJuries as loadJuries } from "./data";
import { getPortalTeams } from "./team-data";
import type { Jury, PortalTeam } from "./types";
import {
  verifyPasswordWithFirebaseAuth,
  getAdminFirebaseEmail,
  getTeamFirebaseEmail,
  getJuryFirebaseEmail,
  getAdminAuth,
} from "./firebase-auth";

export async function isAdminAuthenticated(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  if (!token || !token.startsWith("admin:")) return false;
  const uid = token.slice(6);
  if (!uid) return false;

  try {
    const auth = getAdminAuth();
    const user = await auth.getUser(uid);
    const adminEmail = getAdminFirebaseEmail().toLowerCase();
    const userEmail = user.email?.toLowerCase();
    const isEmailAdmin =
      userEmail === adminEmail ||
      userEmail === "admin@maerika.com" ||
      userEmail === "admin@gmail.com";
    const isClaimAdmin = user.customClaims?.role === "admin";
    return isEmailAdmin || isClaimAdmin;
  } catch {
    return false;
  }
}

export async function authenticateAdmin(identifier: string, password: string) {
  const cleanId = identifier.trim().toLowerCase();
  const adminEmail = getAdminFirebaseEmail();

  let emailToAuth = cleanId;
  if (cleanId === "admin" || !cleanId.includes("@")) {
    emailToAuth = adminEmail;
  }

  const result = await verifyPasswordWithFirebaseAuth(emailToAuth, password);

  // Strictly verify that the user possesses admin privileges
  const auth = getAdminAuth();
  const user = await auth.getUser(result.localId);
  const userEmail = user.email?.toLowerCase();
  const isEmailAdmin =
    userEmail === adminEmail.toLowerCase() ||
    userEmail === "admin@maerika.com" ||
    userEmail === "admin@gmail.com";
  const isClaimAdmin = user.customClaims?.role === "admin";

  if (!isEmailAdmin && !isClaimAdmin) {
    throw new Error("Access denied: This account does not have administrator privileges.");
  }

  // Automatically ensure custom claim is set for the verified admin
  if (!isClaimAdmin && isEmailAdmin) {
    try {
      await auth.setCustomUserClaims(user.uid, { role: "admin" });
    } catch {}
  }

  const store = await cookies();
  store.set(ADMIN_COOKIE, `admin:${result.localId}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
  return result;
}

export async function logoutAdmin() {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
}

export async function findJury(
  identifier: string,
): Promise<Jury | undefined> {
  const juries = await loadJuries();
  const lower = identifier.trim().toLowerCase();
  return juries.find(
    (jury) =>
      jury.id.toLowerCase() === lower || jury.name.toLowerCase() === lower,
  );
}

export async function authenticateJury(identifier: string, password: string): Promise<Jury | undefined> {
  const jury = await findJury(identifier);
  if (!jury) return undefined;

  const email = getJuryFirebaseEmail(jury.id);
  await verifyPasswordWithFirebaseAuth(email, password);

  const store = await cookies();
  store.set(JURY_COOKIE, `jury:${jury.id}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
  return jury;
}

export async function getCurrentJury() {
  const store = await cookies();
  const token = store.get(JURY_COOKIE)?.value;
  if (!token) return undefined;
  const [, juryId] = token.split(":");
  if (!juryId) return undefined;
  const jury = await findJury(juryId);
  return jury;
}

export async function findPortalTeam(identifier: string): Promise<PortalTeam | undefined> {
  const teams = await getPortalTeams();
  const lower = identifier.trim().toLowerCase();
  return teams.find(
    (team) =>
      team.teamName.toLowerCase() === lower ||
      team.id.toLowerCase() === lower ||
      (team.leaderEmail && team.leaderEmail.toLowerCase() === lower),
  );
}

export async function authenticateTeam(identifier: string, password: string) {
  const team = await findPortalTeam(identifier);
  if (!team) return undefined;

  const email = team.leaderEmail || getTeamFirebaseEmail(team.id);
  await verifyPasswordWithFirebaseAuth(email, password);

  const store = await cookies();
  store.set(TEAM_COOKIE, `team:${team.id}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
  return team;
}

export async function logoutTeam() {
  const store = await cookies();
  store.delete(TEAM_COOKIE);
}

export async function getCurrentTeam(): Promise<PortalTeam | undefined> {
  const store = await cookies();
  const token = store.get(TEAM_COOKIE)?.value;
  if (!token) return undefined;
  const [, teamId] = token.split(":");
  if (!teamId) return undefined;
  const teams = await getPortalTeams();
  return teams.find((team) => team.id === teamId);
}
