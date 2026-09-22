import dns from "node:dns";
import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

// Force IPv4 first to prevent EHOSTUNREACH on Windows/Node.js networks
try {
  dns.setDefaultResultOrder("ipv4first");
} catch {}
process.env.GRPC_DNS_RESOLVER = "native";

let app: App | null = null;
let firestoreInstance: Firestore | null = null;

export function getFirebaseAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  if (app) {
    return app;
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

  app = initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });

  return app;
}

export function getAdminDb(): Firestore {
  if (!firestoreInstance) {
    const adminApp = getFirebaseAdminApp();
    firestoreInstance = getFirestore(adminApp);
  }
  return firestoreInstance;
}
