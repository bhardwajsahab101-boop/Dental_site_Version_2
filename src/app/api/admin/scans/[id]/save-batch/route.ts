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

function safeExtractString(field: any): string | undefined {
  if (field === null || field === undefined) return undefined;
  let raw: any = field;
  if (typeof raw === "object") {
    if ("value" in raw) {
      raw = raw.value;
    } else {
      return undefined;
    }
  }
  if (raw === null || raw === undefined) return undefined;
  if (typeof raw === "object") return undefined;
  const s = String(raw).trim();
  if (!s || s.toLowerCase() === "nan" || s.toLowerCase() === "undefined" || s.toLowerCase() === "null") {
    return undefined;
  }
  return s;
}

function safeExtractNumber(field: any): number | undefined {
  if (field === null || field === undefined) return undefined;
  let raw: any = field;
  if (typeof raw === "object") {
    if ("value" in raw) {
      raw = raw.value;
    } else {
      return undefined;
    }
  }
  if (raw === null || raw === undefined) return undefined;
  if (typeof raw === "object") return undefined;
  if (typeof raw === "number") {
    return (!isNaN(raw) && isFinite(raw) && raw >= 0) ? raw : undefined;
  }
  const cleaned = String(raw).replace(/[^0-9.-]/g, "").trim();
  if (!cleaned) return undefined;
  const num = Number(cleaned);
  return (!isNaN(num) && isFinite(num) && num >= 0) ? num : undefined;
}

function safeExtractGender(field: any): "Male" | "Female" | "Other" | undefined {
  const str = safeExtractString(field);
  if (!str) return undefined;
  const lower = str.toLowerCase();
  if (lower === "male" || lower === "m" || lower.startsWith("m/") || lower === "man" || lower === "boy") {
    return "Male";
  }
  if (lower === "female" || lower === "f" || lower.startsWith("f/") || lower === "woman" || lower === "girl") {
    return "Female";
  }
  if (lower === "other" || lower === "o") {
    return "Other";
  }
  return undefined;
}

function safeExtractPhone(field: any): string {
  const str = safeExtractString(field);
  if (!str) return "Not Provided";
  const digits = str.replace(/\D/g, "");
  if (digits.length >= 7) return digits.slice(-10);
  return "Not Provided";
}

function safeExtractDate(field: any): Date {
  const str = safeExtractString(field);
  if (str) {
    const d = new Date(str);
    if (!isNaN(d.getTime())) return d;
  }
  return new Date();
}

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
    const { entryIndices, modifiedEntries } = body;

    await connectDB();

    const scan = await ScanDocument.findOne({
      _id: id,
      clinicId: user.clinicId,
    });

    if (!scan) {
      return NextResponse.json({ success: false, message: "Scan not found" }, { status: 404 });
    }

    // Apply any client-modified edits before batch saving
    if (modifiedEntries && Array.isArray(modifiedEntries)) {
      for (const mod of modifiedEntries) {
        const target = scan.entries.find((e) => (e.boxIndex || e.entryIndex) === (mod.boxIndex || mod.entryIndex));
        if (target && mod.fields) {
          for (const k of Object.keys(mod.fields)) {
            const rawVal = mod.fields[k];
            let val: any = rawVal;
            if (typeof rawVal === "object" && rawVal !== null) {
              val = "value" in rawVal ? rawVal.value : undefined;
            }
            if (typeof val === "object" && val !== null) {
              val = undefined;
            }
            (target.fields as any)[k] = {
              value: val,
              confidence: 100,
              flag: val != null && val !== "" ? "high" : "missing",
            };
          }
        }
      }
    }

    const targetEntries = scan.entries.filter((e) => {
      if (e.status === "saved" || e.status === "rejected") return false;
      if (entryIndices && Array.isArray(entryIndices)) {
        return entryIndices.includes(e.entryIndex);
      }
      return true;
    });

    if (targetEntries.length === 0) {
      return NextResponse.json(
        { success: false, message: "No eligible pending entries found to batch save." },
        { status: 400 }
      );
    }

    let savedCount = 0;

    for (const entry of targetEntries) {
      const fullName = safeExtractString(entry.fields.fullName) || `Patient #${entry.boxIndex || entry.entryIndex || 1}`;
      const phone = safeExtractPhone(entry.fields.phone);
      const age = safeExtractNumber(entry.fields.age);
      const gender = safeExtractGender(entry.fields.gender);
      const address = safeExtractString(entry.fields.address);
      const rawDisease = entry.fields.disease || entry.fields.chiefComplaint;
      const diseaseName = safeExtractString(rawDisease) || "";
      const treatmentName = safeExtractString(entry.fields.treatment) || (diseaseName ? `Care for: ${diseaseName}` : "General Dental Consultation");
      const remarks = safeExtractString(entry.fields.remarks) || "";
      const sNo = safeExtractString(entry.fields.sNo) || String(entry.boxIndex || entry.entryIndex || "");
      const daily = safeExtractString(entry.fields.daily) || "";
      const cashPaise = safeExtractString(entry.fields.cashPaise) || "";
      const creditPaise = safeExtractString(entry.fields.creditPaise) || "";
      const dailyToken = daily ? `Daily #${daily}` : "";
      const dentalNotes = safeExtractString(entry.fields.dentalNotes) || [diseaseName ? `Diagnosis: ${diseaseName}` : "", remarks ? `Remark: ${remarks}` : "", dailyToken].filter(Boolean).join(" | ") || "Imported from register scan";

      const cashRs = safeExtractNumber(entry.fields.cashRs);
      const creditRs = safeExtractNumber(entry.fields.creditRs);
      const totalAmount = (cashRs != null || creditRs != null)
        ? ((cashRs || 0) + (creditRs || 0))
        : (safeExtractNumber(entry.fields.fee) ?? safeExtractNumber(entry.fields.amount) ?? 0);
      const paidAmount = cashRs != null ? cashRs : (safeExtractString(entry.fields.paymentStatus) === "paid" ? totalAmount : 0);
      const paymentStatus = (creditRs != null && creditRs > 0)
        ? ((cashRs && cashRs > 0) ? "partial" : "unpaid")
        : (safeExtractString(entry.fields.paymentStatus) || (totalAmount > 0 ? "paid" : "unpaid"));

      const visitDate = safeExtractDate(entry.fields.visitDate);

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
          address: address || undefined,
          patientCode,
          medicalNotes: dentalNotes,
          sNo: sNo || undefined,
          daily: daily || undefined,
          disease: diseaseName || undefined,
          treatment: treatmentName || undefined,
          cashRs: cashRs ?? undefined,
          cashPaise: cashPaise || undefined,
          creditRs: creditRs ?? undefined,
          creditPaise: creditPaise || undefined,
          remarks: remarks || undefined,
          visitDate,
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
        sNo: sNo || undefined,
        daily: daily || undefined,
        disease: diseaseName || undefined,
        treatment: treatmentName || undefined,
        cashRs: cashRs ?? undefined,
        cashPaise: cashPaise || undefined,
        creditRs: creditRs ?? undefined,
        creditPaise: creditPaise || undefined,
        remarks: remarks || undefined,
        createdBy: user.userId,
      });

      if (treatmentName || totalAmount > 0) {
        await Treatment.create({
          clinicId: user.clinicId,
          patientId: targetPatientId,
          appointmentId: appointment._id,
          treatmentName,
          diagnosis: diseaseName || treatmentName,
          toothNumber: "General",
          notes: `${dentalNotes}${creditRs ? ` [Credit Rs: ${creditRs}]` : ""}${cashRs ? ` [Cash Rs: ${cashRs}]` : ""}`,
          cost: totalAmount,
          paidAmount: paidAmount,
          paymentStatus: paymentStatus as any,
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
