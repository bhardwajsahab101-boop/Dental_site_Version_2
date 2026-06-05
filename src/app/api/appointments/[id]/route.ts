import { NextResponse } from "next/server";
import { connectDB } from "../../../../lib/mongodb";
import { Appointment } from "../../../../models/Appointment";

const VALID_STATUSES = ["pending", "confirmed", "completed", "cancelled"];

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
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

    const body = await req.json();
    const { status, appointmentDate, appointmentTime, notes, service } = body;

    const updateFields: any = {};

    // Validate incoming status if provided
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
      updateFields.status = status;
    }

    if (appointmentDate !== undefined) {
      updateFields.appointmentDate = new Date(appointmentDate);
    }
    if (appointmentTime !== undefined) {
      updateFields.appointmentTime = appointmentTime;
    }
    if (notes !== undefined) {
      updateFields.notes = notes;
    }
    if (service !== undefined) {
      updateFields.service = service;
    }

    const updatedAppointment = await Appointment.findByIdAndUpdate(
      id,
      updateFields,
      { new: true, runValidators: true }
    ).populate("patientId");

    if (!updatedAppointment) {
      return NextResponse.json(
        {
          success: false,
          message: "Appointment not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Appointment updated successfully",
      updatedAppointment,
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

