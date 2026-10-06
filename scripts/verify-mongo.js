const dns = require('node:dns');
try { dns.setDefaultResultOrder('ipv4first'); } catch {}
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Read .env
const envFile = path.resolve(__dirname, '..', '.env');
const lines = fs.readFileSync(envFile, 'utf-8').split('\n');
for (const line of lines) {
  const match = line.match(/^([A-Za-z0-9_]+)=(.*)$/);
  if (match && !process.env[match[1]]) {
    let val = match[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
    process.env[match[1]] = val.replace(/\\n/g, '\n');
  }
}

async function verify() {
  console.log("==================================================");
  console.log("       MONGODB VERIFICATION & INTEGRITY CHECK     ");
  console.log("==================================================");
  console.log("\nConnecting to MongoDB...");
  await mongoose.connect(process.env.MONGODB_URI, { dbName: 'dars-fest' });
  console.log(`Connected to database: ${mongoose.connection.name}`);

  const db = mongoose.connection.db;

  // 1. Collections Overview
  const collections = await db.listCollections().toArray();
  console.log("\n--- COLLECTION COUNTS ---");
  const counts = [];
  for (const col of collections) {
    const count = await db.collection(col.name).countDocuments();
    counts.push({ Collection: col.name, Documents: count });
  }
  console.table(counts);

  // 2. Teams
  const teams = await db.collection('teams').find().toArray();
  console.log(`\n--- TEAMS (${teams.length}) ---`);
  teams.forEach(t => console.log(`  * [${t.id}] ${t.name} (Leader: ${t.leader}, Password: ${t.portal_password ? '✓' : '✗'}, Points: ${t.total_points})`));

  // 3. Students
  const students = await db.collection('students').find().sort({ chest_no: 1 }).toArray();
  console.log(`\n--- STUDENTS (${students.length}) ---`);
  students.forEach(s => console.log(`  * [${s.chest_no}] ${s.name} (${s.team_id}) - Avatar: ${s.avatar ? '✓ (' + s.avatar.slice(0, 20) + '...)' : 'None'}`));

  // 4. Programs
  const programs = await db.collection('programs').find().toArray();
  const singleCount = programs.filter(p => p.section === 'single').length;
  const groupCount = programs.filter(p => p.section === 'group').length;
  const generalCount = programs.filter(p => p.section === 'general').length;
  console.log(`\n--- PROGRAMS (${programs.length}) ---`);
  console.log(`  * Single: ${singleCount}, Group: ${groupCount}, General: ${generalCount}`);

  // 5. Program Registrations
  const registrationsCount = await db.collection('program_registrations').countDocuments();
  console.log(`\n--- PROGRAM REGISTRATIONS (${registrationsCount}) ---`);
  const sampleRegistrations = await db.collection('program_registrations').find().limit(3).toArray();
  sampleRegistrations.forEach(r => console.log(`  * Student: ${r.studentName} (${r.studentChest}) -> Program: ${r.programName} [Team: ${r.teamName}]`));

  // 6. Registration Schedule
  const schedule = await db.collection('registration_schedules').findOne();
  console.log(`\n--- REGISTRATION SCHEDULE ---`);
  if (schedule) {
    console.log(`  * Window: ${schedule.startDateTime} to ${schedule.endDateTime}`);
  } else {
    console.log(`  * No schedule found!`);
  }

  // 7. Juries
  const juries = await db.collection('juries').find().toArray();
  console.log(`\n--- JURIES (${juries.length}) ---`);
  juries.forEach(j => console.log(`  * [${j.id}] ${j.name} (Avatar: ${j.avatar})`));

  // 8. Live Scores
  const liveScores = await db.collection('live_scores').find().toArray();
  console.log(`\n--- LIVE SCORES (${liveScores.length}) ---`);
  liveScores.forEach(s => console.log(`  * Team: ${s.team_id || s.id} -> Total Points: ${s.total_points}`));

  // 9. Admin Settings
  const adminSettings = await db.collection('admin_settings').find().toArray();
  console.log(`\n--- ADMIN SETTINGS (${adminSettings.length}) ---`);
  adminSettings.forEach(a => console.log(`  * Key/Doc: ${a.id || a.key || 'config'} -> Fields: ${Object.keys(a).filter(k => k !== '_id').join(', ')}`));

  await mongoose.disconnect();
  console.log("\n==================================================");
  console.log("       VERIFICATION COMPLETED SUCCESSFULLY        ");
  console.log("==================================================");
}

verify().catch(err => {
  console.error("Verification error:", err);
  process.exit(1);
});
