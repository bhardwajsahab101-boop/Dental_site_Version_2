"use client";

import React, { useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";
import {
  Users,
  UserPlus,
  Key,
  UserCheck,
  UserX,
  Activity,
  Loader2,
  Lock,
  Mail,
  User,
  ShieldAlert,
  X,
  Clock,
  ChevronDown,
  ChevronUp,
  Search,
  Building
} from "lucide-react";

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  role: "doctor" | "receptionist" | "owner" | "admin";
  isActive: boolean;
  createdAt: string;
}

interface AuditLogEntry {
  _id: string;
  action: string;
  details: string;
  createdAt: string;
}

export default function UsersPage() {
  const [clinics, setClinics] = useState<any[]>([]);
  const [expandedClinicId, setExpandedClinicId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showActivityPane, setShowActivityPane] = useState(false);

  // Form States
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"doctor" | "receptionist">("doctor");
  const [submitting, setSubmitting] = useState(false);

  // Password Reset Target User
  const [targetUser, setTargetUser] = useState<UserProfile | null>(null);
  const [newPassword, setNewPassword] = useState("");

  // Activity Pane Target User
  const [activityUser, setActivityUser] = useState<UserProfile | null>(null);
  const [activityLogs, setActivityLogs] = useState<AuditLogEntry[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchCurrentUser();
    fetchUsers();
  }, []);

  async function fetchCurrentUser() {
    try {
      const res = await fetch("/api/admin/me");
      const data = await res.json();
      if (data.success) {
        setCurrentUser(data.user);
      }
    } catch (err) {
      console.error("Error fetching me details:", err);
    }
  }

  async function fetchUsers() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", { cache: "no-store" });
      const data = await res.json();
      if (data.success) {
        setClinics(data.clinics || []);
        // Expand the first clinic by default if not already expanded
        if (data.clinics && data.clinics.length > 0 && !expandedClinicId) {
          setExpandedClinicId(data.clinics[0]._id);
        }
      } else {
        throw new Error(data.message || "Failed to load clinics & users");
      }
    } catch (err: any) {
      toast.error(err.message || "Error fetching clinic staff list");
    } finally {
      setLoading(false);
    }
  }

  const filteredClinics = useMemo(() => {
    return clinics.map((c) => {
      const filteredUsers = (c.users || []).filter((u: any) => {
        const q = searchQuery.toLowerCase().trim();
        if (!q) return true;
        return (
          (u.name || "").toLowerCase().includes(q) ||
          (u.email || "").toLowerCase().includes(q) ||
          (u.role || "").toLowerCase().includes(q)
        );
      });
      return {
        ...c,
        users: filteredUsers,
      };
    }).filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        (c.name || "").toLowerCase().includes(q) ||
        (c.slug || "").toLowerCase().includes(q) ||
        c.users.length > 0
      );
    });
  }, [clinics, searchQuery]);

  const toggleExpandClinic = (clinicId: string) => {
    if (expandedClinicId === clinicId) {
      setExpandedClinicId(null);
    } else {
      setExpandedClinicId(clinicId);
    }
  };

  // Handle staff registration
  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim() || !role) {
      toast.error("Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Account created for ${name}`);
        setShowCreateModal(false);
        // Reset form
        setName("");
        setEmail("");
        setPassword("");
        setRole("doctor");
        fetchUsers();
      } else {
        throw new Error(data.message || "Failed to create account");
      }
    } catch (err: any) {
      toast.error(err.message || "Error creating user");
    } finally {
      setSubmitting(false);
    }
  }

  // Toggle user active status (Enable/Disable)
  async function handleToggleActive(user: UserProfile) {
    const actionLabel = user.isActive ? "disable" : "enable";
    if (String(user._id) === currentUser?.id) {
      toast.error("You cannot disable your own account!");
      return;
    }

    if (!window.confirm(`Are you sure you want to ${actionLabel} ${user.name}'s account?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${user._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`${user.name}'s account is now ${!user.isActive ? "Active" : "Disabled"}`);
        fetchUsers();
      } else {
        throw new Error(data.message || "Failed to change active status");
      }
    } catch (err: any) {
      toast.error(err.message || "Error toggling status");
    }
  }

  // Reset password
  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!targetUser) return;
    if (newPassword.trim().length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/users/${targetUser._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Password updated for ${targetUser.name}`);
        setShowResetModal(false);
        setNewPassword("");
        setTargetUser(null);
      } else {
        throw new Error(data.message || "Failed to reset password");
      }
    } catch (err: any) {
      toast.error(err.message || "Error resetting password");
    } finally {
      setSubmitting(false);
    }
  }

  // Fetch and show user activity logs
  async function openActivityPane(user: UserProfile) {
    setActivityUser(user);
    setShowActivityPane(true);
    setLoadingLogs(true);
    setActivityLogs([]);
    try {
      const res = await fetch(`/api/admin/users/${user._id}`);
      const data = await res.json();
      if (data.success) {
        setActivityLogs(data.logs || []);
      } else {
        throw new Error(data.message || "Failed to fetch logs");
      }
    } catch (err: any) {
      toast.error(err.message || "Error loading activity logs");
    } finally {
      setLoadingLogs(false);
    }
  }

  if (!mounted) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-48" />
        <div className="h-48 bg-slate-200 rounded w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
            <Users className="h-5.5 w-5.5 text-indigo-500" />
            <span>Staff Management</span>
          </h1>
          <p className="text-slate-500 text-xs font-semibold mt-1">
            Manage Doctor and Receptionist credentials, status states, and view system audit records.
          </p>
        </div>

        {/* Create Trigger */}
        {["owner", "admin"].includes(currentUser?.role) && (
          <button
            onClick={() => setShowCreateModal(true)}
            type="button"
            className="inline-flex items-center space-x-1.5 bg-indigo-700 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm shrink-0 cursor-pointer"
          >
            <UserPlus className="h-4.5 w-4.5" />
            <span>Add Staff Member</span>
          </button>
        )}
      </div>

      {/* Search Filter input */}
      <div className="relative w-full">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search staff members by name, email, role or clinic..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white border border-slate-200/80 focus:border-indigo-500 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-800 outline-none transition-all shadow-sm placeholder:text-slate-450"
        />
      </div>

      {/* Clinics Directory with Accordions */}
      <div className="space-y-4">
        {loading && clinics.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center text-slate-500 text-xs flex items-center justify-center gap-2 shadow-sm">
            <Loader2 className="animate-spin h-5 w-5 text-indigo-500" />
            <span>Fetching clinic staff registry...</span>
          </div>
        ) : filteredClinics.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center text-slate-405 text-xs shadow-sm">
            No clinics or staff members found matching your search.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredClinics.map((clinic: any) => {
              const isExpanded = expandedClinicId === clinic._id;
              return (
                <div
                  key={clinic._id}
                  className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden transition-all duration-200 hover:border-slate-300/85"
                >
                  {/* Clinic Accordion Header (Clickable to toggle dropdown) */}
                  <div
                    onClick={() => toggleExpandClinic(clinic._id)}
                    className="p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/40 select-none"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white text-base font-bold shrink-0">
                        🏢
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 truncate">
                          {clinic.name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-y-1 gap-x-2 text-[10px] text-slate-400 font-semibold mt-0.5">
                          <span className="font-mono bg-slate-100 border text-slate-500 px-1 py-0.25 rounded lowercase">
                            slug: {clinic.slug}
                          </span>
                          <span>•</span>
                          <span>{clinic.phone}</span>
                          <span>•</span>
                          <span className="truncate">{clinic.email}</span>
                        </div>
                      </div>
                    </div>

                    {/* Arrow indicator and staff count */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider leading-none">Staff</span>
                        <span className="text-xs font-extrabold text-slate-800">
                          {clinic.users?.length || 0} Accounts
                        </span>
                      </div>
                      <div className="w-7 h-7 rounded-lg bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors">
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
                      </div>
                    </div>
                  </div>

                  {/* Dropdown Content: Staff Table */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50/40 p-5 space-y-3 animate-in slide-in-from-top-2 duration-200">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Clinic Staff Directory</span>
                        <span className="text-[10px] text-slate-400 font-semibold font-mono">Clinic ID: {clinic._id}</span>
                      </div>

                      {(!clinic.users || clinic.users.length === 0) ? (
                        <p className="text-xs text-slate-400 italic py-2">No staff accounts registered for this clinic matching the filter.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                <th className="px-4 py-2.5">User Details</th>
                                <th className="px-4 py-2.5">Role</th>
                                <th className="px-4 py-2.5">Account Status</th>
                                <th className="px-4 py-2.5 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100/60">
                              {clinic.users.map((user: any) => {
                                const isSelf = String(user._id) === currentUser?.id;
                                return (
                                  <tr key={user._id} className="hover:bg-slate-100/30 transition-colors">
                                    {/* User Details */}
                                    <td className="px-4 py-2.5">
                                      <div className="flex items-center space-x-3">
                                        <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs uppercase shrink-0">
                                          {user.name.slice(0, 2)}
                                        </div>
                                        <div>
                                          <span className="font-bold text-slate-850 block">
                                            {user.name} 
                                            {isSelf && (
                                              <span className="text-[9px] bg-slate-100 border text-slate-500 px-1 py-0.25 rounded font-mono ml-1">You</span>
                                            )}
                                          </span>
                                          <span className="text-[10px] text-slate-400 block">{user.email}</span>
                                        </div>
                                      </div>
                                    </td>

                                    {/* Role */}
                                    <td className="px-4 py-2.5">
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9.5px] font-bold border capitalize ${
                                        user.role === "owner" || user.role === "admin"
                                          ? "bg-slate-905 text-white border-slate-850"
                                          : user.role === "doctor"
                                          ? "bg-indigo-50 text-indigo-700 border-indigo-100"
                                          : "bg-emerald-50 text-emerald-700 border-emerald-100"
                                      }`}>
                                        {user.role}
                                      </span>
                                    </td>

                                    {/* Status */}
                                    <td className="px-4 py-2.5">
                                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                                        user.isActive
                                          ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                          : "bg-rose-50 text-rose-700 border-rose-100"
                                      }`}>
                                        <span className={`h-1.5 w-1.5 rounded-full ${user.isActive ? "bg-emerald-500" : "bg-rose-500"}`} />
                                        <span>{user.isActive ? "Active" : "Disabled"}</span>
                                      </span>
                                    </td>

                                    {/* Actions */}
                                    <td className="px-4 py-2.5 text-right">
                                      <div className="flex justify-end gap-1.5">
                                        {/* Reset Password */}
                                        <button
                                          onClick={() => {
                                            setTargetUser(user);
                                            setShowResetModal(true);
                                          }}
                                          type="button"
                                          title="Reset Password"
                                          className="p-1.5 hover:bg-slate-100 border border-slate-205 text-slate-500 hover:text-slate-800 rounded-lg transition-colors cursor-pointer"
                                        >
                                          <Key className="h-4 w-4" />
                                        </button>

                                        {/* View Activity Logs */}
                                        <button
                                          onClick={() => openActivityPane(user)}
                                          type="button"
                                          title="User Logs"
                                          className="p-1.5 hover:bg-slate-100 border border-slate-205 text-slate-500 hover:text-slate-800 rounded-lg transition-colors cursor-pointer"
                                        >
                                          <Activity className="h-4 w-4" />
                                        </button>

                                        {/* Toggle Active Status */}
                                        {!isSelf && user.role !== "admin" && (
                                          <button
                                            onClick={() => handleToggleActive(user)}
                                            type="button"
                                            title={user.isActive ? "Disable User" : "Enable User"}
                                            className={`p-1.5 border rounded-lg transition-colors cursor-pointer ${
                                              user.isActive
                                                ? "hover:bg-rose-50 border-slate-205 text-slate-500 hover:text-rose-600"
                                                : "hover:bg-emerald-50 border-slate-205 text-slate-500 hover:text-emerald-600"
                                            }`}
                                          >
                                            {user.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                                          </button>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE STAFF MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setShowCreateModal(false)} />
          <div className="bg-white border border-slate-100 w-full max-w-md rounded-2xl shadow-xl z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="text-xs font-extrabold text-slate-800 flex items-center space-x-1.5">
                <UserPlus className="h-4.5 w-4.5 text-indigo-500" />
                <span>Add Staff Member</span>
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="p-5 space-y-4">
              {/* Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
                  <User className="h-3 w-3" />
                  <span>Full Name</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dr. Sarah Connor"
                  className="block w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 outline-none transition-all text-slate-705"
                />
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
                  <Mail className="h-3 w-3" />
                  <span>Email Address</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. sarah@clinic.com"
                  className="block w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 outline-none transition-all text-slate-705"
                />
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
                  <Lock className="h-3 w-3" />
                  <span>Initial Password</span>
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="block w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 outline-none transition-all text-slate-705 font-mono"
                />
              </div>

              {/* Role */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Role</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole("doctor")}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      role === "doctor"
                        ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                        : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    🦷 Doctor
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("receptionist")}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      role === "receptionist"
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                        : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    👩‍💼 Receptionist
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full inline-flex items-center justify-center space-x-1 bg-indigo-700 hover:bg-indigo-750 text-white py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="animate-spin h-3.5 w-3.5" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <span>Add Staff Member</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {showResetModal && targetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setShowResetModal(false)} />
          <div className="bg-white border border-slate-100 w-full max-w-sm rounded-2xl shadow-xl z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="text-xs font-extrabold text-slate-805 flex items-center space-x-1.5">
                <Key className="h-4.5 w-4.5 text-indigo-500" />
                <span>Reset password</span>
              </h3>
              <button onClick={() => setShowResetModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
            <form onSubmit={handleResetPassword} className="p-5 space-y-4">
              <div className="bg-slate-50 border rounded-xl p-3 text-[11px] text-slate-500 leading-normal flex items-start gap-2.5">
                <ShieldAlert className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  Resetting password for <span className="font-bold text-slate-800">{targetUser.name}</span>. The user will need this new password to sign in next time.
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
                  <Lock className="h-3 w-3" />
                  <span>New Password</span>
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="block w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 outline-none transition-all text-slate-705 font-mono"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full inline-flex items-center justify-center space-x-1 bg-indigo-700 hover:bg-indigo-750 text-white py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="animate-spin h-3.5 w-3.5" />
                      <span>Saving password...</span>
                    </>
                  ) : (
                    <span>Confirm Password Reset</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ACTIVITY FEED SIDEBAR/DRAWER */}
      {showActivityPane && activityUser && (
        <div className="fixed inset-0 z-50">
          <div className="fixed inset-0 bg-slate-900/35 backdrop-blur-[1px]" onClick={() => setShowActivityPane(false)} />
          <div className="fixed top-0 bottom-0 right-0 w-full max-w-md bg-white border-l border-slate-100 flex flex-col shadow-2xl z-10 animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div>
                <h3 className="text-xs font-extrabold text-slate-805 flex items-center space-x-1.5">
                  <Activity className="h-4 w-4 text-indigo-500" />
                  <span>Staff Activity Log</span>
                </h3>
                <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">{activityUser.name} ({activityUser.role})</span>
              </div>
              <button onClick={() => setShowActivityPane(false)} className="text-slate-450 hover:text-slate-700 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* List of activity */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {loadingLogs ? (
                <div className="flex items-center justify-center h-48 text-slate-500 text-xs gap-2">
                  <Loader2 className="animate-spin h-5 w-5 text-indigo-500" />
                  <span>Loading user audits...</span>
                </div>
              ) : activityLogs.length === 0 ? (
                <div className="text-center py-20 text-slate-400 italic text-xs">
                  No activity records logged for this user yet.
                </div>
              ) : (
                <div className="relative border-l border-slate-100 pl-4 space-y-5 ml-1.5">
                  {activityLogs.map((log) => {
                    const dateObj = new Date(log.createdAt);
                    const formattedDate = isNaN(dateObj.getTime())
                      ? "Unknown Time"
                      : dateObj.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        });

                    return (
                      <div key={log._id} className="relative group text-xs">
                        {/* Dot indicator */}
                        <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 bg-indigo-550 rounded-full border border-white ring-4 ring-white shadow-sm shrink-0" />
                        <div className="space-y-1 bg-slate-50/70 p-3 rounded-xl border border-slate-100/80">
                          <div className="flex justify-between items-start gap-1">
                            <span className="font-bold text-slate-800">{log.action}</span>
                            <span className="text-[9px] text-slate-400 font-semibold font-mono flex items-center shrink-0">
                              <Clock className="w-2.5 h-2.5 mr-0.5 text-slate-350" />
                              {formattedDate}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{log.details}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
