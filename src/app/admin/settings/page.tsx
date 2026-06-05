"use client";

import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Save, Building, Phone, Mail, MapPin, Hash, Loader2 } from "lucide-react";

export default function ClinicSettingsPage() {
  const [name, setName] = useState("");
  const [logo, setLogo] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [gstNumber, setGstNumber] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const res = await fetch("/api/admin/settings");
      const data = await res.json();
      if (data.success && data.settings) {
        setName(data.settings.name || "");
        setLogo(data.settings.logo || "");
        setPhone(data.settings.phone || "");
        setEmail(data.settings.email || "");
        setAddress(data.settings.address || "");
        setGstNumber(data.settings.gstNumber || "");
      } else {
        throw new Error(data.message || "Failed to load clinic settings");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error loading clinic settings");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          logo: logo.trim(),
          phone: phone.trim(),
          email: email.trim(),
          address: address.trim(),
          gstNumber: gstNumber.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Settings saved successfully");
      } else {
        throw new Error(data.message || "Failed to save settings");
      }
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Error saving settings");
    } finally {
      setSaving(false);
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <div className="w-8 h-8 border-4 border-indigo-650 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-500">Loading settings configurations...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
          <span>⚙️</span>
          <span>Clinic Settings</span>
        </h1>
        <p className="text-slate-500 text-xs font-semibold mt-1">
          Configure default SaaS clinic values, contact information, and billing codes for dynamic invoice headers.
        </p>
      </div>

      {/* Main Settings Card */}
      <form onSubmit={handleSave} className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Clinic Name */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
              <Building className="h-3 w-3" />
              <span>Clinic Name</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Bright Smile Dental"
              className="block w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 outline-none transition-all text-slate-700"
            />
          </div>

          {/* GSTIN Number */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
              <Hash className="h-3 w-3" />
              <span>GSTIN / Tax ID</span>
            </label>
            <input
              type="text"
              value={gstNumber}
              onChange={(e) => setGstNumber(e.target.value)}
              placeholder="e.g. 27AAAAA1111A1Z1"
              className="block w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 outline-none transition-all text-slate-700 font-mono"
            />
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
              <Phone className="h-3 w-3" />
              <span>Contact Phone</span>
            </label>
            <input
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +91 98765 43210"
              className="block w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 outline-none transition-all text-slate-700 font-mono"
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
              <Mail className="h-3 w-3" />
              <span>Invoice Email</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. billing@brightsmile.com"
              className="block w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 outline-none transition-all text-slate-700"
            />
          </div>

          {/* Address */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
              <MapPin className="h-3 w-3" />
              <span>Clinic Address</span>
            </label>
            <textarea
              required
              rows={3}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. 123 Health Ave, Medical District, Pune, MH, 411001"
              className="block w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 outline-none transition-all text-slate-700 leading-relaxed resize-none"
            />
          </div>

          {/* Logo URL */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Clinic Logo URL
            </label>
            <input
              type="text"
              value={logo}
              onChange={(e) => setLogo(e.target.value)}
              placeholder="e.g. https://yourdomain.com/logo.png"
              className="block w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 outline-none transition-all text-slate-700 font-mono"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-4 border-t border-slate-50">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center space-x-2 bg-indigo-700 hover:bg-indigo-700 disabled:bg-indigo-300 text-white px-4.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Saving settings...</span>
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" />
                <span>Save Configuration</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
