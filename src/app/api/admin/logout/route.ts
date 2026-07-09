import { NextResponse } from "next/server";
import { resolveTenantInfo } from "../../../../lib/subdomain";

export async function POST(req: Request) {
  try {
    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully",
    });

    // Resolve cookie domain for subdomain sharing
    const hostHeader = req.headers.get("host") || "";
    const tenantInfo = resolveTenantInfo(hostHeader);
    const cookieDomain = tenantInfo.cookieDomain;

    // Clear HTTP-only cookie by setting maxAge to 0 on the correct wildcard domain
    response.cookies.set("admin_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      domain: cookieDomain,
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error("Logout API error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "An internal server error occurred",
      },
      { status: 500 }
    );
  }
}
