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
        if ((entry.fields as any)[k] !== undefined) {
          let customVal = customFields[k];
          if (typeof customVal === "object" && customVal !== null) {
            customVal = "value" in customVal ? customVal.value : undefined;
          }
          if (typeof customVal === "object" && customVal !== null) {
            customVal = undefined;
          }
          (entry.fields as any)[k] = {
            value: customVal,
            confidence: 100,
            flag: customVal != null && customVal !== "" ? "high" : "missing",
          };
        }
      }
    }

    const rawAge = customFields?.age !== undefined ? customFields.age : entry.fields.age;
    const rawGender = customFields?.gender !== undefined ? customFields.gender : entry.fields.gender;
    const rawName = customFields?.fullName !== undefined ? customFields.fullName : entry.fields.fullName;
    const rawPhone = customFields?.phone !== undefined ? customFields.phone : entry.fields.phone;
    const rawAddress = customFields?.address !== undefined ? customFields.address : entry.fields.address;
    const rawDisease = customFields?.disease !== undefined ? customFields.disease : (entry.fields.disease || entry.fields.chiefComplaint);
    const rawTreatment = customFields?.treatment !== undefined ? customFields.treatment : entry.fields.treatment;
    const rawVisitDate = customFields?.visitDate !== undefined ? customFields.visitDate : entry.fields.visitDate;
    const rawRemarks = customFields?.remarks !== undefined ? customFields.remarks : (entry.fields.remarks || entry.fields.dentalNotes);
    const rawDaily = customFields?.daily !== undefined ? customFields.daily : entry.fields.daily;
    const rawSNo = customFields?.sNo !== undefined ? customFields.sNo : entry.fields.sNo;
    const rawCashRs = customFields?.cashRs !== undefined ? customFields.cashRs : entry.fields.cashRs;
    const rawCashPaise = customFields?.cashPaise !== undefined ? customFields.cashPaise : entry.fields.cashPaise;
    const rawCreditRs = customFields?.creditRs !== undefined ? customFields.creditRs : entry.fields.creditRs;
    const rawCreditPaise = customFields?.creditPaise !== undefined ? customFields.creditPaise : entry.fields.creditPaise;
    const rawFee = customFields?.fee !== undefined ? customFields.fee : (entry.fields.fee ?? entry.fields.amount);
    const rawPaymentStatus = customFields?.paymentStatus !== undefined ? customFields.paymentStatus : entry.fields.paymentStatus;

    const fullName = safeExtractString(rawName) || `Patient #${entry.boxIndex || entry.entryIndex || 1}`;
    const phone = safeExtractPhone(rawPhone);
    const age = safeExtractNumber(rawAge);
    const gender = safeExtractGender(rawGender);
    const address = safeExtractString(rawAddress);
    const diseaseName = safeExtractString(rawDisease) || "";
    const treatmentName = safeExtractString(rawTreatment) || (diseaseName ? `Care for: ${diseaseName}` : "General Dental Consultation");
    const remarks = safeExtractString(rawRemarks) || "";
    const sNo = safeExtractString(rawSNo) || String(entry.boxIndex || entry.entryIndex || "");
    const daily = safeExtractString(rawDaily) || "";
    const cashPaise = safeExtractString(rawCashPaise) || "";
    const creditPaise = safeExtractString(rawCreditPaise) || "";
    const dailyToken = daily ? `Daily #${daily}` : "";
    const dentalNotes = safeExtractString(customFields?.dentalNotes || entry.fields.dentalNotes) || [diseaseName ? `Diagnosis: ${diseaseName}` : "", remarks ? `Remark: ${remarks}` : "", dailyToken].filter(Boolean).join(" | ") || "Imported from register scan";

    const cashRs = safeExtractNumber(rawCashRs);
    const creditRs = safeExtractNumber(rawCreditRs);
    const totalAmount = (cashRs != null || creditRs != null)
      ? ((cashRs || 0) + (creditRs || 0))
      : (safeExtractNumber(rawFee) ?? 0);
    const paidAmount = cashRs != null ? cashRs : (safeExtractString(rawPaymentStatus) === "paid" ? totalAmount : 0);
    const paymentStatus = (creditRs != null && creditRs > 0)
      ? ((cashRs && cashRs > 0) ? "partial" : "unpaid")
      : (safeExtractString(rawPaymentStatus) || (totalAmount > 0 ? "paid" : "unpaid"));

    const visitDate = safeExtractDate(rawVisitDate);

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
        address: address || undefined,
        patientCode,
        medicalNotes: `Register entry note: ${dentalNotes}`,
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
        if (address && !existingPatient.address) {
          existingPatient.address = address;
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
