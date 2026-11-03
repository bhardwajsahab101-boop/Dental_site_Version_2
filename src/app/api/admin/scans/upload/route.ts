import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { getCurrentUser } from "@/src/lib/auth";
import { connectDB } from "@/src/lib/mongodb";
import { ScanDocument } from "@/src/models/ScanDocument";
import { logActivity } from "@/src/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const files = formData.getAll("files") as File[];
    const singleFile = formData.get("file") as File | null;

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

    await connectDB();

    const storageDir = path.join(process.cwd(), "private_storage", "scans");
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }

    const createdDocs = [];

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
        `Uploaded register page: ${file.name} (${Math.round(file.size / 1024)} KB)`,
        String(doc._id),
        "ScanDocument"
      );

      createdDocs.push(doc);
    }

    return NextResponse.json({
      success: true,
      message: `Uploaded ${createdDocs.length} register page(s) successfully`,
      scans: createdDocs,
      firstScanId: createdDocs[0]._id,
    });
  } catch (error: any) {
    console.error("Error uploading scan file:", error);
    return NextResponse.json({ success: false, message: error.message || "Upload failed" }, { status: 500 });
  }
}
