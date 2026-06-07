import { headers } from "next/headers";
import { connectDB } from "./mongodb";
import { Clinic } from "../models/Clinic";
 
// 1. Get current clinic slug (subdomain)
export async function getCurrentClinicSlug(): Promise<string> {
  const headersList = await headers();
  const midSlug = headersList.get("x-clinic-slug");
  if (midSlug) {
    return midSlug.toLowerCase();
  }
 
  // Fallback: parse host header directly
  const host = headersList.get("host") || "";
  const hostname = host.split(":")[0].toLowerCase();
  const parts = hostname.split(".");
  
  if (parts.length > 2 && parts[0] !== "www") {
    return parts[0];
  } else if (hostname.includes("localhost") && parts.length > 1) {
    if (parts[0] !== "www") {
      return parts[0];
    }
  }
  return "default";
}
 
// 2. Get current clinic ID
export async function getCurrentClinicId(): Promise<string | null> {
  const slug = await getCurrentClinicSlug();
  
  await connectDB();
  
  // If slug is "default" (root domain access)
  if (slug === "default") {
    // Check if we are authenticated and can get clinicId from session cookie directly
    try {
      const { cookies } = await import("next/headers");
      const cookieStore = await cookies();
      const token = cookieStore.get("admin_token")?.value;
      if (token) {
        const secret = process.env.JWT_SECRET || "default_secret";
        const { verifyJWT } = await import("./auth");
        const verified = await verifyJWT(token, secret);
        if (verified?.clinicId) {
          console.log(`[Clinic ID Helper] Default slug. Auth token matched clinic ID: ${verified.clinicId}`);
          return String(verified.clinicId);
        }
      }
    } catch (err) {
      console.error("[Clinic ID Helper] Token read error:", err);
    }
    
    // Otherwise return the default/first clinic in DB
    const defaultClinic = await Clinic.findOne({ slug: "default" }).lean();
    if (defaultClinic) {
      console.log(`[Clinic ID Helper] Default slug. Found default clinic: ${defaultClinic.name} (${defaultClinic._id})`);
      return String(defaultClinic._id);
    }
    const anyClinic = await Clinic.findOne().lean();
    console.log(`[Clinic ID Helper] Default slug. Found fallback clinic: ${anyClinic ? anyClinic.name : "None"} (${anyClinic ? anyClinic._id : "None"})`);
    return anyClinic ? String(anyClinic._id) : null;
  }
 
  // If a specific subdomain slug is provided, we MUST find that specific clinic
  // NEVER fallback to first clinic! If not found, return null.
  const clinic = await Clinic.findOne({ slug }).lean();
  console.log(`[Clinic ID Helper] Subdomain slug: '${slug}' | Lookup Match: ${clinic ? clinic.name : "None"} (${clinic ? clinic._id : "None"})`);
  return clinic ? String(clinic._id) : null;
}
 
// 3. Get current clinic full details object
export async function getCurrentClinic() {
  const slug = await getCurrentClinicSlug();
  
  await connectDB();
  
  let clinic;
  if (slug === "default") {
    // Fallback logic for default/root domain
    clinic = await Clinic.findOne({ slug: "default" });
    if (!clinic) {
      clinic = await Clinic.findOne();
    }
  } else {
    // Specific subdomain: find exact match, NEVER fallback
    clinic = await Clinic.findOne({ slug });
  }
  
  console.log(`[Clinic Helper] Subdomain slug: '${slug}' | Lookup Match: ${clinic ? clinic.name : "None"}`);

  if (!clinic) {
    // If specific subdomain was requested but clinic was not found, return null (leading to 404)
    if (slug !== "default") {
      return null;
    }
    
    // Fallback for default only
    return {
      id: "fallback-id",
      clinicName: "Dental Clinic",
      name: "Dental Clinic",
      email: "support@clinic.com",
      phone: "+91 99999 99999",
      address: "Clinic Address",
      logo: "",
      slug: "default",
    };
  }
 
  const clinicObj = clinic.toObject ? clinic.toObject() : clinic;
  return {
    id: String(clinicObj._id),
    slug: clinicObj.slug || "",
    name: clinicObj.name || "",
    clinicName: clinicObj.name || "",
    email: clinicObj.email || "",
    phone: clinicObj.phone || "",
    address: clinicObj.address || "",
    logo: clinicObj.logo || "",
    gstNumber: clinicObj.gstNumber || "",
  };
}
 
// Re-export getClinic mapping to getCurrentClinic to maintain backwards compatibility
export async function getClinic() {
  return getCurrentClinic();
}
