"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

interface RevenueMonthData {
  name: string;
  Revenue: number;
}

interface TreatmentTypeData {
  name: string;
  value: number;
}

interface AppointmentStatusData {
  name: string;
  value: number;
  color: string;
}

interface DashboardChartsProps {
  revenueByMonth: RevenueMonthData[];
  treatmentsByType: TreatmentTypeData[];
  appointmentStatusDist: AppointmentStatusData[];
}

export default function DashboardCharts({
  revenueByMonth,
  treatmentsByType,
  appointmentStatusDist,
}: DashboardChartsProps) {
  // Cohesive healthcare status colors
  const healthcareStatusPalette: Record<string, string> = {
    requested: "#F59E0B",
    pending: "#F59E0B",
    confirmed: "#0284C7",
    arrived: "#14B8A6",
    in_treatment: "#14213D",
    completed: "#10B981",
    cancelled: "#E11D48",
    no_show: "#94A3B8",
  };

  const formattedStatusDist = appointmentStatusDist.map((item) => ({
    ...item,
    color: healthcareStatusPalette[item.name.toLowerCase().replace(" ", "_")] || item.color || "#14B8A6",
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 1. Revenue By Month Bar Chart */}
      <div className="bg-white border border-[#E2E8F0] p-5 rounded-xl shadow-2xs lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-[#14213D]">Monthly Revenue Inflow</h3>
            <p className="text-[#64748B] text-[11px] font-medium">
              Completed procedure billing per calendar month (Last 6 Months)
            </p>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-[#F0FDFA] text-[#0D9488] border border-[#CCFBF1] px-2.5 py-1 rounded-md">
            INR ₹ Financials
          </span>
        </div>

        <div className="h-64 w-full text-[11px]">
          {revenueByMonth.length === 0 || revenueByMonth.every((d) => d.Revenue === 0) ? (
            <div className="h-full flex items-center justify-center text-[#64748B] text-xs italic">
              No revenue records logged in this timeframe.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueByMonth} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#94A3B8" tickLine={false} axisLine={false} />
                <YAxis
                  stroke="#94A3B8"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `₹${val}`}
                />
                <Tooltip
                  contentStyle={{
                    background: "#FFFFFF",
                    border: "1px solid #E2E8F0",
                    borderRadius: "10px",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#182230",
                    boxShadow: "0 4px 12px rgba(20, 33, 61, 0.08)",
                  }}
                  formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, "Collections"]}
                  cursor={{ fill: "#F4F7FA" }}
                />
                <Bar dataKey="Revenue" fill="#14B8A6" radius={[6, 6, 0, 0]} barSize={34} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 2. Status Distribution Donut Chart */}
      <div className="bg-white border border-[#E2E8F0] p-5 rounded-xl shadow-2xs space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-[#14213D]">Appointment Pipeline</h3>
          <p className="text-[#64748B] text-[11px] font-medium">
            Status proportion of active clinical visits
          </p>
        </div>

        <div className="h-64 w-full flex flex-col justify-center items-center text-[11px]">
          {formattedStatusDist.length === 0 ? (
            <p className="text-xs text-[#64748B] italic">No status distribution records available.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={formattedStatusDist}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {formattedStatusDist.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "#FFFFFF",
                    border: "1px solid #E2E8F0",
                    borderRadius: "10px",
                    fontSize: "11px",
                    boxShadow: "0 4px 12px rgba(20, 33, 61, 0.08)",
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  iconSize={7}
                  wrapperStyle={{ fontSize: "11px", fontWeight: "600", color: "#64748B" }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 3. Top Dental Procedures */}
      <div className="bg-white border border-[#E2E8F0] p-5 rounded-xl shadow-2xs lg:col-span-3 space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#14213D]">Top Clinical Procedures</h3>
            <p className="text-[#64748B] text-[11px] font-medium">
              Frequency distribution of completed and scheduled dental treatments
            </p>
          </div>
          <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded">
            Procedure Insights
          </span>
        </div>

        <div className="space-y-3.5">
          {treatmentsByType.length === 0 ? (
            <div className="py-6 text-center text-xs text-[#64748B] italic">
              No treatment procedures recorded yet.
            </div>
          ) : (
            treatmentsByType.map((t, idx) => {
              const maxVal = treatmentsByType[0]?.value || 1;
              const percentage = Math.max(8, Math.round((t.value / maxVal) * 100));

              // Palette: Navy, Teal, Sky, Emerald, Amber
              const barColors = [
                "bg-[#14213D]",
                "bg-[#14B8A6]",
                "bg-sky-600",
                "bg-emerald-600",
                "bg-amber-600",
              ];
              const barColor = barColors[idx % barColors.length];

              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-[#182230]">
                    <span className="truncate max-w-[320px]">{t.name}</span>
                    <span className="text-[#64748B] font-mono font-medium">
                      {t.value} {t.value === 1 ? "case" : "cases"}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-[#F4F7FA] rounded-full overflow-hidden border border-[#E2E8F0]">
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
  );
}
