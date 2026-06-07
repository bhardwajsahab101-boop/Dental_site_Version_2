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

  const referencedIds = [
    "6a1d099e2368d64765fd20ac",
    "6a1d13372368d64765fd20b3",
    "6a1ffb075dd248bf075b5fb3",
    "6a1ef1cd0d7be07cd939f8ca",
    "6a1d10c42368d64765fd20b2",
    "6a22db8338a059d8dfec2f8e"
  ].map(id => new mongoose.Types.ObjectId(id));

  console.log("Searching for referenced patient IDs in DB...");
  const patients = await Patient.find({ _id: { $in: referencedIds } });
  console.log(`Found ${patients.length} matching patients:`);
  patients.forEach(p => {
    console.log(`- ID: ${p._id}, Name: ${p.fullName}, clinicId: ${p.clinicId}, deletedAt: ${p.deletedAt}`);
  });

  await mongoose.disconnect();
}

run().catch(console.error);
