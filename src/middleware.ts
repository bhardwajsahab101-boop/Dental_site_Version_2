import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyJWT } from "./lib/auth";
import { hasPageAccess, hasApiAccess } from "./lib/permissions";
 
// Parser helper for subdomain / clinic slug
function getSubdomainSlug(host: string): string {
  const hostname = host.split(":")[0].toLowerCase();
  
  if (hostname === "localhost" || hostname === "lvh.me" || hostname === "127.0.0.1") {
    return "default";
  }
 
  // Handle local wildcard subdomains like aksharma.lvh.me
  if (hostname.endsWith(".lvh.me")) {
    const parts = hostname.split(".");
    if (parts.length > 2 && parts[0] !== "www") {
      return parts[0];
    }
  }
 
  // Handle production wildcard subdomains (assuming root domain launchstack.in)
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "launchstack.in";
  if (hostname.endsWith("." + rootDomain)) {
    const sub = hostname.replace("." + rootDomain, "");
    if (sub !== "www") {
      return sub;
    }
  }
 
  // Fallback: if hostname has 3 parts and doesn't match above rules
  const parts = hostname.split(".");
  if (parts.length > 2 && parts[0] !== "www") {
    return parts[0];
  }
 
  return "default";
}
 
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host") || "";
  const currentSlug = getSubdomainSlug(host);
 
  console.log(`[Middleware Request] Host: ${host} | Extracted Slug: ${currentSlug} | Pathname: ${pathname}`);
 
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
 
  // Store clinic slug context in the request headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-clinic-slug", currentSlug);
 
  // Allow public access to login page
  if (pathname === "/admin/login" || pathname === "/admin/login/") {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }
 
  // 2. Protect Admin UI Routes (/admin/*)
  if (pathname.startsWith("/admin")) {
    const token = request.cookies.get("admin_token")?.value;
    if (!token) {
      // Redirect to login page on the current subdomain
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
 
    const secret = process.env.JWT_SECRET || "default_secret";
    const verified = await verifyJWT(token, secret);
    if (!verified || !verified.role) {
      // Clear invalid cookie and redirect to login
      const response = NextResponse.redirect(new URL("/admin/login", request.url));
      
      const host = request.headers.get("host") || "";
      const hostname = host.split(":")[0].toLowerCase();
      let cookieDomain = undefined;
 
      if (hostname.endsWith(".lvh.me")) {
        cookieDomain = ".lvh.me";
      } else if (hostname !== "localhost" && hostname !== "127.0.0.1") {
        const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "launchstack.in";
        if (hostname.endsWith("." + rootDomain)) {
          cookieDomain = `.${rootDomain}`;
        }
      }
 
      response.cookies.set("admin_token", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        domain: cookieDomain,
        maxAge: 0,
      });
 
      return response;
    }
 
    // Enforce subdomain tenant separation
    if (verified.role !== "admin") {
      const userSlug = verified.clinicSlug || "default";
      
      // Strict matching: clinic user must be on their specific subdomain
      if (currentSlug === "default" || currentSlug !== userSlug) {
        console.warn(`Blocked cross-tenant access to page: user clinic '${userSlug}' tried to access subdomain '${currentSlug}'`);
        // Redirect them to their own correct subdomain admin page
        const protocol = request.nextUrl.protocol;
        const rootDomain = host.includes("localhost") ? "lvh.me:3000" : host.split(".").slice(-2).join(".");
        const targetUrl = `${protocol}//${userSlug}.${rootDomain}/admin`;
        return NextResponse.redirect(new URL(targetUrl));
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
    if (verified.role !== "admin") {
      const userSlug = verified.clinicSlug || "default";
      if (currentSlug === "default" || currentSlug !== userSlug) {
        console.warn(`Blocked cross-tenant access to API: user clinic '${userSlug}' tried to access subdomain '${currentSlug}'`);
        return NextResponse.json(
          { success: false, message: "Forbidden: cross-tenant access is blocked" },
          { status: 403 }
        );
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
 
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}
 
// Config to specify Matching paths for proxy execution
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.svg).*)",
  ],
};
