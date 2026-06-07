import { NextResponse } from "next/server";
import { connectDB } from "../../../../lib/mongodb";
import { Clinic } from "../../../../models/Clinic";
import { getCurrentClinic } from "../../../../lib/auth";
 
export const dynamic = "force-dynamic";
 
export async function GET() {
  try {
    const clinicId = await getCurrentClinic();
    if (!clinicId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 401 }
      );
    }
 
    await connectDB();
 
    const settings = await Clinic.findById(clinicId);
    if (!settings) {
      return NextResponse.json(
        { success: false, message: "Clinic not found" },
        { status: 404 }
      );
    }
 
    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error("GET settings error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch settings" },
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
    const { slug, name, logo, phone, email, address, gstNumber } = body;
 
    if (!name || !phone || !email || !address) {
      return NextResponse.json(
        { success: false, message: "Missing required settings fields" },
        { status: 400 }
      );
    }
 
    const settings = await Clinic.findById(clinicId);
    if (!settings) {
      return NextResponse.json(
        { success: false, message: "Clinic not found" },
        { status: 404 }
      );
    }

    // Validate and update slug if changing
    if (slug && slug.trim().toLowerCase() !== settings.slug) {
      const cleanSlug = slug.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^\w\-]+/g, "");
      if (!cleanSlug) {
        return NextResponse.json(
          { success: false, message: "Invalid subdomain/slug format" },
          { status: 400 }
        );
      }
      const existing = await Clinic.findOne({ slug: cleanSlug, _id: { $ne: clinicId } });
      if (existing) {
        return NextResponse.json(
          { success: false, message: "This subdomain/slug is already taken by another clinic" },
          { status: 400 }
        );
      }
      settings.slug = cleanSlug;
    }
 
    settings.name = name;
    settings.logo = logo || "";
    settings.phone = phone;
    settings.email = email;
    settings.address = address;
    settings.gstNumber = gstNumber || "";
 
    await settings.save();
 
    return NextResponse.json({
      success: true,
      message: "Clinic settings updated successfully",
      settings,
    });
  } catch (error) {
    console.error("POST settings error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update settings" },
      { status: 500 }
    );
  }
}
