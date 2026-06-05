"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  Percent
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line
} from "recharts";

export default function AdminAnalytics() {
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchAnalyticsData();
  }, []);

  async function fetchAnalyticsData() {
    try {
      const res = await fetch("/api/admin/analytics");
      const data = await res.json();
      if (data.success) {
        setAnalyticsData(data.data);
      } else {
        throw new Error(data.message || "Failed to load analytics");
      }
    } catch (error) {
      console.error("Failed to load analytics data:", error);
      toast.error("Error loading analytics metrics");
    } finally {
      setLoading(false);
    }
  }

  if (!mounted) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-48" />
        <div className="h-28 bg-slate-200 rounded w-full" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <div className="w-8 h-8 border-4 border-indigo-650 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-500">Compiling owner analytics...</p>
      </div>
    );
  }

  const {
    totalRevenue,
    totalCollected,
    collectionRate,
    highestRevenuePatients,
    commonProcedures,
    monthlyBreakdown
  } = analyticsData || {
    totalRevenue: 0,
    totalCollected: 0,
    collectionRate: 0,
    highestRevenuePatients: [],
    commonProcedures: [],
    monthlyBreakdown: []
  };

  const currentMonthData = monthlyBreakdown[monthlyBreakdown.length - 1] || { growthRate: 0, collectionRate: 0 };

  const cards = [
    {
      title: "Gross Billed Revenue",
      value: `₹${totalRevenue.toLocaleString()}`,
      description: "Total value of all treatment plans billed",
      icon: CreditCard,
      color: "text-blue-650 bg-blue-50 border-blue-105",
    },
    {
      title: "Collected Revenue",
      value: `₹${totalCollected.toLocaleString()}`,
      description: "Actual cash collections cleared",
      icon: DollarSign,
      color: "text-emerald-650 bg-emerald-50 border-emerald-105",
    },
    {
      title: "Overall Collection Rate",
      value: `${collectionRate}%`,
      description: "Ratio of collections to total billings",
      icon: Percent,
      color: "text-violet-650 bg-violet-50 border-violet-105",
    },
    {
      title: "Monthly Growth Rate",
      value: `${currentMonthData.growthRate >= 0 ? "+" : ""}${currentMonthData.growthRate}%`,
      description: "Revenue change compared to last month",
      icon: currentMonthData.growthRate >= 0 ? TrendingUp : TrendingDown,
      color: currentMonthData.growthRate >= 0 ? "text-emerald-650 bg-emerald-50 border-emerald-105" : "text-rose-650 bg-rose-50 border-rose-105",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
          <span>📊</span>
          <span>Admin & Owner Analytics</span>
        </h1>
        <p className="text-slate-500 text-xs font-semibold mt-1">
          Real-time performance reports, cashflow collections, and growth audits.
        </p>
      </div>

      {/* Analytics KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {card.title}
                </span>
                <div className={`p-1.5 rounded-lg border ${card.color}`}>
                  <Icon className="h-4 w-4 shrink-0" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-black text-slate-800 tracking-tight font-mono">
                  {card.value}
                </p>
                <p className="text-[10px] text-slate-450 font-medium">
                  {card.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Cashflow & Collections Growth Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Billings vs Collections */}
        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-4">
          <div>
            <h3 className="text-xs font-extrabold text-slate-800">Billed vs. Cash Collections</h3>
            <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider mt-0.5">
              Cashflow efficiency comparison (Last 6 Months)
            </p>
          </div>

          <div className="h-64 w-full text-[10px]">
            {monthlyBreakdown.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 italic">No cashflow records.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#94a3b8" tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val}`} />
                  <Tooltip
                    contentStyle={{
                      background: "#ffffff",
                      border: "1px solid #f1f5f9",
                      borderRadius: "12px",
                      fontSize: "11px",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                    formatter={(value: any) => [`₹${value.toLocaleString()}`]}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" iconSize={6} wrapperStyle={{ fontSize: "10.5px", fontWeight: "600" }} />
                  <Bar dataKey="revenue" name="Total Billed" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="collected" name="Cash Collected" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Collection & Growth Rates */}
        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-4">
          <div>
            <h3 className="text-xs font-extrabold text-slate-800">Collection Rate & Growth Trend</h3>
            <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider mt-0.5">
              Monthly metrics auditing (Last 6 Months)
            </p>
          </div>

          <div className="h-64 w-full text-[10px]">
            {monthlyBreakdown.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 italic">No audit records.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyBreakdown} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#94a3b8" tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} tickFormatter={(val) => `${val}%`} />
                  <Tooltip
                    contentStyle={{
                      background: "#ffffff",
                      border: "1px solid #f1f5f9",
                      borderRadius: "12px",
                      fontSize: "11px",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                    formatter={(value: any) => [`${value}%`]}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" iconSize={6} wrapperStyle={{ fontSize: "10.5px", fontWeight: "600" }} />
                  <Line type="monotone" dataKey="collectionRate" name="Collection Rate (%)" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="growthRate" name="Growth Rate (%)" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Grid for top patients and common procedures */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Highest Revenue Patients */}
        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-4">
          <div>
            <h3 className="text-xs font-extrabold text-slate-800">Highest Revenue Patients</h3>
            <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider mt-0.5">
              Top 5 billing patients across all logs
            </p>
          </div>

          <div className="space-y-2.5">
            {highestRevenuePatients.length === 0 ? (
              <p className="text-[11px] text-slate-400 italic">No billing records found.</p>
            ) : (
              highestRevenuePatients.map((patient: any, idx: number) => (
                <div key={patient._id} className="bg-slate-50/50 hover:bg-slate-50 border border-slate-100 p-3 rounded-xl flex items-center justify-between text-xs transition-colors">
                  <div className="flex items-center space-x-3 min-w-0">
                    <span className="text-[10px] font-black text-slate-400 bg-slate-100 border border-slate-205 w-6 h-6 flex items-center justify-center rounded-lg font-mono">
                      #{idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 truncate">
                        <Link href={`/admin/patients/${patient._id}`} className="hover:text-indigo-650 hover:underline">
                          {patient.patientName}
                        </Link>
                      </p>
                      <span className="text-[9.5px] text-slate-500 font-semibold block">
                        Code: {patient.patientCode} • Phone: {patient.phone}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-black text-emerald-650 shrink-0 font-mono">
                    ₹{patient.revenue.toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Most Common Procedures */}
        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-4">
          <div>
            <h3 className="text-xs font-extrabold text-slate-800">Most Common Procedures</h3>
            <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider mt-0.5">
              Top 5 frequency distribution of performed treatments
            </p>
          </div>

          <div className="space-y-3.5">
            {commonProcedures.length === 0 ? (
              <p className="text-[11px] text-slate-400 italic">No procedures recorded yet.</p>
            ) : (
              commonProcedures.map((proc: any, idx: number) => {
                const maxCount = commonProcedures[0]?.count || 1;
                const percentage = Math.round((proc.count / maxCount) * 100);

                const colorClasses = [
                  "bg-indigo-605",
                  "bg-sky-505",
                  "bg-emerald-505",
                  "bg-amber-505",
                  "bg-rose-505",
                ];
                const barColor = colorClasses[idx % colorClasses.length];

                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                      <span className="truncate max-w-[200px]">{proc.name}</span>
                      <span className="text-[10px] text-slate-450 font-bold">
                        {proc.count} times • <span className="text-emerald-655 font-mono font-black">₹{proc.revenue.toLocaleString()}</span>
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                        style={{ width: `${percentage}%` }}
                      />
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
