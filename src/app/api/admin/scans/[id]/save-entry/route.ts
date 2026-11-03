import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getCurrentUser } from "@/src/lib/auth";
import { connectDB } from "@/src/lib/mongodb";
import { ScanDocument } from "@/src/models/ScanDocument";
import { ScanBatch } from "@/src/models/ScanBatch";
import { Patient } from "@/src/models/Patient";
import { Appointment } from "@/src/models/Appointment";
import { Treatment, computePaymentFields } from "@/src/models/treatment";
import { Counter } from "@/src/models/Counter";
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
      entryIndex,
      action = "create_new", // "create_new" | "link_existing" | "update_existing"
      existingPatientId,
      customFields,
    } = body;

    await connectDB();

    const scan = await ScanDocument.findOne({
      _id: id,
      clinicId: user.clinicId,
    });

    if (!scan) {
      return NextResponse.json({ success: false, message: "Scan document not found" }, { status: 404 });
    }

    const entry = scan.entries.find((e) => e.entryIndex === entryIndex);
    if (!entry) {
      return NextResponse.json({ success: false, message: "Entry not found" }, { status: 404 });
    }

    // Prevent duplicate saves if accidentally clicked twice
    if (entry.status === "saved") {
      return NextResponse.json({
        success: true,
        message: `Patient record has already been saved (${entry.savedPatientCode || "Saved"})`,
        patientId: entry.savedPatientId,
        patientCode: entry.savedPatientCode,
        scanStatus: scan.status,
        entry,
      });
    }

    // Apply any customized fields submitted during confirmation
    if (customFields) {
      for (const k of Object.keys(customFields)) {
        if ((entry.fields as any)[k]) {
          (entry.fields as any)[k].value = customFields[k];
          (entry.fields as any)[k].confidence = 100;
          (entry.fields as any)[k].flag = "high";
        }
      }
    }

    const fullName = (entry.fields.fullName.value || "").trim();
    if (!fullName) {
      return NextResponse.json(
        { success: false, message: "Patient name is required before saving." },
        { status: 400 }
      );
    }

    const phone = entry.fields.phone.value ? entry.fields.phone.value.replace(/\D/g, "") : "";
    const age = entry.fields.age.value ? Number(entry.fields.age.value) : undefined;
    const gender = entry.fields.gender.value || undefined;
    const treatmentName = entry.fields.treatment.value || "General Dental Consultation";
    const dentalNotes = entry.fields.dentalNotes.value || "Imported from handwritten patient register scan";
    const amount = entry.fields.amount.value ? Number(entry.fields.amount.value) : 0;
    const paymentStatus = entry.fields.paymentStatus.value || (amount > 0 ? "paid" : "unpaid");

    let visitDate = new Date();
    if (entry.fields.visitDate.value) {
      const parsed = new Date(entry.fields.visitDate.value);
      if (!isNaN(parsed.getTime())) {
        visitDate = parsed;
      }
    }

    let targetPatientId: mongoose.Types.ObjectId;
    let targetPatientCode: string;

    if (action === "create_new" || !existingPatientId) {
      const counter = await Counter.findOneAndUpdate(
        { name: `patient_${user.clinicId}` },
        { $inc: { sequence: 1 } },
        { new: true, upsert: true }
      );
      const patientCode = `PAT-${String(counter.sequence).padStart(3, "0")}`;

      const newPatient = await Patient.create({
        clinicId: user.clinicId,
        fullName,
        phone: phone || "Not Provided",
        age,
        gender,
        patientCode,
        medicalNotes: `Register entry note: ${dentalNotes}`,
        createdBy: user.userId,
      });

      targetPatientId = newPatient._id as mongoose.Types.ObjectId;
      targetPatientCode = newPatient.patientCode;

      await logActivity(
        "CREATE_PATIENT_FROM_SCAN",
        `Created patient ${fullName} (${patientCode}) from register scan`,
        String(newPatient._id),
        "Patient"
      );
    } else {
      const existingPatient = await Patient.findOne({
        _id: existingPatientId,
        clinicId: user.clinicId,
      });

      if (!existingPatient) {
        return NextResponse.json({ success: false, message: "Existing patient not found" }, { status: 404 });
      }

      if (action === "update_existing") {
        if (phone && (!existingPatient.phone || existingPatient.phone === "Not Provided")) {
          existingPatient.phone = phone;
        }
        if (age && !existingPatient.age) {
          existingPatient.age = age;
        }
        if (gender && !existingPatient.gender) {
          existingPatient.gender = gender;
        }
        if (dentalNotes) {
          existingPatient.medicalNotes = `${existingPatient.medicalNotes || ""}\n[Scan Import ${visitDate.toLocaleDateString()}]: ${dentalNotes}`.trim();
        }
        await existingPatient.save();
      }

      targetPatientId = existingPatient._id as mongoose.Types.ObjectId;
      targetPatientCode = existingPatient.patientCode;
    }

    const appointment = await Appointment.create({
      clinicId: user.clinicId,
      patientId: targetPatientId,
      service: treatmentName,
      appointmentDate: visitDate,
      appointmentTime: "10:00 AM",
      status: "completed",
      notes: `${dentalNotes} (Register Scan: ${scan.fileName})`,
      createdBy: user.userId,
    });

    if (treatmentName || amount > 0) {
      const paymentInfo = computePaymentFields(amount, paymentStatus === "paid" ? amount : 0);
      await Treatment.create({
        clinicId: user.clinicId,
        patientId: targetPatientId,
        appointmentId: appointment._id,
        treatmentName,
        diagnosis: treatmentName,
        toothNumber: "General",
        notes: dentalNotes,
        cost: paymentInfo.cost,
        paidAmount: paymentInfo.paidAmount,
        paymentStatus: paymentInfo.paymentStatus,
        status: "completed",
        createdBy: user.userId,
      });
    }

    entry.status = "saved";
    entry.savedPatientId = targetPatientId;
    entry.savedPatientCode = targetPatientCode;
    entry.savedAppointmentId = appointment._id as mongoose.Types.ObjectId;

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

    if (scan.batchId) {
      const batchPages = await ScanDocument.find({ batchId: scan.batchId, clinicId: user.clinicId });
      const totalApproved = batchPages.reduce((acc, p) => acc + (p.approvedCount || 0), 0);
      const totalRejected = batchPages.reduce((acc, p) => acc + (p.rejectedCount || 0), 0);
      const totalDetected = batchPages.reduce((acc, p) => acc + (p.detectedCount || 0), 0);
      const isBatchAllDone = batchPages.every((p) => p.status === "completed" || p.status === "failed");
      await ScanBatch.updateOne(
        { _id: scan.batchId, clinicId: user.clinicId },
        {
          totalApproved,
          totalRejected,
          totalDetected,
          status: isBatchAllDone ? "approved" : "partially_approved",
        }
      );
    }

    await logActivity(
      "CONFIRM_SCAN_ENTRY",
      `Saved register patient row #${entryIndex} as ${fullName} (${targetPatientCode})`,
      String(scan._id),
      "ScanDocument"
    );

    return NextResponse.json({
      success: true,
      message: `Successfully saved ${fullName} (${targetPatientCode}) to DentalOS`,
      patientId: targetPatientId,
      patientCode: targetPatientCode,
      appointmentId: appointment._id,
      scanStatus: scan.status,
      entry,
    });
  } catch (error: any) {
    console.error("Error saving scan entry:", error);
    return NextResponse.json({ success: false, message: error.message || "Failed to save entry" }, { status: 500 });
  }
}
