import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyJWT } from "./lib/auth";
import { hasPageAccess, hasApiAccess } from "./lib/permissions";
 
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
 
  console.log(`[Middleware Request] Pathname: ${pathname}`);
 
  // 1. Exclude public static/assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".jpg") ||
    pathname.endsWith(".ico") ||
    pathname.endsWith(".svg")
  ) {
    return NextResponse.next();
  }
 
  // Allow public access to login page
  if (pathname === "/admin/login" || pathname === "/admin/login/") {
    return NextResponse.next();
  }
 
  // 2. Protect Admin UI Routes (/admin/*)
  if (pathname.startsWith("/admin")) {
    const token = request.cookies.get("admin_token")?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
 
    const secret = process.env.JWT_SECRET || "default_secret";
    const verified = await verifyJWT(token, secret);
    if (!verified || !verified.role) {
      // Clear invalid cookie and redirect to login
      const response = NextResponse.redirect(new URL("/admin/login", request.url));
      
      response.cookies.set("admin_token", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      });
 
      return response;
    }
 
    // Check RBAC permission for page access
    const pageAccessGranted = hasPageAccess(verified.role, pathname);
    console.log(`[Middleware Page RBAC Check] Path: ${pathname} | Role: ${verified.role} | Granted: ${pageAccessGranted}`);
    if (!pageAccessGranted) {
      if (verified.role === "admin") {
        return NextResponse.redirect(new URL("/admin/register", request.url));
      } else {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
    }
  }
 
  // 3. Protect API Routes
  const isProtectedApi =
    pathname.startsWith("/api/admin/services") ||
    pathname.startsWith("/api/admin/settings") ||
    pathname.startsWith("/api/admin/analytics") ||
    pathname.startsWith("/api/admin/dashboard") ||
    pathname.startsWith("/api/admin/search") ||
    pathname.startsWith("/api/admin/finance") ||
    pathname.startsWith("/api/admin/export") ||
    pathname.startsWith("/api/patients") ||
    pathname.startsWith("/api/treatment") ||
    pathname.startsWith("/api/treatments") ||
    pathname.startsWith("/api/messages") ||
    (pathname.startsWith("/api/appointments") && request.method !== "POST");
 
  if (isProtectedApi) {
    const token = request.cookies.get("admin_token")?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }
 
    const secret = process.env.JWT_SECRET || "default_secret";
    const verified = await verifyJWT(token, secret);
    if (!verified || !verified.role) {
      return NextResponse.json(
        { success: false, message: "Invalid session token" },
        { status: 401 }
      );
    }
 
    // Check RBAC permission for API access
    const apiAccessGranted = hasApiAccess(verified.role, pathname, request.method);
    console.log(`[Middleware API RBAC Check] Path: ${pathname} [${request.method}] | Role: ${verified.role} | Granted: ${apiAccessGranted}`);
    if (!apiAccessGranted) {
      return NextResponse.json(
        { success: false, message: "Forbidden: insufficient permissions for this operation" },
        { status: 403 }
      );
    }
  }
 
  return NextResponse.next();
}
 
// Config to specify Matching paths for proxy execution
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.svg).*)",
  ],
};
