import { NextResponse } from "next/server";
import { connectDB } from "../../../lib/mongodb";
import { Appointment } from "../../../models/Appointment";
import { Patient } from "../../../models/Patient";
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
 
    // Self-heal/link legacy appointments that are missing patientId within clinic
    const unlinkedAppointments = await Appointment.find({
      ...clinicFilter,
      patientId: { $exists: false },
    });
    if (unlinkedAppointments.length > 0) {
      const patients = await Patient.find(clinicFilter);
      for (const appt of unlinkedAppointments) {
        const legacyAppt = appt as any;
        if (legacyAppt.phone && legacyAppt.fullName) {
          const apptPhoneClean = legacyAppt.phone.trim().replace(/\D/g, "");
          const matchingPatient = patients.find(p => {
            const pPhoneClean = p.phone.trim().replace(/\D/g, "");
            return pPhoneClean === apptPhoneClean && p.fullName.toLowerCase() === legacyAppt.fullName.toLowerCase();
          });
          if (matchingPatient) {
            await Appointment.findByIdAndUpdate(appt._id, { $set: { patientId: matchingPatient._id, clinicId } });
          }
        }
      }
    }
 
    const appointments = await Appointment.find(clinicFilter)
      .populate("patientId")
      .sort({ createdAt: -1 })
      .lean();
 
    return NextResponse.json({
      success: true,
      appointments,
    });
  } catch (error) {
    console.error("GET appointments error:", error);
 
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch appointments",
      },
      { status: 500 }
    );
  }
}
 
export async function POST(req: Request) {
  try {
    await connectDB();
 
    const body = await req.json();
 
    const {
      clinicId: bodyClinicId,
      patientId, // Passed when booking from patient profile
      fullName,
      phone,
      email,
      age,
      gender,
      address,
      medicalNotes,
      allergies,
      service,
      appointmentDate,
      appointmentTime,
      notes,
    } = body;

    // Resolve clinicId: check body, logged-in session, then DB default
    let resolvedClinicId = bodyClinicId;

    if (!resolvedClinicId) {
      resolvedClinicId = await getCurrentClinic();
    }

    if (!resolvedClinicId) {
      const defaultClinic = await Clinic.findOne();
      if (defaultClinic) {
        resolvedClinicId = String(defaultClinic._id);
      }
    }

    const clinicId = resolvedClinicId || undefined;
 
    const clinicFilter = { clinicId, deletedAt: null };
 
    let patient;
 
    if (patientId) {
      // Flow A: Book directly for an existing patient
      patient = await Patient.findOne({ _id: patientId, ...clinicFilter });
      if (!patient) {
        return NextResponse.json(
          {
            success: false,
            message: "Patient not found",
          },
          { status: 400 }
        );
      }
    } else {
      // Flow B: Website booking flow (requires name and phone)
      if (!fullName || !phone) {
        return NextResponse.json(
          {
            success: false,
            message: "Name and phone are required",
          },
          { status: 400 }
        );
      }
 
      const cleanedPhone = phone.trim().replace(/\D/g, "");
      const cleanedName = fullName.trim();
 
      // Search existing patient within clinic scope
      const nameRegex = new RegExp(
        `^${cleanedName.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")}$`,
        "i"
      );
 
      const candidates = await Patient.find({ fullName: nameRegex, ...clinicFilter });
      patient = candidates.find((p: any) => {
        if (!p.phone) return false;
        const pPhoneClean = p.phone.trim().replace(/\D/g, "");
        return pPhoneClean === cleanedPhone;
      });
 
      // Fallback: try direct phone match within clinic
      if (!patient) {
        patient = await Patient.findOne({ phone: cleanedPhone, ...clinicFilter });
      }
 
      // Create patient if not found
      if (!patient) {
        const counter = await Counter.findOneAndUpdate(
          { name: `patient_${clinicId || "default"}` },
          { $inc: { sequence: 1 } },
          { returnDocument: "after", upsert: true }
        );
        const patientCode = `PAT-${String(counter.sequence).padStart(3, "0")}`;
 
        try {
          patient = await Patient.create({
            clinicId,
            fullName: cleanedName,
            patientCode,
            phone: cleanedPhone,
            email,
            age: age ? Number(age) : undefined,
            gender,
            address,
            medicalNotes,
            allergies,
          });
 
          console.log("New patient created:", patient._id);
        } catch (err: any) {
          if (err?.code === 11000) {
            const counter2 = await Counter.findOneAndUpdate(
              { name: `patient_${clinicId || "default"}` },
              { $inc: { sequence: 1 } },
              { returnDocument: "after", upsert: true }
            );
            const seq2 = counter2?.sequence ?? ((counter?.sequence ?? 0) + 1);
            const patientCode2 = `PAT-${String(seq2).padStart(3, "0")}`;
            try {
              patient = await Patient.create({
                clinicId,
                fullName: cleanedName,
                patientCode: patientCode2,
                phone: cleanedPhone,
                email,
                age: age ? Number(age) : undefined,
                gender,
                address,
                medicalNotes,
                allergies,
              });
              console.log("New patient created after retry:", patient._id);
            } catch (err2: any) {
              if (err2?.code === 11000) {
                const fallbackNameRegex = new RegExp(
                  `^${cleanedName.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")}$`,
                  "i"
                );
                patient = await Patient.findOne({
                  $and: [
                    clinicFilter,
                    {
                      $or: [
                        { phone: cleanedPhone },
                        { fullName: fallbackNameRegex },
                      ],
                    }
                  ]
                });
 
                if (patient) {
                  console.log("Using existing patient found after retry collision:", patient._id);
                } else {
                  throw err2;
                }
              } else {
                throw err2;
              }
            }
          } else {
            throw err;
          }
        }
      } else {
        console.log("Existing patient found:", patient._id);
      }
    }
 
    if (!service || !appointmentDate || !appointmentTime) {
      return NextResponse.json(
        {
          success: false,
          message: "Appointment details (service, date, time) are required",
        },
        { status: 400 }
      );
    }
 
    // Create appointment inside clinic context
    const appointment = await Appointment.create({
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
 
    console.log("Appointment created:", appointment._id);
 
    return NextResponse.json(
      {
        success: true,
        message: "Appointment booked successfully",
        patientId: patient._id,
        appointment,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST appointments error:", error);
 
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Something went wrong",
      },
      { status: 500 }
    );
  }
}