import { NextResponse } from "next/server";
import { connectDB } from "../../../../lib/mongodb";
import { Clinic } from "../../../../models/Clinic";
import { User } from "../../../../models/User";
import { getCurrentUser } from "../../../../lib/auth";
import { getSubscriptionInfo } from "../../../../lib/subscription";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 401 }
      );
    }

    await connectDB();

    const clinics = await Clinic.find({}).sort({ createdAt: -1 }).lean();
    const users = await User.find({ role: "owner" }).select("name email clinicId").lean();

    let totalActive = 0;
    let expiringSoon = 0;
    let expired = 0;
    let mrr = 0;

    const data = clinics.map((clinic: any) => {
      const subInfo = getSubscriptionInfo(clinic);
      const owner = users.find((u: any) => String(u.clinicId) === String(clinic._id));

      const daysLeft = subInfo.daysLeft;
      const status = subInfo.status;

      // Stats aggregation
      if (status === "active") {
        totalActive++;
        if (daysLeft > 0 && daysLeft <= 7) {
          expiringSoon++;
        }
      } else if (status === "expired") {
        expired++;
      }

      // Calculate MRR contribution for active/trial
      let planPrice = 0;
      const planName = subInfo.plan.toLowerCase();
      if (planName.includes("pro")) {
        planPrice = 99;
      } else if (planName.includes("enter")) {
        planPrice = 299;
      }

      if (status === "active") {
        mrr += planPrice;
      }

      return {
        _id: clinic._id,
        name: clinic.name,
        slug: clinic.slug,
        email: clinic.email,
        phone: clinic.phone,
        productType: clinic.productType || "DentalOS",
        subscriptionPlan: subInfo.plan,
        subscriptionStatus: status,
        subscriptionStartDate: subInfo.subscriptionStartDate,
        subscriptionEndDate: subInfo.subscriptionEndDate,
        daysLeft,
        isActive: subInfo.isActive,
        ownerName: owner ? owner.name : "N/A",
        ownerEmail: owner ? owner.email : "N/A",
      };
    });

    return NextResponse.json({
      success: true,
      subscriptions: data,
      stats: {
        totalActive,
        expiringSoon,
        expired,
        mrr,
      },
    });
  } catch (error) {
    console.error("GET subscriptions error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch subscriptions" },
      { status: 500 }
    );
  }
}
