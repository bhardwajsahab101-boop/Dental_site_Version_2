const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

let MONGODB_URI = "";
try {
  const envContent = fs.readFileSync(path.join(__dirname, "../.env.local"), "utf8");
  const lines = envContent.split(/\r?\n/);
  for (const line of lines) {
    if (line.trim().startsWith("MONGODB_URI=")) {
      MONGODB_URI = line.substring(line.indexOf("=") + 1).trim().replace(/^['"]|['"]$/g, "");
    }
  }
} catch (err) {
  console.error("Error reading env:", err);
}

async function run() {
  await mongoose.connect(MONGODB_URI);

  const Patient = mongoose.model("Patient", new mongoose.Schema({}, { strict: false }));
  const Appointment = mongoose.model("Appointment", new mongoose.Schema({}, { strict: false }));
  const Treatment = mongoose.model("Treatment", new mongoose.Schema({}, { strict: false }));
  const Clinic = mongoose.model("Clinic", new mongoose.Schema({}, { strict: false }));

  const clinics = await Clinic.find({});
  console.log("Clinics in DB:");
  for (const clinic of clinics) {
    const cId = clinic._id;
    const pCount = await Patient.countDocuments({ clinicId: cId });
    const pActiveCount = await Patient.countDocuments({ clinicId: cId, deletedAt: null });
    const apptCount = await Appointment.countDocuments({ clinicId: cId });
    const apptActiveCount = await Appointment.countDocuments({ clinicId: cId, deletedAt: null });
    const treatCount = await Treatment.countDocuments({ clinicId: cId });
    const treatActiveCount = await Treatment.countDocuments({ clinicId: cId, deletedAt: null });

    console.log(`- Clinic: ${clinic.name} (${cId}) [slug: ${clinic.slug}]`);
    console.log(`  Patients:     total=${pCount}, active=${pActiveCount}`);
    console.log(`  Appointments: total=${apptCount}, active=${apptActiveCount}`);
    console.log(`  Treatments:   total=${treatCount}, active=${treatActiveCount}`);
  }

  // Check counts with undefined clinicId
  const pNoClinic = await Patient.countDocuments({ clinicId: { $exists: false } });
  const apptNoClinic = await Appointment.countDocuments({ clinicId: { $exists: false } });
  const treatNoClinic = await Treatment.countDocuments({ clinicId: { $exists: false } });
  console.log(`\nDocuments with NO clinicId:`);
  console.log(`- Patients: ${pNoClinic}`);
  console.log(`- Appointments: ${apptNoClinic}`);
  console.log(`- Treatments: ${treatNoClinic}`);

  await mongoose.disconnect();
}

run().catch(console.error);
