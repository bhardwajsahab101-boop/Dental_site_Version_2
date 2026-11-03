import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/src/lib/auth";
import { connectDB } from "@/src/lib/mongodb";
import { ScanDocument } from "@/src/models/ScanDocument";
import { findDuplicatePatient } from "@/src/lib/scanner/duplicateDetector";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; entryIndex: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id, entryIndex } = await params;
    const idx = parseInt(entryIndex, 10);

    const body = await req.json();
    const { fields, status } = body;

    await connectDB();

    const scan = await ScanDocument.findOne({
      _id: id,
      clinicId: user.clinicId,
    });

    if (!scan) {
      return NextResponse.json({ success: false, message: "Scan not found" }, { status: 404 });
    }

    const entry = scan.entries.find((e) => e.entryIndex === idx);
    if (!entry) {
      return NextResponse.json({ success: false, message: "Entry not found" }, { status: 404 });
    }

    // Update fields
    if (fields) {
      for (const key of Object.keys(fields)) {
        if ((entry.fields as any)[key]) {
          (entry.fields as any)[key] = {
            ...(entry.fields as any)[key],
            ...fields[key],
            confidence: 100, // Staff manually verified/edited
            flag: "high",
          };
        }
      }
    }

    if (status) {
      entry.status = status;
    }

    // Re-check duplicate with updated fields
    const dupMatch = await findDuplicatePatient(String(user.clinicId), {
      fullName: entry.fields.fullName.value,
      phone: entry.fields.phone.value,
      age: entry.fields.age.value,
    });

    if (dupMatch) {
      entry.duplicateMatch = {
        patientId: dupMatch.patientId,
        patientCode: dupMatch.patientCode,
        fullName: dupMatch.fullName,
        phone: dupMatch.phone,
        matchReason: dupMatch.matchReason,
        lastVisit: dupMatch.lastVisit,
      };
    } else {
      entry.duplicateMatch = undefined;
    }

    await scan.save();

    return NextResponse.json({
      success: true,
      message: "Entry updated successfully",
      entry,
    });
  } catch (error: any) {
    console.error("Error updating scan entry:", error);
    return NextResponse.json({ success: false, message: "Failed to update entry" }, { status: 500 });
  }
}
