import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { getCurrentUser } from "@/src/lib/auth";
import { connectDB } from "@/src/lib/mongodb";
import { ScanBatch } from "@/src/models/ScanBatch";
import { ScanDocument } from "@/src/models/ScanDocument";
import { logActivity } from "@/src/lib/audit";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ batchId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { batchId } = await params;
    await connectDB();

    const batch = await ScanBatch.findOne({
      _id: batchId,
      clinicId: user.clinicId,
    }).lean();

    if (!batch) {
      return NextResponse.json({ success: false, message: "Batch not found" }, { status: 404 });
    }

    const pages = await ScanDocument.find({
      batchId: batch._id,
      clinicId: user.clinicId,
    })
      .sort({ pageNumber: 1, createdAt: 1 })
      .lean();

    // Map image URLs for private authenticated serving
    const pagesWithUrls = pages.map((p) => ({
      ...p,
      imageUrl: `/api/admin/scans/image/${p.storedFileName}`,
    }));

    return NextResponse.json({
      success: true,
      batch: {
        ...batch,
        pages: pagesWithUrls,
      },
    });
  } catch (error: any) {
    console.error("Error fetching batch details:", error);
    return NextResponse.json({ success: false, message: error.message || "Failed to load batch" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ batchId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { batchId } = await params;
    const body = await req.json().catch(() => ({}));

    await connectDB();

    const batch = await ScanBatch.findOne({
      _id: batchId,
      clinicId: user.clinicId,
    });

    if (!batch) {
      return NextResponse.json({ success: false, message: "Batch not found" }, { status: 404 });
    }

    if (body.batchName) batch.batchName = body.batchName.trim();
    if (body.notes !== undefined) batch.notes = body.notes.trim();
    if (body.status) batch.status = body.status;

    await batch.save();

    return NextResponse.json({
      success: true,
      message: "Batch updated successfully",
      batch,
    });
  } catch (error: any) {
    console.error("Error updating batch:", error);
    return NextResponse.json({ success: false, message: error.message || "Failed to update batch" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ batchId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { batchId } = await params;
    await connectDB();

    const batch = await ScanBatch.findOne({
      _id: batchId,
      clinicId: user.clinicId,
    });

    if (!batch) {
      return NextResponse.json({ success: false, message: "Batch not found" }, { status: 404 });
    }

    // Find and delete all pages & files
    const pages = await ScanDocument.find({
      batchId: batch._id,
      clinicId: user.clinicId,
    });

    const storageDir = path.join(process.cwd(), "private_storage", "scans");
    for (const page of pages) {
      const filePath = path.join(storageDir, page.storedFileName);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          console.warn("Could not delete file:", filePath);
        }
      }
    }

    await ScanDocument.deleteMany({ batchId: batch._id, clinicId: user.clinicId });
    await ScanBatch.deleteOne({ _id: batch._id, clinicId: user.clinicId });

    await logActivity(
      "DELETE_SCAN_BATCH",
      `Deleted scan batch: ${batch.batchName} (${batch.batchCode}) and ${pages.length} associated pages`,
      String(batch._id),
      "ScanBatch"
    );

    return NextResponse.json({
      success: true,
      message: `Batch ${batch.batchCode} and all its pages deleted successfully`,
    });
  } catch (error: any) {
    console.error("Error deleting scan batch:", error);
    return NextResponse.json({ success: false, message: error.message || "Failed to delete batch" }, { status: 500 });
  }
}

