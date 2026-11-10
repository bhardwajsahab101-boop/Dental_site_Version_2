import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { getCurrentUser } from "@/src/lib/auth";
import { connectDB } from "@/src/lib/mongodb";
import { ScanDocument } from "@/src/models/ScanDocument";
import { ScanBatch } from "@/src/models/ScanBatch";
import { executeDocumentExtraction } from "@/src/lib/scanner/ocrPipeline";
import { logActivity } from "@/src/lib/audit";
import { ensureLocalScanFile } from "@/src/lib/scanner/storage";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const scan = await ScanDocument.findOne({
      _id: id,
      clinicId: user.clinicId,
    });

    if (!scan) {
      return NextResponse.json({ success: false, message: "Scan not found" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const engine = body.engine || scan.ocrEngine || "tesseract";
    const language = body.language || scan.language || "mixed";
    const layoutType = body.layoutType || scan.layoutType || "grid_boxes";
    const columnsCount = body.columnsCount || scan.columnsDetected || 2;
    const rowsPerColumn = body.rowsPerColumn || 4;
    const readingOrder = body.readingOrder || scan.readingOrder || "column_first";
    const templateId = body.templateId || scan.templateId;
    const preprocessingSettings = body.preprocessingSettings || scan.preprocessingSettings || {};

    const testMode = body.testMode !== undefined ? !!body.testMode : false;

    const filePath = ensureLocalScanFile(scan.storedFileName, scan.imageBase64) || "";
    if (!filePath && !scan.imageBase64) {
      return NextResponse.json({ success: false, message: "Document image missing" }, { status: 404 });
    }

    // Set status to processing
    scan.status = "processing";
    scan.ocrEngine = engine;
    scan.language = language;
    scan.layoutType = layoutType;
    scan.columnsDetected = columnsCount;
    scan.readingOrder = readingOrder;
    if (templateId) scan.templateId = templateId;
    scan.preprocessingSettings = preprocessingSettings;
    await scan.save();

    if (scan.batchId) {
      await ScanBatch.updateOne(
        { _id: scan.batchId, clinicId: user.clinicId },
        { status: "processing" }
      );
    }

    try {
      const result = await executeDocumentExtraction(filePath, {
        engine,
        language,
        layoutType,
        columnsCount,
        rowsPerColumn,
        readingOrder,
        templateId: templateId ? String(templateId) : undefined,
        clinicId: String(user.clinicId),
        testMode,
        imageBase64: scan.imageBase64,
        mimeType: scan.mimeType,
      });

      scan.entries = result.entries as any;
      scan.detectedCount = result.entries.length;
      scan.approvedCount = 0;
      scan.rejectedCount = 0;
      scan.layoutType = (result.layoutType || scan.layoutType) as any;
      scan.layoutMetadata = result.layoutMetadata;
      scan.columnsDetected = result.layoutMetadata?.columnsDetected || scan.columnsDetected;
      scan.status = result.entries.length > 0 ? "needs_review" : "needs_review";
      scan.errorMessage = result.entries.length === 0 ? "No legible patient entries detected in register page. Manual entry or re-scan recommended." : undefined;

      await scan.save();

      // Update associated batch stats
      if (scan.batchId) {
        const batchPages = await ScanDocument.find({ batchId: scan.batchId, clinicId: user.clinicId });
        const totalDetected = batchPages.reduce((acc, p) => acc + (p.detectedCount || 0), 0);
        const totalApproved = batchPages.reduce((acc, p) => acc + (p.approvedCount || 0), 0);
        const totalRejected = batchPages.reduce((acc, p) => acc + (p.rejectedCount || 0), 0);
        await ScanBatch.updateOne(
          { _id: scan.batchId, clinicId: user.clinicId },
          {
            totalDetected,
            totalApproved,
            totalRejected,
            status: "needs_review",
          }
        );
      }

      await logActivity(
        "PROCESS_REGISTER_SCAN",
        `Processed box-based scan ${scan.fileName} (${columnsCount} cols, ${result.entries.length} boxes) using ${result.engineUsed}.`,
        String(scan._id),
        "ScanDocument"
      );

      return NextResponse.json({
        success: true,
        message: `Processed document successfully. Detected ${result.entries.length} patient boxes.`,
        scan: {
          ...scan.toObject(),
          imageUrl: `/api/admin/scans/image/${scan.storedFileName}`,
        },
      });
    } catch (procErr: any) {
      console.error("Document extraction error:", procErr);
      scan.status = "failed";
      scan.errorMessage = procErr.message || "Failed to process document image";
      await scan.save();

      return NextResponse.json(
        {
          success: false,
          message: procErr.message || "Document processing failed. Please check image clarity.",
          scan: scan.toObject(),
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error processing scan route:", error);
    return NextResponse.json({ success: false, message: error.message || "Processing failed" }, { status: 500 });
  }
}
