import dns from "node:dns";
import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

// Force IPv4 first to prevent EHOSTUNREACH on Windows/Node.js networks
try {
  dns.setDefaultResultOrder("ipv4first");
} catch {}
process.env.GRPC_DNS_RESOLVER = "native";

const globalForFirebase = globalThis as unknown as {
  firebaseAdminApp?: App;
  firestoreInstance?: Firestore;
};

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
    throw new Error("Missing Firebase Admin SDK environment variables in .env.local");
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

export function getAdminDb(): Firestore {
  if (!globalForFirebase.firestoreInstance) {
    const adminApp = getFirebaseAdminApp();
    globalForFirebase.firestoreInstance = getFirestore(adminApp);
  }
  return globalForFirebase.firestoreInstance;
}
