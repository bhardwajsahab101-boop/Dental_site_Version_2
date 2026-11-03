import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { getCurrentUser } from "@/src/lib/auth";
import { connectDB } from "@/src/lib/mongodb";
import { ScanDocument } from "@/src/models/ScanDocument";
import { ScanBatch } from "@/src/models/ScanBatch";
import { logActivity } from "@/src/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return NextResponse.json(
        { success: false, message: "Upload failed: Payload too large or invalid multipart form data (Maximum allowed file size is 10MB)." },
        { status: 400 }
      );
    }

    const files = formData.getAll("files") as File[];
    const singleFile = formData.get("file") as File | null;
    const testMode = formData.get("testMode") === "true";
    const batchNameInput = formData.get("batchName") as string | null;
    const existingBatchId = formData.get("batchId") as string | null;

    const filesToProcess: File[] = [];
    if (singleFile) filesToProcess.push(singleFile);
    if (files && files.length > 0) {
      for (const f of files) {
        if (!filesToProcess.some((item) => item.name === f.name && item.size === f.size)) {
          filesToProcess.push(f);
        }
      }
    }

    if (filesToProcess.length === 0) {
      return NextResponse.json({ success: false, message: "No files uploaded" }, { status: 400 });
    }

    // Size limit check (max 10MB per file)
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    for (const file of filesToProcess) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { success: false, message: `File ${file.name} exceeds maximum allowed size (15MB).` },
          { status: 400 }
        );
      }
    }

    await connectDB();

    const storageDir = path.join(process.cwd(), "private_storage", "scans");
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }

    // Resolve or create Batch
    let activeBatch = null;
    if (existingBatchId) {
      activeBatch = await ScanBatch.findOne({ _id: existingBatchId, clinicId: user.clinicId });
    }

    if (!activeBatch) {
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      const batchCode = `BATCH-${dateStr}-${randomSuffix}`;
      const batchName = batchNameInput?.trim() || `Register Batch ${batchCode}`;

      activeBatch = await ScanBatch.create({
        clinicId: user.clinicId,
        batchName,
        batchCode,
        totalPages: 0,
        totalDetected: 0,
        totalApproved: 0,
        totalRejected: 0,
        status: "uploaded",
        pages: [],
        testMode,
        createdBy: user.userId,
        createdByName: user.name,
      });

      await logActivity(
        "CREATE_SCAN_BATCH",
        `Created register batch: ${batchName} (${batchCode})`,
        String(activeBatch._id),
        "ScanBatch"
      );
    }

    const createdDocs = [];
    let pageNum = (activeBatch.pages?.length || 0) + 1;

    for (const file of filesToProcess) {
      // Validate mime type
      const allowedMimes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic"];
      if (!allowedMimes.includes(file.type.toLowerCase()) && !file.name.match(/\.(jpe?g|png|webp|heic)$/i)) {
        return NextResponse.json(
          { success: false, message: `Unsupported file type: ${file.name}. Only JPG, PNG, and WebP are allowed.` },
          { status: 400 }
        );
      }

      const ext = path.extname(file.name) || ".jpg";
      const randomId = crypto.randomUUID();
      const storedFileName = `${randomId}${ext}`;
      const filePath = path.join(storageDir, storedFileName);

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      fs.writeFileSync(filePath, buffer);

      const doc = await ScanDocument.create({
        clinicId: user.clinicId,
        batchId: activeBatch._id,
        pageNumber: pageNum++,
        fileName: file.name,
        storedFileName,
        fileSize: file.size,
        mimeType: file.type || "image/jpeg",
        status: "uploaded",
        ocrEngine: "tesseract",
        language: "mixed",
        detectedCount: 0,
        approvedCount: 0,
        rejectedCount: 0,
        entries: [],
        uploadedBy: user.userId,
        uploadedByName: user.name,
      });

      await logActivity(
        "UPLOAD_REGISTER_SCAN",
        `Uploaded register page #${doc.pageNumber}: ${file.name} (${Math.round(file.size / 1024)} KB) in batch ${activeBatch.batchCode}`,
        String(doc._id),
        "ScanDocument"
      );

      activeBatch.pages.push(doc._id as any);
      createdDocs.push(doc);
    }

    activeBatch.totalPages = activeBatch.pages.length;
    await activeBatch.save();

    return NextResponse.json({
      success: true,
      message: `Uploaded ${createdDocs.length} register page(s) successfully to batch ${activeBatch.batchCode}`,
      batch: activeBatch,
      batchId: activeBatch._id,
      scans: createdDocs,
      firstScanId: createdDocs[0]._id,
    });
  } catch (error: any) {
    console.error("Error uploading scan file:", error);
    return NextResponse.json({ success: false, message: error.message || "Upload failed" }, { status: 500 });
  }
}
