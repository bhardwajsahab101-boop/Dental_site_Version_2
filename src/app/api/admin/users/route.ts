import { NextResponse } from "next/server";
import { connectDB } from "../../../../lib/mongodb";
import { User } from "../../../../models/User";
import { Clinic } from "../../../../models/Clinic";
import { getCurrentUser, hashPassword } from "../../../../lib/auth";
import { logActivity } from "../../../../lib/audit";

export const dynamic = "force-dynamic";

// GET /api/admin/users - List all clinics and their staff users
export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session || !["owner", "admin"].includes(session.role)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 401 }
      );
    }

    await connectDB();

    let clinicsData = [];

    if (session.role === "admin") {
      // Super Admin sees all clinics and their users
      const clinics = await Clinic.find({}).sort({ name: 1 }).lean();
      const users = await User.find({}).select("-password").sort({ createdAt: -1 }).lean();

      clinicsData = clinics.map((clinic: any) => {
        const clinicUsers = users
          .filter((u: any) => String(u.clinicId) === String(clinic._id))
          .map((u: any) => ({
            ...u,
            isActive: u.isActive !== false,
          }));

        return {
          ...clinic,
          users: clinicUsers,
        };
      });
    } else {
      // Owner sees only their own clinic and its users
      const clinic = await Clinic.findById(session.clinicId).lean();
      const users = await User.find({ clinicId: session.clinicId })
        .select("-password")
        .sort({ createdAt: -1 })
        .lean();

      clinicsData = clinic
        ? [
            {
              ...clinic,
              users: users.map((u: any) => ({
                ...u,
                isActive: u.isActive !== false,
              })),
            },
          ]
        : [];
    }

    return NextResponse.json({
      success: true,
      clinics: clinicsData,
    });
  } catch (error) {
    console.error("GET /api/admin/users error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

// POST /api/admin/users - Create a new Doctor or Receptionist user
export async function POST(req: Request) {
  try {
    const session = await getCurrentUser();
    if (!session || !["owner", "admin"].includes(session.role)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { name, email, password, role } = body;

    // Validate role
    if (!["doctor", "receptionist"].includes(role)) {
      return NextResponse.json(
        { success: false, message: "Invalid role. Only Doctor or Receptionist can be created." },
        { status: 400 }
      );
    }

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: "All fields are required" },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Hash the password
    const hashedPassword = await hashPassword(password);

    // Create user scoped to current clinic
    const newUser = await User.create({
      clinicId: session.clinicId,
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      role,
      isActive: true,
    });

    // Create Audit Log
    await logActivity(
      "Create User",
      `Created new ${role} account: ${newUser.name} (${newUser.email})`,
      String(newUser._id),
      "User"
    );

    return NextResponse.json(
      {
        success: true,
        message: "User created successfully",
        user: {
          id: String(newUser._id),
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/admin/users error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create user" },
      { status: 500 }
    );
  }
}
