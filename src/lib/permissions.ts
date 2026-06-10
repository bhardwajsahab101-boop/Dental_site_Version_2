/**
 * Helper to check if a user role is permitted to access a specific front-end route.
 */
export function hasPageAccess(role: string, pathname: string): boolean {
  const normPath = pathname.toLowerCase();

  // SaaS Super Admin can register clinics
  if (normPath.startsWith("/admin/register")) {
    return ["admin"].includes(role);
  }

  // Other roles cannot register clinics
  if (normPath.startsWith("/admin/register")) {
    return false;
  }

  // Clinic Settings: Owner or Admin
  if (normPath.startsWith("/admin/settings")) {
    return ["owner", "admin"].includes(role);
  }

  // Staff User Management: Owner or Admin
  if (normPath.startsWith("/admin/users")) {
    return ["owner", "admin"].includes(role);
  }

  // Finance Dashboard: Owner or Admin
  if (normPath.startsWith("/admin/finance")) {
    return ["owner", "admin"].includes(role);
  }

  // Analytics: Owner or Admin
  if (normPath.startsWith("/admin/analytics")) {
    return ["owner", "admin"].includes(role);
  }

  // Messages: Owner, Receptionist, or Admin
  if (normPath.startsWith("/admin/messages")) {
    return ["owner", "receptionist", "admin"].includes(role);
  }

  // Appointments queue: Owner, Receptionist, or Admin
  if (normPath.startsWith("/admin/appointments")) {
    return ["owner", "receptionist", "admin"].includes(role);
  }

  // Calendar: Owner, Doctor, or Admin
  if (normPath.startsWith("/admin/calendar")) {
    return ["owner", "doctor", "admin"].includes(role);
  }

  // Patients: Owner, Doctor, Receptionist, or Admin
  if (normPath.startsWith("/admin/patients")) {
    return ["owner", "doctor", "receptionist", "admin"].includes(role);
  }

  // Academy: Owner, Doctor, Receptionist, or Admin
  if (normPath.startsWith("/admin/academy")) {
    return ["owner", "doctor", "receptionist", "admin"].includes(role);
  }

  // Dashboard homepage: Owner, Doctor, Receptionist, or Admin
  if (pathname === "/admin" || pathname === "/admin/") {
    return ["owner", "doctor", "receptionist", "admin"].includes(role);
  }

  return true;
}

/**
 * Helper to check if a user role is permitted to hit a specific API endpoint.
 */
export function hasApiAccess(role: string, pathname: string, method: string): boolean {
  const normPath = pathname.toLowerCase();

  // SaaS Super Admin has access to all APIs including registration
  if (role === "admin") {
    return true;
  }

  // Other roles cannot register clinics
  if (normPath.startsWith("/api/admin/register")) {
    return false;
  }

  // Settings APIs: Owner only
  if (normPath.startsWith("/api/admin/settings")) {
    return ["owner"].includes(role);
  }

  // Services Management APIs: GET for owner, receptionist, doctor; POST/PATCH/DELETE for owner only
  if (normPath.startsWith("/api/admin/services")) {
    if (method === "GET") {
      return ["owner", "receptionist", "doctor"].includes(role);
    }
    return ["owner"].includes(role);
  }

  // Staff User Management APIs: Owner or Admin
  if (normPath.startsWith("/api/admin/users")) {
    return ["owner", "admin"].includes(role);
  }

  // Finance Dashboard and CSV Export APIs: Owner or Admin
  if (normPath.startsWith("/api/admin/finance") || normPath.startsWith("/api/admin/export")) {
    return ["owner", "admin"].includes(role);
  }

  // Analytics APIs: Owner only
  if (normPath.startsWith("/api/admin/analytics")) {
    return ["owner"].includes(role);
  }

  // Dashboard API: Accessible by all authenticated staff roles
  if (normPath.startsWith("/api/admin/dashboard")) {
    return ["owner", "doctor", "receptionist", "admin"].includes(role);
  }

  // Messages APIs: Owner or Receptionist
  if (normPath.startsWith("/api/messages") || normPath.startsWith("/api/contact")) {
    return ["owner", "receptionist"].includes(role);
  }

  // Appointments APIs: Owner, Receptionist, or Doctor (Doctors can only read/GET)
  if (normPath.startsWith("/api/appointments")) {
    if (method === "GET") {
      return ["owner", "receptionist", "doctor"].includes(role);
    }
    return ["owner", "receptionist"].includes(role);
  }

  // Treatment APIs: Owner or Doctor
  if (normPath.startsWith("/api/treatment") || normPath.startsWith("/api/treatments")) {
    return ["owner", "doctor"].includes(role);
  }

  // Patient APIs: Owner, Doctor, or Receptionist
  if (normPath.startsWith("/api/patients") || normPath.startsWith("/api/admin/search")) {
    return ["owner", "doctor", "receptionist"].includes(role);
  }

  return true;
}
