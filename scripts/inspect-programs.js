const { getAdminDb } = require('./src/lib/firebase-admin');

async function inspectPrograms() {
  try {
    const db = getAdminDb();
    const snapshot = await db.collection('programs').get();
    console.log('Total programs in Firestore:', snapshot.size);
    let scheduledCount = 0;
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.scheduledDate || data.scheduledTime || data.scheduleStatus) {
        scheduledCount++;
        console.log(`Program: "${data.name}" [ID: ${doc.id}]`);
        console.log(`  scheduledDate: ${data.scheduledDate}`);
        console.log(`  scheduledTime: ${data.scheduledTime}`);
        console.log(`  scheduleStatus: ${data.scheduleStatus}`);
      }
    });
    console.log(`Scheduled programs count: ${scheduledCount}`);
  } catch (e) {
    console.error('Error reading Firestore:', e);
  }
}

inspectPrograms();
