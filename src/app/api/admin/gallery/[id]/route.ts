import { NextResponse } from "next/server";
import { connectDB } from "../../../../../lib/mongodb";
import { getCurrentClinic } from "../../../../../lib/auth";
import { GalleryItem } from "../../../../../models/GalleryItem";
import { logActivity } from "../../../../../lib/audit";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const updated = await GalleryItem.findOneAndUpdate(
      { _id: id, clinicId },
      {
        $set: {
          ...(title !== undefined && { title: title.trim() }),
          ...(alt !== undefined && { alt: alt.trim() }),
          ...(imageUrl !== undefined && { imageUrl: imageUrl.trim() }),
          ...(category !== undefined && { category }),
          ...(isFeatured !== undefined && { isFeatured }),
          ...(displayOrder !== undefined && { displayOrder: Number(displayOrder) }),
        },
      },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Photo not found or unauthorized" },
        { status: 404 }
      );
    }

    await logActivity(
      "UPDATE",
      `Updated gallery item: ${updated.title}`,
      String(updated._id),
      undefined,
      String(clinicId)
    );

    return NextResponse.json({
      success: true,
      message: "Gallery item updated successfully",
      item: updated,
    });
  } catch (error) {
    console.error("PATCH gallery item error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update gallery photo" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const clinicId = await getCurrentClinic();
    if (!clinicId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 401 }
      );
    }

    await connectDB();

    const deleted = await GalleryItem.findOneAndDelete({ _id: id, clinicId });
    if (!deleted) {
      return NextResponse.json(
        { success: false, message: "Photo not found or unauthorized" },
        { status: 404 }
      );
    }

    await logActivity(
      "DELETE",
      `Deleted gallery photo: ${deleted.title}`,
      String(deleted._id),
      undefined,
      String(clinicId)
    );

    return NextResponse.json({
      success: true,
      message: "Photograph removed from gallery successfully",
    });
  } catch (error) {
    console.error("DELETE gallery item error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete photograph" },
      { status: 500 }
    );
  }
}
