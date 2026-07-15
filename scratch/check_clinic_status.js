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
  const Clinic = mongoose.model("Clinic", new mongoose.Schema({
    name: String,
    slug: String,
    status: String,
    trialEndsAt: Date
  }));
  const clinics = await Clinic.find({ _id: "6a253ddbb5a6fbc70cb6ce06" });
  console.log("Clinic details:", JSON.stringify(clinics, null, 2));
  await mongoose.disconnect();
}

run().catch(console.error);
