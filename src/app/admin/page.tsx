"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  CalendarDays,
  Clock,
  ArrowRight,
  User
} from "lucide-react";
import DashboardStatsCards from "../../components/admin/DashboardStatsCards";
import DashboardCharts from "../../components/admin/DashboardCharts";
import { StatsSkeleton } from "../../components/admin/Skeletons";

export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchDashboardData();
    fetchUser();
  }, []);

  async function fetchUser() {
    try {
      const res = await fetch("/api/admin/me");
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
      }
    } catch (err) {
      console.error("Failed to fetch user in dashboard:", err);
    }
  }

  async function fetchDashboardData() {
    try {
      const res = await fetch("/api/admin/dashboard");
      const data = await res.json();
      if (data.success) {
        setDashboardData(data.data);
      } else {
        throw new Error(data.message || "Failed to load dashboard data");
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      toast.error("Error loading dashboard metrics");
    } finally {
      setLoading(false);
    }
  }

  const stats = dashboardData || {
    totalPatients: 0,
    totalAppointments: 0,
    totalTreatments: 0,
    totalRevenue: 0,
    outstandingRevenue: 0,
    todayAppointments: 0,
    revenueToday: 0,
    totalPendingAppointments: 0,
  };

  const recentBookings = dashboardData?.recentAppointments || [];

  // Calculate upcoming appointments (pending/confirmed)
  const upcomingReminders = recentBookings
    .filter((a: any) => a.status === "pending" || a.status === "confirmed")
    .slice(0, 3);

  if (!mounted) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-48" />
        <div className="h-28 bg-slate-200 rounded w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section Banner with Quick Indicators */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white border border-slate-805 p-6 rounded-2xl shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-lg font-extrabold tracking-tight flex items-center space-x-1.5">
            <span>👋</span>
            <span>
              Welcome, {user?.name || "Clinic Staff"} (
              {user?.role ? `${user.role.charAt(0).toUpperCase() + user.role.slice(1)} Portal` : "Clinic Portal"}
              )
            </span>
          </h1>
          <p className="text-slate-400 text-xs font-semibold">
            Manage your clinic operations, billing, and scheduling seamlessly.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <Link
              href="/admin/patients"
              className="inline-flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all shadow-sm"
            >
              <User className="h-3.5 w-3.5 text-slate-400" />
              <span>Search Patients</span>
            </Link>
            <Link
              href="/admin/appointments"
              className="inline-flex items-center space-x-1.5 bg-indigo-650 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all shadow-sm"
            >
              <span>Manage Queue</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Quick Indicators inside banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full lg:w-auto shrink-0 border-t lg:border-t-0 lg:border-l border-slate-800/80 pt-4 lg:pt-0 lg:pl-6">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Pending Queue
            </p>
            <p className="text-base font-extrabold text-amber-500">
              {stats.totalPendingAppointments || 0}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Today's Visits
            </p>
            <p className="text-base font-extrabold text-sky-400">
              {stats.todayAppointments || 0}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Revenue Today
            </p>
            <p className="text-base font-extrabold text-emerald-400 font-mono">
              ₹{(stats.revenueToday || 0).toLocaleString()}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Outstanding
            </p>
            <p className="text-base font-extrabold text-rose-400 font-mono">
              ₹{(stats.outstandingRevenue || 0).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      {loading ? (
        <StatsSkeleton />
      ) : (
        <DashboardStatsCards
          totalPatients={stats.totalPatients}
          totalAppointments={stats.totalAppointments}
          totalTreatments={stats.totalTreatments}
          totalRevenue={stats.totalRevenue}
          outstandingRevenue={stats.outstandingRevenue}
          todayAppointments={stats.todayAppointments}
        />
      )}

      {/* Charts Section */}
      {!loading && dashboardData && (
        <DashboardCharts
          revenueByMonth={dashboardData.revenueByMonth || []}
          treatmentsByType={dashboardData.treatmentsByType || []}
          appointmentStatusDist={dashboardData.appointmentStatus || []}
        />
      )}

      {/* Grid of details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column panels - stack bookings and outstanding dues */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Schedule Panel */}
          <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-50 pb-2">
              <h3 className="text-xs font-extrabold text-slate-800 flex items-center space-x-1.5">
                <CalendarDays className="h-4 w-4 text-slate-400" />
                <span>Recently Booked Appointments</span>
              </h3>
              <Link
                href="/admin/appointments"
                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-850 flex items-center"
              >
                <span>View all</span>
                <ArrowRight className="h-3 w-3 ml-0.5" />
              </Link>
            </div>

            <div className="space-y-2">
              {loading ? (
                [...Array(2)].map((_, i) => (
                  <div key={i} className="h-10 bg-slate-50 rounded-lg animate-pulse" />
                ))
              ) : recentBookings.length === 0 ? (
                <p className="text-[11px] text-slate-400 italic">No bookings recorded yet.</p>
              ) : (
                recentBookings.map((app: any) => {
                  const patientName = app.patientId?.fullName || app.fullName || "Standalone Patient";
                  return (
                    <div
                      key={app._id}
                      className="bg-slate-50/50 hover:bg-slate-50 border border-slate-100 p-3 rounded-xl flex items-center justify-between text-xs transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 truncate">
                          {app.patientId ? (
                            <Link href={`/admin/patients/${app.patientId._id}`} className="hover:text-indigo-600 hover:underline">
                              {patientName}
                            </Link>
                          ) : (
                            patientName
                          )}
                        </p>
                        <span className="text-[10px] text-slate-450 mt-0.5 block font-medium">
                          {app.service} • {new Date(app.appointmentDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} at {app.appointmentTime}
                        </span>
                      </div>
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border shrink-0 ${app.status === "pending"
                            ? "bg-amber-50 text-amber-600 border-amber-100"
                            : app.status === "confirmed"
                              ? "bg-blue-50 text-blue-600 border-blue-100"
                              : app.status === "completed"
                                ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                : "bg-rose-50 text-rose-600 border-rose-100"
                          }`}
                      >
                        {app.status}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Outstanding Payments Widget */}
          <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-50 pb-2">
              <h3 className="text-xs font-extrabold text-slate-800 flex items-center space-x-1.5">
                <span className="text-sm">🟠</span>
                <span>Outstanding Payments</span>
              </h3>
              <span className="text-[9.5px] font-bold text-slate-400 bg-slate-50 border border-slate-100 rounded-full px-2 py-0.5">
                Follow-ups Pending
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {loading ? (
                [...Array(2)].map((_, i) => (
                  <div key={i} className="h-12 bg-slate-50 rounded-lg animate-pulse" />
                ))
              ) : !dashboardData?.outstandingPayments || dashboardData.outstandingPayments.length === 0 ? (
                <p className="text-[11px] text-slate-400 italic py-1 col-span-2">No outstanding dues recorded.</p>
              ) : (
                dashboardData.outstandingPayments.map((payment: any) => (
                  <div
                    key={payment._id}
                    className="bg-slate-50/50 hover:bg-slate-50 border border-slate-100 p-3 rounded-xl flex items-center justify-between text-xs transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 truncate">
                        <Link href={`/admin/patients/${payment._id}`} className="hover:text-indigo-600 hover:underline">
                          {payment.patientName}
                        </Link>
                      </p>
                      <span className="text-[9.5px] text-slate-500 font-semibold block mt-0.5">
                        Code: {payment.patientCode}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-black text-rose-600">
                        ₹{payment.due.toLocaleString()} Due
                      </span>
                      <button
                        onClick={() => toast.success(`Reminder sent to ${payment.patientName} (${payment.phone})`)}
                        type="button"
                        className="block text-[8px] font-bold mt-1 text-indigo-650 hover:text-indigo-850 hover:underline w-full text-right cursor-pointer"
                      >
                        Remind
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right column panels */}
        <div className="space-y-6">
          {/* Today's Schedule Widget */}
          <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-50 pb-2">
              <h3 className="text-xs font-extrabold text-slate-805 flex items-center space-x-1.5">
                <Clock className="h-4 w-4 text-indigo-500" />
                <span>Today's Schedule</span>
              </h3>
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                {stats.todayAppointments || 0} Visits
              </span>
            </div>

            <div className="space-y-2">
              {loading ? (
                [...Array(2)].map((_, i) => (
                  <div key={i} className="h-10 bg-slate-50 rounded-lg animate-pulse" />
                ))
              ) : !dashboardData?.todaySchedule || dashboardData.todaySchedule.length === 0 ? (
                <p className="text-[11px] text-slate-400 italic py-1">No appointments scheduled for today.</p>
              ) : (
                dashboardData.todaySchedule.map((app: any) => (
                  <div
                    key={app._id}
                    className="bg-slate-50/50 hover:bg-slate-50 border border-slate-100 p-2.5 rounded-xl flex items-center justify-between text-xs transition-colors"
                  >
                    <div className="flex items-center space-x-2.5">
                      <span className="text-[10px] font-extrabold text-indigo-655 bg-indigo-50 border border-indigo-100/50 px-2 py-0.5 rounded-md min-w-[50px] text-center font-mono">
                        {app.time}
                      </span>
                      <span className="font-bold text-slate-800">
                        {app.patientId ? (
                          <Link href={`/admin/patients/${app.patientId}`} className="hover:text-indigo-600 hover:underline">
                            {app.patientName}
                          </Link>
                        ) : (
                          app.patientName
                        )}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-450 font-medium truncate max-w-[100px]">
                      {app.service}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Top Revenue Patients Widget */}
          <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-50 pb-2">
              <h3 className="text-xs font-extrabold text-slate-805 flex items-center space-x-1.5">
                <span className="text-sm">👑</span>
                <span>Top Revenue Patients</span>
              </h3>
              <span className="text-[9px] font-bold text-slate-400">Lifetime Billing</span>
            </div>

            <div className="space-y-2">
              {loading ? (
                [...Array(2)].map((_, i) => (
                  <div key={i} className="h-10 bg-slate-50 rounded-lg animate-pulse" />
                ))
              ) : !dashboardData?.topRevenuePatients || dashboardData.topRevenuePatients.length === 0 ? (
                <p className="text-[11px] text-slate-400 italic py-1">No treatments billed yet.</p>
              ) : (
                dashboardData.topRevenuePatients.map((patient: any) => (
                  <div
                    key={patient._id}
                    className="bg-slate-50/50 hover:bg-slate-50 border border-slate-100 p-2.5 rounded-xl flex items-center justify-between text-xs transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 truncate">
                        <Link href={`/admin/patients/${patient._id}`} className="hover:text-indigo-600 hover:underline">
                          {patient.patientName}
                        </Link>
                      </p>
                      <span className="text-[9.5px] text-slate-500 font-semibold block">
                        Code: {patient.patientCode}
                      </span>
                    </div>
                    <span className="text-xs font-black text-emerald-650 shrink-0">
                      ₹{patient.revenue.toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Patient Reminders Panel */}
          <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center border-b border-slate-50 pb-2">
              <Clock className="h-4 w-4 text-indigo-500 mr-1.5" />
              <h3 className="text-xs font-extrabold text-slate-805">Patient Reminders</h3>
            </div>

            <div className="space-y-3.5">
              {loading ? (
                [...Array(2)].map((_, i) => (
                  <div key={i} className="h-16 bg-slate-50 rounded-lg animate-pulse" />
                ))
              ) : upcomingReminders.length === 0 ? (
                <p className="text-[11px] text-slate-450 italic">No pending notifications needed.</p>
              ) : (
                upcomingReminders.map((app: any) => {
                  const patientName = app.patientId?.fullName || app.fullName || "Patient";
                  const phone = app.patientId?.phone || app.phone || "";
                  return (
                    <div key={app._id} className="bg-slate-50/50 hover:bg-slate-50 border border-slate-105 p-3 rounded-xl text-xs space-y-2.5 transition-all">
                      <div className="flex justify-between items-start">
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 truncate">{patientName}</p>
                          <p className="text-[9.5px] text-slate-500 font-semibold mt-0.5 truncate">
                            {app.service} • {app.appointmentTime}
                          </p>
                        </div>
                        <span className={`text-[8.5px] font-bold uppercase px-1.5 rounded border shrink-0 ${app.status === 'confirmed' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                          }`}>
                          {app.status}
                        </span>
                      </div>

                      <div className="flex gap-1.5 justify-end pt-1 border-t border-slate-100/50">
                        <button
                          onClick={() => toast.success(`WhatsApp reminder sent to ${patientName} (${phone})`)}
                          type="button"
                          title="WhatsApp Reminder"
                          className="p-1.5 bg-slate-50 hover:bg-emerald-50 text-emerald-600 border border-slate-205 hover:border-emerald-250 rounded-lg transition-colors cursor-pointer text-xs"
                        >
                          🟢
                        </button>
                        <button
                          onClick={() => toast.success(`SMS reminder sent to ${patientName}`)}
                          type="button"
                          title="SMS Reminder"
                          className="p-1.5 bg-slate-50 hover:bg-sky-50 text-sky-600 border border-slate-205 hover:border-sky-250 rounded-lg transition-colors cursor-pointer text-xs"
                        >
                          📱
                        </button>
                        <button
                          onClick={() => toast.success(`Email reminder sent to ${app.patientId?.email || app.email || 'patient@example.com'}`)}
                          type="button"
                          title="Email Reminder"
                          className="p-1.5 bg-slate-50 hover:bg-indigo-50 text-indigo-600 border border-slate-205 hover:border-indigo-250 rounded-lg transition-colors cursor-pointer text-xs"
                        >
                          📧
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Recent Activity Panel */}
          <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-50 pb-2">
              <h3 className="text-xs font-extrabold text-slate-805 flex items-center space-x-1.5">
                <span className="text-sm">⚡</span>
                <span>Recent Clinic Activity</span>
              </h3>
              <span className="text-[9px] font-bold text-slate-400">Live Audits</span>
            </div>

            <div className="space-y-3">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <div key={i} className="h-12 bg-slate-50 rounded-lg animate-pulse" />
                ))
              ) : !dashboardData?.recentActivity || dashboardData.recentActivity.length === 0 ? (
                <p className="text-[11px] text-slate-400 italic py-1">No recent activities recorded.</p>
              ) : (
                <div className="relative border-l border-slate-100 pl-3.5 space-y-3.5 ml-1">
                  {dashboardData.recentActivity.map((log: any) => {
                    const dateObj = new Date(log.createdAt);
                    const timeLabel = isNaN(dateObj.getTime())
                      ? "Just now"
                      : dateObj.toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                      });

                    return (
                      <div key={log._id} className="relative group text-[11px]">
                        {/* Dot */}
                        <span className="absolute -left-[18.5px] top-1 w-1.5 h-1.5 bg-indigo-500 rounded-full border border-white ring-2 ring-white shadow-sm shrink-0" />
                        <div>
                          <p className="font-bold text-slate-800">
                            {log.action}
                          </p>
                          <p className="text-slate-500 text-[10px] leading-relaxed mt-0.5">
                            {log.details}
                          </p>
                          <span className="text-[8.5px] text-slate-450 font-semibold block mt-0.5">
                            {log.userName} ({log.userRole}) • {timeLabel}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}