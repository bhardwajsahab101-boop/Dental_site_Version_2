import { connectDB } from "./mongodb";
import { Clinic } from "../models/Clinic";

// 1. Get current clinic slug (for display purposes)
export async function getCurrentClinicSlug(): Promise<string> {
  const clinic = await getCurrentClinic();
  return clinic ? clinic.slug : "default";
}

// 2. Get current clinic ID purely from JWT session cookie, with fallback to first clinic in DB for public landing page
export async function getCurrentClinicId(): Promise<string | null> {
  await connectDB();

  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token")?.value;
    if (token) {
      const secret = process.env.JWT_SECRET || "default_secret";
      const { verifyJWT } = await import("./auth");
      const verified = await verifyJWT(token, secret);
      if (verified?.clinicId) {
        return String(verified.clinicId);
      }
    }
  } catch (err) {
    console.error("[Clinic ID Helper] Token read error:", err);
  }

  // Fallback to first clinic in database for public routes (e.g. landing/booking)
  const anyClinic = await Clinic.findOne().lean();
  return anyClinic ? String(anyClinic._id) : null;
}

// 3. Get current clinic details purely from getCurrentClinicId
export async function getCurrentClinic() {
  await connectDB();

  const clinicId = await getCurrentClinicId();
  if (!clinicId) {
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

  const clinic = await Clinic.findById(clinicId).lean();
  if (!clinic) {
    return null;
  }

  return {
    id: String(clinic._id),
    slug: clinic.slug || "",
    name: clinic.name || "",
    clinicName: clinic.name || "",
    email: clinic.email || "",
    phone: clinic.phone || "",
    address: clinic.address || "",
    logo: clinic.logo || "",
    gstNumber: clinic.gstNumber || "",
  };
}

// Re-export getClinic mapping to getCurrentClinic to maintain backwards compatibility
export async function getClinic() {
  return getCurrentClinic();
}
