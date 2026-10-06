const dns = require('node:dns');
try { dns.setDefaultResultOrder('ipv4first'); } catch {}
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// 1. Load .env
const envFile = path.resolve(__dirname, '..', '.env');
const lines = fs.readFileSync(envFile, 'utf-8').split('\n');
const env = {};
for (const line of lines) {
  const match = line.match(/^([A-Za-z0-9_]+)=(.*)$/);
  if (match) {
    let val = match[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
    env[match[1]] = val.replace(/\\n/g, '\n');
  }
}

const MONGODB_URI = env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("MONGODB_URI is not defined in .env");
  process.exit(1);
}

// 2. Initialize Firebase Admin SDK
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

if (!env.FIREBASE_PROJECT_ID || !env.FIREBASE_CLIENT_EMAIL || !env.FIREBASE_PRIVATE_KEY) {
  console.error("Firebase Admin credentials missing in .env");
  process.exit(1);
}

const firebaseApp = getApps().length > 0 ? getApps()[0] : initializeApp({
  credential: cert({
    projectId: env.FIREBASE_PROJECT_ID,
    clientEmail: env.FIREBASE_CLIENT_EMAIL,
    privateKey: env.FIREBASE_PRIVATE_KEY,
  })
}, 'migration-app');

const firebaseDb = getFirestore(firebaseApp);
try {
  firebaseDb.settings({ ignoreUndefinedProperties: true });
} catch {}

const KNOWN_COLLECTIONS = [
  'teams',
  'students',
  'programs',
  'juries',
  'assigned_programs',
  'results_pending',
  'results_approved',
  'live_scores',
  'program_registrations',
  'registration_schedules',
  'replacement_requests',
  'notifications',
  'attendance',
  'system_meta',
  'admin_settings'
];

/**
 * Deep convert any Firestore Timestamp / Date / Buffer into plain JSON types.
 */
function sanitizeData(val) {
  if (val === null || val === undefined) return val;
  if (Array.isArray(val)) return val.map(sanitizeData);
  if (typeof val === 'object') {
    // Firestore Timestamp
    if (typeof val.toDate === 'function') {
      return val.toDate().toISOString();
    }
    // Timestamp-like {_seconds, _nanoseconds}
    if (typeof val._seconds === 'number' && typeof val._nanoseconds === 'number') {
      return new Date(val._seconds * 1000 + val._nanoseconds / 1000000).toISOString();
    }
    // Date object
    if (val instanceof Date) {
      return val.toISOString();
    }
    // Buffer
    if (Buffer.isBuffer(val)) {
      return val.toString();
    }
    const clean = {};
    for (const [k, v] of Object.entries(val)) {
      clean[k] = sanitizeData(v);
    }
    return clean;
  }
  return val;
}

async function migrate() {
  console.log("==================================================");
  console.log("    FIRESTORE TO MONGODB FULL DATA MIGRATION     ");
  console.log("==================================================");

  // Connect to MongoDB
  console.log("\nConnecting to MongoDB Atlas...");
  await mongoose.connect(MONGODB_URI, { dbName: 'dars-fest' });
  console.log(`Connected to MongoDB successfully! Database: ${mongoose.connection.name}`);
  const mongoDb = mongoose.connection.db;

  // Local disk backup cache directory
  const cacheDir = path.resolve(__dirname, '..', '.cache', 'firestore');
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }

  // Discover all Firestore collections dynamically
  console.log("\nDiscovering collections in Firestore...");
  const discovered = await firebaseDb.listCollections();
  const discoveredNames = discovered.map(c => c.id);
  console.log(`Discovered ${discoveredNames.length} active Firestore collections:`, discoveredNames);

  // Merge with known collections without duplicates
  const allTargetCollections = Array.from(new Set([...discoveredNames, ...KNOWN_COLLECTIONS]));
  console.log(`Total collections to process: ${allTargetCollections.length}`);

  const summary = [];

  for (const colName of allTargetCollections) {
    console.log(`\n--------------------------------------------------`);
    console.log(`Processing collection: "${colName}"`);

    let docs = [];

    try {
      const snap = await firebaseDb.collection(colName).get();
      console.log(`- Fetched ${snap.size} documents from Firestore.`);

      snap.forEach(docSnap => {
        const raw = docSnap.data();
        const data = sanitizeData(raw);

        // Ensure primary ID is set from docSnap.id
        if (!data.id) {
          data.id = docSnap.id;
        }

        // Keep key for scheduled or settings collections
        if (colName === 'registration_schedules' || colName === 'system_meta') {
          if (!data.key) data.key = docSnap.id;
        }

        docs.push(data);
      });
    } catch (err) {
      console.warn(`- Failed to read collection "${colName}" from live Firestore: ${err.message}`);
    }

    // Save backup JSON to local disk
    if (docs.length > 0) {
      const backupPath = path.join(cacheDir, `${colName}.json`);
      fs.writeFileSync(backupPath, JSON.stringify(docs, null, 2), 'utf-8');
      console.log(`- Saved local backup copy to: .cache/firestore/${colName}.json`);
    } else {
      // Check disk cache if live read was empty or failed
      const backupPath = path.join(cacheDir, `${colName}.json`);
      if (fs.existsSync(backupPath)) {
        try {
          const cached = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));
          if (Array.isArray(cached) && cached.length > 0) {
            docs = cached;
            console.log(`- Loaded ${docs.length} fallback documents from disk cache.`);
          }
        } catch {}
      }
    }

    if (docs.length === 0) {
      console.log(`- No documents to migrate for collection "${colName}".`);
      const existingMongoCount = await mongoDb.collection(colName).countDocuments();
      summary.push({
        collection: colName,
        firestoreCount: 0,
        mongoCount: existingMongoCount,
        status: existingMongoCount > 0 ? "Skipped (already has Mongo docs)" : "Empty in both"
      });
      continue;
    }

    const targetCol = mongoDb.collection(colName);
    console.log(`- Upserting ${docs.length} documents into MongoDB "${colName}"...`);

    const bulkOps = docs.map(doc => {
      const cleanDoc = { ...doc };
      delete cleanDoc._id; // Let Mongo manage native ObjectId

      let filter;
      if (colName === 'live_scores') {
        const teamId = cleanDoc.team_id || cleanDoc.id;
        filter = { $or: [{ team_id: teamId }, { id: teamId }] };
      } else if (colName === 'registration_schedules') {
        const keyVal = cleanDoc.key || cleanDoc.id || 'global';
        filter = { $or: [{ key: keyVal }, { id: keyVal }] };
      } else if (colName === 'system_meta') {
        const keyVal = cleanDoc.key || cleanDoc.id;
        filter = { $or: [{ key: keyVal }, { id: keyVal }] };
      } else if (colName === 'assigned_programs' && cleanDoc.program_id && cleanDoc.jury_id) {
        filter = { program_id: cleanDoc.program_id, jury_id: cleanDoc.jury_id };
      } else {
        const idVal = String(cleanDoc.id || cleanDoc.key || cleanDoc.username);
        filter = { id: idVal };
      }

      return {
        updateOne: {
          filter,
          update: { $set: cleanDoc },
          upsert: true
        }
      };
    });

    const res = await targetCol.bulkWrite(bulkOps, { ordered: false });
    const finalMongoCount = await targetCol.countDocuments();
    console.log(`- Bulk write result: matched=${res.matchedCount}, modified=${res.modifiedCount}, upserted=${res.upsertedCount}.`);
    console.log(`- Collection "${colName}" now has ${finalMongoCount} documents in MongoDB.`);

    summary.push({
      collection: colName,
      firestoreCount: docs.length,
      mongoCount: finalMongoCount,
      status: "Migrated successfully"
    });
  }

  // Print final summary report
  console.log("\n==================================================");
  console.log("            MIGRATION SUMMARY REPORT              ");
  console.log("==================================================");
  console.table(summary);

  await mongoose.disconnect();
  console.log("MongoDB disconnected cleanly.");
  console.log("All data migration completed successfully!\n");
}

migrate().catch(err => {
  console.error("Migration fatal error:", err);
  process.exit(1);
});
