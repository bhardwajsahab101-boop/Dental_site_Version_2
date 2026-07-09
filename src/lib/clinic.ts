import { headers } from "next/headers";
import { connectDB } from "./mongodb";
import { Clinic } from "../models/Clinic";
import { resolveTenantInfo } from "./subdomain";

// 1. Get current clinic slug (subdomain)
export async function getCurrentClinicSlug(): Promise<string> {
  const headersList = await headers();
  const midSlug = headersList.get("x-clinic-slug");
  if (midSlug) {
    return midSlug.toLowerCase();
  }

  // Fallback: parse host header directly
  const host = headersList.get("host") || "";
  return resolveTenantInfo(host).tenantSlug;
}

// 2. Get current clinic ID
export async function getCurrentClinicId(): Promise<string | null> {
  const headersList = await headers();
  const host = headersList.get("host") || "";
  const tenantInfo = resolveTenantInfo(host);
  const isRoot = tenantInfo.isRoot;
  const slug = isRoot ? "default" : tenantInfo.tenantSlug;

  await connectDB();

  // If slug is "default" (root domain access)
  if (isRoot) {
    // Check if we are authenticated and can get clinicId from session cookie directly
    let matchedId = null;
    let matchSource = "None";
    try {
      const { cookies } = await import("next/headers");
      const cookieStore = await cookies();
      const token = cookieStore.get("admin_token")?.value;
      if (token) {
        const secret = process.env.JWT_SECRET || "default_secret";
        const { verifyJWT } = await import("./auth");
        const verified = await verifyJWT(token, secret);
        if (verified?.clinicId) {
          matchedId = String(verified.clinicId);
          matchSource = `Auth Token (Clinic ID: ${verified.clinicId})`;
        }
      }
    } catch (err) {
      console.error("[Clinic ID Helper] Token read error:", err);
    }

    if (matchedId) {
      console.log(`Host: ${host}`);
      console.log(`Detected Slug: ${slug}`);
      console.log(`Is Root Domain: ${isRoot}`);
      console.log(`Clinic Match: ${matchSource}`);
      return matchedId;
    }

    // Otherwise return the default/first clinic in DB without slug lookup!
    const anyClinic = await Clinic.findOne().lean();
    const resultName = anyClinic ? `${anyClinic.name} (${anyClinic._id})` : "None";
    console.log(`Host: ${host}`);
    console.log(`Detected Slug: ${slug}`);
    console.log(`Is Root Domain: ${isRoot}`);
    console.log(`Clinic Match: ${resultName} (via DB Fallback)`);
    return anyClinic ? String(anyClinic._id) : null;
  }

  // If a specific subdomain slug is provided, we MUST find that specific clinic
  // NEVER fallback to first clinic! If not found, return null.
  const clinic = await Clinic.findOne({ slug }).lean();
  const resultName = clinic ? `${clinic.name} (${clinic._id})` : "None";
  console.log(`Host: ${host}`);
  console.log(`Detected Slug: ${slug}`);
  console.log(`Is Root Domain: ${isRoot}`);
  console.log(`Clinic Match: ${resultName}`);
  return clinic ? String(clinic._id) : null;
}

// 3. Get current clinic full details object
export async function getCurrentClinic() {
  const headersList = await headers();
  const host = headersList.get("host") || "";
  const tenantInfo = resolveTenantInfo(host);
  const isRoot = tenantInfo.isRoot;
  const slug = isRoot ? "default" : tenantInfo.tenantSlug;

  await connectDB();

  let clinic;
  if (isRoot) {
    // Fallback logic for default/root domain: NEVER query by slug!
    clinic = await Clinic.findOne();
  } else {
    // Specific subdomain: find exact match, NEVER fallback
    clinic = await Clinic.findOne({ slug });
  }

  const clinicMatch = clinic ? clinic.name : "None";
  console.log(`Host: ${host}`);
  console.log(`Detected Slug: ${slug}`);
  console.log(`Is Root Domain: ${isRoot}`);
  console.log(`Clinic Match: ${clinicMatch}`);

  if (!clinic) {
    // If specific subdomain was requested but clinic was not found, return null (leading to 404)
    if (!isRoot) {
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
