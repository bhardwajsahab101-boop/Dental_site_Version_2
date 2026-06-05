import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyJWT } from "./lib/auth";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminRoute = pathname.startsWith("/admin");
  const isLoginRoute = pathname === "/admin/login" || pathname === "/admin/login/";

  // Ensure the login page is never blocked by auth middleware
  if (isLoginRoute) {
    return NextResponse.next();
  }

  // If this is an admin route, enforce auth check
  if (isAdminRoute) {
    const token = request.cookies.get("admin_token")?.value;

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.warn("WARNING: JWT_SECRET environment variable is not defined");
    }
    const verified = token ? await verifyJWT(token, secret || "default_secret") : null;

    if (isLoginRoute) {
      // If user is already logged in, redirect them directly to admin dashboard
      if (verified) {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
      return NextResponse.next();
    }

    // For all other admin routes, redirect to login if not authenticated
    if (!verified) {
      const response = NextResponse.redirect(new URL("/admin/login", request.url));
      // Clean up the invalid cookie if present
      response.cookies.delete("admin_token");
      return response;
    }
  }

  return NextResponse.next();
}

// Config to specify the paths the middleware will run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (public api endpoints, though login/logout are handled manually)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/admin/:path*",
  ],
};
