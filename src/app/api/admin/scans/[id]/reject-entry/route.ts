import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/src/lib/auth";
import { connectDB } from "@/src/lib/mongodb";
import { ScanDocument } from "@/src/models/ScanDocument";
import { logActivity } from "@/src/lib/audit";

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
    const body = await req.json();
    const { entryIndex, reason = "Unreadable or rejected by staff" } = body;

    await connectDB();

    const scan = await ScanDocument.findOne({
      _id: id,
      clinicId: user.clinicId,
    });

    if (!scan) {
      return NextResponse.json({ success: false, message: "Scan not found" }, { status: 404 });
    }

    const entry = scan.entries.find((e) => e.entryIndex === entryIndex);
    if (!entry) {
      return NextResponse.json({ success: false, message: "Entry not found" }, { status: 404 });
    }

    entry.status = "rejected";
    entry.rejectionReason = reason;

    const approved = scan.entries.filter((e) => e.status === "saved").length;
    const rejected = scan.entries.filter((e) => e.status === "rejected").length;
    scan.approvedCount = approved;
    scan.rejectedCount = rejected;

    if (approved + rejected >= scan.entries.length) {
      scan.status = approved > 0 ? "completed" : "failed";
    } else {
      scan.status = "partially_approved";
    }

    await scan.save();

    await logActivity(
      "REJECT_SCAN_ENTRY",
      `Rejected register row #${entryIndex} in scan ${scan.fileName} (Reason: ${reason})`,
      String(scan._id),
      "ScanDocument"
    );

    return NextResponse.json({
      success: true,
      message: `Entry #${entryIndex} marked as rejected`,
      entry,
      scanStatus: scan.status,
    });
  } catch (error: any) {
    console.error("Error rejecting entry:", error);
    return NextResponse.json({ success: false, message: "Failed to reject entry" }, { status: 500 });
  }
}
