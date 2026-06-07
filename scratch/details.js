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

  const Appointment = mongoose.model("Appointment", new mongoose.Schema({}, { strict: false }));
  const Treatment = mongoose.model("Treatment", new mongoose.Schema({}, { strict: false }));

  const clinicId = new mongoose.Types.ObjectId("6a23069909cd4dc78018c04c"); // AK Sharma

  const appts = await Appointment.find({ clinicId });
  console.log("Appointments details:");
  appts.forEach(a => {
    console.log(`- ID: ${a._id}, patientId: ${a.patientId} (${typeof a.patientId}), type: ${a.patientId ? a.patientId.constructor.name : 'null'}`);
  });

  const treats = await Treatment.find({ clinicId });
  console.log("\nTreatments details:");
  treats.forEach(t => {
    console.log(`- ID: ${t._id}, patientId: ${t.patientId} (${typeof t.patientId}), type: ${t.patientId ? t.patientId.constructor.name : 'null'}`);
  });

  await mongoose.disconnect();
}

run().catch(console.error);
