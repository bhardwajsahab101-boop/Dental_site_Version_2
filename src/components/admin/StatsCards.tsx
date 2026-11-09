import React from "react";
import {
  ClipboardList,
  Clock,
  Calendar,
  UserCheck,
  Stethoscope,
  CheckCircle,
  EyeOff,
  XCircle
} from "lucide-react";

interface StatsCardsProps {
  total: number;
  requested: number;
  confirmed: number;
  arrived: number;
  inTreatment: number;
  completed: number;
  noShow: number;
  cancelled: number;
}

export default function StatsCards({
  total,
  requested,
  confirmed,
  arrived,
  inTreatment,
  completed,
  noShow,
  cancelled,
}: StatsCardsProps) {
  const stats = [
    {
      title: "Total Queue",
      value: total,
      icon: ClipboardList,
      color: "text-[#14213D] bg-[#14213D]/5 border-[#14213D]/10",
    },
    {
      title: "Requested",
      value: requested,
      icon: Clock,
      color: "text-amber-700 bg-amber-50 border-amber-200",
    },
    {
      title: "Confirmed",
      value: confirmed,
      icon: Calendar,
      color: "text-sky-700 bg-sky-50 border-sky-200",
    },
    {
      title: "Arrived",
      value: arrived,
      icon: UserCheck,
      color: "text-[#0D9488] bg-[#CCFBF1] border-[#14B8A6]/20",
    },
    {
      title: "In Treatment",
      value: inTreatment,
      icon: Stethoscope,
      color: "text-[#14213D] bg-[#14213D]/10 border-[#14213D]/20",
    },
    {
      title: "Completed",
      value: completed,
      icon: CheckCircle,
      color: "text-emerald-700 bg-emerald-50 border-emerald-200",
    },
    {
      title: "No Show",
      value: noShow,
      icon: EyeOff,
      color: "text-slate-600 bg-slate-100 border-slate-200",
    },
    {
      title: "Cancelled",
      value: cancelled,
      icon: XCircle,
      color: "text-rose-700 bg-rose-50 border-rose-200",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div
            key={idx}
            className="bg-white p-3 rounded-xl border border-[#E2E8F0] flex flex-col justify-between shadow-2xs hover:shadow-xs hover:border-[#14B8A6]/40 transition-all duration-150"
          >
            <div className="flex items-center justify-between">
              <p className="text-[9px] font-bold text-[#64748B] uppercase tracking-wider leading-none">
                {stat.title}
              </p>
              <div className={`p-1.5 rounded-lg border shrink-0 ${stat.color}`}>
                <Icon className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <h3 className="font-extrabold text-lg text-[#14213D] leading-none">
                {stat.value}
              </h3>
            </div>
          </div>
        );
      })}
    </div>
  );
}
