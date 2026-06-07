import { NextResponse } from "next/server";
import { connectDB } from "../../../../../lib/mongodb";
import { Patient } from "../../../../../models/Patient";
import { getCurrentClinic, getCurrentUser } from "../../../../../lib/auth";
import { saveFile, deleteFile } from "../../../../../lib/storage";
import { logActivity } from "../../../../../lib/audit";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const clinicId = await getCurrentClinic();
    const user = await getCurrentUser();
    if (!clinicId || !user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    await connectDB();

    // Verify patient belongs to the clinic and is not deleted
    const patient = await Patient.findOne({ _id: id, clinicId, deletedAt: null });
    if (!patient) {
      return NextResponse.json(
        { success: false, message: "Patient not found" },
        { status: 404 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const category = formData.get("category") as string;

    if (!file || !category) {
      return NextResponse.json(
        { success: false, message: "Missing file or category parameters" },
        { status: 400 }
      );
    }

    // Save file on disk
    const relativeUrl = await saveFile(file, clinicId, id);

    // Save document details inside patient schema
    const newDoc = {
      name: file.name,
      category: category as any,
      url: relativeUrl,
      uploadedAt: new Date(),
      uploadedBy: user.name,
    };

    if (!patient.documents) {
      patient.documents = [];
    }
    patient.documents.push(newDoc);
    await patient.save();

    const savedDoc = patient.documents[patient.documents.length - 1];

    // Log the upload activity
    await logActivity(
      "Upload Document",
      `Uploaded ${category} document "${file.name}" for patient "${patient.fullName}"`,
      String(patient._id),
      "Patient"
    );

    return NextResponse.json({
      success: true,
      document: savedDoc,
    }, { status: 201 });
  } catch (error) {
    console.error("POST patient document error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to upload patient document" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const clinicId = await getCurrentClinic();
    const user = await getCurrentUser();
    if (!clinicId || !user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get("documentId");

    if (!documentId) {
      return NextResponse.json(
        { success: false, message: "Missing documentId parameter" },
        { status: 400 }
      );
    }

    await connectDB();

    const patient = await Patient.findOne({ _id: id, clinicId, deletedAt: null });
    if (!patient) {
      return NextResponse.json(
        { success: false, message: "Patient not found" },
        { status: 404 }
      );
    }

    // Find the document inside patient documents list
    const doc = patient.documents?.find((d: any) => String(d._id) === documentId);
    if (!doc) {
      return NextResponse.json(
        { success: false, message: "Document record not found" },
        { status: 404 }
      );
    }

    // Delete the file from local storage disk
    await deleteFile(doc.url);

    // Pull document from patient documents list
    patient.documents = patient.documents?.filter((d: any) => String(d._id) !== documentId);
    await patient.save();

    // Log the delete activity
    await logActivity(
      "Delete Document",
      `Removed ${doc.category} document "${doc.name}" for patient "${patient.fullName}"`,
      String(patient._id),
      "Patient"
    );

    return NextResponse.json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    console.error("DELETE patient document error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete patient document" },
      { status: 500 }
    );
  }
}
