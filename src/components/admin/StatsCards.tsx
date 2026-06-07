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
      title: "Total",
      value: total,
      icon: ClipboardList,
      color: "text-slate-650 bg-slate-50 border-slate-200/50",
    },
    {
      title: "Requested",
      value: requested,
      icon: Clock,
      color: "text-amber-650 bg-amber-50/50 border-amber-100",
    },
    {
      title: "Confirmed",
      value: confirmed,
      icon: Calendar,
      color: "text-blue-650 bg-blue-50/50 border-blue-100",
    },
    {
      title: "Arrived",
      value: arrived,
      icon: UserCheck,
      color: "text-indigo-650 bg-indigo-50/50 border-indigo-100",
    },
    {
      title: "In Treatment",
      value: inTreatment,
      icon: Stethoscope,
      color: "text-purple-650 bg-purple-50/50 border-purple-100",
    },
    {
      title: "Completed",
      value: completed,
      icon: CheckCircle,
      color: "text-emerald-650 bg-emerald-50/50 border-emerald-100",
    },
    {
      title: "No Show",
      value: noShow,
      icon: EyeOff,
      color: "text-slate-500 bg-slate-100 border-slate-200",
    },
    {
      title: "Cancelled",
      value: cancelled,
      icon: XCircle,
      color: "text-rose-650 bg-rose-50/50 border-rose-100",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div
            key={idx}
            className="bg-white p-2.5 rounded-xl border border-slate-100 flex flex-col justify-between transition-colors hover:border-slate-200/80 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none">
                {stat.title}
              </p>
              <div className={`p-1.5 rounded-lg border shrink-0 ${stat.color}`}>
                <Icon className="h-3.5 w-3.5" />
              </div>
            </div>
            <h3 className="text-base font-extrabold text-slate-800 mt-2.5 leading-none">
              {stat.value}
            </h3>
          </div>
        );
      })}
    </div>
  );
}
