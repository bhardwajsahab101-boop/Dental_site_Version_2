import { NextResponse } from "next/server";
import { connectDB } from "../../../../lib/mongodb";
import { Patient } from "../../../../models/Patient";
import { Appointment } from "../../../../models/Appointment";
import { Treatment } from "../../../../models/treatment";
import { getCurrentClinic, getCurrentUser } from "../../../../lib/auth";
import { logActivity } from "../../../../lib/audit";
 
export const dynamic = "force-dynamic";
 
export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
 
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
 
    let patient = null;
 
    // Search by Mongo ID and verify clinic scope
    try {
      patient = await Patient.findOne({ _id: id, ...clinicFilter });
    } catch {
      // Ignore invalid ObjectId
    }
 
    // Search by Patient Code if not found
    if (!patient) {
      patient = await Patient.findOne({ patientCode: id, ...clinicFilter });
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
 
    // Link legacy appointments (under active clinic scope)
    if (patient.phone && patient.fullName) {
      await Appointment.updateMany(
        {
          ...clinicFilter,
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
            clinicId,
          },
        }
      );
    }
 
    // Fetch appointments within clinic scope
    const appointments = await Appointment.find({
      ...clinicFilter,
      patientId: patient._id,
    }).sort({
      appointmentDate: -1,
    });
 
    const totalAppointments = appointments.length;
 
    const completedAppointments = appointments.filter(
      (a) => a.status === "completed"
    ).length;
 
    const pendingAppointments = appointments.filter(
      (a) => a.status === "requested" || (a.status as string) === "pending"
    ).length;
 
    const confirmedAppointments = appointments.filter(
      (a) => a.status === "confirmed"
    ).length;
 
    const cancelledAppointments = appointments.filter(
      (a) => a.status === "cancelled"
    ).length;
 
    // Fetch treatments within clinic scope
    const treatments = await Treatment.find({
      ...clinicFilter,
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

    // Fetch related audit logs
    const { AuditLog } = await import("../../../../models/AuditLog");
    const apptIds = appointments.map(a => a._id);
    const treatmentIds = treatments.map(t => t._id);
    const auditLogs = await AuditLog.find({
      clinicId,
      $or: [
        { targetId: patient._id },
        { targetId: { $in: apptIds } },
        { targetId: { $in: treatmentIds } }
      ]
    }).sort({ createdAt: -1 }).limit(100).lean();
 
    return NextResponse.json({
      success: true,
      patient,
      appointments,
      treatments,
      auditLogs,
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
    const clinicId = await getCurrentClinic();
    const currentUser = await getCurrentUser();
    if (!clinicId || !currentUser) {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 401 }
      );
    }
 
    await connectDB();
 
    const clinicFilter = { clinicId, deletedAt: null };
 
    let patient = null;
 
    try {
      patient = await Patient.findOne({ _id: id, ...clinicFilter });
    } catch {
      // Ignore invalid ObjectId
    }
 
    if (!patient) {
      patient = await Patient.findOne({ patientCode: id, ...clinicFilter });
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
      ...clinicFilter,
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
 
    await Patient.findOneAndUpdate(
      { _id: patient._id, clinicId, deletedAt: null },
      { deletedAt: new Date(), deletedBy: currentUser.userId }
    );
 
    await logActivity(
      "Delete Patient",
      `Deleted patient: ${patient.fullName} (${patient.patientCode})`,
      String(patient._id),
      "Patient"
    );
 
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

// PATCH /api/patients/[id] - Update patient details
export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
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
    
    // Find patient by ID or code
    let patient = await Patient.findOne({ _id: id, ...clinicFilter }).catch(() => null);
    if (!patient) {
      patient = await Patient.findOne({ patientCode: id, ...clinicFilter });
    }

    if (!patient) {
      return NextResponse.json(
        { success: false, message: "Patient not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    
    // Update allowed fields
    const allowedFields = [
      "fullName",
      "phone",
      "email",
      "age",
      "gender",
      "address",
      "medicalNotes",
      "allergies",
    ];

    const updates: any = {};
    allowedFields.forEach((field) => {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    });

    // Update DB
    const updatedPatient = await Patient.findByIdAndUpdate(
      patient._id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updatedPatient) {
      throw new Error("Failed to retrieve updated patient document");
    }

    // Audit logging
    await logActivity(
      "Edit Patient",
      `Updated patient details for ${updatedPatient.fullName} (${updatedPatient.patientCode})`,
      String(updatedPatient._id),
      "Patient"
    );

    return NextResponse.json({
      success: true,
      message: "Patient updated successfully",
      patient: updatedPatient,
    });
  } catch (error: any) {
    console.error("PATCH patient error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update patient" },
      { status: 500 }
    );
  }
}