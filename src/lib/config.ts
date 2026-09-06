export const ADMIN_COOKIE = "fest_admin_token";
export const JURY_COOKIE = "fest_jury_token";
export const TEAM_COOKIE = "fest_team_token";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 365 * 10; // 10 years


export const JWT_SECRET = process.env.JWT_SECRET || "default_insecure_secret_for_dev_only";
export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
