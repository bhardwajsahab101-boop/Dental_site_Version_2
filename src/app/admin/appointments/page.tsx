"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Loader2,
  RefreshCw,
  FilterX
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
  status: "pending" | "confirmed" | "completed" | "cancelled";
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

      toast.success(`Updated status to ${newStatus}`);
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
    pending: appointments.filter((a) => a.status === "pending").length,
    confirmed: appointments.filter((a) => a.status === "confirmed").length,
    completed: appointments.filter((a) => a.status === "completed").length,
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
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Appointments</h1>
          <p className="text-slate-500 text-[11px] font-medium">
            Manage incoming schedule and update patients
          </p>
        </div>
        <button
          onClick={fetchAppointments}
          disabled={loading}
          className="inline-flex items-center justify-center space-x-1.5 bg-white hover:bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 shadow-sm transition-colors disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-600" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
          )}
          <span>Refresh</span>
        </button>
      </div>

      {/* Loading Skeletons for first-time fetches */}
      {loading && appointments.length === 0 ? (
        <div className="space-y-5">
          <StatsSkeleton />
          <div className="h-20 bg-white rounded-xl border border-slate-100 animate-pulse" />
          <AppointmentListSkeleton />
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-100 rounded-xl p-5 text-center space-y-3">
          <h3 className="text-xs font-bold text-rose-800">Failed to connect</h3>
          <p className="text-[11px] text-rose-600 leading-normal">{error}</p>
          <button
            onClick={fetchAppointments}
            className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            Retry Connection
          </button>
        </div>
      ) : (
        <>
          {/* Stats KPI Panel */}
          <StatsCards
            total={statusCounts.all}
            pending={statusCounts.pending}
            confirmed={statusCounts.confirmed}
            completed={statusCounts.completed}
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
          <div className="space-y-2">
            {filteredAppointments.length === 0 ? (
              <div className="bg-white border border-slate-100 rounded-xl p-8 text-center">
                <FilterX className="h-8 w-8 text-slate-350 mx-auto mb-2.5" />
                <h4 className="text-xs font-bold text-slate-800">No appointments match filters</h4>
                <p className="text-slate-450 text-[11px] mt-1 max-w-xs mx-auto">
                  Try adjusting your query or resetting status tabs.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedStatus("all");
                    setSelectedService("all");
                  }}
                  className="mt-3 text-[11px] font-semibold text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-100 px-2.5 py-1 rounded-md transition-colors"
                >
                  Clear Filters
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