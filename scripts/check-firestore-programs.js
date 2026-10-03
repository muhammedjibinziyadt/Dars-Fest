const fs = require('fs');
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Read .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    let val = match[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.slice(1, -1);
    }
    env[match[1].trim()] = val;
  }
});

const projectId = env.FIREBASE_PROJECT_ID;
const clientEmail = env.FIREBASE_CLIENT_EMAIL;
let privateKey = env.FIREBASE_PRIVATE_KEY;
if (privateKey) {
  privateKey = privateKey.replace(/\\n/g, '\n');
}

const app = getApps().length > 0 ? getApps()[0] : initializeApp({
  credential: cert({ projectId, clientEmail, privateKey })
});

const db = getFirestore(app);

async function check() {
  const snapshot = await db.collection('programs').get();
  console.log('Total programs in Firestore:', snapshot.size);
  let count = 0;
  snapshot.forEach(doc => {
    const d = doc.data();
    if (d.scheduledDate || d.scheduledTime || d.scheduleStatus) {
      count++;
      console.log(`- [${doc.id}] ${d.name}: date="${d.scheduledDate}", time="${d.scheduledTime}", status="${d.scheduleStatus}"`);
    }
  });
  console.log('Total scheduled programs found:', count);
}

check();
