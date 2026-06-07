import { NextResponse } from "next/server";
import { connectDB } from "../../../../lib/mongodb";
import { Appointment } from "../../../../models/Appointment";
import { getCurrentClinic, getCurrentUser } from "../../../../lib/auth";
import { logActivity } from "../../../../lib/audit";

const VALID_STATUSES = ["requested", "confirmed", "arrived", "in_treatment", "completed", "no_show", "cancelled"];
 
export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const clinicId = await getCurrentClinic();
    if (!clinicId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 401 }
      );
    }
 
    await connectDB();
 
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Appointment ID is required",
        },
        { status: 400 }
      );
    }
 
    const clinicFilter = { clinicId, deletedAt: null };
 
    // Find appointment and verify it belongs to this clinic
    const appointment = await Appointment.findOne({ _id: id, ...clinicFilter });
    if (!appointment) {
      return NextResponse.json(
        {
          success: false,
          message: "Appointment not found",
        },
        { status: 404 }
      );
    }
 
    const body = await req.json();
    let { status, appointmentDate, appointmentTime, notes, service } = body;

    // Convert legacy pending status to requested
    if (status === "pending") {
      status = "requested";
    }
 
    // Validate incoming status if provided
    let statusChanged = false;
    const oldStatus = appointment.status;

    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json(
          {
            success: false,
            message: `Invalid status. Status must be one of: ${VALID_STATUSES.join(", ")}`,
          },
          { status: 400 }
        );
      }
      if (appointment.status !== status) {
        appointment.status = status;
        statusChanged = true;
      }
    }
 
    if (appointmentDate !== undefined) {
      appointment.appointmentDate = new Date(appointmentDate);
    }
    if (appointmentTime !== undefined) {
      appointment.appointmentTime = appointmentTime;
    }
    if (notes !== undefined) {
      appointment.notes = notes;
    }
    if (service !== undefined) {
      appointment.service = service;
    }
 
    await appointment.save();
    
    // Populate patient info for the response and audit log
    const populated = await Appointment.findById(appointment._id).populate("patientId");

    const patientName = (populated?.patientId as any)?.fullName || "Patient";

    if (statusChanged) {
      await logActivity(
        "Change Status",
        `Changed appointment status for ${patientName} from '${oldStatus}' to '${status}'`,
        String(appointment._id),
        "Appointment"
      );
    } else {
      await logActivity(
        "Edit Appointment",
        `Updated details of appointment for ${patientName} (${populated?.service})`,
        String(appointment._id),
        "Appointment"
      );
    }
 
    return NextResponse.json({
      success: true,
      message: "Appointment updated successfully",
      updatedAppointment: populated,
    });
  } catch (error) {
    console.error("PATCH appointment error:", error);
 
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update appointment",
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

    const appointment = await Appointment.findOneAndUpdate(
      { _id: id, ...clinicFilter },
      { deletedAt: new Date(), deletedBy: currentUser.userId },
      { new: true }
    ).populate("patientId");

    if (!appointment) {
      return NextResponse.json(
        { success: false, message: "Appointment not found" },
        { status: 404 }
      );
    }

    const patientName = (appointment.patientId as any)?.fullName || "Patient";

    await logActivity(
      "Delete Appointment",
      `Deleted appointment for ${patientName} (${appointment.service})`,
      String(appointment._id),
      "Appointment"
    );

    return NextResponse.json({
      success: true,
      message: "Appointment deleted successfully",
    });
  } catch (error) {
    console.error("DELETE appointment error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete appointment" },
      { status: 500 }
    );
  }
}
