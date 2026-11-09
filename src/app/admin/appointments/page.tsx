"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Loader2,
  RefreshCw,
  FilterX,
  CalendarCheck
} from "lucide-react";
import StatsCards from "../../../components/admin/StatsCards";
import SearchFilterUI from "../../../components/admin/SearchFilterUI";
import AppointmentCard from "../../../components/admin/AppointmentCard";
import {
  StatsSkeleton,
  AppointmentListSkeleton
} from "../../../components/admin/Skeletons";

interface Appointment {
  _id: string;
  patientId?: {
    _id: string;
    fullName: string;
    phone: string;
    email?: string;
    patientCode?: string;
  };
  service: string;
  appointmentDate: string;
  appointmentTime?: string;
  notes?: string;
  status: "requested" | "confirmed" | "arrived" | "in_treatment" | "completed" | "no_show" | "cancelled";
  createdAt: string;
  updatedAt: string;
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedService, setSelectedService] = useState("all");

  useEffect(() => {
    setMounted(true);
    fetchAppointments();
  }, []);

  async function fetchAppointments() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/appointments", { cache: "no-store" });
      if (!res.ok) {
        throw new Error("Failed to fetch appointments");
      }
      const data = await res.json();
      if (data.success) {
        setAppointments(data.appointments || []);
      } else {
        throw new Error(data.message || "Failed to load appointments");
      }
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "An error occurred");
      toast.error("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, newStatus: string) {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update status");
      }

      // Update local state
      setAppointments((prev) =>
        prev.map((app) =>
          app._id === id ? { ...app, status: newStatus as Appointment["status"] } : app
        )
      );

      toast.success(`Updated status to ${newStatus.replace("_", " ")}`);
    } catch (err: unknown) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  }

  // Derive unique list of services
  const services = Array.from(
    new Set(appointments.map((a) => a.service))
  ).filter(Boolean);

  // Calculate global status counts
  const statusCounts = {
    all: appointments.length,
    requested: appointments.filter((a) => a.status === "requested" || (a.status as string) === "pending").length,
    confirmed: appointments.filter((a) => a.status === "confirmed").length,
    arrived: appointments.filter((a) => a.status === "arrived").length,
    in_treatment: appointments.filter((a) => a.status === "in_treatment").length,
    completed: appointments.filter((a) => a.status === "completed").length,
    no_show: appointments.filter((a) => a.status === "no_show").length,
    cancelled: appointments.filter((a) => a.status === "cancelled").length,
  };

  // Perform client-side filter for fast receptionist workflow
  const filteredAppointments = appointments.filter((app) => {
    const patient = app.patientId;
    const fullName = patient?.fullName || "";
    const phone = patient?.phone || "";
    const email = patient?.email || "";

    // 1. Text search
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      fullName.toLowerCase().includes(query) ||
      phone.toLowerCase().includes(query) ||
      email.toLowerCase().includes(query);

    // 2. Status Pill Tabs
    const matchesStatus =
      selectedStatus === "all" || app.status === selectedStatus;

    // 3. Service Selector
    const matchesService =
      selectedService === "all" || app.service === selectedService;

    return matchesSearch && matchesStatus && matchesService;
  });

  // Render Skeletons during SSR / Hydration
  if (!mounted) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-6 bg-slate-200 rounded w-32" />
        </div>
        <StatsSkeleton />
        <div className="h-10 bg-slate-200 rounded w-full" />
        <AppointmentListSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header section (Compact) */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-[#14213D] tracking-tight">Appointments & Queue</h1>
          <p className="text-[#64748B] text-xs font-medium">
            Real-time schedule management, visit arrival tracking, and treatment triage
          </p>
        </div>
        <button
          onClick={fetchAppointments}
          disabled={loading}
          className="inline-flex items-center justify-center space-x-1.5 bg-white hover:bg-[#F4F7FA] border border-[#E2E8F0] px-3.5 py-1.5 rounded-lg text-xs font-semibold text-[#182230] shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-[#14B8A6]" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5 text-[#64748B]" />
          )}
          <span>Refresh</span>
        </button>
      </div>

      {/* Loading Skeletons for first-time fetches */}
      {loading && appointments.length === 0 ? (
        <div className="space-y-5">
          <StatsSkeleton />
          <div className="h-20 bg-white rounded-xl border border-[#E2E8F0] animate-pulse" />
          <AppointmentListSkeleton />
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-5 text-center space-y-3">
          <h3 className="text-xs font-bold text-rose-800">Connection Error</h3>
          <p className="text-xs text-rose-600 leading-normal">{error}</p>
          <button
            onClick={fetchAppointments}
            className="bg-[#14213D] hover:bg-[#0D1629] text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      ) : (
        <>
          {/* Stats KPI Panel */}
          <StatsCards
            total={statusCounts.all}
            requested={statusCounts.requested}
            confirmed={statusCounts.confirmed}
            arrived={statusCounts.arrived}
            inTreatment={statusCounts.in_treatment}
            completed={statusCounts.completed}
            noShow={statusCounts.no_show}
            cancelled={statusCounts.cancelled}
          />

          {/* Inline filters */}
          <SearchFilterUI
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedStatus={selectedStatus}
            setSelectedStatus={setSelectedStatus}
            selectedService={selectedService}
            setSelectedService={setSelectedService}
            services={services}
            statusCounts={statusCounts}
          />

          {/* List of appointments */}
          <div className="space-y-2.5">
            {filteredAppointments.length === 0 ? (
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-10 text-center shadow-2xs">
                <FilterX className="h-9 w-9 text-[#64748B] mx-auto mb-3" />
                <h4 className="text-sm font-bold text-[#14213D]">No matching appointments</h4>
                <p className="text-[#64748B] text-xs mt-1 max-w-sm mx-auto">
                  No appointments match your search criteria. Try modifying your search or resetting the status filters.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedStatus("all");
                    setSelectedService("all");
                  }}
                  className="mt-4 text-xs font-bold text-[#14B8A6] bg-[#CCFBF1] hover:bg-[#14B8A6] hover:text-white border border-[#14B8A6]/30 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              filteredAppointments.map((app) => (
                <AppointmentCard
                  key={app._id}
                  appointment={app}
                  updatingId={updatingId}
                  onUpdateStatus={updateStatus}
                />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
