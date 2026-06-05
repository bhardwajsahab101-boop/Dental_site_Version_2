"use client";

import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  User,
  Loader2,
  RefreshCw,
  X,
  MessageSquare
} from "lucide-react";

interface Appointment {
  _id: string;
  fullName: string;
  phone: string;
  email: string;
  service: string;
  appointmentDate: string;
  appointmentTime?: string;
  message?: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  createdAt: string;
}

export default function AdminCalendarPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Rescheduling states
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [savingReschedule, setSavingReschedule] = useState(false);

  useEffect(() => {
    if (selectedAppointment) {
      const dateStr = typeof selectedAppointment.appointmentDate === "string"
        ? selectedAppointment.appointmentDate.split("T")[0]
        : new Date(selectedAppointment.appointmentDate).toISOString().split("T")[0];
      setNewDate(dateStr);
      setNewTime(selectedAppointment.appointmentTime || "");
      setIsRescheduling(false);
    }
  }, [selectedAppointment]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/appointments");
      const data = await res.json();
      if (data.success) {
        setAppointments(data.appointments || []);
      } else {
        throw new Error(data.message || "Failed to load appointments");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchAppointments();
    });
  }, []);

  const updateStatus = async (id: string, newStatus: string) => {
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

      setAppointments((prev) =>
        prev.map((app) =>
          app._id === id ? { ...app, status: newStatus as Appointment["status"] } : app
        )
      );

      // If the selected appointment is open, update its local instance too
      if (selectedAppointment?._id === id) {
        setSelectedAppointment((prev) =>
          prev ? { ...prev, status: newStatus as Appointment["status"] } : null
        );
      }

      toast.success(`Updated status to ${newStatus}`);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSaveReschedule = async () => {
    if (!selectedAppointment) return;
    if (!newDate || !newTime) {
      toast.error("Please specify both date and time");
      return;
    }

    setSavingReschedule(true);
    try {
      const res = await fetch(`/api/appointments/${selectedAppointment._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          appointmentDate: newDate,
          appointmentTime: newTime,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to reschedule appointment");
      }

      toast.success("Appointment rescheduled successfully!");
      setIsRescheduling(false);

      // Refresh appointments
      await fetchAppointments();

      // Update selectedAppointment instance in view
      setSelectedAppointment((prev) =>
        prev
          ? {
              ...prev,
              appointmentDate: newDate,
              appointmentTime: newTime,
            }
          : null
      );
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to reschedule");
    } finally {
      setSavingReschedule(false);
    }
  };

  // Get days in current month
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Create grid days array
  const gridDays: (Date | null)[] = [];
  
  // Padding for previous month
  for (let i = 0; i < startingDayOfWeek; i++) {
    gridDays.push(null);
  }

  // Days of current month
  for (let d = 1; d <= daysInMonth; d++) {
    gridDays.push(new Date(year, month, d));
  }

  // Format month title
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const monthTitle = `${monthNames[month]} ${year}`;

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Match appointments to a specific calendar date (YYYY-MM-DD format comparison)
  const getAppointmentsForDate = (date: Date) => {
    const targetDateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD
    
    return appointments.filter((app) => {
      if (!app.appointmentDate) return false;
      const appDateStr = typeof app.appointmentDate === "string"
        ? app.appointmentDate.split("T")[0]
        : new Date(app.appointmentDate).toISOString().split("T")[0];
      return appDateStr === targetDateStr;
    });
  };

  const getStatusColorClass = (status: Appointment["status"]) => {
    switch (status) {
      case "pending":
        return "bg-amber-500";
      case "confirmed":
        return "bg-blue-500";
      case "completed":
        return "bg-emerald-500";
      case "cancelled":
        return "bg-rose-500";
      default:
        return "bg-slate-400";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Calendar View</h1>
          <p className="text-slate-500 text-[11px] font-medium">
            Browse and schedule appointments in a monthly calendar layout.
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <button
            onClick={fetchAppointments}
            disabled={loading}
            className="inline-flex items-center justify-center space-x-1.5 bg-white hover:bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 shadow-sm transition-colors disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-600" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
            )}
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Calendar Control Bar */}
      <div className="bg-white border border-slate-100 p-3.5 rounded-xl shadow-sm flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
          <CalendarIcon className="h-4 w-4 text-slate-500" />
          <span>{monthTitle}</span>
        </h2>

        <div className="flex items-center space-x-1">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={handleToday}
            className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 transition-colors"
          >
            Today
          </button>
          <button
            onClick={handleNextMonth}
            className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50 text-center py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 md:auto-rows-[100px] auto-rows-[60px] border-collapse">
          {loading ? (
            <div className="col-span-7 py-20 text-center flex items-center justify-center space-x-2 text-slate-450 text-xs">
              <Loader2 className="h-5 w-5 animate-spin text-slate-600" />
              <span>Loading calendar appointments...</span>
            </div>
          ) : (
            gridDays.map((date, idx) => {
              if (date === null) {
                return <div key={`empty-${idx}`} className="border border-slate-50 bg-slate-50/20" />;
              }

              const dateApps = getAppointmentsForDate(date);
              const isToday = new Date().toDateString() === date.toDateString();

              return (
                <div
                  key={`day-${date.getDate()}`}
                  className={`border border-slate-50 p-1 flex flex-col justify-between overflow-hidden group hover:bg-slate-50/50 transition-colors ${
                    isToday ? "bg-blue-50/20" : ""
                  }`}
                >
                  {/* Day Date Label */}
                  <span
                    className={`text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center self-end ${
                      isToday
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-600"
                    }`}
                  >
                    {date.getDate()}
                  </span>

                  {/* Appointments indicators/list */}
                  <div className="flex-1 mt-1 overflow-y-auto space-y-0.5 max-h-[70px] hidden md:block">
                    {dateApps.map((app) => (
                      <div
                        key={app._id}
                        onClick={() => setSelectedAppointment(app)}
                        className={`text-[8.5px] px-1.5 py-0.5 rounded text-white truncate font-bold cursor-pointer hover:opacity-90 transition-opacity flex items-center justify-between gap-1 ${getStatusColorClass(
                          app.status
                        )}`}
                      >
                        <span className="truncate">{app.fullName}</span>
                      </div>
                    ))}
                  </div>

                  {/* Mobile Compact Indicators (Dots) */}
                  <div className="flex-1 flex items-center justify-center space-x-0.5 md:hidden">
                    {dateApps.slice(0, 3).map((app) => (
                      <span
                        key={app._id}
                        onClick={() => setSelectedAppointment(app)}
                        className={`h-1.5 w-1.5 rounded-full block cursor-pointer ${getStatusColorClass(
                          app.status
                        )}`}
                      />
                    ))}
                    {dateApps.length > 3 && (
                      <span className="text-[7px] text-slate-400 font-bold">+{dateApps.length - 3}</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Appointment Detail Popup Modal */}
      {selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-[2px]"
            onClick={() => setSelectedAppointment(null)}
          />
          
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-sm p-5 relative z-10 space-y-4">
            {/* Modal Title */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
                <CalendarIcon className="h-4 w-4 mr-1.5 text-slate-500" />
                <span>Appointment Detail</span>
              </h3>
              <button
                onClick={() => setSelectedAppointment(null)}
                className="p-1 text-slate-400 hover:text-slate-900 focus:outline-none"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Profile Detail card */}
            <div className="space-y-3.5 text-xs">
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800 text-[13px] flex items-center">
                    <User className="h-4 w-4 text-slate-400 mr-1.5" />
                    {selectedAppointment.fullName}
                  </span>
                  <span
                    className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border shrink-0 ${
                      selectedAppointment.status === "pending"
                        ? "bg-amber-50 text-amber-600 border-amber-100"
                        : selectedAppointment.status === "confirmed"
                        ? "bg-blue-50 text-blue-600 border-blue-100"
                        : selectedAppointment.status === "completed"
                        ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                        : "bg-rose-50 text-rose-600 border-rose-100"
                    }`}
                  >
                    {selectedAppointment.status}
                  </span>
                </div>
                
                <div className="text-[11px] text-slate-500 space-y-0.5 pt-1 border-t border-slate-100/50 mt-1.5">
                  <p className="flex items-center">
                    <span className="font-semibold text-slate-600 mr-1.5 w-14">Phone:</span>
                    <a href={`tel:${selectedAppointment.phone}`} className="text-slate-800 hover:underline">
                      {selectedAppointment.phone}
                    </a>
                  </p>
                  <p className="flex items-center">
                    <span className="font-semibold text-slate-600 mr-1.5 w-14">Email:</span>
                    <a href={`mailto:${selectedAppointment.email}`} className="text-slate-800 hover:underline">
                      {selectedAppointment.email}
                    </a>
                  </p>
                  <p className="flex items-center">
                    <span className="font-semibold text-slate-600 mr-1.5 w-14">Service:</span>
                    <span className="text-slate-800 font-semibold">{selectedAppointment.service}</span>
                  </p>
                  <p className="flex items-center">
                    <span className="font-semibold text-slate-600 mr-1.5 w-14">Scheduled:</span>
                    <span className="text-slate-800 font-bold">{selectedAppointment.appointmentDate}</span>
                  </p>
                </div>
              </div>

              {/* Message from Patient */}
              {selectedAppointment.message && (
                <div className="space-y-1">
                  <span className="font-bold text-slate-500 flex items-center">
                    <MessageSquare className="h-3.5 w-3.5 mr-1 text-slate-400" />
                    Patient Message:
                  </span>
                  <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3 text-[11px] text-slate-600 italic">
                    &ldquo;{selectedAppointment.message}&rdquo;
                  </div>
                </div>
              )}

              {/* Rescheduling Block */}
              <div className="space-y-1.5 pt-1 border-t border-slate-100 mt-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-705 block">Reschedule Visit:</span>
                  <button
                    onClick={() => setIsRescheduling(!isRescheduling)}
                    type="button"
                    className="text-[10px] text-indigo-600 hover:text-indigo-850 font-bold cursor-pointer"
                  >
                    {isRescheduling ? "Cancel" : "Change Date/Time"}
                  </button>
                </div>

                {isRescheduling ? (
                  <div className="space-y-2 bg-slate-50 border border-slate-150 p-2.5 rounded-xl animate-in slide-in-from-top-1 duration-150 mt-1">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-0.5">
                        <label className="text-[9px] uppercase font-bold text-slate-400">New Date</label>
                        <input
                          type="date"
                          value={newDate}
                          onChange={(e) => setNewDate(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-855 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-0.5">
                        <label className="text-[9px] uppercase font-bold text-slate-400">New Time</label>
                        <input
                          type="time"
                          value={newTime}
                          onChange={(e) => setNewTime(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-855 focus:outline-none"
                        />
                      </div>
                    </div>
                    <button
                      onClick={handleSaveReschedule}
                      disabled={savingReschedule}
                      type="button"
                      className="w-full bg-slate-900 hover:bg-slate-850 disabled:opacity-75 disabled:cursor-not-allowed text-white text-[10px] font-bold py-1.5 px-2.5 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      {savingReschedule ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin text-white" />
                          Saving...
                        </>
                      ) : (
                        "Confirm Reschedule"
                      )}
                    </button>
                  </div>
                ) : null}
              </div>

              {/* Dropdown status update action */}
              <div className="space-y-1.5 pt-1">
                <label className="font-bold text-slate-700 block">Update Status:</label>
                <div className="relative">
                  <select
                    value={selectedAppointment.status}
                    disabled={updatingId === selectedAppointment._id}
                    onChange={(e) => updateStatus(selectedAppointment._id, e.target.value)}
                    className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 focus:border-slate-900 rounded-xl p-2.5 text-xs text-slate-850 font-semibold focus:outline-none transition-colors appearance-none cursor-pointer pr-10"
                  >
                    <option value="pending">⏳ Pending review</option>
                    <option value="confirmed">📅 Confirm Appointment</option>
                    <option value="completed">✅ Complete Visit</option>
                    <option value="cancelled">❌ Cancel Appointment</option>
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-450">
                    <Loader2 className={`h-4 w-4 animate-spin ${updatingId === selectedAppointment._id ? "block" : "hidden"}`} />
                    <ChevronRight className={`h-4 w-4 rotate-90 ${updatingId === selectedAppointment._id ? "hidden" : "block"}`} />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal actions */}
            <div className="border-t border-slate-100 pt-3 flex justify-end">
              <button
                onClick={() => setSelectedAppointment(null)}
                className="bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-colors"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
