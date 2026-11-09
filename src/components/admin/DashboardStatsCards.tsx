import React from "react";
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  MessageSquare,
  Users,
  Stethoscope
} from "lucide-react";

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
      title: "Total Appointments",
      value: totalAppointments,
      icon: CalendarDays,
      iconBg: "bg-[#14213D]/5 text-[#14213D] border-[#14213D]/10",
    },
    {
      title: "Pending Requests",
      value: totalPendingAppointments,
      icon: Clock,
      iconBg: "bg-amber-50 text-amber-600 border-amber-200",
    },
    {
      title: "Confirmed Visits",
      value: totalConfirmedAppointments,
      icon: CheckCircle2,
      iconBg: "bg-emerald-50 text-emerald-600 border-emerald-200",
    },
    {
      title: "New Enquiries",
      value: newEnquiries,
      icon: MessageSquare,
      iconBg: "bg-[#CCFBF1] text-[#0D9488] border-[#14B8A6]/20",
    },
    {
      title: "Registered Patients",
      value: totalPatients,
      icon: Users,
      iconBg: "bg-[#14213D]/10 text-[#14213D] border-[#14213D]/20",
    },
    {
      title: "Today's Schedule",
      value: todayAppointments,
      icon: Stethoscope,
      iconBg: "bg-sky-50 text-sky-600 border-sky-200",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div
            key={idx}
            className="bg-white p-4 rounded-xl border border-[#E2E8F0] flex items-center space-x-3.5 shadow-2xs hover:shadow-xs hover:border-[#14B8A6]/40 transition-all duration-150"
          >
            <div
              className={`p-2.5 rounded-lg border shrink-0 flex items-center justify-center w-11 h-11 ${stat.iconBg}`}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider leading-none truncate">
                {stat.title}
              </p>
              <h3 className="font-extrabold text-xl text-[#14213D] mt-1.5 leading-none">
                {stat.value.toLocaleString()}
              </h3>
            </div>
          </div>
        );
      })}
    </div>
  );
}
