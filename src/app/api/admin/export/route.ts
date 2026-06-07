import { NextResponse } from "next/server";
import { connectDB } from "../../../../lib/mongodb";
import { Patient } from "../../../../models/Patient";
import { Appointment } from "../../../../models/Appointment";
import { Treatment } from "../../../../models/treatment";
import { User } from "../../../../models/User";
import { getCurrentClinic } from "../../../../lib/auth";

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

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    if (!type) {
      return NextResponse.json(
        { success: false, message: "Missing export type parameter" },
        { status: 400 }
      );
    }

    const clinicFilter = { clinicId };

    if (type === "patients") {
      // Fetch patients and calculate dues
      const patients = await Patient.find({ ...clinicFilter, deletedAt: null }).lean();
      const patientIds = patients.map((p) => p._id);
      
      const treatments = await Treatment.find({
        clinicId,
        patientId: { $in: patientIds },
        deletedAt: null,
      } as any).lean();

      // Map patient dues
      const duesMap: Record<string, number> = {};
      treatments.forEach((t) => {
        const pId = String(t.patientId);
        const due = Math.max(0, (t.cost || 0) - (t.paidAmount || 0));
        duesMap[pId] = (duesMap[pId] || 0) + due;
      });

      const exportData = patients.map((p: any) => ({
        name: p.fullName || "",
        code: p.patientCode || "",
        email: p.email || "",
        phone: p.phone || "",
        age: p.age || "",
        gender: p.gender || "",
        address: p.address || "",
        medicalNotes: p.medicalNotes || "",
        dues: duesMap[String(p._id)] || 0,
      }));

      return NextResponse.json({ success: true, data: exportData });
    }

    if (type === "appointments") {
      const appointments = await Appointment.find({ ...clinicFilter, deletedAt: null })
        .populate("patientId")
        .sort({ appointmentDate: -1 })
        .lean();

      const exportData = appointments.map((a: any) => ({
        patientName: a.patientId?.fullName || a.fullName || "Standalone Patient",
        patientCode: a.patientId?.patientCode || "",
        date: a.appointmentDate ? new Date(a.appointmentDate).toISOString().split("T")[0] : "",
        time: a.appointmentTime || "",
        service: a.service || "",
        status: a.status || "",
        notes: a.notes || "",
      }));

      return NextResponse.json({ success: true, data: exportData });
    }

    if (type === "treatments") {
      const treatments = await Treatment.find({ ...clinicFilter, deletedAt: null })
        .populate("patientId")
        .sort({ createdAt: -1 })
        .lean();

      const exportData = treatments.map((t: any) => {
        const due = Math.max(0, (t.cost || 0) - (t.paidAmount || 0));
        return {
          patientName: t.patientId?.fullName || "Patient",
          patientCode: t.patientId?.patientCode || "",
          treatmentName: t.treatmentName || "",
          cost: t.cost || 0,
          paid: t.paidAmount || 0,
          due,
          status: t.status || "",
          paymentStatus: t.paymentStatus || "",
          date: t.createdAt ? new Date(t.createdAt).toISOString().split("T")[0] : "",
        };
      });

      return NextResponse.json({ success: true, data: exportData });
    }

    if (type === "users") {
      const users = await User.find(clinicFilter).sort({ role: 1 }).lean();

      const exportData = users.map((u: any) => ({
        name: u.name || "",
        email: u.email || "",
        role: u.role || "",
        status: u.isActive !== false ? "Active" : "Disabled",
      }));

      return NextResponse.json({ success: true, data: exportData });
    }

    return NextResponse.json(
      { success: false, message: "Invalid export type" },
      { status: 400 }
    );
  } catch (error) {
    console.error("GET export error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to generate export dataset" },
      { status: 500 }
    );
  }
}
