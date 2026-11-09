import { NextResponse } from "next/server";
import { connectDB } from "../../../lib/mongodb";
import { Patient } from "../../../models/Patient";
import { Appointment } from "../../../models/Appointment";
import { Treatment } from "../../../models/treatment";
import { Counter } from "../../../models/Counter";
import { ScanDocument } from "../../../models/ScanDocument";
import { getCurrentClinic } from "../../../lib/auth";
import { Clinic } from "../../../models/Clinic";
import { logActivity } from "../../../lib/audit";
 
export const dynamic = "force-dynamic";
 
export async function GET(req: Request) {
  try {
    const clinicId = await getCurrentClinic();
    if (!clinicId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 401 }
      );
    }
 
    await connectDB();
 
    const clinicFilter = { clinicId, deletedAt: null };

    const url = new URL(req.url);
    const targetDate = url.searchParams.get("date"); // e.g. "2026-09-20"
    const mode = url.searchParams.get("mode"); // "register" or standard
 
    const patients = await Patient.find(clinicFilter).sort({ createdAt: -1 }).lean();
    const appointments = await Appointment.find(clinicFilter).sort({ appointmentDate: 1, createdAt: 1 }).lean();
    const treatments = await Treatment.find(clinicFilter).lean();

    // Map of patients by ID
    const patientMap = new Map<string, any>();
    patients.forEach((p) => patientMap.set(p._id.toString(), p));

    // Map of treatments by appointmentId and by patientId
    const treatmentByAppt = new Map<string, any>();
    const treatmentsByPatient = new Map<string, any[]>();
    treatments.forEach((t) => {
      if (t.appointmentId) {
        treatmentByAppt.set(t.appointmentId.toString(), t);
      }
      if (t.patientId) {
        const pId = t.patientId.toString();
        const list = treatmentsByPatient.get(pId) || [];
        list.push(t);
        treatmentsByPatient.set(pId, list);
      }
    });

    // Helper to get clinic date key (YYYY-MM-DD in Asia/Kolkata timezone)
    const toDateKey = (dateInput: any): string | null => {
      if (!dateInput) return null;
      const d = new Date(dateInput);
      if (isNaN(d.getTime())) return null;
      return d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    };

    // Calculate all available dates with patient visits
    const dateCounts = new Map<string, number>();
    appointments.forEach((a) => {
      const key = toDateKey(a.appointmentDate);
      if (key) {
        dateCounts.set(key, (dateCounts.get(key) || 0) + 1);
      }
    });
    patients.forEach((p) => {
      if (p.visitDate) {
        const key = toDateKey(p.visitDate);
        if (key && !dateCounts.has(key)) {
          dateCounts.set(key, (dateCounts.get(key) || 0) + 1);
        }
      }
    });

    const availableDates = Array.from(dateCounts.keys())
      .sort((a, b) => b.localeCompare(a))
      .map((dateStr) => ({
        date: dateStr,
        count: dateCounts.get(dateStr) || 0,
      }));

    // Find patients with unrecorded visit dates
    const unassignedPatients = patients.filter((p) => {
      const hasAppt = appointments.some((a) => a.patientId?.toString() === p._id.toString());
      return !p.visitDate && !hasAppt;
    });

    // PHYSICAL REGISTER VIEW: Filter by exact visit date
    if (mode === "register" || targetDate) {
      const selectedDateKey = targetDate || availableDates[0]?.date || toDateKey(new Date()) || "";

      const matchingRows: any[] = [];
      const seenPatientIdsOnDate = new Set<string>();

      // 1. From appointments matching selectedDateKey
      appointments.forEach((appt) => {
        const apptDateKey = toDateKey(appt.appointmentDate);
        if (apptDateKey === selectedDateKey) {
          const patient = patientMap.get(appt.patientId?.toString()) || {
            _id: appt.patientId,
            fullName: "Patient",
            phone: "",
            patientCode: "PAT-000",
          };
          const tr = treatmentByAppt.get(appt._id.toString()) || treatmentsByPatient.get(patient._id?.toString())?.[0];

          seenPatientIdsOnDate.add(patient._id?.toString());

          const cash = appt.cashRs ?? tr?.paidAmount ?? patient.cashRs ?? (tr?.paymentStatus === "paid" ? tr?.cost : undefined);
          const credit = appt.creditRs ?? (tr && tr.cost > tr.paidAmount ? tr.cost - tr.paidAmount : undefined) ?? patient.creditRs ?? undefined;
          const totalAmt = tr?.cost ?? (((cash || 0) + (credit || 0)) || undefined);

          matchingRows.push({
            date: selectedDateKey,
            sNo: appt.sNo ?? patient.sNo ?? (matchingRows.length + 1),
            daily: appt.daily ?? patient.daily ?? "",
            patientId: patient._id,
            patientCode: patient.patientCode,
            fullName: patient.fullName,
            age: patient.age,
            gender: patient.gender,
            phone: patient.phone,
            address: patient.address || "",
            disease: appt.disease || tr?.diagnosis || patient.disease || "",
            treatment: appt.treatment || tr?.treatmentName || appt.service || patient.treatment || "",
            cashRs: cash !== undefined && cash !== null ? Number(cash) : null,
            cashPaise: appt.cashPaise ?? patient.cashPaise ?? "",
            creditRs: credit !== undefined && credit !== null ? Number(credit) : null,
            creditPaise: appt.creditPaise ?? patient.creditPaise ?? "",
            totalCost: totalAmt !== undefined && totalAmt !== null ? Number(totalAmt) : null,
            paymentStatus: tr?.paymentStatus || (credit && credit > 0 ? "partial" : (cash && cash > 0 ? "paid" : "unpaid")),
            remarks: appt.remarks || patient.remarks || appt.notes || "",
            appointmentId: appt._id,
            appointmentTime: appt.appointmentTime,
          });
        }
      });

      // 2. From patients with visitDate matching selectedDateKey without duplicate
      patients.forEach((patient) => {
        if (!seenPatientIdsOnDate.has(patient._id.toString()) && toDateKey(patient.visitDate) === selectedDateKey) {
          const tr = treatmentsByPatient.get(patient._id.toString())?.[0];
          const cash = patient.cashRs ?? tr?.paidAmount;
          const credit = patient.creditRs ?? (tr && tr.cost > tr.paidAmount ? tr.cost - tr.paidAmount : undefined);
          const totalAmt = tr?.cost ?? (((cash || 0) + (credit || 0)) || undefined);

          matchingRows.push({
            date: selectedDateKey,
            sNo: patient.sNo ?? (matchingRows.length + 1),
            daily: patient.daily ?? "",
            patientId: patient._id,
            patientCode: patient.patientCode,
            fullName: patient.fullName,
            age: patient.age,
            gender: patient.gender,
            phone: patient.phone,
            address: patient.address || "",
            disease: tr?.diagnosis || patient.disease || "",
            treatment: tr?.treatmentName || patient.treatment || "",
            cashRs: cash !== undefined && cash !== null ? Number(cash) : null,
            cashPaise: patient.cashPaise ?? "",
            creditRs: credit !== undefined && credit !== null ? Number(credit) : null,
            creditPaise: patient.creditPaise ?? "",
            totalCost: totalAmt !== undefined && totalAmt !== null ? Number(totalAmt) : null,
            paymentStatus: tr?.paymentStatus || (credit && credit > 0 ? "partial" : (cash && cash > 0 ? "paid" : "unpaid")),
            remarks: patient.remarks || "",
          });
        }
      });

      const totalCash = matchingRows.reduce((acc, r) => acc + (Number(r.cashRs) || 0), 0);
      const totalCredit = matchingRows.reduce((acc, r) => acc + (Number(r.creditRs) || 0), 0);

      return NextResponse.json({
        success: true,
        mode: "register",
        selectedDate: selectedDateKey,
        availableDates,
        unassignedCount: unassignedPatients.length,
        summary: {
          totalPatients: matchingRows.length,
          totalCash,
          totalCredit,
          totalRevenue: totalCash + totalCredit,
        },
        registerRows: matchingRows,
      });
    }

    // Default mode: standard patient directory
    const data = patients.map((patient) => {
      const patientAppts = appointments.filter(
        (a) => a.patientId && a.patientId.toString() === patient._id.toString()
      );
      const appointmentCount = patientAppts.length;
      const lastVisit = patientAppts[patientAppts.length - 1]?.appointmentDate || patient.visitDate || null;
 
      return {
        ...patient,
        appointmentCount,
        lastVisit,
      };
    });
 
    // Sort data dynamically by latest activity: max(lastVisit, createdAt) descending
    const sortedData = data.sort((a, b) => {
      const dateA = a.lastVisit ? new Date(a.lastVisit).getTime() : new Date(a.createdAt).getTime();
      const dateB = b.lastVisit ? new Date(b.lastVisit).getTime() : new Date(b.createdAt).getTime();
      return (dateB || 0) - (dateA || 0);
    });
 
    return NextResponse.json({
      success: true,
      data: sortedData,
      availableDates,
      unassignedCount: unassignedPatients.length,
    });
  } catch (error) {
    console.error("Error fetching patients:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch patients." },
      { status: 500 }
    );
  }
}
 
export async function POST(req: Request) {
  try {
    await connectDB();
 
    // Resolve clinicId: check logged-in context, fallback to first clinic in database
    let resolvedClinicId = await getCurrentClinic();
    if (!resolvedClinicId) {
      const defaultClinic = await Clinic.findOne();
      if (defaultClinic) {
        resolvedClinicId = String(defaultClinic._id);
      }
    }
    const clinicId = resolvedClinicId || undefined;
 
    const body = await req.json();
    const {
      fullName,
      phone,
      bookAppointment,
      service,
      appointmentDate,
      appointmentTime,
      notes
    } = body;
 
    const cleanedPhone = phone?.trim().replace(/\D/g, "");
    const cleanedName = fullName?.trim();
 
    const clinicFilter = { clinicId, deletedAt: null };
 
    // Search for existing patient with matching phone AND name within active clinic scope
    let patient = await Patient.findOne({
      ...clinicFilter,
      phone: cleanedPhone,
      fullName: { $regex: new RegExp(`^${cleanedName.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")}$`, "i") }
    });
 
    let isNewPatient = false;
    if (!patient) {
      isNewPatient = true;
      const counter = await Counter.findOneAndUpdate(
        { name: `patient_${clinicId || "default"}` },
        { $inc: { sequence: 1 } },
        { new: true, upsert: true }
      );
      const patientCode = `PAT-${String(counter.sequence).padStart(3, "0")}`;
 
      patient = await Patient.create({
        ...body,
        clinicId,
        fullName: cleanedName,
        phone: cleanedPhone,
        patientCode,
      });

      await logActivity(
        "Create Patient",
        `Registered new patient: ${patient.fullName} (${patient.patientCode})`,
        String(patient._id),
        "Patient"
      );
    }
 
    // Link legacy appointments
    if (patient.phone) {
      const cleanedPhoneDb = patient.phone.trim().replace(/\D/g, "");
      const phoneRegexString = "^" + cleanedPhoneDb.split("").map(digit => `\\D*${digit}`).join("") + "\\D*$";
      const phoneRegex = new RegExp(phoneRegexString);
 
      await Appointment.updateMany(
        {
          ...clinicFilter,
          phone: phoneRegex,
          fullName: { $regex: new RegExp(`^${patient.fullName.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")}$`, "i") },
          patientId: { $exists: false }
        },
        {
          $set: { patientId: patient._id, clinicId }
        }
      );
    }
 
    // Book optional appointment if requested
    let appointment = null;
    if (bookAppointment) {
      if (!service || !appointmentDate || !appointmentTime) {
        return NextResponse.json(
          {
            success: false,
            message: "Appointment details (service, date, time) are required when booking.",
          },
          { status: 400 }
        );
      }
 
      appointment = await Appointment.create({
        clinicId,
        patientId: patient._id,
        service,
        appointmentDate: new Date(appointmentDate),
        appointmentTime,
        status: "requested",
        notes: notes || "",
      });

      await logActivity(
        "Create Appointment",
        `Scheduled appointment for ${patient.fullName}: ${appointment.service} on ${appointmentDate} at ${appointmentTime}`,
        String(appointment._id),
        "Appointment"
      );
    }
 
    return NextResponse.json({ success: true, data: patient, appointment });
  } catch (error: any) {
    console.error("Error creating patient:", error);

    const message =
      error?.message ||
      (typeof error === "string" ? error : "Failed to create patient.");

    return NextResponse.json(
      {
        success: false,
        message,
        error: error?.name,
      },
      { status: 500 }
    );
  }
}

// DELETE /api/patients - Clear all patients, linked appointments, treatments, and reset counter
export async function DELETE(req: Request) {
  try {
    const clinicId = await getCurrentClinic();
    if (!clinicId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 401 }
      );
    }

    await connectDB();

    // 1. Delete all patients for this clinic
    const patientDeleteResult = await Patient.deleteMany({ clinicId });

    // 2. Delete all appointments for this clinic
    const appointmentDeleteResult = await Appointment.deleteMany({ clinicId });

    // 3. Delete all treatments for this clinic
    const treatmentDeleteResult = await Treatment.deleteMany({ clinicId });

    // 4. Reset patient counter back to 0 so next patient starts from PAT-001
    await Counter.findOneAndUpdate(
      { name: `patient_${clinicId}` },
      { $set: { sequence: 0 } },
      { upsert: true }
    );

    // 5. Reset scan documents entries back to pending
    await ScanDocument.updateMany(
      { clinicId },
      {
        $set: {
          approvedCount: 0,
          status: "needs_review",
          "entries.$[].status": "pending",
          "entries.$[].savedPatientId": null,
          "entries.$[].savedPatientCode": null,
          "entries.$[].savedAppointmentId": null,
        },
      }
    );

    await logActivity(
      "Clear All Patients",
      `Cleared all ${patientDeleteResult.deletedCount} patients, ${appointmentDeleteResult.deletedCount} appointments, and reset numbering`,
      String(clinicId),
      "Patient"
    );

    return NextResponse.json({
      success: true,
      message: `Successfully cleared all ${patientDeleteResult.deletedCount} patients and reset numbering.`,
      deletedCount: patientDeleteResult.deletedCount,
    });
  } catch (error: any) {
    console.error("Error clearing patients:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to clear patients" },
      { status: 500 }
    );
  }
}
