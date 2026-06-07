import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyJWT } from "./lib/auth";
import { hasPageAccess, hasApiAccess } from "./lib/permissions";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Exclude public static/assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".jpg")
  ) {
    return NextResponse.next();
  }

  // Allow public access to login page
  if (pathname === "/admin/login" || pathname === "/admin/login/") {
    // If already logged in, redirect to dashboard or register depending on role
    const token = request.cookies.get("admin_token")?.value;
    if (token) {
      const secret = process.env.JWT_SECRET || "default_secret";
      const verified = await verifyJWT(token, secret);
      if (verified && verified.role) {
        if (verified.role === "admin") {
          return NextResponse.redirect(new URL("/admin/register", request.url));
        }
        return NextResponse.redirect(new URL("/admin", request.url));
      }
    }
    return NextResponse.next();
  }

  // 2. Protect Admin UI Routes (/admin/*)
  if (pathname.startsWith("/admin")) {
    const token = request.cookies.get("admin_token")?.value;
    if (!token) {
      // Redirect to login page
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    const secret = process.env.JWT_SECRET || "default_secret";
    const verified = await verifyJWT(token, secret);
    if (!verified || !verified.role) {
      // Clear invalid cookie and redirect to login
      const response = NextResponse.redirect(new URL("/admin/login", request.url));
      response.cookies.delete("admin_token");
      return response;
    }

    // Enforce subdomain tenant separation
    if (verified.role !== "admin" && verified.clinicSlug) {
      const host = request.headers.get("host") || "";
      const parts = host.split(".");
      let hostSlug = "default";
      if (parts.length > 2 || (host.includes("localhost") && parts.length > 1)) {
        if (parts[0] !== "www") {
          hostSlug = parts[0].split(":")[0].toLowerCase();
        }
      }
      
      let isMatch = verified.clinicSlug === hostSlug;
      if (hostSlug === "default") {
        isMatch = true;
      }

      if (!isMatch) {
        console.warn(`Blocked cross-tenant access to page: user clinic '${verified.clinicSlug}' tried to access '${hostSlug}'`);
        const response = NextResponse.redirect(new URL("/admin/login", request.url));
        response.cookies.delete("admin_token");
        return response;
      }
    }

    // Check RBAC permission for page access
    if (!hasPageAccess(verified.role, pathname)) {
      // Redirect based on role
      if (verified.role === "admin") {
        return NextResponse.redirect(new URL("/admin/register", request.url));
      } else {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
    }

    return NextResponse.next();
  }

  // 3. Protect API Routes
  const isProtectedApi =
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

    // Enforce subdomain tenant separation on APIs
    if (verified.role !== "admin" && verified.clinicSlug) {
      const host = request.headers.get("host") || "";
      const parts = host.split(".");
      let hostSlug = "default";
      if (parts.length > 2 || (host.includes("localhost") && parts.length > 1)) {
        if (parts[0] !== "www") {
          hostSlug = parts[0].split(":")[0].toLowerCase();
        }
      }

      let isMatch = verified.clinicSlug === hostSlug;
      if (hostSlug === "default") {
        isMatch = true;
      }

      if (!isMatch) {
        console.warn(`Blocked cross-tenant access to API: user clinic '${verified.clinicSlug}' tried to access '${hostSlug}'`);
        const response = NextResponse.json(
          { success: false, message: "Forbidden: cross-tenant access is blocked" },
          { status: 403 }
        );
        response.cookies.delete("admin_token");
        return response;
      }
    }

    // Check RBAC permission for API access
    if (!hasApiAccess(verified.role, pathname, request.method)) {
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
    "/admin/:path*",
    "/api/admin/:path*",
    "/api/patients/:path*",
    "/api/treatment/:path*",
    "/api/treatments/:path*",
    "/api/messages/:path*",
    "/api/appointments/:path*",
  ],
};
