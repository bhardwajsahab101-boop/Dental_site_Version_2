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
    const body = await req.json().catch(() => ({}));
    const { entryIndices } = body;

    await connectDB();

    const scan = await ScanDocument.findOne({
      _id: id,
      clinicId: user.clinicId,
    });

    if (!scan) {
      return NextResponse.json({ success: false, message: "Scan not found" }, { status: 404 });
    }

    const targetEntries = scan.entries.filter((e) => {
      if (e.status === "saved" || e.status === "rejected") return false;
      if (entryIndices && Array.isArray(entryIndices)) {
        return entryIndices.includes(e.entryIndex);
      }
      return Boolean(e.fields.fullName.value && e.fields.fullName.value.trim());
    });

    if (targetEntries.length === 0) {
      return NextResponse.json(
        { success: false, message: "No eligible pending entries found to batch save." },
        { status: 400 }
      );
    }

    let savedCount = 0;

    for (const entry of targetEntries) {
      const fullName = (entry.fields.fullName.value || "").trim();
      const phone = entry.fields.phone.value ? entry.fields.phone.value.replace(/\D/g, "") : "";
      const age = entry.fields.age.value ? Number(entry.fields.age.value) : undefined;
      const gender = entry.fields.gender.value || undefined;
      const treatmentName = entry.fields.treatment.value || "General Dental Consultation";
      const dentalNotes = entry.fields.dentalNotes.value || "Imported from register scan";
      const amount = entry.fields.amount.value ? Number(entry.fields.amount.value) : 0;
      const paymentStatus = entry.fields.paymentStatus.value || (amount > 0 ? "paid" : "unpaid");

      let visitDate = new Date();
      if (entry.fields.visitDate.value) {
        const parsed = new Date(entry.fields.visitDate.value);
        if (!isNaN(parsed.getTime())) visitDate = parsed;
      }

      let targetPatientId: mongoose.Types.ObjectId;
      let targetPatientCode: string;

      if (entry.duplicateMatch?.patientId) {
        targetPatientId = entry.duplicateMatch.patientId;
        targetPatientCode = entry.duplicateMatch.patientCode;
      } else {
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
          medicalNotes: dentalNotes,
          createdBy: user.userId,
        });

        targetPatientId = newPatient._id as mongoose.Types.ObjectId;
        targetPatientCode = newPatient.patientCode;
      }

      const appointment = await Appointment.create({
        clinicId: user.clinicId,
        patientId: targetPatientId,
        service: treatmentName,
        appointmentDate: visitDate,
        appointmentTime: "10:00 AM",
        status: "completed",
        notes: `${dentalNotes} (Register: ${scan.fileName})`,
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
      savedCount++;
    }

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
      "BATCH_SAVE_SCAN_ENTRIES",
      `Batch saved ${savedCount} patient records from register scan ${scan.fileName}`,
      String(scan._id),
      "ScanDocument"
    );

    return NextResponse.json({
      success: true,
      message: `Successfully batch saved ${savedCount} patient records to DentalOS.`,
      savedCount,
      scanStatus: scan.status,
    });
  } catch (error: any) {
    console.error("Error in batch save:", error);
    return NextResponse.json({ success: false, message: error.message || "Batch save failed" }, { status: 500 });
  }
}
