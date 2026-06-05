import { NextResponse } from "next/server";
import { connectDB } from "../../../lib/mongodb";
import { Patient } from "../../../models/Patient";
import { Appointment } from "../../../models/Appointment";
import { Counter } from "../../../models/Counter";

export const dynamic = "force-dynamic";

// Only do: GET all patients + POST create patient

export async function GET() {
    try {
        await connectDB();

        const patients = await Patient.find().sort({ createdAt: -1 }).lean();
        const appointments = await Appointment.find().sort({ appointmentDate: -1 }).lean();

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

        // Search for existing patient with matching phone AND name (case-insensitive match)
        let patient = await Patient.findOne({
            phone: cleanedPhone,
            fullName: { $regex: new RegExp(`^${cleanedName.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")}$`, "i") }
        });

        if (!patient) {
            const counter = await Counter.findOneAndUpdate(
                { name: "patient" },
                { $inc: { sequence: 1 } },
                { new: true, upsert: true }
            );
            const patientCode = `PAT-${String(counter.sequence).padStart(3, "0")}`;

            patient = await Patient.create({
                ...body,
                fullName: cleanedName,
                phone: cleanedPhone,
                patientCode,
            });
        }

        // Link legacy appointments that have matching phone & name but no patientId
        if (patient.phone) {
            const cleanedPhoneDb = patient.phone.trim().replace(/\D/g, "");
            const phoneRegexString = "^" + cleanedPhoneDb.split("").map(digit => `\\D*${digit}`).join("") + "\\D*$";
            const phoneRegex = new RegExp(phoneRegexString);

            await Appointment.updateMany(
                {
                    phone: phoneRegex,
                    fullName: { $regex: new RegExp(`^${patient.fullName.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")}$`, "i") },
                    patientId: { $exists: false }
                },
                {
                    $set: { patientId: patient._id }
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
                patientId: patient._id,
                service,
                appointmentDate: new Date(appointmentDate),
                appointmentTime,
                status: "pending",
                notes: notes || "",
            });
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

