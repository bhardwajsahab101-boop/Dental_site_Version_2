import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { getCurrentUser } from "@/src/lib/auth";
import { connectDB } from "@/src/lib/mongodb";
import { ScanDocument } from "@/src/models/ScanDocument";
import { logActivity } from "@/src/lib/audit";

export async function GET(
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
    }).lean();

    if (!scan) {
      return NextResponse.json({ success: false, message: "Scan not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      scan: {
        ...scan,
        imageUrl: `/api/admin/scans/image/${scan.storedFileName}`,
      },
    });
  } catch (error: any) {
    console.error("Error retrieving scan:", error);
    return NextResponse.json({ success: false, message: "Failed to retrieve scan" }, { status: 500 });
  }
}

export async function DELETE(
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

    // Delete image file from disk
    const filePath = path.join(process.cwd(), "private_storage", "scans", scan.storedFileName);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.warn("Failed to delete file from disk:", err);
      }
    }

    await ScanDocument.deleteOne({ _id: id });

    await logActivity(
      "DELETE_SCAN",
      `Deleted scan document: ${scan.fileName}`,
      id,
      "ScanDocument"
    );

    return NextResponse.json({ success: true, message: "Scan deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting scan:", error);
    return NextResponse.json({ success: false, message: "Failed to delete scan" }, { status: 500 });
  }
}
