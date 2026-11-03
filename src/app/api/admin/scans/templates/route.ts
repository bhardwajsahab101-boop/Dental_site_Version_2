import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/src/lib/auth";
import { connectDB } from "@/src/lib/mongodb";
import { RegisterTemplate } from "@/src/models/RegisterTemplate";
import { DEFAULT_REGISTER_TEMPLATES, generateGridBoxes } from "@/src/lib/scanner/boxDetector";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    let templates = await RegisterTemplate.find({ clinicId: user.clinicId }).sort({ createdAt: 1 }).lean();

    // Auto-seed default templates if none exist for this clinic
    if (templates.length === 0) {
      const seeded = [];
      for (const tpl of DEFAULT_REGISTER_TEMPLATES) {
        const boxes = generateGridBoxes(tpl.columnsCount, tpl.rowsPerColumn, tpl.readingOrder).map((b) => ({
          boxIndex: b.boxIndex,
          col: b.col,
          row: b.row,
          x: b.coordinates.x,
          y: b.coordinates.y,
          width: b.coordinates.width,
          height: b.coordinates.height,
          label: `Box ${b.boxIndex}`,
        }));

        const created = await RegisterTemplate.create({
          clinicId: user.clinicId,
          name: tpl.name,
          description: tpl.description,
          columnsCount: tpl.columnsCount,
          rowsPerColumn: tpl.rowsPerColumn,
          readingOrder: tpl.readingOrder,
          boxes,
          fieldLayout: tpl.fieldLayout,
          isDefault: tpl.isDefault,
        });
        seeded.push(created);
      }
      templates = seeded as any;
    }

    return NextResponse.json({ success: true, templates });
  } catch (error: any) {
    console.error("Error fetching register templates:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch templates" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, columnsCount = 2, rowsPerColumn = 4, readingOrder = "column_first", description } = body;

    if (!name?.trim()) {
      return NextResponse.json({ success: false, message: "Template name is required" }, { status: 400 });
    }

    await connectDB();

    const boxes = generateGridBoxes(columnsCount, rowsPerColumn, readingOrder).map((b) => ({
      boxIndex: b.boxIndex,
      col: b.col,
      row: b.row,
      x: b.coordinates.x,
      y: b.coordinates.y,
      width: b.coordinates.width,
      height: b.coordinates.height,
      label: `Box ${b.boxIndex}`,
    }));

    const template = await RegisterTemplate.create({
      clinicId: user.clinicId,
      name: name.trim(),
      description: description || "",
      columnsCount,
      rowsPerColumn,
      readingOrder,
      boxes,
      fieldLayout: ["Patient Name", "Age/Sex", "Phone", "Treatment", "Fee", "Notes"],
      isDefault: false,
    });

    return NextResponse.json({ success: true, message: "Template created successfully", template });
  } catch (error: any) {
    console.error("Error creating template:", error);
    return NextResponse.json({ success: false, message: error.message || "Failed to create template" }, { status: 500 });
  }
}

