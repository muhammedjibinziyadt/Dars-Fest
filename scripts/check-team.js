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

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is not set.");
    process.exit(1);
  }
  await mongoose.connect(uri, { dbName: 'dars-fest' });
  const db = mongoose.connection.db;

  const teams = await db.collection('teams').find().toArray();
  console.log("Teams found in MongoDB:", teams.length);
  teams.forEach(doc => {
    console.log(doc.id, JSON.stringify(doc, null, 2));
  });

  await mongoose.disconnect();
}

main().catch(console.error);
