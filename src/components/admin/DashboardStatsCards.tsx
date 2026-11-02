import React from "react";

interface DashboardStatsCardsProps {
  totalPatients: number;
  totalAppointments: number;
  totalPendingAppointments?: number;
  totalConfirmedAppointments?: number;
  newEnquiries?: number;
  totalTreatments: number;
  totalRevenue: number;
  outstandingRevenue: number;
  todayAppointments: number;
}

export default function DashboardStatsCards({
  totalPatients,
  totalAppointments,
  totalPendingAppointments = 0,
  totalConfirmedAppointments = 0,
  newEnquiries = 0,
  totalTreatments,
  totalRevenue,
  outstandingRevenue,
  todayAppointments,
}: DashboardStatsCardsProps) {
  const stats = [
    {
      title: "Total Requests",
      value: totalAppointments,
      emoji: "📅",
      color: "text-[#102C46] bg-slate-100 border-slate-200",
    },
    {
      title: "Pending Requests",
      value: totalPendingAppointments,
      emoji: "⏳",
      color: "text-amber-700 bg-amber-50 border-amber-200",
    },
    {
      title: "Confirmed",
      value: totalConfirmedAppointments,
      emoji: "✅",
      color: "text-emerald-700 bg-emerald-50 border-emerald-200",
    },
    {
      title: "New Enquiries",
      value: newEnquiries,
      emoji: "💬",
      color: "text-[#16A6A1] bg-[#E6F7F6] border-[#16A6A1]/30",
    },
    {
      title: "Patients",
      value: totalPatients,
      emoji: "👥",
      color: "text-indigo-700 bg-indigo-50 border-indigo-200",
    },
    {
      title: "Today's Visits",
      value: todayAppointments,
      emoji: "📍",
      color: "text-violet-700 bg-violet-50 border-violet-200",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {stats.map((stat, idx) => (
        <div
          key={idx}
          className="bg-white p-4 rounded-2xl border border-slate-200/90 flex items-center space-x-3.5 shadow-xs transition-all hover:shadow duration-200"
        >
          <div
            className={`p-2.5 rounded-xl border shrink-0 text-xl flex items-center justify-center w-11 h-11 ${stat.color}`}
          >
            {stat.emoji}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none truncate">
              {stat.title}
            </p>
            <h3 className="font-extrabold text-xl text-[#102C46] mt-1.5 leading-none">
              {stat.value}
            </h3>
          </div>
        </div>
      ))}
    </div>
  );
}
