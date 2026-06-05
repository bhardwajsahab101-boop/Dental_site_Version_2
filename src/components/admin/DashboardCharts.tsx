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
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 1. Revenue By Month Bar Chart */}
      <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm lg:col-span-2 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Monthly Revenue</h3>
          <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider">
            Total treatment billing per month (Last 6 Months)
          </p>
        </div>

        <div className="h-64 w-full text-[10px]">
          {revenueByMonth.length === 0 || revenueByMonth.every(d => d.Revenue === 0) ? (
            <div className="h-full flex items-center justify-center text-slate-400 italic">
              No revenue data available yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueByMonth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#94a3b8" tickLine={false} axisLine={false} />
                <YAxis
                  stroke="#94a3b8"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `₹${val}`}
                />
                <Tooltip
                  contentStyle={{
                    background: "#ffffff",
                    border: "1px solid #f1f5f9",
                    borderRadius: "12px",
                    fontSize: "11px",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                  formatter={(value: any) => [`₹${value.toLocaleString()}`, "Revenue"]}
                  cursor={{ fill: "#f8fafc" }}
                />
                <Bar dataKey="Revenue" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={36} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 2. Status Distribution Donut Chart */}
      <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Status Allocation</h3>
          <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider">
            Breakdown of appointments by state
          </p>
        </div>

        <div className="h-64 w-full flex flex-col justify-center items-center text-[10px]">
          {appointmentStatusDist.length === 0 ? (
            <p className="text-[11px] text-slate-400 italic">No status data to present.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={appointmentStatusDist}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {appointmentStatusDist.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "#ffffff",
                    border: "1px solid #f1f5f9",
                    borderRadius: "12px",
                    fontSize: "11px",
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  iconSize={6}
                  wrapperStyle={{ fontSize: "10.5px", fontWeight: "600", color: "#64748b" }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 3. Treatments By Type Horizontal Bar Chart */}
      <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm lg:col-span-3 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Top Dental Procedures</h3>
          <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider">
            Frequency distribution of treatments performed
          </p>
        </div>

        <div className="space-y-3.5">
          {treatmentsByType.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 italic">
              No treatment records logged.
            </div>
          ) : (
            treatmentsByType.map((t, idx) => {
              const maxVal = treatmentsByType[0]?.value || 1;
              const percentage = Math.round((t.value / maxVal) * 100);

              const colorClasses = [
                "bg-indigo-605",
                "bg-sky-505",
                "bg-emerald-505",
                "bg-amber-505",
                "bg-rose-505",
              ];
              const barColor = colorClasses[idx % colorClasses.length];

              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span className="truncate max-w-[250px]">{t.name}</span>
                    <span>{t.value} {t.value === 1 ? 'treatment' : 'treatments'}</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
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
