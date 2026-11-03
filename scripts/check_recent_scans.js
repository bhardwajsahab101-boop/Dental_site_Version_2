const mongoose = require("mongoose");
const fs = require("fs");
require("dotenv").config({ path: ".env.local" });

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const ScanDocument = mongoose.models.ScanDocument || mongoose.model("ScanDocument", new mongoose.Schema({}, { strict: false }));
  const ScanBatch = mongoose.models.ScanBatch || mongoose.model("ScanBatch", new mongoose.Schema({}, { strict: false }));
  const Patient = mongoose.models.Patient || mongoose.model("Patient", new mongoose.Schema({}, { strict: false }));

  console.log("=== RECENT SCAN DOCUMENTS ===");
  const docs = await ScanDocument.find().sort({ createdAt: -1 }).limit(10).lean();
  for (const d of docs) {
    console.log("Scan ID:", d._id.toString(), "BatchId:", d.batchId?.toString(), "File:", d.originalFileName, "Status:", d.status, "Entries:", d.entries?.length, "Engine:", d.ocrEngine);
    if (d.entries && d.entries.length > 0) {
      console.log("  Entries Names:", d.entries.map(e => e.fields?.fullName?.value));
      console.log("  Entries Dates:", d.entries.map(e => e.fields?.visitDate?.value));
    }
  }

  console.log("\n=== RECENT SCAN BATCHES ===");
  const batches = await ScanBatch.find().sort({ createdAt: -1 }).limit(5).lean();
  for (const b of batches) {
    console.log("Batch:", b._id.toString(), "Name:", b.batchName, "Code:", b.batchCode, "Status:", b.status, "Pages:", b.pages?.length, "TestMode:", b.testMode);
  }

  console.log("\n=== RECENT PATIENTS ===");
  const patients = await Patient.find().sort({ createdAt: -1 }).limit(10).lean();
  for (const p of patients) {
    console.log("Patient:", p.patientId, p.fullName, p.phone, p.createdAt);
  }

  process.exit(0);
}

check().catch(err => {
  console.error(err);
  process.exit(1);
});

