import { NextResponse } from "next/server";
import { connectDB } from "../../../../lib/mongodb";
import { Treatment, computePaymentFields } from "../../../../models/treatment";
import { getCurrentClinic, getCurrentUser } from "../../../../lib/auth";
 
export const dynamic = "force-dynamic";
 
export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
 
  try {
    const clinicId = await getCurrentClinic();
    if (!clinicId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 401 }
      );
    }
 
    await connectDB();
 
    const clinicFilter = { clinicId, deletedAt: null };
 
    const treatment = await Treatment.findOne({ _id: id, ...clinicFilter })
      .populate("patientId")
      .populate("appointmentId");
 
    if (!treatment) {
      return NextResponse.json(
        { success: false, message: "Treatment not found" },
        { status: 404 }
      );
    }
 
    return NextResponse.json({
      success: true,
      treatment,
    });
  } catch (error) {
    console.error("GET treatment detail error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch treatment" },
      { status: 500 }
    );
  }
}
 
export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
 
  try {
    const clinicId = await getCurrentClinic();
    if (!clinicId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 401 }
      );
    }
 
    await connectDB();
 
    const clinicFilter = { clinicId, deletedAt: null };
 
    // Fetch existing treatment and verify it belongs to this clinic
    const existing = await Treatment.findOne({ _id: id, ...clinicFilter });
    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Treatment not found" },
        { status: 404 }
      );
    }
 
    const body = await req.json();
 
    // Determine values to calculate
    const cost = body.cost !== undefined ? Number(body.cost) : existing.cost;
    const paidAmount = body.paidAmount !== undefined ? body.paidAmount : existing.paidAmount;
 
    // Run rules if financial fields are modified
    let updateFields = { ...body };
    if (body.cost !== undefined || body.paidAmount !== undefined) {
      const financialFields = computePaymentFields(cost, paidAmount);
      updateFields = {
        ...updateFields,
        ...financialFields,
      };
    }
 
    const treatment = await Treatment.findOneAndUpdate(
      { _id: id, ...clinicFilter },
      updateFields,
      { new: true, runValidators: true }
    );
 
    return NextResponse.json({
      success: true,
      treatment,
    });
  } catch (error) {
    console.error("PATCH treatment error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update treatment" },
      { status: 500 }
    );
  }
}
 
export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
 
  try {
    const clinicId = await getCurrentClinic();
    const currentUser = await getCurrentUser();
    if (!clinicId || !currentUser) {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 401 }
      );
    }
 
    await connectDB();
 
    const clinicFilter = { clinicId, deletedAt: null };
 
    const treatment = await Treatment.findOneAndUpdate(
      { _id: id, ...clinicFilter },
      { deletedAt: new Date(), deletedBy: currentUser.userId },
      { new: true }
    );
 
    if (!treatment) {
      return NextResponse.json(
        { success: false, message: "Treatment not found" },
        { status: 404 }
      );
    }
 
    return NextResponse.json({
      success: true,
      message: "Treatment deleted successfully",
    });
  } catch (error) {
    console.error("DELETE treatment error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete treatment" },
      { status: 500 }
    );
  }
}