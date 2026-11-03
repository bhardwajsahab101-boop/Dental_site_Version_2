const mongoose = require('mongoose');
const fs = require('fs');

// Load env
try {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.substring(0, eqIdx).trim();
      const val = trimmed.substring(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
      process.env[key] = val;
    }
  }
} catch (e) {
  console.warn('Could not read .env.local', e);
}

async function clearAll() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB:', process.env.MONGODB_URI);

  const db = mongoose.connection.db;

  // 1. Delete all patients
  const pRes = await db.collection('patients').deleteMany({});
  console.log(`Deleted ${pRes.deletedCount} patient records.`);

  // 2. Delete all appointments
  const aRes = await db.collection('appointments').deleteMany({});
  console.log(`Deleted ${aRes.deletedCount} appointment records.`);

  // 3. Delete all treatments
  const tRes = await db.collection('treatments').deleteMany({});
  console.log(`Deleted ${tRes.deletedCount} treatment records.`);

  // 4. Reset patient counters to 0
  const cRes = await db.collection('counters').deleteMany({ name: { $regex: '^patient_' } });
  console.log(`Reset patient counters.`);

  // 5. Reset scan documents entries back to pending
  const sRes = await db.collection('scandocuments').updateMany(
    {},
    {
      $set: {
        approvedCount: 0,
        status: 'needs_review',
        'entries.$[].status': 'pending',
        'entries.$[].savedPatientId': null,
        'entries.$[].savedPatientCode': null,
        'entries.$[].savedAppointmentId': null,
      },
    }
  );
  console.log(`Reset scan document entries back to pending.`);

  console.log('ALL PATIENTS, APPOINTMENTS, TREATMENTS, AND NUMBERING CLEARED SUCCESSFULLY!');
  await mongoose.disconnect();
}

clearAll().catch((err) => {
  console.error('Error clearing patients:', err);
  process.exit(1);
});
