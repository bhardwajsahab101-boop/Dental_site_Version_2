"use client";

import React, { useEffect, useState, useRef } from "react";
import { CalendarDays, Search, User, ClipboardList, Calendar, Loader2 } from "lucide-react";
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
    <div className="hidden md:flex items-center justify-between h-14 px-6 border-b border-slate-100 bg-white sticky top-0 z-30 shrink-0 w-full">
      {/* Search Input Container */}
      <div ref={searchRef} className="relative w-72">
        <div className="relative flex items-center">
          <Search className="absolute left-3 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search patients, phone, procedures..."
            value={searchQuery}
            onFocus={() => setShowDropdown(true)}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 bg-slate-50 border border-slate-200 focus:border-slate-800 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-100 transition-all font-medium text-slate-700"
          />
          {loading && (
            <Loader2 className="absolute right-3 h-3 w-3 animate-spin text-slate-400" />
          )}
        </div>

        {/* Dropdown list */}
        {showDropdown && searchQuery.trim() && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-150 rounded-xl shadow-xl max-h-96 overflow-y-auto z-50 p-3.5 space-y-3.5 text-xs animate-in fade-in slide-in-from-top-1 duration-150">
            {/* Patients section */}
            <div>
              <div className="flex items-center gap-1 text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-1 border-b border-slate-50 pb-1 font-semibold">
                <User className="h-2.5 w-2.5 text-slate-500" />
                <span>Patients ({results.patients?.length || 0})</span>
              </div>
              {!results.patients || results.patients.length === 0 ? (
                <p className="text-[10px] text-slate-400 italic p-1">No matching patients</p>
              ) : (
                <div className="space-y-0.5">
                  {results.patients.map((p: any) => (
                    <Link
                      key={p._id}
                      href={`/admin/patients/${p._id}`}
                      onClick={() => {
                        setShowDropdown(false);
                        setSearchQuery("");
                      }}
                      className="block p-1.5 hover:bg-slate-50 rounded-lg transition-colors font-medium"
                    >
                      <p className="font-bold text-slate-800">{p.fullName}</p>
                      <p className="text-[9px] text-slate-500 mt-0.5">Code: {p.patientCode} • Phone: {p.phone}</p>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Treatments section */}
            <div>
              <div className="flex items-center gap-1 text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-1 border-b border-slate-50 pb-1 font-semibold">
                <ClipboardList className="h-2.5 w-2.5 text-slate-500" />
                <span>Treatments ({results.treatments?.length || 0})</span>
              </div>
              {!results.treatments || results.treatments.length === 0 ? (
                <p className="text-[10px] text-slate-400 italic p-1">No matching treatments</p>
              ) : (
                <div className="space-y-0.5">
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
                        className="block p-1.5 hover:bg-slate-50 rounded-lg transition-colors font-medium"
                      >
                        <p className="font-bold text-slate-800">{t.treatmentName}</p>
                        <p className="text-[9px] text-slate-500 mt-0.5">
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
              <div className="flex items-center gap-1 text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-1 border-b border-slate-50 pb-1 font-semibold">
                <Calendar className="h-2.5 w-2.5 text-slate-500" />
                <span>Appointments ({results.appointments?.length || 0})</span>
              </div>
              {!results.appointments || results.appointments.length === 0 ? (
                <p className="text-[10px] text-slate-400 italic p-1">No matching appointments</p>
              ) : (
                <div className="space-y-0.5">
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
                        className="block p-1.5 hover:bg-slate-50 rounded-lg transition-colors font-medium"
                      >
                        <p className="font-bold text-slate-800">{a.service}</p>
                        <p className="text-[9px] text-slate-500 mt-0.5">
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

      {/* Utilities */}
      <div className="flex items-center space-x-4">
        {/* Subscription Status Badge */}
        {subscription && (() => {
          const { plan, status, subscriptionEndDate, daysLeft } = subscription;
          let badgeColorClass = "";
          let dotColorClass = "";
          let labelText = "";

          if (status === "expired" || daysLeft <= 0) {
            badgeColorClass = "bg-slate-100 text-slate-700 border-slate-200";
            dotColorClass = "bg-slate-500";
            labelText = "Subscription Expired";
          } else if (daysLeft >= 1 && daysLeft <= 7) {
            badgeColorClass = "bg-rose-50 text-rose-700 border-rose-100 animate-pulse";
            dotColorClass = "bg-rose-500";
            labelText = `Expires in ${daysLeft} Day${daysLeft > 1 ? "s" : ""}`;
          } else if (daysLeft >= 8 && daysLeft <= 15) {
            badgeColorClass = "bg-amber-50 text-amber-700 border-amber-100";
            dotColorClass = "bg-amber-500";
            labelText = `${plan} • Expires in ${daysLeft} Days`;
          } else {
            badgeColorClass = "bg-emerald-50 text-emerald-700 border-emerald-100";
            dotColorClass = "bg-emerald-500";
            labelText = `${plan} • ${daysLeft} Days Left`;
          }

          return (
            <div className="relative shrink-0" ref={popoverRef}>
              <button
                onClick={() => setShowSubscriptionPopover(!showSubscriptionPopover)}
                className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-lg border text-[11px] font-semibold cursor-pointer shadow-sm hover:brightness-95 transition-all select-none focus:outline-none ${badgeColorClass}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${dotColorClass}`} />
                <span>{labelText}</span>
              </button>

              {showSubscriptionPopover && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-slate-150 rounded-xl shadow-xl z-50 p-4 font-sans animate-in fade-in slide-in-from-top-1 duration-150">
                  {status === "expired" || daysLeft <= 0 ? (
                    <div className="space-y-3.5 text-center">
                      <div className="inline-flex items-center justify-center h-10 w-10 bg-rose-50 text-rose-500 rounded-xl text-lg font-bold border border-rose-100">
                        ⚠️
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Subscription Expired</h3>
                        <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
                          Your subscription has ended.
                        </p>
                      </div>
                      <button
                        onClick={() => toast.success("Redirecting to payment gateway...")}
                        className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10.5px] font-bold shadow-md hover:shadow-lg transition-all cursor-pointer border-0"
                      >
                        Renew Now
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="border-b border-slate-100 pb-2">
                        <h3 className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wider block">
                          Subscription Details
                        </h3>
                      </div>
                      
                      <div className="space-y-2.5">
                        <div className="flex justify-between items-center text-[10.5px]">
                          <span className="font-semibold text-slate-400">Current Plan</span>
                          <span className="font-extrabold text-indigo-600 bg-indigo-50 border border-indigo-100/50 px-2 py-0.5 rounded text-[9.5px] uppercase">
                            {plan}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center text-[10.5px]">
                          <span className="font-semibold text-slate-400">Subscription Status</span>
                          <span className="font-bold text-emerald-600 bg-emerald-50 border border-emerald-100/50 px-2 py-0.5 rounded text-[9.5px] uppercase">
                            {status}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center text-[10.5px]">
                          <span className="font-semibold text-slate-400">Expiry Date</span>
                          <span className="font-bold text-slate-700">
                            {new Date(subscriptionEndDate).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center text-[10.5px]">
                          <span className="font-semibold text-slate-400">Days Remaining</span>
                          <span className="font-bold text-slate-700">{daysLeft} Days</span>
                        </div>
                      </div>

                      <button
                        onClick={() => toast.success("Redirecting to payment gateway...")}
                        className="w-full py-1.5 bg-[#5f22e6] hover:bg-[#4b18c0] text-white rounded-lg text-[10.5px] font-bold shadow-md hover:shadow-lg transition-all cursor-pointer border-0"
                      >
                        Renew Subscription
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })()}

        {/* Date Display */}
        <div className="flex items-center space-x-1.5 text-slate-500 text-[11px] font-semibold bg-slate-50 border border-slate-100 px-2.5 py-0.5 rounded-lg">
          <CalendarDays className="h-3.5 w-3.5" />
          <span>{dateStr || "Loading date..."}</span>
        </div>

        {/* Office Status */}
        <div className="flex items-center space-x-1">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] text-slate-500 font-bold">Live Portal</span>
        </div>
      </div>
    </div>
  );
}
