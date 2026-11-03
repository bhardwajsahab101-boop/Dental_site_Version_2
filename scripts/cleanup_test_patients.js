const mongoose = require("mongoose");

async function cleanup() {
  await mongoose.connect(process.env.MONGODB_URI);
  const Patient = mongoose.models.Patient || mongoose.model("Patient", new mongoose.Schema({}, { strict: false }));
  const res = await Patient.deleteMany({ fullName: { $regex: /Patient in Box|Dental Clinic Fatient/i } });
  console.log("Deleted placeholders:", res.deletedCount);
  const remaining = await Patient.find({}).lean();
  console.log(`Remaining authentic patients: ${remaining.length}`);
  for (const r of remaining) {
    console.log(`- ${r.patientId || r.patientCode || r._id}: ${r.fullName} (${r.phone || 'no phone'})`);
  }
  process.exit(0);
}

cleanup().catch(err => {
  console.error("Cleanup error:", err);
  process.exit(1);
});
