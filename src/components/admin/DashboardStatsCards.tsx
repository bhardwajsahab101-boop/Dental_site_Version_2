import React from "react";

interface DashboardStatsCardsProps {
  totalPatients: number;
  totalAppointments: number;
  totalTreatments: number;
  totalRevenue: number;
  outstandingRevenue: number;
  todayAppointments: number;
}

export default function DashboardStatsCards({
  totalPatients,
  totalAppointments,
  totalTreatments,
  totalRevenue,
  outstandingRevenue,
  todayAppointments,
}: DashboardStatsCardsProps) {
  const stats = [
    {
      title: "Patients",
      value: totalPatients,
      emoji: "👥",
      color: "text-indigo-650 bg-indigo-50 border-indigo-100",
    },
    {
      title: "Appointments",
      value: totalAppointments,
      emoji: "📅",
      color: "text-sky-650 bg-sky-50 border-sky-100",
    },
    {
      title: "Treatments",
      value: totalTreatments,
      emoji: "🦷",
      color: "text-amber-650 bg-amber-50 border-amber-100",
    },
    {
      title: "Revenue",
      value: `₹${totalRevenue.toLocaleString()}`,
      emoji: "💰",
      color: "text-emerald-650 bg-emerald-50 border-emerald-100",
    },
    {
      title: "Outstanding",
      value: `₹${outstandingRevenue.toLocaleString()}`,
      emoji: "🟠",
      color: "text-rose-650 bg-rose-50 border-rose-100",
    },
    {
      title: "Today's Visits",
      value: todayAppointments,
      emoji: "📍",
      color: "text-violet-650 bg-violet-50 border-violet-100",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {stats.map((stat, idx) => {
        const isRevenue = stat.title === "Revenue";
        return (
          <div
            key={idx}
            className={`bg-white p-4 rounded-2xl border flex items-center space-x-4 shadow-sm transition-all hover:shadow duration-200 ${
              isRevenue
                ? "border-emerald-200 ring-2 ring-emerald-50 bg-emerald-50/10 col-span-1 sm:col-span-2 xl:col-span-1"
                : "border-slate-100"
            }`}
          >
            <div className={`p-2.5 rounded-xl border shrink-0 text-xl flex items-center justify-center w-11 h-11 ${stat.color}`}>
              {stat.emoji}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none truncate">
                {stat.title}
              </p>
              <h3
                className={`font-black mt-1.5 leading-none ${
                  isRevenue
                    ? "text-xl text-emerald-650 tracking-tight"
                    : "text-xl text-slate-800"
                }`}
              >
                {stat.value}
              </h3>
            </div>
          </div>
        );
      })}
    </div>
  );
}
