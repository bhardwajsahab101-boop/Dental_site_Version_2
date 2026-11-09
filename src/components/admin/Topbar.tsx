"use client";

import React, { useEffect, useState, useRef } from "react";
import { CalendarDays, Search, User, ClipboardList, Calendar, Loader2, Sparkles, AlertCircle } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function Topbar() {
  const [dateStr, setDateStr] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<any>({ patients: [], treatments: [], appointments: [] });
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const [subscription, setSubscription] = useState<any>(null);
  const [showSubscriptionPopover, setShowSubscriptionPopover] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const today = new Date();
    setDateStr(
      today.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    );

    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults({ patients: [], treatments: [], appointments: [] });
      setLoading(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        if (data.success) {
          setResults(data.results);
        }
      } catch (err) {
        console.error("Search fetch error:", err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  useEffect(() => {
    async function fetchSubscription() {
      try {
        const res = await fetch("/api/admin/subscription");
        const data = await res.json();
        if (data.success) {
          setSubscription(data.subscription);
        }
      } catch (err) {
        console.error("Failed to fetch subscription info:", err);
      }
    }
    fetchSubscription();

    function handleClickOutsidePopover(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setShowSubscriptionPopover(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutsidePopover);
    return () => document.removeEventListener("mousedown", handleClickOutsidePopover);
  }, []);

  return (
    <div className="hidden md:flex items-center justify-between h-14 px-6 border-b border-[#E2E8F0] bg-white sticky top-0 z-30 shrink-0 w-full shadow-xs">
      {/* Global Quick Search Input */}
      <div ref={searchRef} className="relative w-80">
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 h-3.5 w-3.5 text-[#64748B]" />
          <input
            type="text"
            placeholder="Search patients, phone, procedures..."
            value={searchQuery}
            onFocus={() => setShowDropdown(true)}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 bg-[#F4F7FA] border border-[#E2E8F0] focus:bg-white focus:border-[#14B8A6] focus:ring-2 focus:ring-[#14B8A6]/20 text-xs rounded-xl focus:outline-none transition-all font-medium text-[#182230] placeholder:text-[#64748B]"
          />
          {loading && (
            <Loader2 className="absolute right-3 h-3.5 w-3.5 animate-spin text-[#14B8A6]" />
          )}
        </div>

        {/* Dropdown list */}
        {showDropdown && searchQuery.trim() && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#E2E8F0] rounded-xl shadow-xl max-h-96 overflow-y-auto z-50 p-3.5 space-y-3 text-xs animate-in fade-in slide-in-from-top-1 duration-150">
            {/* Patients section */}
            <div>
              <div className="flex items-center justify-between text-[10px] uppercase font-bold text-[#64748B] tracking-wider mb-1.5 border-b border-slate-100 pb-1">
                <div className="flex items-center gap-1.5">
                  <User className="h-3 w-3 text-[#14B8A6]" />
                  <span>Patients</span>
                </div>
                <span className="font-mono text-[9px] bg-slate-100 px-1.5 py-0.2 rounded text-slate-600">
                  {results.patients?.length || 0}
                </span>
              </div>
              {!results.patients || results.patients.length === 0 ? (
                <p className="text-[11px] text-[#64748B] italic p-1">No matching patients</p>
              ) : (
                <div className="space-y-1">
                  {results.patients.map((p: any) => (
                    <Link
                      key={p._id}
                      href={`/admin/patients/${p._id}`}
                      onClick={() => {
                        setShowDropdown(false);
                        setSearchQuery("");
                      }}
                      className="block p-2 hover:bg-[#F4F7FA] rounded-lg transition-colors border border-transparent hover:border-[#E2E8F0]"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-[#182230]">{p.fullName}</p>
                        <span className="text-[9px] font-mono bg-[#14213D] text-white px-1.5 py-0.2 rounded">
                          {p.patientCode || "PAT"}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#64748B] mt-0.5">Phone: {p.phone || "—"}</p>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Treatments section */}
            <div>
              <div className="flex items-center justify-between text-[10px] uppercase font-bold text-[#64748B] tracking-wider mb-1.5 border-b border-slate-100 pb-1">
                <div className="flex items-center gap-1.5">
                  <ClipboardList className="h-3 w-3 text-[#14B8A6]" />
                  <span>Treatments</span>
                </div>
                <span className="font-mono text-[9px] bg-slate-100 px-1.5 py-0.2 rounded text-slate-600">
                  {results.treatments?.length || 0}
                </span>
              </div>
              {!results.treatments || results.treatments.length === 0 ? (
                <p className="text-[11px] text-[#64748B] italic p-1">No matching treatments</p>
              ) : (
                <div className="space-y-1">
                  {results.treatments.map((t: any) => {
                    const patientName = t.patientId?.fullName || "Patient";
                    return (
                      <Link
                        key={t._id}
                        href={`/admin/patients/${t.patientId?._id || t.patientId}`}
                        onClick={() => {
                          setShowDropdown(false);
                          setSearchQuery("");
                        }}
                        className="block p-2 hover:bg-[#F4F7FA] rounded-lg transition-colors border border-transparent hover:border-[#E2E8F0]"
                      >
                        <p className="font-bold text-[#182230]">{t.treatmentName}</p>
                        <p className="text-[10px] text-[#64748B] mt-0.5">
                          Patient: {patientName} • Tooth {t.toothNumber}
                        </p>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Appointments section */}
            <div>
              <div className="flex items-center justify-between text-[10px] uppercase font-bold text-[#64748B] tracking-wider mb-1.5 border-b border-slate-100 pb-1">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3 w-3 text-[#14B8A6]" />
                  <span>Appointments</span>
                </div>
                <span className="font-mono text-[9px] bg-slate-100 px-1.5 py-0.2 rounded text-slate-600">
                  {results.appointments?.length || 0}
                </span>
              </div>
              {!results.appointments || results.appointments.length === 0 ? (
                <p className="text-[11px] text-[#64748B] italic p-1">No matching appointments</p>
              ) : (
                <div className="space-y-1">
                  {results.appointments.map((a: any) => {
                    const patientName = a.patientId?.fullName || "Patient";
                    return (
                      <Link
                        key={a._id}
                        href={`/admin/patients/${a.patientId?._id || a.patientId}`}
                        onClick={() => {
                          setShowDropdown(false);
                          setSearchQuery("");
                        }}
                        className="block p-2 hover:bg-[#F4F7FA] rounded-lg transition-colors border border-transparent hover:border-[#E2E8F0]"
                      >
                        <p className="font-bold text-[#182230]">{a.service}</p>
                        <p className="text-[10px] text-[#64748B] mt-0.5">
                          Patient: {patientName} • {new Date(a.appointmentDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </p>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Utilities & Status Badges */}
      <div className="flex items-center space-x-3.5">
        {/* Subscription Status Badge */}
        {subscription && (() => {
          const { plan, status, subscriptionEndDate, daysLeft, isInfinite } = subscription;
          let badgeColorClass = "";
          let dotColorClass = "";
          let labelText = "";

          const isInf = isInfinite || plan === "Super Admin" || daysLeft > 50000;

          if (isInf) {
            badgeColorClass = "bg-[#F0FDFA] text-[#0D9488] border-[#CCFBF1]";
            dotColorClass = "bg-[#14B8A6]";
            labelText = "Admin • Infinite";
          } else if (status === "expired" || daysLeft <= 0) {
            badgeColorClass = "bg-rose-50 text-rose-700 border-rose-200";
            dotColorClass = "bg-rose-500";
            labelText = "Subscription Expired";
          } else if (daysLeft >= 1 && daysLeft <= 7) {
            badgeColorClass = "bg-amber-50 text-amber-700 border-amber-200 animate-pulse";
            dotColorClass = "bg-amber-500";
            labelText = `Expires in ${daysLeft} Day${daysLeft > 1 ? "s" : ""}`;
          } else if (daysLeft >= 8 && daysLeft <= 15) {
            badgeColorClass = "bg-amber-50 text-amber-700 border-amber-200";
            dotColorClass = "bg-amber-500";
            labelText = `${plan} • ${daysLeft} Days Left`;
          } else {
            badgeColorClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
            dotColorClass = "bg-emerald-500";
            labelText = `${plan} • ${daysLeft} Days Left`;
          }

          return (
            <div className="relative shrink-0" ref={popoverRef}>
              <button
                onClick={() => setShowSubscriptionPopover(!showSubscriptionPopover)}
                className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg border text-xs font-semibold cursor-pointer shadow-2xs hover:brightness-95 transition-all select-none focus:outline-none ${badgeColorClass}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${dotColorClass}`} />
                <span>{labelText}</span>
              </button>

              {showSubscriptionPopover && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-[#E2E8F0] rounded-xl shadow-xl z-50 p-4 font-sans animate-in fade-in slide-in-from-top-1 duration-150">
                  {status === "expired" || daysLeft <= 0 ? (
                    <div className="space-y-3.5 text-center">
                      <div className="inline-flex items-center justify-center h-10 w-10 bg-rose-50 text-rose-600 rounded-xl text-lg font-bold border border-rose-100">
                        <AlertCircle className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-xs font-bold text-[#182230] uppercase tracking-wide">Subscription Expired</h3>
                        <p className="text-[11px] text-[#64748B] leading-relaxed">
                          Your clinic subscription has ended. Renew now to restore full operations.
                        </p>
                      </div>
                      <button
                        onClick={() => toast.success("Redirecting to payment gateway...")}
                        className="w-full py-2 bg-[#14213D] hover:bg-[#0D1629] text-white rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer border-0"
                      >
                        Renew Now
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="border-b border-slate-100 pb-2">
                        <h3 className="text-xs font-bold text-[#14213D] uppercase tracking-wider block">
                          Subscription Details
                        </h3>
                      </div>
                      
                      <div className="space-y-2.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-medium text-[#64748B]">Current Plan</span>
                          <span className="font-bold text-[#0D9488] bg-[#CCFBF1] border border-[#14B8A6]/30 px-2 py-0.5 rounded text-[10px] uppercase">
                            {plan}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-medium text-[#64748B]">Status</span>
                          <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[10px] uppercase">
                            {status}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-medium text-[#64748B]">Expiry Date</span>
                          <span className="font-semibold text-[#182230]">
                            {isInf ? "Permanent (Active)" : new Date(subscriptionEndDate).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-medium text-[#64748B]">Remaining</span>
                          <span className="font-semibold text-[#182230]">{isInf ? "Infinite" : `${daysLeft} Days`}</span>
                        </div>
                      </div>

                      {!isInf && (
                        <button
                          onClick={() => toast.success("Redirecting to payment gateway...")}
                          className="w-full py-2 bg-[#14B8A6] hover:bg-[#0D9488] text-white rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer border-0"
                        >
                          Extend Subscription
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })()}

        {/* Date Display */}
        <div className="flex items-center space-x-1.5 text-[#64748B] text-xs font-medium bg-[#F4F7FA] border border-[#E2E8F0] px-3 py-1 rounded-lg">
          <CalendarDays className="h-3.5 w-3.5 text-[#14B8A6]" />
          <span>{dateStr || "Loading date..."}</span>
        </div>

        {/* Live Portal Status */}
        <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-emerald-50/70 border border-emerald-200/60 rounded-lg">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-emerald-800 font-bold tracking-tight">Live Portal</span>
        </div>
      </div>
    </div>
  );
}
