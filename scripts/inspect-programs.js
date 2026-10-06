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

async function inspectPrograms() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.error("MONGODB_URI not found in .env");
      process.exit(1);
    }
    await mongoose.connect(uri, { dbName: 'dars-fest' });
    const db = mongoose.connection.db;

    const programs = await db.collection('programs').find().toArray();
    console.log('Total programs in MongoDB:', programs.length);
    let scheduledCount = 0;
    programs.forEach(data => {
      if (data.scheduledDate || data.scheduledTime || data.scheduleStatus) {
        scheduledCount++;
        console.log(`Program: "${data.name}" [ID: ${data.id}]`);
        console.log(`  scheduledDate: ${data.scheduledDate}`);
        console.log(`  scheduledTime: ${data.scheduledTime}`);
        console.log(`  scheduleStatus: ${data.scheduleStatus}`);
      }
    });
    console.log(`Scheduled programs count: ${scheduledCount}`);
    await mongoose.disconnect();
  } catch (e) {
    console.error('Error reading MongoDB programs:', e);
  }
}

inspectPrograms();
