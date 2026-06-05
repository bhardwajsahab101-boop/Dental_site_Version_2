import { NextResponse } from "next/server";
import { connectDB } from "../../../lib/mongodb";
import { Appointment } from "../../../models/Appointment";
import { Patient } from "../../../models/Patient";
import { Counter } from "../../../models/Counter";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();

    // Self-heal/link legacy appointments that are missing patientId
    const unlinkedAppointments = await Appointment.find({ patientId: { $exists: false } });
    if (unlinkedAppointments.length > 0) {
      const patients = await Patient.find({});
      for (const appt of unlinkedAppointments) {
        const legacyAppt = appt as any;
        if (legacyAppt.phone && legacyAppt.fullName) {
          const apptPhoneClean = legacyAppt.phone.trim().replace(/\D/g, "");
          const matchingPatient = patients.find(p => {
            const pPhoneClean = p.phone.trim().replace(/\D/g, "");
            return pPhoneClean === apptPhoneClean && p.fullName.toLowerCase() === legacyAppt.fullName.toLowerCase();
          });
          if (matchingPatient) {
            await Appointment.findByIdAndUpdate(appt._id, { $set: { patientId: matchingPatient._id } });
          }
        }
      }
    }

    const appointments = await Appointment.find()
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

    let patient;

    if (patientId) {
      // Flow A: Book directly for an existing patient
      patient = await Patient.findById(patientId);
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

      // Search existing patient by case-insensitive full name first,
      // then verify phone digits match (handles formatted phone numbers)
      const nameRegex = new RegExp(
        `^${cleanedName.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")}$`,
        "i"
      );

      const candidates = await Patient.find({ fullName: nameRegex });
      patient = candidates.find((p: any) => {
        if (!p.phone) return false;
        const pPhoneClean = p.phone.trim().replace(/\D/g, "");
        return pPhoneClean === cleanedPhone;
      });

      // Fallback: try direct phone match (if name differs slightly)
      if (!patient) {
        patient = await Patient.findOne({ phone: cleanedPhone });
      }

      // Create patient if not found
      if (!patient) {
        // Atomic patient code generation using modern returnDocument option
        const counter = await Counter.findOneAndUpdate(
          { name: "patient" },
          { $inc: { sequence: 1 } },
          { returnDocument: "after", upsert: true }
        );
        const patientCode = `PAT-${String(counter.sequence).padStart(3, "0")}`;

        // Create patient; handle rare duplicate patientCode by retrying once
        try {
          patient = await Patient.create({
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
          // If duplicate key on patientCode (rare race), increment counter again and retry once
          if (err?.code === 11000 && err?.keyValue?.patientCode) {
            const counter2 = await Counter.findOneAndUpdate(
              { name: "patient" },
              { $inc: { sequence: 1 } },
              { returnDocument: "after", upsert: true }
            );
            const seq2 = counter2?.sequence ?? ((counter?.sequence ?? 0) + 1);
            const patientCode2 = `PAT-${String(seq2).padStart(3, "0")}`;
            try {
              patient = await Patient.create({
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
              // If retry also collides, best-effort: find the already-created patient by phone/name
              if (err2?.code === 11000) {
                const fallbackNameRegex = new RegExp(
                  `^${cleanedName.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")}$`,
                  "i"
                );
                patient = await Patient.findOne({
                  $or: [
                    { phone: cleanedPhone },
                    { fullName: fallbackNameRegex },
                  ],
                });

                if (patient) {
                  console.log("Using existing patient found after retry collision:", patient._id);
                } else {
                  // If still not found, rethrow the original error
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

    // Standardized appointment structure only (no legacy fullName, phone, email fields)
    const appointment = await Appointment.create({
      patientId: patient._id,
      service,
      appointmentDate: new Date(appointmentDate),
      appointmentTime,
      status: "pending",
      notes: notes || "",
    });

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