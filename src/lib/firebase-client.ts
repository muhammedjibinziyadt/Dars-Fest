import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let clientApp: FirebaseApp | null = null;

/**
 * Returns Firebase Client App instance for Firebase services (e.g. Firebase Auth).
 * Firestore has been migrated to MongoDB.
 */
export function getClientFirebaseApp(): FirebaseApp {
  if (!clientApp) {
    clientApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  }
  return clientApp;
}
