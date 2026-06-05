import React from "react";
import {
  ClipboardList,
  Clock,
  Calendar,
  CheckCircle,
  XCircle
} from "lucide-react";

interface StatsCardsProps {
  total: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
}

export default function StatsCards({
  total,
  pending,
  confirmed,
  completed,
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
      title: "Pending",
      value: pending,
      icon: Clock,
      color: "text-amber-650 bg-amber-50/50 border-amber-100",
    },
    {
      title: "Confirmed",
      value: confirmed,
      icon: Calendar,
      color: "text-sky-650 bg-sky-50/50 border-sky-100",
    },
    {
      title: "Completed",
      value: completed,
      icon: CheckCircle,
      color: "text-emerald-650 bg-emerald-50/50 border-emerald-100",
    },
    {
      title: "Cancelled",
      value: cancelled,
      icon: XCircle,
      color: "text-rose-650 bg-rose-50/50 border-rose-100",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div
            key={idx}
            className="bg-white p-3 rounded-xl border border-slate-100 flex items-center space-x-3 transition-colors hover:border-slate-200/80"
          >
            <div className={`p-2 rounded-lg border shrink-0 ${stat.color}`}>
              <Icon className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider leading-none">
                {stat.title}
              </p>
              <h3 className="text-lg font-bold text-slate-850 mt-1 leading-none">
                {stat.value}
              </h3>
            </div>
          </div>
        );
      })}
    </div>
  );
}
