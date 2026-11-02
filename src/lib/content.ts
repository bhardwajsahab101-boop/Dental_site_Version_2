import { connectDB } from "./mongodb";
import { getCurrentClinicId } from "./clinic";
import { WebsiteContent } from "../models/WebsiteContent";

export async function getWebsiteContent() {
  await connectDB();
  const clinicId = await getCurrentClinicId();

  if (clinicId) {
    const content = await WebsiteContent.findOne({ clinicId }).lean();
    if (content) {
      return JSON.parse(JSON.stringify(content));
    }
  }

  // Fallback: return default document structure
  const dummy = new WebsiteContent();
  return JSON.parse(JSON.stringify(dummy));
}
