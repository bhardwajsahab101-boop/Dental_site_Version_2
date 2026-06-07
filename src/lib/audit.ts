import { AuditLog } from "../models/AuditLog";
import { getCurrentUser } from "./auth";

/**
 * Creates an audit log entry in the database.
 * Automatically resolves the logged-in user and active clinic context.
 */
export async function logActivity(
  action: string,
  details: string,
  targetId?: string,
  targetType?: "Patient" | "Appointment" | "Treatment" | "User",
  clinicIdOverride?: string
): Promise<void> {
  try {
    const session = await getCurrentUser();
    if (!session) {
      console.warn("logActivity: No active session found. Skipping audit log.");
      return;
    }

    const clinicId = clinicIdOverride || session.clinicId;

    await AuditLog.create({
      clinicId,
      userId: session.userId,
      userName: session.name || session.email,
      userRole: session.role,
      action,
      details,
      targetId,
      targetType,
    });
    
    console.log(`[Audit Logged] User: ${session.name} (${session.role}) | Action: ${action} | Details: ${details}`);
  } catch (error) {
    console.error("logActivity error:", error);
  }
}
