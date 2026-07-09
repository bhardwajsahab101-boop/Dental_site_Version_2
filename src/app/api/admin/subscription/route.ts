import { NextResponse } from "next/server";
import { connectDB } from "../../../../lib/mongodb";
import { Clinic } from "../../../../models/Clinic";
import { getCurrentClinic } from "../../../../lib/auth";
import { getSubscriptionInfo, checkAndTriggerReminder } from "../../../../lib/subscription";

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

    const clinic = await Clinic.findById(clinicId);
    if (!clinic) {
      return NextResponse.json(
        { success: false, message: "Clinic not found" },
        { status: 404 }
      );
    }

    const subscription = getSubscriptionInfo(clinic);

    // Automatically trigger warning reminders based on daysLeft
    await checkAndTriggerReminder(
      clinic._id.toString(),
      clinic.name,
      clinic.email,
      subscription.daysLeft,
      clinic.lastSubscriptionWarningDaysLeft
    );

    return NextResponse.json({
      success: true,
      subscription,
    });
  } catch (error) {
    console.error("GET subscription error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch subscription details" },
      { status: 500 }
    );
  }
}
