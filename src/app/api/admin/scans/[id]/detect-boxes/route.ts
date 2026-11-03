import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/src/lib/auth";
import { connectDB } from "@/src/lib/mongodb";
import { ScanDocument } from "@/src/models/ScanDocument";
import { RegisterTemplate } from "@/src/models/RegisterTemplate";
import { generateGridBoxes } from "@/src/lib/scanner/boxDetector";
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
    const {
      columnsCount = 2,
      rowsPerColumn = 4,
      readingOrder = "column_first",
      templateId,
    } = body;

    await connectDB();

    const scan = await ScanDocument.findOne({
      _id: id,
      clinicId: user.clinicId,
    });

    if (!scan) {
      return NextResponse.json({ success: false, message: "Scan not found" }, { status: 404 });
    }

    let finalCols = columnsCount;
    let finalRows = rowsPerColumn;
    let finalOrder = readingOrder;

    if (templateId) {
      const tpl = await RegisterTemplate.findOne({
        _id: templateId,
        clinicId: user.clinicId,
      });
      if (tpl) {
        finalCols = tpl.columnsCount;
        finalRows = tpl.rowsPerColumn;
        finalOrder = tpl.readingOrder;
        scan.templateId = tpl._id as any;
      }
    }

    // Generate grid box geometries
    const gridBoxes = generateGridBoxes(finalCols, finalRows, finalOrder);

    // Update scan metadata
    scan.layoutType = "grid_boxes";
    scan.columnsDetected = finalCols;
    scan.readingOrder = finalOrder;

    // Adjust entries to match grid boxes
    const newEntries = gridBoxes.map((box, idx) => {
      const existing = scan.entries[idx];
      if (existing) {
        existing.boxIndex = box.boxIndex;
        existing.colIndex = box.col;
        existing.rowIndex = box.row;
        existing.boxCoordinates = box.coordinates;
        return existing;
      }
      return {
        entryIndex: box.boxIndex,
        boxIndex: box.boxIndex,
        colIndex: box.col,
        rowIndex: box.row,
        boxCoordinates: box.coordinates,
        status: "pending" as const,
        fields: {
          fullName: { value: `Patient in Box ${box.boxIndex}`, confidence: 30, flag: "low" as const },
          age: { confidence: 0, flag: "missing" as const },
          gender: { confidence: 0, flag: "missing" as const },
          phone: { confidence: 0, flag: "missing" as const },
          visitDate: { value: new Date().toISOString().split("T")[0], confidence: 70, flag: "medium" as const },
          patientCode: { confidence: 0, flag: "missing" as const },
          treatment: { confidence: 0, flag: "missing" as const },
          dentalNotes: { confidence: 0, flag: "missing" as const },
          prescribedTreatment: { confidence: 0, flag: "missing" as const },
          amount: { confidence: 0, flag: "missing" as const },
          paymentStatus: { confidence: 0, flag: "missing" as const },
          followUpDate: { confidence: 0, flag: "missing" as const },
        },
      };
    });

    scan.entries = newEntries as any;
    scan.detectedCount = newEntries.length;
    await scan.save();

    await logActivity(
      "CONFIGURE_REGISTER_BOXES",
      `Configured register boxes: ${finalCols} columns, ${finalRows} rows (${finalCols * finalRows} boxes, ${finalOrder})`,
      String(scan._id),
      "ScanDocument"
    );

    return NextResponse.json({
      success: true,
      message: `Updated layout: ${finalCols} columns x ${finalRows} rows = ${gridBoxes.length} patient boxes`,
      scan: {
        ...scan.toObject(),
        imageUrl: `/api/admin/scans/image/${scan.storedFileName}`,
      },
    });
  } catch (error: any) {
    console.error("Error detecting boxes:", error);
    return NextResponse.json({ success: false, message: error.message || "Failed to detect boxes" }, { status: 500 });
  }
}
