import { NextResponse } from "next/server";
import { connectDB } from "../../../lib/mongodb";
import { Treatment, computePaymentFields } from "../../../models/treatment";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get("patientId");

    const query: any = {};
    if (patientId) {
      query.patientId = patientId;
    }

    const treatments = await Treatment.find(query)
      .populate("patientId")
      .populate("appointmentId")
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      treatments,
    });
  } catch (error) {
    console.error("GET treatment error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch treatments" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();
    const {
      patientId,
      appointmentId,
      treatmentName,
      diagnosis,
      toothNumber,
      cost,
      paidAmount,
      notes,
      status,
    } = body;

    if (!patientId || !treatmentName || !diagnosis || !toothNumber) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Run financial fields calculation
    const financialFields = computePaymentFields(Number(cost || 0), paidAmount);

    const treatment = await Treatment.create({
      patientId,
      appointmentId: appointmentId || null,
      treatmentName,
      diagnosis,
      toothNumber,
      notes: notes || "",
      status: status || "planned",
      ...financialFields,
    });

    return NextResponse.json(
      {
        success: true,
        treatment,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST treatment error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create treatment" },
      { status: 500 }
    );
  }
}
