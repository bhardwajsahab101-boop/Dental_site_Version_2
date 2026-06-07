import { NextResponse } from "next/server";
import { connectDB } from "../../../../lib/mongodb";
import { getCurrentClinic } from "../../../../lib/clinic";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();
    const clinic = await getCurrentClinic();
    
    if (!clinic || clinic.id === "fallback-id") {
      return NextResponse.json(
        { success: false, message: "Clinic not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      clinic: {
        name: clinic.name,
        logo: clinic.logo,
        slug: clinic.slug,
      },
    });
  } catch (err) {
    console.error("Failed to fetch public clinic info:", err);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
