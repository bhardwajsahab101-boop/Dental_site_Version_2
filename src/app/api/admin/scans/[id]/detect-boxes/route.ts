import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { getCurrentUser } from "@/src/lib/auth";
import { connectDB } from "@/src/lib/mongodb";
import { ScanDocument } from "@/src/models/ScanDocument";
import { RegisterTemplate } from "@/src/models/RegisterTemplate";
import { generateGridBoxes } from "@/src/lib/scanner/boxDetector";
import { runOpenCVGridDetection } from "@/src/lib/scanner/opencvDetector";
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
    const body = await req.json().catch(() => ({}));
    const {
      columnsCount = 2,
      rowsPerColumn = 4,
      readingOrder = "column_first",
      templateId,
      autoDetectWithOpenCV = false,
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
    let methodUsed = "manual_template";

    const filePath = path.join(process.cwd(), "private_storage", "scans", scan.storedFileName);

    let detectedBoxes = null;
    let cvRes: any = null;
    if (autoDetectWithOpenCV && fs.existsSync(filePath)) {
      cvRes = await runOpenCVGridDetection(filePath, {
        expectedCols: columnsCount,
        readingOrder,
      });
      if (cvRes.success && cvRes.boxes.length > 0) {
        finalCols = cvRes.columnsDetected;
        finalRows = cvRes.rowsDetected;
        methodUsed = cvRes.detectionMethod;
        detectedBoxes = cvRes.boxes;
      }
    }

    if (!detectedBoxes && templateId) {
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

    // Generate grid box geometries if OpenCV didn't already supply exact coordinates
    const gridBoxes = detectedBoxes || generateGridBoxes(finalCols, finalRows, finalOrder).map((b) => ({
      index: b.boxIndex,
      colIndex: b.colIndex ?? b.col,
      rowIndex: b.rowIndex ?? b.row,
      coordinates: b.coordinates,
    }));

    // Update scan metadata
    const resolvedLayoutType: "COLUMN_BASED" | "BOX_BASED" | "FREE_FORM" | "MIXED_LAYOUT" =
      cvRes?.layoutType ||
      (scan.layoutType === "grid_boxes" ? "BOX_BASED" :
       scan.layoutType === "table_rows" ? "COLUMN_BASED" :
       scan.layoutType as any) ||
      (finalCols >= 5 ? "COLUMN_BASED" : "BOX_BASED");

    scan.layoutType = resolvedLayoutType;
    scan.columnsDetected = finalCols;
    scan.readingOrder = finalOrder;
    if (cvRes?.layoutMetadata || cvRes?.regionsDetected) {
      scan.layoutMetadata = {
        layoutType: resolvedLayoutType,
        confidence: cvRes?.confidence || 0.92,
        columnsDetected: finalCols,
        rowsDetected: gridBoxes.length,
        regionsDetected: cvRes?.regionsDetected || cvRes?.totalCellsDetected || gridBoxes.length,
        totalCellsDetected: cvRes?.totalCellsDetected || cvRes?.regionsDetected || gridBoxes.length,
        totalRowsDetected: gridBoxes.length,
        requiresManualReview: cvRes?.requiresManualReview || false,
        columnDividers: cvRes?.columnDividers || [],
        rowDividers: cvRes?.rowDividers || [],
      };
    }

    // Adjust entries to match grid boxes without inventing fake data
    const newEntries = gridBoxes.map((box: any, idx: number) => {
      const boxCoords = box.coordinates || {
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height,
      };
      const bIndex = (box.boxIndex && box.boxIndex > 0) ? box.boxIndex : ((box.index && box.index > 0) ? box.index : idx + 1);
      const bCol = box.colIndex ?? box.col ?? 0;
      const bRow = box.rowIndex ?? box.row ?? idx;

      const existing = scan.entries[idx];
      if (existing) {
        existing.boxIndex = bIndex;
        existing.colIndex = bCol;
        existing.rowIndex = bRow;
        existing.boxCoordinates = boxCoords;
        return existing;
      }

      // New entry detected geometrically: never insert fake names or dates!
      return {
        entryIndex: bIndex,
        boxIndex: bIndex,
        colIndex: bCol,
        rowIndex: bRow,
        boxCoordinates: boxCoords,
        status: "pending" as const,
        unreadableFields: ["name", "phone", "treatment"],
        fields: {
          sNo: { value: String(bIndex), confidence: 80, flag: "medium" as const },
          fullName: { confidence: 0, flag: "missing" as const },
          age: { confidence: 0, flag: "missing" as const },
          gender: { confidence: 0, flag: "missing" as const },
          phone: { confidence: 0, flag: "missing" as const },
          visitDate: { confidence: 0, flag: "missing" as const },
          patientCode: { confidence: 0, flag: "missing" as const },
          treatment: { confidence: 0, flag: "missing" as const },
          dentalNotes: { confidence: 0, flag: "missing" as const },
          prescribedTreatment: { confidence: 0, flag: "missing" as const },
          amount: { confidence: 0, flag: "missing" as const },
          paymentStatus: { confidence: 0, flag: "missing" as const },
          followUpDate: { confidence: 0, flag: "missing" as const },
          remarks: { confidence: 0, flag: "missing" as const },
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

