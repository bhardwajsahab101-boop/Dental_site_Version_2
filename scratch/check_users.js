const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

let MONGODB_URI = "";
try {
  const envContent = fs.readFileSync(path.join(__dirname, "../.env.local"), "utf8");
  const lines = envContent.split(/\r?\n/);
  for (const line of lines) {
    if (line.trim().startsWith("MONGODB_URI=")) {
      // Get the value after MONGODB_URI=
      const index = line.indexOf("=");
      MONGODB_URI = line.substring(index + 1).trim();
      // Remove surrounding quotes
      MONGODB_URI = MONGODB_URI.replace(/^['"]|['"]$/g, "").trim();
    }
  }
} catch (err) {
  console.error("Error reading .env.local:", err.message);
}

if (!MONGODB_URI) {
  console.error("MONGODB_URI is not defined");
  process.exit(1);
}

async function run() {
  console.log("Connecting to URI of length:", MONGODB_URI.length);
  // Log hex representation to ensure no hidden carriage returns
  console.log("URI Hex end:", Buffer.from(MONGODB_URI.slice(-10)).toString("hex"));

  await mongoose.connect(MONGODB_URI);
  console.log("Connected to DB");
  
  const User = mongoose.model("User", new mongoose.Schema({
    email: String,
    role: String,
    name: String,
    isActive: Boolean
  }));

  const users = await User.find({});
  console.log("Users:", JSON.stringify(users, null, 2));
  
  await mongoose.disconnect();
}

run().catch(console.error);
