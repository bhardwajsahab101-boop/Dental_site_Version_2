import { NextResponse } from "next/server";
import { connectDB } from "../../../lib/mongodb";
import { ContactMessage } from "../../../models/ContactMessage";
import { Clinic } from "../../../models/Clinic";
import { notifyContactFormSubmitted } from "../../../lib/notifications";
 
// Simple HTML escaping to sanitize string inputs
function sanitizeString(str: string): string {
  if (typeof str !== "string") return "";
  return str
    .trim()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
 
// Simple email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
 
export async function POST(req: Request) {
  try {
    await connectDB();
 
    // Resolve clinicId from database
    const clinic = await Clinic.findOne();
    const clinicId = clinic?._id || undefined;
 
    const body = await req.json();
    const { fullName, email, message } = body;
 
    // Validation checks
    if (!fullName || typeof fullName !== "string" || fullName.trim().length < 2) {
      return NextResponse.json(
        { success: false, message: "Full Name must be at least 2 characters long." },
        { status: 400 }
      );
    }
 
    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { success: false, message: "Please provide a valid email address." },
        { status: 400 }
      );
    }
 
    if (!message || typeof message !== "string" || message.trim().length < 10) {
      return NextResponse.json(
        { success: false, message: "Message must be at least 10 characters long." },
        { status: 400 }
      );
    }
 
    // Sanitization
    const cleanName = sanitizeString(fullName);
    const cleanEmail = sanitizeString(email).toLowerCase();
    const cleanMessage = sanitizeString(message);
 
    // Save to Database with clinicId
    const newMessage = await ContactMessage.create({
      clinicId,
      fullName: cleanName,
      email: cleanEmail,
      message: cleanMessage,
      status: "unread",
    });
 
    // Trigger Notification
    try {
      await notifyContactFormSubmitted({
        fullName: cleanName,
        email: cleanEmail,
        message: cleanMessage,
      });
    } catch (notifErr) {
      console.error("Failed to send notification for contact message:", notifErr);
    }
 
    return NextResponse.json(
      {
        success: true,
        message: "Message sent successfully! Thank you for reaching out.",
        messageId: newMessage._id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST contact form error:", error);
    return NextResponse.json(
      { success: false, message: "An error occurred while sending your message. Please try again." },
      { status: 500 }
    );
  }
}
