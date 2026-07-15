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
  const [clinicName, setClinicName] = useState("");
  const [clinicLogo, setClinicLogo] = useState("");
  const [clinicSlug, setClinicSlug] = useState("default");
  const [callbackLoading, setCallbackLoading] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Check if token callback is present in query parameters
    const searchParams = new URLSearchParams(window.location.search);
    const tokenParam = searchParams.get("token");

    if (tokenParam) {
      setCallbackLoading(true);
      async function handleTokenCallback() {
        try {
          const res = await fetch("/api/admin/login/callback", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ token: tokenParam }),
          });
          const data = await res.json();
          if (res.ok && data.success) {
            toast.success("Welcome! Redirecting...");
            window.location.href = "/admin";
          } else {
            throw new Error(data.message || "Failed to set login session");
          }
        } catch (err: any) {
          toast.error(err.message || "Session initialization failed");
          setCallbackLoading(false);
        }
      }
      handleTokenCallback();
      return;
    }

    async function loadClinic() {
      try {
        const res = await fetch("/api/clinic/info");
        const data = await res.json();
        if (data.success && data.clinic) {
          setClinicName(data.clinic.name);
          setClinicLogo(data.clinic.logo);
          setClinicSlug(data.clinic.slug);
          document.title = `${data.clinic.name} - Doctor Login`;
        } else {
          document.title = "Doctor Login";
        }
      } catch (err) {
        console.error("Failed to load clinic info:", err);
        document.title = "Doctor Login";
      }
    }
    loadClinic();
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
      const token = data.token;

      if (user && user.role !== "admin") {
        const currentHost = window.location.hostname.toLowerCase();

        // Local development
        if (
          currentHost === "localhost" ||
          currentHost === "127.0.0.1" ||
          currentHost.endsWith(".lvh.me")
        ) {
          const port = window.location.port || "3000";

          window.location.href =
            `${window.location.protocol}//${user.clinicSlug}.lvh.me:${port}/admin/login?token=${token}`;

          return;
        }

        // Production
        const rootDomain = "dental.launchstack.in";

        window.location.href =
          `${window.location.protocol}//${user.clinicSlug}.${rootDomain}/admin/login?token=${token}`;

        return;
      }

      // Platform admin
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

  if (callbackLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
          <p className="text-slate-400 text-xs font-semibold">Setting up your session...</p>
        </div>
      </div>
    );
  }

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white border border-slate-100 rounded-2xl shadow-xl p-6 sm:p-8 space-y-6">
        {/* Logo and Headings */}
        <div className="text-center space-y-1.5">
          {clinicLogo ? (
            <img src={clinicLogo} alt={clinicName} className="h-10 w-auto object-contain mx-auto mb-1" />
          ) : (
            <div className="inline-flex items-center justify-center h-10 w-10 bg-slate-900 text-white rounded-xl text-lg font-bold">
              🦷
            </div>
          )}
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">
            {clinicName ? `${clinicName} - Doctor Login` : "Doctor Login"}
          </h1>
          <p className="text-slate-400 text-[11px] font-medium leading-none">
            Sign in with your email to manage patients
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
                placeholder="doctor@example.com"
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
        {clinicSlug === "default" && (
          <div className="text-center text-[11px] text-slate-400">
            Want to register a new clinic?{" "}
            <Link href="/admin/register" className="font-semibold text-slate-800 hover:underline">
              Register here
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
