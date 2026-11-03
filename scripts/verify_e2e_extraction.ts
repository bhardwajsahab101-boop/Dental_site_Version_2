import path from "path";
import fs from "fs";

// Load .env.local manually
try {
  const envContent = fs.readFileSync(".env.local", "utf8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.substring(0, eqIdx).trim();
      const val = trimmed.substring(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
      process.env[key] = val;
    }
  }
} catch (e) {
  console.warn("Could not read .env.local", e);
}

async function verify() {
  const { connectDB } = await import("../src/lib/mongodb");
  const { executeDocumentExtraction } = await import("../src/lib/scanner/ocrPipeline");
  const { ScanDocument } = await import("../src/models/ScanDocument");

  await connectDB();

  const imgPath = path.resolve("private_storage/scans/15dffe08-40bb-4d69-aa23-649146428256.png");
  console.log("Processing register:", imgPath);

  const result = await executeDocumentExtraction(imgPath, {
    engine: "apinex",
    language: "mixed",
    layoutType: "COLUMN_BASED",
    columnsCount: 10,
    rowsPerColumn: 10,
    readingOrder: "row_first",
    mimeType: "image/png",
  });

  console.log("\n================ EXTRACTION RESULTS ================");
  console.log("Layout Type:", result.layoutType);
  console.log("Entries detected:", result.entries.length);
  console.log("Layout Metadata:", JSON.stringify(result.layoutMetadata, null, 2));

  console.log("\n--- Extracted Patients Table ---");
  for (const [i, e] of result.entries.entries()) {
    console.log(
      `#${i + 1}: Name="${e.fields.fullName?.value}" | Age/Sex="${e.fields.age?.value || ''}/${e.fields.gender?.value || ''}" | Phone="${e.fields.phone?.value || ''}" | Date="${e.fields.visitDate?.value || 'null'}" | Treatment="${e.fields.treatment?.value || ''}" | Next="${e.fields.followUpDate?.value || ''}" | Fee="₹${e.fields.fee?.value ?? e.fields.amount?.value ?? 0}" | Status="${e.fields.paymentStatus?.value || ''}" | Notes="${e.fields.dentalNotes?.value || ''}"`
    );
  }

  // Update or insert into ScanDocument for clinic demo
  const sampleScan = await ScanDocument.findOneAndUpdate(
    { fileName: "Handwritten Dental Clinic Patient Register.png" },
    {
      $set: {
        layoutType: result.layoutType,
        layoutMetadata: result.layoutMetadata,
        columnsDetected: 10,
        detectedCount: result.entries.length,
        entries: result.entries,
        status: "needs_review",
      },
    },
    { new: true }
  );

  if (sampleScan) {
    console.log("\nUpdated ScanDocument ID:", sampleScan._id, "with 10 rows for live testing!");
  }

  process.exit(0);
}

verify().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
