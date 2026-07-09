import { NextResponse } from "next/server";
import { signJWT, hashPassword } from "../../../../lib/auth";
import { connectDB } from "../../../../lib/mongodb";
import { User } from "../../../../models/User";
import { Clinic } from "../../../../models/Clinic";
import { resolveTenantInfo } from "../../../../lib/subdomain";
 
export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    const jwtSecret = process.env.JWT_SECRET;
 
    if (!jwtSecret) {
      console.error("Missing environment variable: JWT_SECRET");
      return NextResponse.json(
        {
          success: false,
          message: "Server configuration error. Contact administrator.",
        },
        { status: 500 }
      );
    }
 
    const cleanEmail = email ? String(email).trim().toLowerCase() : "";

    if (!cleanEmail || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Email and password are required",
        },
        { status: 400 }
      );
    }
 
    await connectDB();
 
    // Find user by email
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password",
        },
        { status: 401 }
      );
    }

    if (user.isActive === false) {
      return NextResponse.json(
        {
          success: false,
          message: "Your account is disabled. Please contact the administrator.",
        },
        { status: 403 }
      );
    }
 
    // Compare password hash
    const inputPasswordHash = await hashPassword(password);
    if (user.password !== inputPasswordHash) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password",
        },
        { status: 401 }
      );
    }
 
    // Resolve clinic slug for subdomain matching
    let clinicSlug = "default";
    let clinicStatus = "active";
    let clinicTrialEndsAt = null;
    if (user.clinicId) {
      const clinic = await Clinic.findById(user.clinicId);
      if (clinic) {
        clinicSlug = clinic.slug || "default";
        clinicStatus = clinic.status || "active";
        clinicTrialEndsAt = clinic.trialEndsAt;
      }
    }

    if (user.role !== "admin") {
      // Check clinic status/trial expiration
      if (clinicStatus === "suspended") {
        return NextResponse.json(
          {
            success: false,
            message: "Your clinic subscription has been suspended. Please contact support.",
          },
          { status: 403 }
        );
      }

      if (clinicStatus === "trial" && clinicTrialEndsAt && new Date(clinicTrialEndsAt).getTime() < Date.now()) {
        return NextResponse.json(
          {
            success: false,
            message: "Your clinic's trial period has expired. Please upgrade to continue.",
          },
          { status: 403 }
        );
      }
    }
 
    // Generate JWT token (expires in 24 hours) containing clinicId, userId, role, and clinicSlug
    const token = await signJWT(
      {
        email: user.email,
        userId: String(user._id),
        clinicId: user.clinicId ? String(user.clinicId) : undefined,
        clinicSlug,
        role: user.role,
      },
      jwtSecret,
      86400
    );
 
    const response = NextResponse.json({
      success: true,
      message: "Logged in successfully",
      token, // Include the token for cross-subdomain handoff
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
        clinicSlug,
      },
    });

    // Resolve cookie domain for subdomain sharing
    const hostHeader = req.headers.get("host") || "";
    const tenantInfo = resolveTenantInfo(hostHeader);
    const cookieDomain = tenantInfo.cookieDomain;
 
    // Set HTTP-only secure cookie on the resolved wildcard domain
    response.cookies.set("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      domain: cookieDomain,
      maxAge: 86400, // 1 day
    });
 
    return response;
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "An internal server error occurred",
      },
      { status: 500 }
    );
  }
}
