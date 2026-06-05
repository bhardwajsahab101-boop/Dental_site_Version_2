import { NextResponse } from "next/server";
import { connectDB } from "../../../../lib/mongodb";
import { ClinicSettings } from "../../../../models/ClinicSettings";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();

    let settings = await ClinicSettings.findOne();
    if (!settings) {
      settings = await ClinicSettings.create({
        name: "Bright Smile Clinic",
        logo: "",
        phone: "+91 99999 99999",
        email: "support@brightsmile.com",
        address: "123 Health Ave, Medical District",
        gstNumber: "27AAAAA1111A1Z1", // Default mock GSTIN
      });
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
    await connectDB();

    const body = await req.json();
    const { name, logo, phone, email, address, gstNumber } = body;

    if (!name || !phone || !email || !address) {
      return NextResponse.json(
        { success: false, message: "Missing required settings fields" },
        { status: 400 }
      );
    }

    let settings = await ClinicSettings.findOne();
    if (!settings) {
      settings = new ClinicSettings({});
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
