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
  
  // Update all clinics to "active" status and extend trialEndsAt far into the future (as backup)
  const result = await Clinic.updateMany(
    {},
    { 
      $set: { 
        status: "active",
        trialEndsAt: new Date(Date.now() + 3650 * 24 * 60 * 60 * 1000) // 10 years
      } 
    }
  );
  
  console.log("Update result:", result);
  
  const updatedClinics = await Clinic.find({});
  console.log("Updated Clinics:", JSON.stringify(updatedClinics, null, 2));
  
  await mongoose.disconnect();
}

run().catch(console.error);
