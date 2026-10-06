const dns = require('node:dns');
try { dns.setDefaultResultOrder('ipv4first'); } catch {}
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (match && !process.env[match[1]]) {
        let val = match[2].trim();
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
        process.env[match[1]] = val.replace(/\\n/g, '\n');
      }
    }
  }
}

loadEnv();

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("Missing MONGODB_URI.");
  process.exit(1);
}

const COLLECTIONS_TO_CLEAR = [
  "results_pending",
  "replacement_requests",
  "notifications",
  "attendance"
];

async function main() {
  console.log("Connecting to MongoDB for mock data cleanup...");
  await mongoose.connect(uri, { dbName: 'dars-fest' });
  const db = mongoose.connection.db;

  for (const colName of COLLECTIONS_TO_CLEAR) {
    const col = db.collection(colName);
    const count = await col.countDocuments();
    if (count > 0) {
      await col.deleteMany({});
      console.log(`[${colName}] cleared ${count} documents from MongoDB.`);
    } else {
      console.log(`[${colName}] already empty in MongoDB.`);
    }
  }

  await mongoose.disconnect();
  console.log("MongoDB cleanup finished successfully!");
}

main().catch(console.error);
