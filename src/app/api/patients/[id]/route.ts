import { NextResponse } from "next/server";
import { connectDB } from "../../../../lib/mongodb";
import { Patient } from "../../../../models/Patient";
import { Appointment } from "../../../../models/Appointment";
import { Treatment } from "../../../../models/treatment";

export const dynamic = "force-dynamic";

export async function GET(
    _req: Request,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;

    try {
        await connectDB();

        let patient = null;

        // Search by Mongo ID
        try {
            patient = await Patient.findById(id);
        } catch {
            // Ignore invalid ObjectId
        }

        // Search by Patient Code if not found
        if (!patient) {
            patient = await Patient.findOne({ patientCode: id });
        }

        if (!patient) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Patient not found",
                },
                { status: 404 }
            );
        }

        // ------------------------------------
        // Legacy appointment migration
        // ------------------------------------
        if (patient.phone && patient.fullName) {
            await Appointment.updateMany(
                {
                    phone: patient.phone,
                    fullName: {
                        $regex: new RegExp(
                            `^${patient.fullName.replace(
                                /[-\/\\^$*+?.()|[\]{}]/g,
                                "\\$&"
                            )}$`,
                            "i"
                        ),
                    },
                    patientId: { $exists: false },
                },
                {
                    $set: {
                        patientId: patient._id,
                    },
                }
            );
        }

        // ------------------------------------
        // Fetch appointments
        // ------------------------------------
        const appointments = await Appointment.find({
            patientId: patient._id,
        }).sort({
            appointmentDate: -1,
        });

        const totalAppointments = appointments.length;

        const completedAppointments = appointments.filter(
            (a) => a.status === "completed"
        ).length;

        const pendingAppointments = appointments.filter(
            (a) => a.status === "pending"
        ).length;

        const confirmedAppointments = appointments.filter(
            (a) => a.status === "confirmed"
        ).length;

        const cancelledAppointments = appointments.filter(
            (a) => a.status === "cancelled"
        ).length;

        // ------------------------------------
        // Fetch treatments & stats
        // ------------------------------------
        const treatments = await Treatment.find({
            patientId: patient._id,
        } as any).sort({
            createdAt: -1,
        });

        const totalTreatments = treatments.length;
        const completedTreatments = treatments.filter((t) => t.status === "completed").length;
        const activeTreatments = treatments.filter((t) => t.status === "planned" || t.status === "in_progress").length;

        // Financial summary
        const totalRevenue = treatments.reduce((sum, t) => sum + (t.cost || 0), 0);
        const totalCollected = treatments.reduce((sum, t) => sum + (t.paidAmount || 0), 0);
        const totalOutstanding = Math.max(0, totalRevenue - totalCollected);

        return NextResponse.json({
            success: true,
            patient,
            appointments,
            treatments,
            stats: {
                totalAppointments,
                completedAppointments,
                pendingAppointments,
                confirmedAppointments,
                cancelledAppointments,
            },
            treatmentStats: {
                totalTreatments,
                completedTreatments,
                activeTreatments,
            },
            financialSummary: {
                totalRevenue,
                totalCollected,
                totalOutstanding,
            },
        });
    } catch (error) {
        console.error("Error fetching patient profile:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Failed to fetch patient profile.",
            },
            { status: 500 }
        );
    }
}

export async function DELETE(
    _req: Request,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;

    try {
        await connectDB();

        let patient = null;

        try {
            patient = await Patient.findById(id);
        } catch {
            // Ignore invalid ObjectId
        }

        if (!patient) {
            patient = await Patient.findOne({ patientCode: id });
        }

        if (!patient) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Patient not found",
                },
                { status: 404 }
            );
        }

        const appointmentCount = await Appointment.countDocuments({
            patientId: patient._id,
        });

        if (appointmentCount > 0) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Cannot delete patient because appointments are linked to this patient.",
                },
                { status: 400 }
            );
        }

        await Patient.findByIdAndDelete(patient._id);

        return NextResponse.json({
            success: true,
            message: "Patient deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting patient:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Failed to delete patient.",
            },
            { status: 500 }
        );
    }
}