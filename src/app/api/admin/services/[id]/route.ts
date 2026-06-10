import { NextResponse } from "next/server";
import { connectDB } from "../../../../../lib/mongodb";
import { ClinicService } from "../../../../../models/ClinicService";
import { getCurrentClinic, getCurrentUser } from "../../../../../lib/auth";

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
        { success: false, message: "Service ID is required" },
        { status: 400 }
      );
    }

    const service = await ClinicService.findOne({ _id: id, clinicId });
    if (!service) {
      return NextResponse.json(
        { success: false, message: "Service not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { name, active } = body;

    if (name !== undefined) {
      const trimmedName = name.trim();
      if (!trimmedName) {
        return NextResponse.json(
          { success: false, message: "Service name cannot be empty" },
          { status: 400 }
        );
      }

      // Check uniqueness of new name, excluding the current service ID
      const escapedName = trimmedName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const existing = await ClinicService.findOne({
        clinicId,
        _id: { $ne: id },
        name: { $regex: new RegExp(`^${escapedName}$`, "i") },
      });

      if (existing) {
        return NextResponse.json(
          { success: false, message: "Service name already exists for this clinic" },
          { status: 400 }
        );
      }

      service.name = trimmedName;
    }

    if (active !== undefined) {
      service.active = !!active;
    }

    await service.save();

    return NextResponse.json({
      success: true,
      service,
    });
  } catch (error) {
    console.error("PATCH service error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update service" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const clinicId = await getCurrentClinic();
    const currentUser = await getCurrentUser();
    if (!clinicId || !currentUser) {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 401 }
      );
    }

    // Restrict deletion to clinic Owner and SaaS superadmin
    if (currentUser.role !== "owner" && currentUser.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Forbidden: only the clinic Owner can delete services" },
        { status: 403 }
      );
    }

    await connectDB();

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Service ID is required" },
        { status: 400 }
      );
    }

    // Hard delete
    const result = await ClinicService.deleteOne({ _id: id, clinicId });
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: "Service not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Service removed successfully",
    });
  } catch (error) {
    console.error("DELETE service error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete service" },
      { status: 500 }
    );
  }
}
