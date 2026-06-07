import { NextResponse } from "next/server";
import { connectDB } from "../../../lib/mongodb";
import { Patient } from "../../../models/Patient";
import { Appointment } from "../../../models/Appointment";
import { Counter } from "../../../models/Counter";
import { getCurrentClinic } from "../../../lib/auth";
import { Clinic } from "../../../models/Clinic";
import { logActivity } from "../../../lib/audit";
 
export const dynamic = "force-dynamic";
 
export async function GET() {
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
 
    const patients = await Patient.find(clinicFilter).sort({ createdAt: -1 }).lean();
    const appointments = await Appointment.find(clinicFilter).sort({ appointmentDate: -1 }).lean();
 
    const data = patients.map((patient) => {
      const patientAppts = appointments.filter(
        (a) => a.patientId && a.patientId.toString() === patient._id.toString()
      );
      const appointmentCount = patientAppts.length;
      const lastVisit = patientAppts[0]?.appointmentDate || null;
 
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
 
    return NextResponse.json({ success: true, data: sortedData });
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
