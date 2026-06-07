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
  console.log("Connected to database.");

  // Models with strict: false so we don't hit validation limits
  const Patient = mongoose.model("Patient", new mongoose.Schema({}, { strict: false }));
  const Appointment = mongoose.model("Appointment", new mongoose.Schema({}, { strict: false }));
  const Treatment = mongoose.model("Treatment", new mongoose.Schema({}, { strict: false }));
  const Counter = mongoose.model("Counter", new mongoose.Schema({}, { strict: false }));

  const clinicId = new mongoose.Types.ObjectId("6a23069909cd4dc78018c04c"); // AK Sharma
  const clinicIdStr = "6a23069909cd4dc78018c04c";

  // Get current sequence value for AK Sharma or default
  let counter = await Counter.findOne({ name: `patient_${clinicIdStr}` });
  if (!counter) {
    counter = await Counter.findOne({ name: "patient_default" });
  }
  let currentSeq = counter ? counter.sequence : 0;
  console.log(`Initial patient sequence for AK Sharma: ${currentSeq}`);

  function getNextPatientCode() {
    currentSeq += 1;
    return `PAT-${String(currentSeq).padStart(3, "0")}`;
  }

  // 1. Recover patients with referenced IDs
  const referencedIds = [
    { id: "6a1d099e2368d64765fd20ac", name: "Ayush", phone: "8950817515", email: "bhardwajSahab@101gmail.com" },
    { id: "6a1d13372368d64765fd20b3", name: "Khushi", phone: "8959817515", email: "Bhardwajsahab101@gamil.com" },
    { id: "6a1ffb075dd248bf075b5fb3", name: "Patient 5fb3", phone: "9999990001", email: "" },
    { id: "6a1ef1cd0d7be07cd939f8ca", name: "Patient f8ca", phone: "9999990002", email: "" },
    { id: "6a1d10c42368d64765fd20b2", name: "Patient 20b2", phone: "9999990003", email: "" },
    { id: "6a22db8338a059d8dfec2f8e", name: "Patient 2f8e", phone: "9999990004", email: "" }
  ];

  for (const ref of referencedIds) {
    const pId = new mongoose.Types.ObjectId(ref.id);
    const existing = await Patient.findById(pId);
    if (!existing) {
      const patientCode = getNextPatientCode();
      await Patient.create({
        _id: pId,
        clinicId,
        fullName: ref.name,
        patientCode,
        phone: ref.phone,
        email: ref.email || undefined,
        gender: "Other",
        age: 30,
        address: "Default Address",
        deletedAt: null,
        deletedBy: null
      });
      console.log(`Recreated patient: ${ref.name} (${patientCode}) with ID: ${ref.id}`);
    } else {
      console.log(`Patient with ID ${ref.id} already exists.`);
    }
  }

  // 2. Link unlinked appointments (appointments 1, 5, 6)
  const unlinkedAppts = await Appointment.find({ clinicId, patientId: { $exists: false } });
  console.log(`Found ${unlinkedAppts.length} unlinked appointments.`);

  for (const appt of unlinkedAppts) {
    const fullName = appt.fullName || "Unlinked Patient";
    const phone = appt.phone || "9999999999";
    const email = appt.email || "";

    // Check if we already created a patient with this phone/name in this clinic
    let patient = await Patient.findOne({ clinicId, phone });
    if (!patient) {
      const patientCode = getNextPatientCode();
      patient = await Patient.create({
        clinicId,
        fullName,
        patientCode,
        phone,
        email: email || undefined,
        gender: "Other",
        age: 30,
        address: "Default Address",
        deletedAt: null,
        deletedBy: null
      });
      console.log(`Created new patient for unlinked appointment: ${fullName} (${patientCode}) with ID: ${patient._id}`);
    }

    await Appointment.findByIdAndUpdate(appt._id, { $set: { patientId: patient._id } });
    console.log(`Linked appointment ${appt._id} to patient ${patient.fullName} (${patient._id})`);
  }

  // Update counter in database
  await Counter.findOneAndUpdate(
    { name: `patient_${clinicIdStr}` },
    { $set: { sequence: currentSeq } },
    { upsert: true, new: true }
  );
  console.log(`Updated database counter 'patient_${clinicIdStr}' sequence to ${currentSeq}`);

  console.log("\nHeal completed successfully.");
  await mongoose.disconnect();
}

run().catch(console.error);
