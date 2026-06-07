const crypto = require("crypto");

const superadminHash = "7d948a6a6ea2e89d89645321e2df20d7ad859e7008acb8531f295b05f59b9a98";
const aksharmaHash = "6b5879d4eff9bf0d5dc3c216c72f0107c78e543ac9210e0775ff8ef7a607a1a2";

function sha256(pwd) {
  return crypto.createHash("sha256").update(pwd).digest("hex");
}

console.log("Hash of 'Password123':", sha256("Password123"));
console.log("Matches superadmin?", sha255("Password123") === superadminHash);

// Wait, let's see what happens if we use other common passwords
const testPasswords = ["Password123", "password123", "admin123", "Admin123", "aksharma", "aksharma123", "anil123", "Anil123"];
for (const pwd of testPasswords) {
  const h = sha256(pwd);
  if (h === superadminHash) {
    console.log(`FOUND match for superadmin: '${pwd}'`);
  }
  if (h === aksharmaHash) {
    console.log(`FOUND match for aksharma: '${pwd}'`);
  }
}

function sha255(pwd) { return sha256(pwd); }
