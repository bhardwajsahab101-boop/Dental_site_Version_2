const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

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

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

console.log("Connecting to MongoDB...");
mongoose
  .connect(mongoUri)
  .then(async () => {
    console.log("Connected successfully to database!");

    const userSchema = new mongoose.Schema({}, { strict: false });
    const User = mongoose.models.User || mongoose.model("User", userSchema, "users");

    const email = "aksharma@gmail.com";
    const plainPassword = "Password123";
    const hashedPassword = hashPassword(plainPassword);

    const result = await User.updateOne(
      { email: email },
      { $set: { password: hashedPassword } }
    );

    if (result.matchedCount > 0) {
      console.log(`Successfully updated password for ${email} to '${plainPassword}' (Hash: ${hashedPassword})`);
    } else {
      console.log(`User ${email} not found.`);
    }

    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  })
  .catch((err) => {
    console.error("Connection error:", err);
  });
