import { NextResponse } from "next/server";
import { connectDB } from "../../../../lib/mongodb";
import { Clinic } from "../../../../models/Clinic";
import { User } from "../../../../models/User";
import { hashPassword, getCurrentUser } from "../../../../lib/auth";
 
// Simple email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
 
function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}
 
export async function POST(req: Request) {
  try {
    await connectDB();
 
    const body = await req.json();
    const {
      clinicName,
      clinicPhone,
      clinicAddress,
      clinicEmail,
      ownerName,
      ownerEmail,
      ownerPassword,
    } = body;
 
    // Validation
    if (
      !clinicName ||
      !clinicPhone ||
      !clinicAddress ||
      !clinicEmail ||
      !ownerName ||
      !ownerEmail ||
      !ownerPassword
    ) {
      return NextResponse.json(
        { success: false, message: "All registration fields are required" },
        { status: 400 }
      );
    }
 
    if (!EMAIL_REGEX.test(clinicEmail)) {
      return NextResponse.json(
        { success: false, message: "Please enter a valid Clinic email" },
        { status: 400 }
      );
    }
 
    if (!EMAIL_REGEX.test(ownerEmail)) {
      return NextResponse.json(
        { success: false, message: "Please enter a valid Owner email" },
        { status: 400 }
      );
    }
 
    if (ownerPassword.length < 6) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }
 
    // Check if user or clinic email already exists
    const existingUser = await User.findOne({ email: ownerEmail.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "A user with this owner email already exists" },
        { status: 409 }
      );
    }
 
    const existingClinic = await Clinic.findOne({ email: clinicEmail.toLowerCase() });
    if (existingClinic) {
      return NextResponse.json(
        { success: false, message: "A clinic with this email already exists" },
        { status: 409 }
      );
    }

    // Generate unique slug
    let slug = slugify(clinicName);
    if (!slug) {
      slug = "clinic";
    }
    let slugCount = 0;
    let uniqueSlug = slug;
    while (await Clinic.findOne({ slug: uniqueSlug })) {
      slugCount++;
      uniqueSlug = `${slug}-${slugCount}`;
    }
 
    // 1. Create Clinic
    const clinic = await Clinic.create({
      slug: uniqueSlug,
      name: clinicName.trim(),
      email: clinicEmail.trim().toLowerCase(),
      phone: clinicPhone.trim(),
      address: clinicAddress.trim(),
      logo: "",
      gstNumber: "",
    });
 
    // 2. Hash Password and Create Owner User
    const hashedPassword = await hashPassword(ownerPassword);
    const user = await User.create({
      clinicId: clinic._id,
      name: ownerName.trim(),
      email: ownerEmail.trim().toLowerCase(),
      password: hashedPassword,
      role: "owner",
    });
 
    return NextResponse.json(
      {
        success: true,
        message: "Clinic and Owner registered successfully! You can now log in.",
        clinicId: clinic._id,
        userId: user._id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST register error:", error);
    return NextResponse.json(
      { success: false, message: "Registration failed due to a server error" },
      { status: 500 }
    );
  }
}

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
    const users = await User.find({}).select("-password").lean();

    const data = clinics.map((clinic: any) => {
      const clinicUsers = users.filter((u: any) => String(u.clinicId) === String(clinic._id))
        .map((u: any) => ({
          _id: u._id,
          name: u.name,
          email: u.email,
          role: u.role,
          isActive: u.isActive !== false,
        }));

      return {
        ...clinic,
        users: clinicUsers,
      };
    });

    return NextResponse.json({
      success: true,
      clinics: data,
    });
  } catch (error) {
    console.error("GET register clinics error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch clinics list" },
      { status: 500 }
    );
  }
}
