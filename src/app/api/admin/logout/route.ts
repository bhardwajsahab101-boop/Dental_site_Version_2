import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully",
    });

    // Resolve cookie domain for subdomain sharing
    const hostHeader = req.headers.get("host") || "";
    const hostname = hostHeader.split(":")[0].toLowerCase();
    let cookieDomain = undefined;

    if (hostname.endsWith(".lvh.me")) {
      cookieDomain = ".lvh.me";
    } else if (hostname !== "localhost" && hostname !== "127.0.0.1") {
      const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "launchstack.in";
      if (hostname.endsWith("." + rootDomain)) {
        cookieDomain = `.${rootDomain}`;
      }
    }

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
