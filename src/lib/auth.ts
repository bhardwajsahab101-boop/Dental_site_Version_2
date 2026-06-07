const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

/**
 * Encodes a Uint8Array to base64url string.
 */
function uint8ArrayToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

/**
 * Decodes a base64url string to ArrayBuffer.
 */
function base64UrlToArrayBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer as ArrayBuffer;
}

/**
 * Signs a payload with HMAC-SHA256 and returns a JWT token string.
 */
export async function signJWT(
  payload: Record<string, unknown>,
  secret: string,
  expireInSeconds: number = 86400
): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const exp = Math.floor(Date.now() / 1000) + expireInSeconds;
  const fullPayload = { ...payload, exp };

  const headerBase64 = uint8ArrayToBase64Url(
    textEncoder.encode(JSON.stringify(header))
  );
  const payloadBase64 = uint8ArrayToBase64Url(
    textEncoder.encode(JSON.stringify(fullPayload))
  );

  const tokenInput = `${headerBase64}.${payloadBase64}`;

  const key = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(secret),
    { name: "HMAC", hash: { name: "SHA-256" } },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    textEncoder.encode(tokenInput)
  );

  const signatureBase64 = uint8ArrayToBase64Url(new Uint8Array(signatureBuffer));
  return `${tokenInput}.${signatureBase64}`;
}

interface JWTPayload extends Record<string, unknown> {
  exp?: number;
  email?: string;
  userId?: string;
  clinicId?: string;
  role?: string;
  clinicSlug?: string;
}

/**
 * Verifies a JWT token using HMAC-SHA256 and returns the decoded payload, or null if invalid/expired.
 */
export async function verifyJWT(
  token: string,
  secret: string
): Promise<JWTPayload | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [headerBase64, payloadBase64, signatureBase64] = parts;
    const tokenInput = `${headerBase64}.${payloadBase64}`;

    const key = await crypto.subtle.importKey(
      "raw",
      textEncoder.encode(secret),
      { name: "HMAC", hash: { name: "SHA-256" } },
      false,
      ["verify"]
    );

    const signatureBuffer = base64UrlToArrayBuffer(signatureBase64);
    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBuffer,
      textEncoder.encode(tokenInput)
    );

    if (!isValid) return null;

    const payloadStr = textDecoder.decode(
      new Uint8Array(base64UrlToArrayBuffer(payloadBase64))
    );
    const payload = JSON.parse(payloadStr) as JWTPayload;

    // Check expiration
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      return null;
    }

    return payload;
  } catch (error) {
    console.error("JWT verification error:", error);
    return null;
  }
}

import { cookies, headers } from "next/headers";

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

export interface UserSession {
  userId: string;
  email: string;
  name: string;
  clinicId?: string;
  role: "admin" | "owner" | "doctor" | "receptionist";
}

export async function getCurrentUser(): Promise<UserSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token")?.value;
    if (!token) {
      console.log("getCurrentUser: No admin_token cookie found.");
      return null;
    }
    const secret = process.env.JWT_SECRET || "default_secret";
    const verified = await verifyJWT(token, secret);
    if (!verified || !verified.userId) {
      console.log("getCurrentUser: JWT verification failed or missing userId.");
      return null;
    }
 
    const { getCurrentClinicId, getCurrentClinicSlug } = await import("./clinic");
    const activeClinicId = await getCurrentClinicId();
    const activeClinicSlug = await getCurrentClinicSlug();
 
    if (!activeClinicId) {
      console.log("getCurrentUser: No active clinic resolved.");
      return null;
    }
 
    console.log(`getCurrentUser: Verifying user ${verified.email} (Role: ${verified.role}) on clinic slug: '${activeClinicSlug}'`);
 
    if (verified.role !== "admin") {
      const tokenClinicId = verified.clinicId ? String(verified.clinicId) : "";
      console.log(`getCurrentUser: Comparing token clinicId '${tokenClinicId}' with active clinicId '${activeClinicId}'`);
      if (tokenClinicId !== activeClinicId) {
        console.warn(`getCurrentUser: Blocked cross-tenant access. Token clinicId '${tokenClinicId}' does not match active clinicId '${activeClinicId}'`);
        return null;
      }
    }
 
    const { connectDB } = await import("./mongodb");
    const { User } = await import("../models/User");
    await connectDB();
 
    const dbUser = await User.findById(verified.userId).select("name").lean();
    const name = dbUser ? dbUser.name : "Clinic Staff";
 
    console.log("getCurrentUser: Session successfully validated.");
    return {
      userId: verified.userId as string,
      email: verified.email as string,
      name,
      clinicId: activeClinicId,
      role: verified.role as any,
    };
  } catch (error) {
    console.error("getCurrentUser error:", error);
    return null;
  }
}
 
export async function getCurrentClinic(): Promise<string | null> {
  try {
    const { getCurrentClinicId } = await import("./clinic");
    return getCurrentClinicId();
  } catch (error) {
    console.error("getCurrentClinic error:", error);
    return null;
  }
}
