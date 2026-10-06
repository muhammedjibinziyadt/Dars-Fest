const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Read .env manually
const envContent = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf-8');
const env = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^([A-Za-z0-9_]+)=(.*)$/);
  if (match) {
    let val = match[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
    env[match[1]] = val.replace(/\\n/g, '\n');
  }
}

async function importStudents(studentsList) {
  if (!studentsList || studentsList.length === 0) {
    console.error("No students provided to import.");
    return;
  }

  await mongoose.connect(env.MONGODB_URI, { dbName: 'dars-fest' });
  const db = mongoose.connection.db;
  const col = db.collection('students');

  console.log(`Importing ${studentsList.length} students into MongoDB...`);

  for (const s of studentsList) {
    const studentId = s.id || s._id || `student-${Math.random().toString(36).substring(2, 9)}`;
    const studentDoc = {
      id: String(studentId),
      name: s.name,
      team_id: s.team_id || s.teamId || "",
      chest_no: String(s.chest_no || s.chestNo || s.chestNumber || "").toUpperCase().trim(),
      avatar: s.avatar || "",
      total_points: Number(s.total_points || 0),
      individual_points: Number(s.individual_points || 0),
      group_points: Number(s.group_points || 0)
    };

    await col.updateOne(
      { chest_no: studentDoc.chest_no },
      { $set: studentDoc },
      { upsert: true }
    );
    console.log(`  + Imported: [${studentDoc.chest_no}] ${studentDoc.name} (${studentDoc.team_id})`);
  }

  const count = await col.countDocuments();
  console.log(`Total students now in MongoDB: ${count}`);

  await mongoose.disconnect();
}

// Check if a json file is provided as argument
const argFile = process.argv[2];
if (argFile && fs.existsSync(argFile)) {
  const data = JSON.parse(fs.readFileSync(argFile, 'utf-8'));
  importStudents(Array.isArray(data) ? data : data.students).catch(console.error);
} else {
  module.exports = { importStudents };
}
