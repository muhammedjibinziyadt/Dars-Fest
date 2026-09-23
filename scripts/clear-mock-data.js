const dns = require('node:dns');
try { dns.setDefaultResultOrder('ipv4first'); } catch {}
const fs = require('fs');
const path = require('path');
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (match) {
        let val = match[2].trim();
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        process.env[match[1]] = val.replace(/\\n/g, '\n');
      }
    }
  }
}

loadEnv();

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (!projectId || !clientEmail || !privateKey) {
  console.error("Missing Firebase credentials.");
  process.exit(1);
}

const app = getApps().length > 0 ? getApps()[0] : initializeApp({
  credential: cert({ projectId, clientEmail, privateKey })
});

const db = getFirestore(app);

const COLLECTIONS_TO_CLEAR = [
  "teams",
  "students",
  "programs",
  "juries",
  "assigned_programs",
  "live_scores",
  "results_pending",
  "results_approved",
  "program_registrations",
  "replacement_requests"
];

async function deleteCollection(colName) {
  const colRef = db.collection(colName);
  const snap = await colRef.get();
  if (snap.empty) {
    console.log(`[${colName}] already empty.`);
    return;
  }
  const batch = db.batch();
  snap.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
  console.log(`[${colName}] cleared ${snap.size} documents.`);
}

async function main() {
  console.log("Starting Firestore data cleanup...");
  for (const col of COLLECTIONS_TO_CLEAR) {
    await deleteCollection(col);
  }
  console.log("Firestore cleanup finished successfully!");
}

main().catch(console.error);
