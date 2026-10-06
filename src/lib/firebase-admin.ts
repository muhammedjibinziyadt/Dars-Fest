import dns from "node:dns";
import { getApps, initializeApp, cert, type App } from "firebase-admin/app";

// Force IPv4 first to prevent EHOSTUNREACH on Windows/Node.js networks
try {
  dns.setDefaultResultOrder("ipv4first");
} catch {}

const globalForFirebase = globalThis as unknown as {
  firebaseAdminApp?: App;
};

/**
 * Returns the Firebase Admin App instance used for Firebase Authentication.
 * Firestore has been migrated to MongoDB.
 */
export function getFirebaseAdminApp(): App {
  if (globalForFirebase.firebaseAdminApp) {
    return globalForFirebase.firebaseAdminApp;
  }

  if (getApps().length > 0) {
    globalForFirebase.firebaseAdminApp = getApps()[0];
    return globalForFirebase.firebaseAdminApp;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (privateKey) {
    privateKey = privateKey.replace(/\\n/g, "\n");
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.slice(1, -1);
    }
  }

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Missing Firebase Admin SDK environment variables");
  }

  const app = initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });

  globalForFirebase.firebaseAdminApp = app;
  return app;
}
