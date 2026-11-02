import { NextResponse } from "next/server";
import { connectDB } from "../../../../lib/mongodb";
import { getCurrentClinic } from "../../../../lib/auth";
import { WebsiteContent } from "../../../../models/WebsiteContent";
import { logActivity } from "../../../../lib/audit";

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

    let content = await WebsiteContent.findOne({ clinicId });
    if (!content) {
      content = await WebsiteContent.create({ clinicId });
    }

    return NextResponse.json({
      success: true,
      content,
    });
  } catch (error) {
    console.error("GET CMS content error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch website content" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
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
    const { hero, about, doctor, hours, faqs, seo } = body;

    let content = await WebsiteContent.findOne({ clinicId });
    if (!content) {
      content = new WebsiteContent({ clinicId });
    }

    if (hero) content.hero = { ...content.hero, ...hero };
    if (about) content.about = { ...content.about, ...about };
    if (doctor) content.doctor = { ...content.doctor, ...doctor };
    if (hours) content.hours = { ...content.hours, ...hours };
    if (faqs && Array.isArray(faqs)) content.faqs = faqs;
    if (seo) content.seo = { ...content.seo, ...seo };

    await content.save();

    await logActivity(
      "UPDATE",
      "Updated website content configuration",
      String(content._id),
      undefined,
      String(clinicId)
    );

    return NextResponse.json({
      success: true,
      message: "Website content updated successfully!",
      content,
    });
  } catch (error) {
    console.error("PUT CMS content error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to save website content" },
      { status: 500 }
    );
  }
}
