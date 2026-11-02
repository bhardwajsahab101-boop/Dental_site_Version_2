import { NextResponse } from "next/server";
import { connectDB } from "../../../../lib/mongodb";
import { getCurrentClinic } from "../../../../lib/auth";
import { GalleryItem } from "../../../../models/GalleryItem";
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

    const items = await GalleryItem.find({ clinicId })
      .sort({ displayOrder: 1, createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      items,
    });
  } catch (error) {
    console.error("GET gallery items error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch gallery items" },
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
    const { title, alt, imageUrl, category, isFeatured, displayOrder } = body;

    if (!title || !imageUrl) {
      return NextResponse.json(
        { success: false, message: "Title and Image URL are required" },
        { status: 400 }
      );
    }

    const newItem = await GalleryItem.create({
      clinicId,
      title: title.trim(),
      alt: alt ? alt.trim() : title.trim(),
      imageUrl: imageUrl.trim(),
      category: category || "Clinic & Operatory",
      isFeatured: isFeatured !== undefined ? isFeatured : true,
      displayOrder: Number(displayOrder) || 0,
    });

    await logActivity(
      "CREATE",
      `Added gallery photograph: ${newItem.title}`,
      String(newItem._id),
      undefined,
      String(clinicId)
    );

    return NextResponse.json({
      success: true,
      message: "Photograph added to gallery successfully!",
      item: newItem,
    });
  } catch (error) {
    console.error("POST gallery item error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to add photograph" },
      { status: 500 }
    );
  }
}
