import { NextResponse } from "next/server";
import { connectDB } from "../../../../../lib/mongodb";
import { User } from "../../../../../models/User";
import { AuditLog } from "../../../../../models/AuditLog";
import { getCurrentUser, hashPassword } from "../../../../../lib/auth";
import { logActivity } from "../../../../../lib/audit";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentUser();
    if (!session || !["owner", "admin"].includes(session.role)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json(
        { success: false, message: "User ID is required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Limit modifications to current clinic context (unless admin)
    const query = session.role === "admin" ? { _id: id } : { _id: id, clinicId: session.clinicId };
    const userToEdit = await User.findOne(query);

    if (!userToEdit) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Owner cannot disable themselves
    if (String(userToEdit._id) === session.userId) {
      return NextResponse.json(
        { success: false, message: "You cannot disable your own account." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { isActive, password } = body;

    let details = "";
    let actionName = "";

    // Handle Active State Change
    if (isActive !== undefined) {
      const activeState = Boolean(isActive);
      userToEdit.isActive = activeState;
      actionName = activeState ? "Enable User" : "Disable User";
      details = `${activeState ? "Enabled" : "Disabled"} user account: ${userToEdit.name} (${userToEdit.email})`;
    }

    // Handle Password Reset
    if (password !== undefined) {
      if (String(password).trim().length < 6) {
        return NextResponse.json(
          { success: false, message: "Password must be at least 6 characters long" },
          { status: 400 }
        );
      }
      userToEdit.password = await hashPassword(password);
      actionName = "Reset Password";
      details = `Reset password for user account: ${userToEdit.name} (${userToEdit.email})`;
    }

    await userToEdit.save();

    // Log Activity
    await logActivity(actionName, details, String(userToEdit._id), "User");

    return NextResponse.json({
      success: true,
      message: "User updated successfully",
      user: {
        id: String(userToEdit._id),
        name: userToEdit.name,
        email: userToEdit.email,
        role: userToEdit.role,
        isActive: userToEdit.isActive,
      },
    });
  } catch (error: any) {
    console.error("PATCH /api/admin/users/[id] error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update user" },
      { status: 500 }
    );
  }
}

// GET /api/admin/users/[id] - Get user activity audit logs
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentUser();
    if (!session || !["owner", "admin"].includes(session.role)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json(
        { success: false, message: "User ID is required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Verify user belongs to same clinic
    const userQuery = session.role === "admin" ? { _id: id } : { _id: id, clinicId: session.clinicId };
    const userExists = await User.findOne(userQuery);
    if (!userExists) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Fetch logs (filtered by clinic context to preserve tenant isolation)
    const logsFilter: any = { userId: id };
    if (session.role !== "admin") {
      logsFilter.clinicId = session.clinicId;
    }

    const logs = await AuditLog.find(logsFilter).sort({ createdAt: -1 }).limit(100).lean();

    return NextResponse.json({
      success: true,
      logs,
    });
  } catch (error: any) {
    console.error("GET /api/admin/users/[id] error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch user logs" },
      { status: 500 }
    );
  }
}
