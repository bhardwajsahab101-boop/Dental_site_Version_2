const mongoose = require('mongoose');

async function main() {
  const targetDateStr = process.argv[2];
  if (!targetDateStr) {
    console.log("Usage: node scripts/update_all_patients_visit_date.js YYYY-MM-DD");
    process.exit(1);
  }

  const targetDate = new Date(targetDateStr + "T00:00:00.000Z");
  if (isNaN(targetDate.getTime())) {
    console.error("Invalid date:", targetDateStr);
    process.exit(1);
  }

  await mongoose.connect('mongodb://127.0.0.1:27017/dentalos');
  const db = mongoose.connection.db;

  const patientRes = await db.collection('patients').updateMany(
    {},
    { $set: { visitDate: targetDate } }
  );

  const apptRes = await db.collection('appointments').updateMany(
    {},
    { $set: { appointmentDate: targetDate } }
  );

  console.log(`Successfully updated ${patientRes.modifiedCount} patients and ${apptRes.modifiedCount} appointments to ${targetDateStr}!`);
  await mongoose.disconnect();
}

main().catch(console.error);

