import fs from "node:fs";
import path from "node:path";
import { initializeApp, getApps, cert, getApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";

function loadEnvFile() {
  try {
    const envPath = path.resolve(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf8");
      // Match KEY=VALUE (supports quoted multiline strings like private keys)
      const regex = /^\s*([A-Za-z0-9_]+)\s*=\s*(?:"((?:[^"\\]|\\.)*)"|'([^']*)'|([^#\r\n]*))/gm;
      let match;
      while ((match = regex.exec(content)) !== null) {
        const key = match[1];
        const val = match[2] !== undefined ? match[2] : (match[3] !== undefined ? match[3] : (match[4] || "").trim());
        process.env[key] = val;
      }
    }
  } catch (e) {}
}

loadEnvFile();

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "dars-fest-61b92";
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

let privateKey: string | undefined = undefined;
if (rawPrivateKey) {
  let key = rawPrivateKey.trim();
  // Strip outer quotes if pasted with quotes
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1).trim();
  }
  // Convert escaped literal \n to real newlines
  privateKey = key.replace(/\\n/g, "\n");
}

if (!getApps().length) {
  if (projectId && clientEmail && privateKey) {
    try {
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    } catch (err) {
      console.error("[Firebase Admin] Failed to initialize with cert:", err);
      initializeApp({
        projectId,
      });
    }
  } else {
    console.warn(
      "[Firebase Admin] Missing service account credentials (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY) in environment variables."
    );
    initializeApp({
      projectId,
    });
  }
}

const app = getApp();

export const adminDb = getFirestore(app);
try {
  adminDb.settings({ ignoreUndefinedProperties: true });
} catch {
  // Settings can only be applied once during Firestore initialization
}
export const adminAuth = getAuth(app);
export const adminStorage = getStorage(app);
