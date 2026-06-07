const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");

// Read .env.local to get MONGODB_URI
const envPath = path.join(__dirname, "../.env.local");
let mongoUri = "";
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  const match = envContent.match(/MONGODB_URI=(.+)/);
  if (match) {
    mongoUri = match[1].trim();
  }
}

if (!mongoUri) {
  console.error("MONGODB_URI not found in .env.local");
  process.exit(1);
}

console.log("Connecting to MongoDB...");
mongoose
  .connect(mongoUri)
  .then(async () => {
    console.log("Connected successfully to database!");

    // Define schemas dynamically to avoid ES module import issues in JS
    const clinicSchema = new mongoose.Schema({}, { strict: false });
    const userSchema = new mongoose.Schema({}, { strict: false });

    const Clinic = mongoose.models.Clinic || mongoose.model("Clinic", clinicSchema, "clinics");
    const User = mongoose.models.User || mongoose.model("User", userSchema, "users");

    const clinics = await Clinic.find({}).lean();
    console.log("\n--- CLINICS ---");
    console.log(JSON.stringify(clinics, null, 2));

    const users = await User.find({}).lean();
    console.log("\n--- USERS ---");
    console.log(JSON.stringify(users, null, 2));

    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB.");
  })
  .catch((err) => {
    console.error("Connection error:", err);
  });
