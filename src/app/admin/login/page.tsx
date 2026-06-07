"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Invalid credentials");
      }

      toast.success("Welcome back! Redirecting...");
      
      // Subdomain-aware redirection
      const user = data.user;
      if (user && user.role !== "admin" && user.clinicSlug) {
        const currentHost = window.location.host;
        const parts = currentHost.split(".");
        let currentSlug = "default";
        if (parts.length > 2 || (currentHost.includes("localhost") && parts.length > 1)) {
          if (parts[0] !== "www") {
            currentSlug = parts[0].split(":")[0].toLowerCase();
          }
        }
        
        // If we logged in to a subdomain that is different from our clinic slug
        if (user.clinicSlug !== currentSlug) {
          // For local development on localhost, if we logged in on flat localhost, we stay on localhost:3000/admin
          if (currentHost.startsWith("localhost") && currentSlug === "default") {
            window.location.href = "/admin";
            return;
          }

          // For local development on localhost, redirect to the wildcard lvh.me loopback domain so subdomains work out of the box
          if (currentHost.startsWith("localhost")) {
            const port = currentHost.split(":")[1] || "3000";
            window.location.href = `${window.location.protocol}//${user.clinicSlug}.lvh.me:${port}/admin`;
            return;
          }

          // If our clinic slug is default and we are on the main domain (default slug), we can stay
          if (user.clinicSlug === "default" && currentSlug === "default") {
            window.location.href = "/admin";
            return;
          }

          let mainDomain = currentHost;
          if (currentSlug !== "default") {
            mainDomain = parts.slice(1).join(".");
          }
          
          const protocol = window.location.protocol;
          window.location.href = `${protocol}//${user.clinicSlug}.${mainDomain}/admin`;
          return;
        }
      }

      // Default redirect to current domain admin dashboard
      window.location.href = "/admin";
    } catch (err: unknown) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : "Failed to log in";
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white border border-slate-100 rounded-2xl shadow-xl p-6 sm:p-8 space-y-6">
        {/* Logo and Headings */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center justify-center h-10 w-10 bg-slate-900 text-white rounded-xl text-lg font-bold">
            🦷
          </div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Admin Portal</h1>
          <p className="text-slate-400 text-[11px] font-medium leading-none">
            Sign in to manage patient appointments
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-[11px] font-semibold text-rose-600">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email field */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="w-full bg-slate-50 border border-slate-100 hover:border-slate-200/80 focus:border-slate-900 rounded-xl pl-10 pr-3 py-2 text-xs text-slate-800 placeholder-slate-450 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Password field */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-100 hover:border-slate-200/80 focus:border-slate-900 rounded-xl pl-10 pr-10 py-2 text-xs text-slate-800 placeholder-slate-450 focus:outline-none transition-colors"
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

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white py-2 rounded-xl text-xs font-semibold shadow-sm transition-colors focus:outline-none disabled:opacity-50 mt-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin text-white" />}
            <span>{loading ? "Signing in..." : "Sign In"}</span>
          </button>
        </form>
 
        {/* Link to register page */}
        <div className="text-center text-[11px] text-slate-400">
          Want to register a new clinic?{" "}
          <Link href="/admin/register" className="font-semibold text-slate-800 hover:underline">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
}
