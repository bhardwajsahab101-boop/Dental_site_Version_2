"use client";

import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  TrendingUp,
  Coins,
  CalendarDays,
  Users,
  Search,
  ArrowUpRight,
  DollarSign,
  Loader2,
  FileSpreadsheet
} from "lucide-react";

export default function FinanceDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [searchDebtor, setSearchDebtor] = useState("");

  useEffect(() => {
    setMounted(true);
    fetchFinanceData();
  }, []);

  async function fetchFinanceData() {
    try {
      const res = await fetch("/api/admin/finance");
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      } else {
        throw new Error(result.message || "Failed to load financial statistics");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error loading financial metrics");
    } finally {
      setLoading(false);
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
        <p className="text-xs font-semibold text-slate-500">Compiling financial ledgers...</p>
      </div>
    );
  }

  // Filter debtors based on search term
  const filteredDebtors = (data?.debtors || []).filter(
    (debtor: any) =>
      debtor.patientName.toLowerCase().includes(searchDebtor.toLowerCase()) ||
      debtor.patientCode.toLowerCase().includes(searchDebtor.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div>
        <h1 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
          <span>📊</span>
          <span>Financial Dashboard</span>
        </h1>
        <p className="text-slate-500 text-xs font-semibold mt-1">
          Monitor your clinic revenue streams, collections, top treatments, and outstanding accounts.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Today's KPI Card */}
        <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm space-y-3.5 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Today's Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
              <CalendarDays className="w-4.5 h-4.5 text-indigo-600" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="text-xs font-semibold text-slate-400">Total Billed:</span>
              <span className="text-sm font-extrabold text-slate-800 font-mono">₹{(data?.today?.billed || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-baseline border-t border-slate-50 pt-2">
              <span className="text-xs font-semibold text-slate-400">Total Collected:</span>
              <span className="text-base font-black text-emerald-600 font-mono">₹{(data?.today?.collected || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* This Month's KPI Card */}
        <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm space-y-3.5 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">This Month's Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <TrendingUp className="w-4.5 h-4.5 text-emerald-600" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="text-xs font-semibold text-slate-400">Total Billed:</span>
              <span className="text-sm font-extrabold text-slate-800 font-mono">₹{(data?.month?.billed || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-baseline border-t border-slate-50 pt-2">
              <span className="text-xs font-semibold text-slate-400">Total Collected:</span>
              <span className="text-base font-black text-emerald-600 font-mono">₹{(data?.month?.collected || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Outstanding Dues KPI Card */}
        <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm space-y-3.5 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Outstanding Dues</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center">
              <Coins className="w-4.5 h-4.5 text-rose-500" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="text-xs font-semibold text-slate-400">Unpaid Balances:</span>
              <span className="text-[20px] font-black text-rose-600 font-mono">₹{(data?.outstanding || 0).toLocaleString()}</span>
            </div>
            <p className="text-[9px] text-slate-400 italic">Across all active treatments matching your clinic settings.</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Procedures and Debtors */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Outstanding Dues Debtors List */}
        <div className="lg:col-span-2 bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-50 pb-3">
            <div className="flex items-center space-x-1.5">
              <span className="text-sm">🟠</span>
              <h2 className="text-xs font-extrabold text-slate-800">Patients with Outstanding Dues</h2>
            </div>
            {/* Search filter input */}
            <div className="relative rounded-xl max-w-[240px] w-full">
              <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                <Search className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                value={searchDebtor}
                onChange={(e) => setSearchDebtor(e.target.value)}
                placeholder="Search patient name or code..."
                className="block w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 outline-none transition-all text-slate-700 font-medium"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            {filteredDebtors.length === 0 ? (
              <p className="text-[11px] text-slate-450 italic py-6 text-center">No outstanding patient balances found.</p>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400">
                    <th className="py-2.5 px-3">Patient</th>
                    <th className="py-2.5 px-3 text-right">Outstanding Dues</th>
                    <th className="py-2.5 px-3 text-center">Contact</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDebtors.map((debtor: any) => (
                    <tr
                      key={debtor._id}
                      className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="py-3 px-3">
                        <p className="font-bold text-slate-800 hover:text-indigo-650 hover:underline">
                          <a href={`/admin/patients/${debtor._id}`}>{debtor.patientName}</a>
                        </p>
                        <span className="text-[9.5px] font-mono text-slate-500 block mt-0.5">Code: {debtor.patientCode}</span>
                      </td>
                      <td className="py-3 px-3 text-right font-black text-rose-600 font-mono">
                        ₹{debtor.due.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-center text-[10.5px] text-slate-600 font-mono">
                        {debtor.phone}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => {
                            const message = `Hello ${debtor.patientName}, this is a friendly payment reminder from our clinic regarding your outstanding treatment balance of ₹${debtor.due.toLocaleString()}. Please get in touch with our receptionist at your earliest convenience to settle this. Thank you!`;
                            const waUrl = `https://wa.me/${debtor.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(message)}`;
                            window.open(waUrl, "_blank");
                            toast.success(`WhatsApp reminder opened for ${debtor.patientName}`);
                          }}
                          className="inline-flex items-center space-x-1 text-[10px] font-bold text-indigo-650 hover:text-indigo-850 hover:underline bg-indigo-50 hover:bg-indigo-100/60 px-2.5 py-1 rounded-lg transition-colors cursor-pointer border border-indigo-100/50"
                        >
                          <span>💬 Remind</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right Column - Top Revenue Procedures List */}
        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-4">
          <div className="border-b border-slate-50 pb-2">
            <h2 className="text-xs font-extrabold text-slate-805 flex items-center space-x-1.5">
              <span>👑</span>
              <span>Top Procedures by Revenue</span>
            </h2>
          </div>

          <div className="space-y-3">
            {(!data?.topProcedures || data.topProcedures.length === 0) ? (
              <p className="text-[11px] text-slate-400 italic py-2">No procedures generated revenue yet.</p>
            ) : (
              data.topProcedures.map((proc: any, index: number) => {
                const colors = [
                  "bg-indigo-50 border-indigo-100 text-indigo-700",
                  "bg-emerald-50 border-emerald-100 text-emerald-700",
                  "bg-amber-50 border-amber-100 text-amber-700",
                  "bg-purple-50 border-purple-100 text-purple-700",
                  "bg-slate-50 border-slate-150 text-slate-700"
                ];
                const badgeColor = colors[index % colors.length];

                return (
                  <div
                    key={proc.name}
                    className="p-3 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-xs transition-all duration-150"
                  >
                    <div className="min-w-0">
                      <p className="font-extrabold text-slate-800 truncate">{proc.name}</p>
                      <span className="text-[9.5px] font-semibold text-slate-450 block mt-0.5">
                        Performed {proc.count} times
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-md border ${badgeColor}`}>
                        ₹{proc.revenue.toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
