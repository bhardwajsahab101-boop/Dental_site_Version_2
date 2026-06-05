"use client";

import React, { useEffect, useState, useRef } from "react";
import { CalendarDays, Search, User, ClipboardList, Calendar, Loader2 } from "lucide-react";
import Link from "next/link";

export default function Topbar() {
  const [dateStr, setDateStr] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<any>({ patients: [], treatments: [], appointments: [] });
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

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
