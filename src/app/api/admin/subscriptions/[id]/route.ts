import { NextResponse } from "next/server";
import { connectDB } from "../../../../../lib/mongodb";
import { Clinic } from "../../../../../models/Clinic";
import { User } from "../../../../../models/User";
import { Appointment } from "../../../../../models/Appointment";
import { Patient } from "../../../../../models/Patient";
import { ClinicService } from "../../../../../models/ClinicService";
import { getCurrentUser } from "../../../../../lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 401 }
      );
    }

    const { id } = await params;
    await connectDB();

    const clinic = await Clinic.findById(id);
    if (!clinic) {
      return NextResponse.json(
        { success: false, message: "Clinic not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const {
      subscriptionPlan,
      subscriptionStartDate,
      subscriptionEndDate,
      isActive,
      productType,
      subscriptionStatus,
    } = body;

    if (subscriptionPlan !== undefined) clinic.subscriptionPlan = subscriptionPlan;
    if (subscriptionStartDate !== undefined) clinic.subscriptionStartDate = new Date(subscriptionStartDate);
    if (subscriptionEndDate !== undefined) clinic.subscriptionEndDate = new Date(subscriptionEndDate);
    if (isActive !== undefined) clinic.isActive = isActive;
    if (productType !== undefined) clinic.productType = productType;
    if (subscriptionStatus !== undefined) clinic.subscriptionStatus = subscriptionStatus;

    await clinic.save();

    return NextResponse.json({
      success: true,
      message: "Subscription updated successfully",
      clinic,
    });
  } catch (error) {
    console.error("PATCH subscription error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update subscription" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 401 }
      );
    }

    const { id } = await params;
    await connectDB();

    const clinic = await Clinic.findById(id);
    if (!clinic) {
      return NextResponse.json(
        { success: false, message: "Clinic not found" },
        { status: 404 }
      );
    }

    // Delete all records referencing this clinic to prevent orphans
    await Clinic.deleteOne({ _id: id });
    await User.deleteMany({ clinicId: id });
    await Appointment.deleteMany({ clinicId: id });
    await Patient.deleteMany({ clinicId: id });
    await ClinicService.deleteMany({ clinicId: id });
    
    // Attempt deletion of treatments if treatment model is exported
    try {
      const { Treatment } = await import("../../../../../models/treatment");
      if (Treatment) {
        await Treatment.deleteMany({ clinicId: id });
      }
    } catch (_) {}

    return NextResponse.json({
      success: true,
      message: "Tenant and all associated data deleted successfully",
    });
  } catch (error) {
    console.error("DELETE subscription error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete subscription" },
      { status: 500 }
    );
  }
}
