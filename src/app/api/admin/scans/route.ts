import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/src/lib/auth";
import { connectDB } from "@/src/lib/mongodb";
import { ScanDocument } from "@/src/models/ScanDocument";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const batchId = searchParams.get("batchId");

    const query: any = { clinicId: user.clinicId };
    if (status && status !== "all") {
      query.status = status;
    }
    if (batchId) {
      query.batchId = batchId;
    }

    const scans = await ScanDocument.find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const formatted = scans.map((s) => ({
      _id: s._id,
      batchId: s.batchId,
      pageNumber: s.pageNumber || 1,
      fileName: s.fileName,
      storedFileName: s.storedFileName,
      imageUrl: `/api/admin/scans/image/${s.storedFileName}`,
      fileSize: s.fileSize,
      status: s.status,
      ocrEngine: s.ocrEngine,
      language: s.language,
      columnsDetected: s.columnsDetected,
      readingOrder: s.readingOrder,
      detectedCount: s.detectedCount,
      approvedCount: s.approvedCount,
      rejectedCount: s.rejectedCount,
      uploadedByName: s.uploadedByName,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      scans: formatted,
    });
  } catch (error: any) {
    console.error("Error fetching scans:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch scans" }, { status: 500 });
  }
}
