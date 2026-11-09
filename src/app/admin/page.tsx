"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  CalendarDays,
  Clock,
  ArrowRight,
  User,
  Users,
  AlertCircle,
  Award,
  Activity,
  Send,
  MessageCircle,
  Smartphone,
  Mail,
  Calendar,
  Sparkles
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
      {/* Welcome Section Banner with Quick Key Performance Indicators */}
      <div className="bg-[#14213D] text-white border border-[#1D2D52] p-6 rounded-2xl shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#14B8A6]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="space-y-2 relative z-10">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#14B8A6] bg-[#14B8A6]/15 border border-[#14B8A6]/30 px-2.5 py-0.5 rounded-full">
              Clinical Operations
            </span>
            <span className="text-xs text-slate-300 font-medium">DentalOS v2.4</span>
          </div>

          <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center space-x-2">
            <span>
              Welcome, {user?.name || "Clinic Staff"} (
              {user?.role ? `${user.role.charAt(0).toUpperCase() + user.role.slice(1)} Portal` : "Clinical Portal"}
              )
            </span>
          </h1>
          <p className="text-slate-300 text-xs font-normal max-w-xl">
            Real-time patient queue, treatment diagnostics, and clinic financial overview.
          </p>

          <div className="flex items-center gap-2.5 pt-2">
            <Link
              href="/admin/patient-scanner"
              className="inline-flex items-center space-x-2 bg-[#14B8A6] hover:bg-[#0D9488] text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>AI Register Scanner</span>
            </Link>
            <Link
              href="/admin/patients"
              className="inline-flex items-center space-x-1.5 bg-[#1D2D52] hover:bg-[#253966] text-slate-200 border border-[#2A3F6D] px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
            >
              <Users className="h-3.5 w-3.5 text-slate-400" />
              <span>Patient Directory</span>
            </Link>
            <Link
              href="/admin/appointments"
              className="inline-flex items-center space-x-1.5 bg-[#1D2D52] hover:bg-[#253966] text-slate-200 border border-[#2A3F6D] px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
            >
              <span>Manage Queue</span>
              <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
            </Link>
          </div>
        </div>

        {/* Quick Indicators inside banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full lg:w-auto shrink-0 border-t lg:border-t-0 lg:border-l border-[#1D2D52] pt-4 lg:pt-0 lg:pl-6 relative z-10">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Pending Queue
            </p>
            <p className="text-lg font-extrabold text-amber-400 font-mono">
              {stats.totalPendingAppointments || 0}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Today's Visits
            </p>
            <p className="text-lg font-extrabold text-[#14B8A6] font-mono">
              {stats.todayAppointments || 0}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Revenue Today
            </p>
            <p className="text-lg font-extrabold text-emerald-400 font-mono">
              ₹{(stats.revenueToday || 0).toLocaleString()}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Outstanding
            </p>
            <p className="text-lg font-extrabold text-rose-400 font-mono">
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
          totalPendingAppointments={stats.totalPendingAppointments}
          totalConfirmedAppointments={stats.totalConfirmedAppointments}
          newEnquiries={stats.newEnquiries}
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
          <div className="bg-white border border-[#E2E8F0] p-5 rounded-xl shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-[#14213D] flex items-center space-x-2">
                <CalendarDays className="h-4 w-4 text-[#14B8A6]" />
                <span>Recently Booked Appointments</span>
              </h3>
              <Link
                href="/admin/appointments"
                className="text-[11px] font-bold text-[#14B8A6] hover:text-[#0D9488] flex items-center"
              >
                <span>View all</span>
                <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </div>

            <div className="space-y-2">
              {loading ? (
                [...Array(2)].map((_, i) => (
                  <div key={i} className="h-10 bg-slate-50 rounded-lg animate-pulse" />
                ))
              ) : recentBookings.length === 0 ? (
                <p className="text-xs text-[#64748B] italic py-2">No bookings recorded yet.</p>
              ) : (
                recentBookings.map((app: any) => {
                  const patientName = app.patientId?.fullName || app.fullName || "Registered Patient";
                  return (
                    <div
                      key={app._id}
                      className="bg-[#F4F7FA]/60 hover:bg-[#F4F7FA] border border-[#E2E8F0] p-3 rounded-lg flex items-center justify-between text-xs transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-[#182230] truncate">
                          {app.patientId ? (
                            <Link href={`/admin/patients/${app.patientId._id}`} className="hover:text-[#14B8A6] transition-colors">
                              {patientName}
                            </Link>
                          ) : (
                            patientName
                          )}
                        </p>
                        <span className="text-[11px] text-[#64748B] mt-0.5 block font-medium">
                          {app.service} • {new Date(app.appointmentDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} at {app.appointmentTime || "Time TBD"}
                        </span>
                      </div>
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border shrink-0 ${
                          app.status === "pending" || app.status === "requested"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : app.status === "confirmed"
                              ? "bg-sky-50 text-sky-700 border-sky-200"
                              : app.status === "completed"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-rose-50 text-rose-700 border-rose-200"
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
          <div className="bg-white border border-[#E2E8F0] p-5 rounded-xl shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-[#14213D] flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <span>Outstanding Dues & Follow-ups</span>
              </h3>
              <span className="text-[10px] font-semibold text-[#64748B] bg-[#F4F7FA] border border-[#E2E8F0] rounded-md px-2 py-0.5">
                Billing Attention
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {loading ? (
                [...Array(2)].map((_, i) => (
                  <div key={i} className="h-12 bg-slate-50 rounded-lg animate-pulse" />
                ))
              ) : !dashboardData?.outstandingPayments || dashboardData.outstandingPayments.length === 0 ? (
                <p className="text-xs text-[#64748B] italic py-2 col-span-2">All patient treatment balances are fully settled.</p>
              ) : (
                dashboardData.outstandingPayments.map((payment: any) => (
                  <div
                    key={payment._id}
                    className="bg-[#F4F7FA]/60 hover:bg-[#F4F7FA] border border-[#E2E8F0] p-3 rounded-lg flex items-center justify-between text-xs transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-[#182230] truncate">
                        <Link href={`/admin/patients/${payment._id}`} className="hover:text-[#14B8A6] transition-colors">
                          {payment.patientName}
                        </Link>
                      </p>
                      <span className="text-[10px] text-[#64748B] font-mono block mt-0.5">
                        Code: {payment.patientCode}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-extrabold text-rose-600 font-mono">
                        ₹{payment.due.toLocaleString()} Due
                      </span>
                      <button
                        onClick={() => toast.success(`Payment reminder sent to ${payment.patientName} (${payment.phone})`)}
                        type="button"
                        className="block text-[10px] font-bold mt-1 text-[#14B8A6] hover:text-[#0D9488] hover:underline w-full text-right cursor-pointer"
                      >
                        Send Reminder
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
          <div className="bg-white border border-[#E2E8F0] p-5 rounded-xl shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-[#14213D] flex items-center space-x-2">
                <Clock className="h-4 w-4 text-[#14B8A6]" />
                <span>Today's Clinic Queue</span>
              </h3>
              <span className="text-[10px] font-bold text-[#0D9488] bg-[#CCFBF1] px-2 py-0.5 rounded-full">
                {stats.todayAppointments || 0} Visits
              </span>
            </div>

            <div className="space-y-2">
              {loading ? (
                [...Array(2)].map((_, i) => (
                  <div key={i} className="h-10 bg-slate-50 rounded-lg animate-pulse" />
                ))
              ) : !dashboardData?.todaySchedule || dashboardData.todaySchedule.length === 0 ? (
                <p className="text-xs text-[#64748B] italic py-1">No appointments scheduled for today.</p>
              ) : (
                dashboardData.todaySchedule.map((app: any) => (
                  <div
                    key={app._id}
                    className="bg-[#F4F7FA]/60 hover:bg-[#F4F7FA] border border-[#E2E8F0] p-2.5 rounded-lg flex items-center justify-between text-xs transition-colors"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <span className="text-[10px] font-extrabold text-[#14213D] bg-white border border-[#E2E8F0] px-2 py-0.5 rounded-md min-w-[50px] text-center font-mono shrink-0">
                        {app.time}
                      </span>
                      <span className="font-bold text-[#182230] truncate">
                        {app.patientId ? (
                          <Link href={`/admin/patients/${app.patientId}`} className="hover:text-[#14B8A6] transition-colors">
                            {app.patientName}
                          </Link>
                        ) : (
                          app.patientName
                        )}
                      </span>
                    </div>
                    <span className="text-[10px] text-[#64748B] font-medium truncate max-w-[100px] shrink-0">
                      {app.service}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Top Revenue Patients Widget */}
          <div className="bg-white border border-[#E2E8F0] p-5 rounded-xl shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-[#14213D] flex items-center space-x-2">
                <Award className="h-4 w-4 text-amber-500" />
                <span>Top Revenue Patients</span>
              </h3>
              <span className="text-[10px] font-semibold text-[#64748B]">Lifetime Value</span>
            </div>

            <div className="space-y-2">
              {loading ? (
                [...Array(2)].map((_, i) => (
                  <div key={i} className="h-10 bg-slate-50 rounded-lg animate-pulse" />
                ))
              ) : !dashboardData?.topRevenuePatients || dashboardData.topRevenuePatients.length === 0 ? (
                <p className="text-xs text-[#64748B] italic py-1">No treatments billed yet.</p>
              ) : (
                dashboardData.topRevenuePatients.map((patient: any) => (
                  <div
                    key={patient._id}
                    className="bg-[#F4F7FA]/60 hover:bg-[#F4F7FA] border border-[#E2E8F0] p-2.5 rounded-lg flex items-center justify-between text-xs transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-[#182230] truncate">
                        <Link href={`/admin/patients/${patient._id}`} className="hover:text-[#14B8A6] transition-colors">
                          {patient.patientName}
                        </Link>
                      </p>
                      <span className="text-[10px] text-[#64748B] font-mono block">
                        Code: {patient.patientCode}
                      </span>
                    </div>
                    <span className="text-xs font-extrabold text-emerald-700 font-mono shrink-0">
                      ₹{patient.revenue.toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Patient Reminders Panel */}
          <div className="bg-white border border-[#E2E8F0] p-5 rounded-xl shadow-2xs space-y-4">
            <div className="flex items-center border-b border-slate-100 pb-3">
              <Send className="h-4 w-4 text-[#14B8A6] mr-2" />
              <h3 className="text-xs font-bold text-[#14213D]">Visit Notifications & Reminders</h3>
            </div>

            <div className="space-y-3">
              {loading ? (
                [...Array(2)].map((_, i) => (
                  <div key={i} className="h-16 bg-slate-50 rounded-lg animate-pulse" />
                ))
              ) : upcomingReminders.length === 0 ? (
                <p className="text-xs text-[#64748B] italic">No pending notifications required.</p>
              ) : (
                upcomingReminders.map((app: any) => {
                  const patientName = app.patientId?.fullName || app.fullName || "Patient";
                  const phone = app.patientId?.phone || app.phone || "";
                  return (
                    <div key={app._id} className="bg-[#F4F7FA]/60 hover:bg-[#F4F7FA] border border-[#E2E8F0] p-3 rounded-lg text-xs space-y-2.5 transition-all">
                      <div className="flex justify-between items-start">
                        <div className="min-w-0">
                          <p className="font-bold text-[#182230] truncate">{patientName}</p>
                          <p className="text-[10px] text-[#64748B] mt-0.5 truncate">
                            {app.service} • {app.appointmentTime || "Scheduled"}
                          </p>
                        </div>
                        <span
                          className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded border shrink-0 ${
                            app.status === "confirmed"
                              ? "bg-sky-50 text-sky-700 border-sky-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {app.status}
                        </span>
                      </div>

                      <div className="flex gap-2 justify-end pt-2 border-t border-[#E2E8F0]">
                        <button
                          onClick={() => toast.success(`WhatsApp reminder sent to ${patientName} (${phone})`)}
                          type="button"
                          title="WhatsApp Reminder"
                          className="inline-flex items-center space-x-1 px-2 py-1 bg-white hover:bg-emerald-50 text-emerald-700 border border-[#E2E8F0] hover:border-emerald-300 rounded-md transition-colors cursor-pointer text-[10px] font-semibold"
                        >
                          <MessageCircle className="h-3 w-3 text-emerald-600" />
                          <span>WhatsApp</span>
                        </button>
                        <button
                          onClick={() => toast.success(`SMS reminder sent to ${patientName}`)}
                          type="button"
                          title="SMS Reminder"
                          className="inline-flex items-center space-x-1 px-2 py-1 bg-white hover:bg-sky-50 text-sky-700 border border-[#E2E8F0] hover:border-sky-300 rounded-md transition-colors cursor-pointer text-[10px] font-semibold"
                        >
                          <Smartphone className="h-3 w-3 text-sky-600" />
                          <span>SMS</span>
                        </button>
                        <button
                          onClick={() => toast.success(`Email reminder sent to ${app.patientId?.email || app.email || "patient@example.com"}`)}
                          type="button"
                          title="Email Reminder"
                          className="inline-flex items-center space-x-1 px-2 py-1 bg-white hover:bg-[#F0FDFA] text-[#0D9488] border border-[#E2E8F0] hover:border-[#14B8A6]/40 rounded-md transition-colors cursor-pointer text-[10px] font-semibold"
                        >
                          <Mail className="h-3 w-3 text-[#14B8A6]" />
                          <span>Email</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Recent Clinic Activity Panel */}
          <div className="bg-white border border-[#E2E8F0] p-5 rounded-xl shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-[#14213D] flex items-center space-x-2">
                <Activity className="h-4 w-4 text-[#14B8A6]" />
                <span>Recent Clinic Activity</span>
              </h3>
              <span className="text-[9px] font-bold text-[#64748B] uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded">
                Live Audit
              </span>
            </div>

            <div className="space-y-3">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <div key={i} className="h-12 bg-slate-50 rounded-lg animate-pulse" />
                ))
              ) : !dashboardData?.recentActivity || dashboardData.recentActivity.length === 0 ? (
                <p className="text-xs text-[#64748B] italic py-1">No recent activities recorded.</p>
              ) : (
                <div className="relative border-l border-[#E2E8F0] pl-3.5 space-y-3.5 ml-1">
                  {dashboardData.recentActivity.map((log: any) => {
                    const dateObj = new Date(log.createdAt);
                    const timeLabel = isNaN(dateObj.getTime())
                      ? "Just now"
                      : dateObj.toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        });

                    return (
                      <div key={log._id} className="relative group text-xs">
                        {/* Dot */}
                        <span className="absolute -left-[18.5px] top-1 w-2 h-2 bg-[#14B8A6] rounded-full border-2 border-white shadow-2xs shrink-0" />
                        <div>
                          <p className="font-bold text-[#182230]">
                            {log.action}
                          </p>
                          <p className="text-[#64748B] text-[11px] leading-relaxed mt-0.5">
                            {log.details}
                          </p>
                          <span className="text-[10px] text-[#64748B] font-medium block mt-0.5">
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
