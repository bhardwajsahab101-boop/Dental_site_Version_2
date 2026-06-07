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
  console.log("Connected to MongoDB database.");

  // Define schemas
  const Patient = mongoose.model("Patient", new mongoose.Schema({}, { strict: false }));
  const Appointment = mongoose.model("Appointment", new mongoose.Schema({}, { strict: false }));
  const Treatment = mongoose.model("Treatment", new mongoose.Schema({}, { strict: false }));
  const Clinic = mongoose.model("Clinic", new mongoose.Schema({}, { strict: false }));

  const clinicsCount = await Clinic.countDocuments({});
  console.log(`\n--- CLINICS (Count: ${clinicsCount}) ---`);
  const clinics = await Clinic.find({});
  clinics.forEach(c => console.log(`- Clinic: ID: ${c._id}, Name: ${c.name}, Slug: ${c.slug}`));

  const patientsCount = await Patient.countDocuments({});
  console.log(`\n--- PATIENTS (Count: ${patientsCount}) ---`);
  const patients = await Patient.find({}).limit(5);
  patients.forEach(p => console.log(`- Patient: ID: ${p._id}, Name: ${p.fullName}, Code: ${p.patientCode}, clinicId: ${p.clinicId}, deletedAt: ${p.deletedAt}`));

  const apptCount = await Appointment.countDocuments({});
  console.log(`\n--- APPOINTMENTS (Count: ${apptCount}) ---`);
  const appts = await Appointment.find({}).limit(5);
  appts.forEach(a => console.log(`- Appointment: ID: ${a._id}, clinicId: ${a.clinicId}, patientId: ${a.patientId}, deletedAt: ${a.deletedAt}, status: ${a.status}`));

  const treatCount = await Treatment.countDocuments({});
  console.log(`\n--- TREATMENTS (Count: ${treatCount}) ---`);
  const treats = await Treatment.find({}).limit(5);
  treats.forEach(t => console.log(`- Treatment: ID: ${t._id}, clinicId: ${t.clinicId}, patientId: ${t.patientId}, deletedAt: ${t.deletedAt}, cost: ${t.cost}`));

  await mongoose.disconnect();
  console.log("\nDisconnected from MongoDB.");
}

run().catch(console.error);
