import { NextResponse } from "next/server";
import { connectDB } from "../../../../lib/mongodb";
import { ClinicService } from "../../../../models/ClinicService";
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
    const all = searchParams.get("all") === "true";

    const query = {
      clinicId,
      ...(all ? {} : { active: true }),
    };

    const services = await ClinicService.find(query).sort({ name: 1 });

    return NextResponse.json({
      success: true,
      services,
    });
  } catch (error) {
    console.error("GET services error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch services" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const clinicId = await getCurrentClinic();
    if (!clinicId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await req.json();
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, message: "Service name is required" },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();

    // Check uniqueness within the clinic case-insensitively
    const escapedName = trimmedName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const existing = await ClinicService.findOne({
      clinicId,
      name: { $regex: new RegExp(`^${escapedName}$`, "i") },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: "Service name already exists for this clinic" },
        { status: 400 }
      );
    }

    const newService = await ClinicService.create({
      clinicId,
      name: trimmedName,
      active: true,
    });

    return NextResponse.json({
      success: true,
      service: newService,
    });
  } catch (error) {
    console.error("POST services error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create service" },
      { status: 500 }
    );
  }
}
