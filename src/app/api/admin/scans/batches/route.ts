import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/src/lib/auth";
import { connectDB } from "@/src/lib/mongodb";
import { ScanBatch } from "@/src/models/ScanBatch";
import { logActivity } from "@/src/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const testModeOnly = searchParams.get("testMode");
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const query: any = { clinicId: user.clinicId };
    if (status) query.status = status;
    if (testModeOnly === "true") query.testMode = true;

    const batches = await ScanBatch.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      batches,
      count: batches.length,
    });
  } catch (error: any) {
    console.error("Error fetching batches:", error);
    return NextResponse.json({ success: false, message: error.message || "Failed to load batches" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const batchName = body.batchName?.trim() || `Register Batch ${new Date().toISOString().slice(0, 10)}`;
    const testMode = !!body.testMode;
    const notes = body.notes?.trim();

    await connectDB();

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const batchCode = `BATCH-${dateStr}-${randomSuffix}`;

    const batch = await ScanBatch.create({
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
      notes,
      createdBy: user.userId,
      createdByName: user.name,
    });

    await logActivity(
      "CREATE_SCAN_BATCH",
      `Created register batch: ${batchName} (${batchCode})`,
      String(batch._id),
      "ScanBatch"
    );

    return NextResponse.json({
      success: true,
      message: `Batch ${batchCode} created successfully`,
      batch,
    });
  } catch (error: any) {
    console.error("Error creating scan batch:", error);
    return NextResponse.json({ success: false, message: error.message || "Failed to create batch" }, { status: 500 });
  }
}

