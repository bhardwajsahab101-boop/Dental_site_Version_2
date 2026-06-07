import { headers } from "next/headers";
import { connectDB } from "./mongodb";
import { Clinic } from "../models/Clinic";

export async function getClinic() {
  await connectDB();
  const headersList = await headers();
  const host = headersList.get("host") || "";
  
  // Parse subdomain.
  // E.g., if host is "smilecare.localhost:3000" or "smilecare.yourapp.com"
  // If it is just localhost:3000 or yourapp.com, we can have a fallback/default clinic
  let slug = "default";
  const parts = host.split(".");
  
  if (parts.length > 2 || (host.includes("localhost") && parts.length > 1)) {
    // If first part is not "www", use it as the slug
    if (parts[0] !== "www") {
      // Split off port if it's localhost
      slug = parts[0].split(":")[0];
    }
  }

  // Look up clinic by slug
  let clinic = await Clinic.findOne({ slug: slug.toLowerCase() });
  
  if (!clinic) {
    // Fallback: try to find any clinic, or the first one, so that there's always a clinic loaded
    clinic = await Clinic.findOne();
  }
  
  if (!clinic) {
    // Safety fallback for empty/unseeded database to prevent server crash
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
