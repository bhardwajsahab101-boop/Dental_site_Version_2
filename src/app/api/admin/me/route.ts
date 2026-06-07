import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth";
import { connectDB } from "../../../../lib/mongodb";
import { User } from "../../../../models/User";

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

    await connectDB();
    const user = await User.findById(session.userId).select("-password").lean();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role,
        clinicId: user.clinicId ? String(user.clinicId) : undefined,
      },
    });
  } catch (error) {
    console.error("GET /api/admin/me error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
