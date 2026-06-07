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
  const clinicId = new mongoose.Types.ObjectId("6a23069909cd4dc78018c04c"); // AK Sharma

  const appts = await Appointment.find({ clinicId });
  console.log(`Found ${appts.length} appointments:`);
  appts.forEach((a, index) => {
    console.log(`${index + 1}. ID: ${a._id}`);
    console.log(`   patientId: ${a.patientId}`);
    console.log(`   fullName:  ${a.fullName}`);
    console.log(`   phone:     ${a.phone}`);
    console.log(`   email:     ${a.email}`);
    console.log(`   age:       ${a.age}`);
    console.log(`   gender:    ${a.gender}`);
    console.log(`   service:   ${a.service}`);
    console.log(`   status:    ${a.status}`);
  });

  await mongoose.disconnect();
}

run().catch(console.error);
