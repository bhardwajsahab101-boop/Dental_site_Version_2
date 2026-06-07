"use client";
 
import React, { useState, useEffect } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Eye, EyeOff, Loader2, Lock, Mail, Building, Phone, MapPin, User } from "lucide-react";
 
export default function RegisterPage() {
  // Clinic Fields
  const [clinicName, setClinicName] = useState("");
  const [clinicPhone, setClinicPhone] = useState("");
  const [clinicEmail, setClinicEmail] = useState("");
  const [clinicAddress, setClinicAddress] = useState("");
 
  // Owner Fields
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");
 
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  const [registeredSlug, setRegisteredSlug] = useState<string | null>(null);
 
  useEffect(() => {
    setMounted(true);
    async function checkAuth() {
      try {
        const res = await fetch("/api/admin/me");
        const data = await res.json();
        if (data.success && data.user && data.user.role === "admin") {
          setLoadingUser(false);
        } else {
          window.location.href = "/admin/login";
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        window.location.href = "/admin/login";
      }
    }
    checkAuth();
  }, []);
 
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
 
    try {
      const res = await fetch("/api/admin/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clinicName,
          clinicPhone,
          clinicAddress,
          clinicEmail,
          ownerName,
          ownerEmail,
          ownerPassword,
        }),
      });
 
      const data = await res.json();
 
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Registration failed");
      }
 
      toast.success("Registration successful!");
      setRegisteredSlug(data.slug);
      setLoading(false);
    } catch (err: unknown) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : "Failed to register";
      setError(errMsg);
      toast.error(errMsg);
      setLoading(false);
    }
  };
 
  if (!mounted || loadingUser) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-slate-800" />
      </div>
    );
  }

  if (registeredSlug) {
    const localUrl = `${window.location.protocol}//${registeredSlug}.lvh.me:${window.location.port || "3000"}/admin/login`;
    const hostParts = window.location.host.split(".");
    let prodDomain = "launchstack.in";
    if (hostParts.length > 2 && hostParts[0] !== "www") {
      prodDomain = hostParts.slice(1).join(".");
    } else {
      prodDomain = window.location.host;
    }
    const prodUrl = `${window.location.protocol}//${registeredSlug}.${prodDomain}/admin/login`;

    return (
      <div className="flex items-center justify-center py-6">
        <div className="w-full bg-white border border-slate-100 rounded-2xl shadow-xl p-6 sm:p-8 space-y-6" style={{ maxWidth: "600px" }}>
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center h-12 w-12 bg-emerald-50 text-emerald-600 rounded-full text-xl font-bold border border-emerald-100">
              ✓
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Clinic Registered!</h1>
            <p className="text-slate-500 text-xs font-semibold">
              Clinic "{clinicName}" was successfully set up with slug <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-indigo-650 font-bold">{registeredSlug}</code>
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              🔗 Access URLs
            </h3>

            <div className="space-y-3">
              {/* Local Dev URL */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Local Development URL</span>
                <div className="flex items-center justify-between gap-2 bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold">
                  <span className="font-mono text-slate-600 truncate">{localUrl}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(localUrl);
                      toast.success("Local URL copied!");
                    }}
                    className="text-[10px] bg-slate-900 hover:bg-slate-800 text-white font-bold px-2 py-1 rounded transition-colors shrink-0 cursor-pointer"
                  >
                    Copy
                  </button>
                </div>
              </div>

              {/* Prod URL */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Production URL</span>
                <div className="flex items-center justify-between gap-2 bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold">
                  <span className="font-mono text-slate-600 truncate">{prodUrl}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(prodUrl);
                      toast.success("Production URL copied!");
                    }}
                    className="text-[10px] bg-slate-900 hover:bg-slate-800 text-white font-bold px-2 py-1 rounded transition-colors shrink-0 cursor-pointer"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <a
              href={localUrl}
              className="flex-1 inline-flex items-center justify-center bg-indigo-650 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm text-center cursor-pointer"
            >
              Open Login (Local Dev)
            </a>
            <button
              onClick={() => {
                setRegisteredSlug(null);
                setClinicName("");
                setClinicPhone("");
                setClinicEmail("");
                setClinicAddress("");
                setOwnerName("");
                setOwnerEmail("");
                setOwnerPassword("");
              }}
              className="flex-1 inline-flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl text-xs font-bold transition-all text-center border border-slate-200 cursor-pointer"
            >
              Register Another Clinic
            </button>
          </div>
        </div>
      </div>
    );
  }
 
  return (
    <div className="flex items-center justify-center py-6">
      <div className="w-full bg-white border border-slate-100 rounded-2xl shadow-xl p-6 sm:p-8 space-y-6" style={{ maxWidth: "600px" }}>
        {/* Logo and Headings */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center justify-center h-10 w-10 bg-slate-900 text-white rounded-xl text-lg font-bold">
            🦷
          </div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Create SaaS Clinic</h1>
          <p className="text-slate-400 text-[11px] font-medium leading-none">
            Register your dental clinic and setup owner account
          </p>
        </div>
 
        {/* Error Banner */}
        {error && (
          <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-[11px] font-semibold text-rose-600">
            {error}
          </div>
        )}
 
        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Section: Clinic Details */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-800 border-b border-slate-50 pb-1.5 uppercase tracking-wider">
              🏥 Clinic Information
            </h3>
 
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Clinic Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Clinic Name
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={clinicName}
                    onChange={(e) => setClinicName(e.target.value)}
                    placeholder="e.g. City Dental Care"
                    className="w-full bg-slate-50 border border-slate-100 hover:border-slate-200/80 focus:border-slate-900 rounded-xl pl-10 pr-3 py-2 text-xs text-slate-805 text-slate-800 placeholder-slate-450 focus:outline-none transition-colors"
                  />
                </div>
              </div>
 
              {/* Clinic Phone */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Clinic Phone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={clinicPhone}
                    onChange={(e) => setClinicPhone(e.target.value)}
                    placeholder="e.g. +91 99999 99999"
                    className="w-full bg-slate-50 border border-slate-100 hover:border-slate-200/80 focus:border-slate-900 rounded-xl pl-10 pr-3 py-2 text-xs text-slate-805 text-slate-800 placeholder-slate-450 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>
 
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Clinic Email */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Clinic Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={clinicEmail}
                    onChange={(e) => setClinicEmail(e.target.value)}
                    placeholder="contact@clinic.com"
                    className="w-full bg-slate-50 border border-slate-100 hover:border-slate-200/80 focus:border-slate-900 rounded-xl pl-10 pr-3 py-2 text-xs text-slate-850 text-slate-800 placeholder-slate-450 focus:outline-none transition-colors"
                  />
                </div>
              </div>
 
              {/* Clinic Address */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Clinic Address
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={clinicAddress}
                    onChange={(e) => setClinicAddress(e.target.value)}
                    placeholder="e.g. 123 Health Ave"
                    className="w-full bg-slate-50 border border-slate-100 hover:border-slate-200/80 focus:border-slate-900 rounded-xl pl-10 pr-3 py-2 text-xs text-slate-850 text-slate-800 placeholder-slate-450 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>
 
          {/* Section: Owner User Account */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-800 border-b border-slate-50 pb-1.5 uppercase tracking-wider">
              👤 Owner Account
            </h3>
 
            {/* Owner Name */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Owner Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="e.g. Dr. Ayush Bhardwaj"
                  className="w-full bg-slate-50 border border-slate-100 hover:border-slate-200/80 focus:border-slate-900 rounded-xl pl-10 pr-3 py-2 text-xs text-slate-850 text-slate-800 placeholder-slate-450 focus:outline-none transition-colors"
                />
              </div>
            </div>
 
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Owner Email */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Owner Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    placeholder="owner@clinic.com"
                    className="w-full bg-slate-50 border border-slate-100 hover:border-slate-200/80 focus:border-slate-900 rounded-xl pl-10 pr-3 py-2 text-xs text-slate-850 text-slate-800 placeholder-slate-450 focus:outline-none transition-colors"
                  />
                </div>
              </div>
 
              {/* Owner Password */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={ownerPassword}
                    onChange={(e) => setOwnerPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-100 hover:border-slate-200/80 focus:border-slate-900 rounded-xl pl-10 pr-10 py-2 text-xs text-slate-850 text-slate-800 placeholder-slate-450 focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
 
          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-colors focus:outline-none disabled:opacity-50 mt-2 cursor-pointer"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin text-white" />}
            <span>{loading ? "Registering Clinic..." : "Register & Create Clinic"}</span>
          </button>
 
          {/* Link back to login */}
          <div className="text-center text-[11px] text-slate-400">
            Already have a clinic?{" "}
            <Link href="/admin/login" className="font-semibold text-slate-800 hover:underline">
              Sign In here
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
