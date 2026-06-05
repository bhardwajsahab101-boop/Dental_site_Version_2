import { NextResponse } from "next/server";
import { connectDB } from "../../../../lib/mongodb";
import { Patient } from "../../../../models/Patient";
import { Treatment } from "../../../../models/treatment";
import { Appointment } from "../../../../models/Appointment";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";

    if (!query.trim()) {
      return NextResponse.json({
        success: true,
        results: {
          patients: [],
          treatments: [],
          appointments: [],
        },
      });
    }

    const regex = new RegExp(query, "i");

    // 1. Search Patients
    const patients = await Patient.find({
      $or: [
        { fullName: regex },
        { phone: regex },
        { patientCode: regex },
      ],
    }).limit(6);

    const patientIds = patients.map((p) => p._id);

    // 2. Search Treatments
    const treatments = await Treatment.find({
      $or: [
        { treatmentName: regex },
        { diagnosis: regex },
        { patientId: { $in: patientIds } },
      ],
    } as any)
      .populate("patientId")
      .limit(6);

    // 3. Search Appointments
    const appointments = await Appointment.find({
      $or: [
        { service: regex },
        { notes: regex },
        { patientId: { $in: patientIds } },
      ],
    } as any)
      .populate("patientId")
      .limit(6);

    return NextResponse.json({
      success: true,
      results: {
        patients,
        treatments,
        appointments,
      },
    });
  } catch (error) {
    console.error("GET search error:", error);
    return NextResponse.json(
      { success: false, message: "Search failed" },
      { status: 500 }
    );
  }
}
