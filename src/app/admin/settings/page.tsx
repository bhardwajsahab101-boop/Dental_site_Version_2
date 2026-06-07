"use client";

import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Save, Building, Phone, Mail, MapPin, Hash, Loader2, FileSpreadsheet } from "lucide-react";

export default function ClinicSettingsPage() {
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [logo, setLogo] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [gstNumber, setGstNumber] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const res = await fetch("/api/admin/settings");
      const data = await res.json();
      if (data.success && data.settings) {
        setSlug(data.settings.slug || "");
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
          slug: slug.trim().toLowerCase(),
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

  const handleExport = async (type: "patients" | "appointments" | "treatments" | "users") => {
    setExporting(type);
    try {
      const res = await fetch(`/api/admin/export?type=${type}`);
      const result = await res.json();
      if (!result.success || !result.data) {
        throw new Error(result.message || "Failed to fetch export dataset");
      }

      const rawData = result.data;
      if (rawData.length === 0) {
        toast.error(`No records found to export for ${type}`);
        return;
      }

      // Convert JSON array to CSV format
      const headers = Object.keys(rawData[0]);
      const csvRows = [
        headers.join(","), // header row
        ...rawData.map((row: any) =>
          headers
            .map((header) => {
              const val = row[header] === null || row[header] === undefined ? "" : String(row[header]);
              // Escape double quotes and wrap in quotes if containing comma or quotes
              const escaped = val.replace(/"/g, '""');
              return escaped.includes(",") || escaped.includes('"') || escaped.includes("\n")
                ? `"${escaped}"`
                : escaped;
            })
            .join(",")
        ),
      ];

      const csvContent = csvRows.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `${type}_export_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} database exported!`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || `Failed to export ${type}`);
    } finally {
      setExporting(null);
    }
  };

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
              placeholder="e.g. Apex Dental Clinic"
              className="block w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 outline-none transition-all text-slate-700"
            />
          </div>

          {/* Subdomain Slug */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
              <span>🌐</span>
              <span>Subdomain / Slug</span>
            </label>
            <div className="flex rounded-xl bg-slate-50 border border-slate-200 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-100 transition-all overflow-hidden">
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^\w\-]+/g, ""))}
                placeholder="subdomain"
                className="block w-full px-3 py-2 text-xs bg-transparent border-0 outline-none text-slate-700 font-semibold"
              />
              <span className="bg-slate-100 px-3 py-2 text-xs text-slate-500 border-l border-slate-200 flex items-center font-mono">
                .yourapp.com
              </span>
            </div>
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
              placeholder="e.g. billing@clinic.com"
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

      {/* Data Portability / CSV Export Card */}
      <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-4">
        <div>
          <h2 className="text-xs font-extrabold text-slate-800 flex items-center space-x-1.5">
            <FileSpreadsheet className="h-4 w-4 text-indigo-500" />
            <span>Export Clinic Data (CSV)</span>
          </h2>
          <p className="text-[11px] text-slate-400 font-semibold mt-1">
            Download comprehensive spreadsheets containing patients, medical treatment records, schedules, and staff rosters.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Patients Export */}
          <button
            onClick={() => handleExport("patients")}
            disabled={exporting !== null}
            className="flex flex-col items-center justify-center p-4 bg-slate-50/50 hover:bg-indigo-50/40 border border-slate-150 hover:border-indigo-200/50 rounded-xl transition-all group shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting === "patients" ? (
              <Loader2 className="w-5 h-5 text-indigo-600 animate-spin mb-2" />
            ) : (
              <span className="text-lg mb-2 group-hover:scale-110 transition-transform">👥</span>
            )}
            <span className="text-[11px] font-bold text-slate-700">Patients List</span>
            <span className="text-[9px] text-slate-400 font-semibold mt-0.5">Contact & Dues</span>
          </button>

          {/* Appointments Export */}
          <button
            onClick={() => handleExport("appointments")}
            disabled={exporting !== null}
            className="flex flex-col items-center justify-center p-4 bg-slate-50/50 hover:bg-indigo-50/40 border border-slate-150 hover:border-indigo-200/50 rounded-xl transition-all group shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting === "appointments" ? (
              <Loader2 className="w-5 h-5 text-indigo-600 animate-spin mb-2" />
            ) : (
              <span className="text-lg mb-2 group-hover:scale-110 transition-transform">📅</span>
            )}
            <span className="text-[11px] font-bold text-slate-700">Appointments</span>
            <span className="text-[9px] text-slate-400 font-semibold mt-0.5">Schedules</span>
          </button>

          {/* Treatments Export */}
          <button
            onClick={() => handleExport("treatments")}
            disabled={exporting !== null}
            className="flex flex-col items-center justify-center p-4 bg-slate-50/50 hover:bg-indigo-50/40 border border-slate-150 hover:border-indigo-200/50 rounded-xl transition-all group shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting === "treatments" ? (
              <Loader2 className="w-5 h-5 text-indigo-600 animate-spin mb-2" />
            ) : (
              <span className="text-lg mb-2 group-hover:scale-110 transition-transform">🩺</span>
            )}
            <span className="text-[11px] font-bold text-slate-700">Treatments</span>
            <span className="text-[9px] text-slate-400 font-semibold mt-0.5">Medical Logs</span>
          </button>

          {/* Users Export */}
          <button
            onClick={() => handleExport("users")}
            disabled={exporting !== null}
            className="flex flex-col items-center justify-center p-4 bg-slate-50/50 hover:bg-indigo-50/40 border border-slate-150 hover:border-indigo-200/50 rounded-xl transition-all group shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting === "users" ? (
              <Loader2 className="w-5 h-5 text-indigo-600 animate-spin mb-2" />
            ) : (
              <span className="text-lg mb-2 group-hover:scale-110 transition-transform">🛡️</span>
            )}
            <span className="text-[11px] font-bold text-slate-700">Staff Members</span>
            <span className="text-[9px] text-slate-400 font-semibold mt-0.5">Role & Active Status</span>
          </button>
        </div>
      </div>
    </div>
  );
}
