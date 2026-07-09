import { NextResponse } from "next/server";
import { connectDB } from "../../../../lib/mongodb";
import { Clinic } from "../../../../models/Clinic";
import { getCurrentClinic, getCurrentUser } from "../../../../lib/auth";
import { getSubscriptionInfo, checkAndTriggerReminder } from "../../../../lib/subscription";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 401 }
      );
    }

    if (session.role === "admin") {
      return NextResponse.json({
        success: true,
        subscription: {
          plan: "Super Admin",
          status: "active",
          subscriptionStartDate: new Date(),
          subscriptionEndDate: new Date(),
          daysLeft: 999999,
          isInfinite: true,
          isActive: true,
          productType: "Platform",
        },
      });
    }

    const clinicId = session.clinicId;
    if (!clinicId) {
      return NextResponse.json(
        { success: false, message: "Clinic not resolved" },
        { status: 400 }
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
