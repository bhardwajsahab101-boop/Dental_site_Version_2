import { NextResponse } from "next/server";
import { verifyJWT } from "../../../../../lib/auth";
import { resolveTenantInfo } from "../../../../../lib/subdomain";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication token is required.",
        },
        { status: 400 }
      );
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      console.error("JWT_SECRET is missing.");
      return NextResponse.json(
        {
          success: false,
          message: "Server configuration error.",
        },
        { status: 500 }
      );
    }

    // Verify the JWT before trusting it
    const payload = await verifyJWT(token, jwtSecret);

    if (!payload) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid or expired token.",
        },
        { status: 401 }
      );
    }

    // Determine cookie domain
    const host = req.headers.get("host") || "";
    const tenantInfo = resolveTenantInfo(host);

    const response = NextResponse.json({
      success: true,
      message: "Session created successfully.",
    });

    response.cookies.set("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      domain: tenantInfo.cookieDomain, // Share across *.dental.launchstack.in
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch (error) {
    console.error("Login callback error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error.",
      },
      { status: 500 }
    );
  }
}