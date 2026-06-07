import { NextResponse } from "next/server";
import { connectDB } from "../../../lib/mongodb";
import { ContactMessage } from "../../../models/ContactMessage";
import { getCurrentClinic } from "../../../lib/auth";
 
export const dynamic = "force-dynamic";
 
export async function GET(req: Request) {
  try {
    const clinicId = await getCurrentClinic();
    if (!clinicId) {
      return NextResponse.json({ success: false, message: "Unauthorized access" }, { status: 401 });
    }
 
    await connectDB();
 
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const query = searchParams.get("q");
 
    const clinicFilter = { clinicId };
 
    // Build DB filter query
    const filter: Record<string, any> = { ...clinicFilter };
 
    if (status && ["unread", "read", "replied"].includes(status)) {
      filter.status = status;
    }
 
    if (query) {
      filter.$and = [
        clinicFilter,
        {
          $or: [
            { fullName: { $regex: query, $options: "i" } },
            { email: { $regex: query, $options: "i" } },
            { message: { $regex: query, $options: "i" } },
          ]
        }
      ];
    }
 
    const messages = await ContactMessage.find(filter).sort({ createdAt: -1 });
 
    return NextResponse.json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error("GET messages error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}
 
export async function PATCH(req: Request) {
  try {
    const clinicId = await getCurrentClinic();
    if (!clinicId) {
      return NextResponse.json({ success: false, message: "Unauthorized access" }, { status: 401 });
    }
 
    await connectDB();
 
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
 
    if (!id) {
      return NextResponse.json({ success: false, message: "Message ID is required" }, { status: 400 });
    }
 
    const body = await req.json();
    const { status } = body;
 
    if (!status || !["unread", "read", "replied"].includes(status)) {
      return NextResponse.json(
        { success: false, message: "Invalid status. Must be unread, read, or replied." },
        { status: 400 }
      );
    }
 
    const clinicFilter = { clinicId };
 
    const updatedMessage = await ContactMessage.findOneAndUpdate(
      { _id: id, ...clinicFilter },
      { status },
      { new: true, runValidators: true }
    );
 
    if (!updatedMessage) {
      return NextResponse.json({ success: false, message: "Message not found" }, { status: 404 });
    }
 
    return NextResponse.json({
      success: true,
      message: "Message status updated successfully",
      updatedMessage,
    });
  } catch (error) {
    console.error("PATCH message error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update message" },
      { status: 500 }
    );
  }
}
 
export async function DELETE(req: Request) {
  try {
    const clinicId = await getCurrentClinic();
    if (!clinicId) {
      return NextResponse.json({ success: false, message: "Unauthorized access" }, { status: 401 });
    }
 
    await connectDB();
 
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
 
    if (!id) {
      return NextResponse.json({ success: false, message: "Message ID is required" }, { status: 400 });
    }
 
    const clinicFilter = { clinicId };
 
    const deletedMessage = await ContactMessage.findOneAndDelete({ _id: id, ...clinicFilter });
 
    if (!deletedMessage) {
      return NextResponse.json({ success: false, message: "Message not found" }, { status: 404 });
    }
 
    return NextResponse.json({
      success: true,
      message: "Message deleted successfully",
    });
  } catch (error) {
    console.error("DELETE message error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete message" },
      { status: 500 }
    );
  }
}
