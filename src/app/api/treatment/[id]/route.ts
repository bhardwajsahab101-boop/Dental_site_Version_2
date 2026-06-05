import { NextResponse } from "next/server";
import { connectDB } from "../../../../lib/mongodb";
import { Treatment, computePaymentFields } from "../../../../models/treatment";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    await connectDB();

    const treatment = await Treatment.findById(id)
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
    await connectDB();

    const body = await req.json();

    // Fetch existing treatment to verify and compute payment fields if cost or paidAmount are changed
    const existing = await Treatment.findById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Treatment not found" },
        { status: 404 }
      );
    }

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

    const treatment = await Treatment.findByIdAndUpdate(
      id,
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
    await connectDB();

    const treatment = await Treatment.findByIdAndDelete(id);

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
