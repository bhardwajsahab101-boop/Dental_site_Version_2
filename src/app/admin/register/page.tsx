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
 
  useEffect(() => {
    setMounted(true);
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
 
      toast.success("Registration successful! Redirecting to login...");
      
      // Redirect to login page
      setTimeout(() => {
        window.location.href = "/admin/login";
      }, 1500);
    } catch (err: unknown) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : "Failed to register";
      setError(errMsg);
      toast.error(errMsg);
      setLoading(false);
    }
  };
 
  if (!mounted) {
    return null;
  }
 
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-10">
      <div className="w-full max-w-lg bg-white border border-slate-100 rounded-2xl shadow-xl p-6 sm:p-8 space-y-6">
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
