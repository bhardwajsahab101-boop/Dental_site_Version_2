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
  MessageSquare,
  Plus,
  Clock,
  Phone,
  Mail,
  Activity
} from "lucide-react";

interface PatientInfo {
  _id: string;
  fullName: string;
  phone: string;
  email?: string;
  patientCode?: string;
}

interface Appointment {
  _id: string;
  patientId?: PatientInfo;
  fullName: string;
  phone: string;
  email: string;
  service: string;
  appointmentDate: string;
  appointmentTime?: string;
  message?: string;
  notes?: string;
  status: "requested" | "confirmed" | "arrived" | "in_treatment" | "completed" | "no_show" | "cancelled";
  createdAt: string;
}

const getLocalDateString = (d: Date) => {
  const yearVal = d.getFullYear();
  const monthVal = String(d.getMonth() + 1).padStart(2, "0");
  const dayVal = String(d.getDate()).padStart(2, "0");
  return `${yearVal}-${monthVal}-${dayVal}`;
};

const getServiceCategory = (service: string): string => {
  const s = service.toLowerCase();
  if (s.includes("consult")) return "Consultation";
  if (s.includes("clean")) return "Cleaning";
  if (s.includes("root") || s.includes("canal")) return "Root Canal";
  if (s.includes("fill")) return "Filling";
  if (s.includes("extract")) return "Extraction";
  if (s.includes("follow") || s.includes("check") || s.includes("review")) return "Follow-up";
  return "Consultation"; // default
};

const getCategoryStyles = (category: string) => {
  switch (category) {
    case "Consultation":
      return {
        bg: "bg-[#f0fdf4]", // light green
        border: "border-[#bbf7d0]", // green-200
        text: "text-[#166534]", // green-800
        timeText: "text-[#15803d]", // green-700
        nameText: "text-slate-800",
        subText: "text-slate-500",
        dotBg: "bg-emerald-500",
      };
    case "Cleaning":
      return {
        bg: "bg-[#faf5ff]", // light purple
        border: "border-[#e9d5ff]", // purple-200
        text: "text-[#6b21a8]", // purple-800
        timeText: "text-[#7e22ce]", // purple-700
        nameText: "text-slate-800",
        subText: "text-slate-500",
        dotBg: "bg-purple-500",
      };
    case "Root Canal":
      return {
        bg: "bg-[#fffbeb]", // light orange/yellow
        border: "border-[#fef3c7]", // yellow-200
        text: "text-[#92400e]", // yellow-850
        timeText: "text-[#b45309]", // yellow-700
        nameText: "text-slate-800",
        subText: "text-slate-500",
        dotBg: "bg-amber-500",
      };
    case "Filling":
      return {
        bg: "bg-[#f0f9ff]", // light blue
        border: "border-[#bae6fd]", // blue-200
        text: "text-[#075985]", // blue-800
        timeText: "text-[#0369a1]", // blue-700
        nameText: "text-slate-800",
        subText: "text-slate-500",
        dotBg: "bg-blue-500",
      };
    case "Extraction":
      return {
        bg: "bg-[#fff1f2]", // light pink/red
        border: "border-[#fecdd3]", // red-200
        text: "text-[#9f1239]", // red-800
        timeText: "text-[#be123c]", // red-700
        nameText: "text-slate-800",
        subText: "text-slate-500",
        dotBg: "bg-rose-500",
      };
    case "Follow-up":
      return {
        bg: "bg-[#f0fdfa]", // light teal
        border: "border-[#99f6e4]", // teal-200
        text: "text-[#115e59]", // teal-800
        timeText: "text-[#0f766e]", // teal-700
        nameText: "text-slate-800",
        subText: "text-slate-500",
        dotBg: "bg-teal-500",
      };
    default:
      return {
        bg: "bg-slate-50",
        border: "border-slate-200",
        text: "text-slate-800",
        timeText: "text-slate-600",
        nameText: "text-slate-800",
        subText: "text-slate-500",
        dotBg: "bg-slate-500",
      };
  }
};

export default function AdminCalendarPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<PatientInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // New Appointment modal states
  const [showNewAppModal, setShowNewAppModal] = useState(false);
  const [savingNewApp, setSavingNewApp] = useState(false);
  const [newAppForm, setNewAppForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    service: "Consultation",
    appointmentDate: "",
    appointmentTime: "10:00",
    notes: "",
  });

  // Rescheduling states
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [savingReschedule, setSavingReschedule] = useState(false);

  useEffect(() => {
    if (selectedAppointment) {
      const dateStr = typeof selectedAppointment.appointmentDate === "string"
        ? selectedAppointment.appointmentDate.split("T")[0]
        : getLocalDateString(new Date(selectedAppointment.appointmentDate));
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

  const fetchPatients = async () => {
    try {
      const res = await fetch("/api/patients");
      const data = await res.json();
      if (data.success) {
        setPatients(data.patients || []);
      }
    } catch (err) {
      console.error("Failed to load patients list", err);
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchAppointments();
      fetchPatients();
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
      await fetchAppointments();

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

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppForm.fullName || !newAppForm.phone || !newAppForm.service || !newAppForm.appointmentDate || !newAppForm.appointmentTime) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSavingNewApp(true);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newAppForm),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to create appointment");
      }

      toast.success("Appointment created successfully!");
      setShowNewAppModal(false);
      await fetchAppointments();
      await fetchPatients();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to create appointment");
    } finally {
      setSavingNewApp(false);
    }
  };

  const handleNameChange = (name: string) => {
    setNewAppForm((prev) => {
      const updated = { ...prev, fullName: name };
      const matched = patients.find((p) => p.fullName.toLowerCase() === name.toLowerCase());
      if (matched) {
        updated.phone = matched.phone || "";
        updated.email = matched.email || "";
      }
      return updated;
    });
  };

  // Get days in current month
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Create grid days array
  const prevMonthDaysCount = new Date(year, month, 0).getDate();
  const gridDays: Date[] = [];
  
  // Padding for previous month
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    gridDays.push(new Date(year, month - 1, prevMonthDaysCount - i));
  }

  // Days of current month
  for (let d = 1; d <= daysInMonth; d++) {
    gridDays.push(new Date(year, month, d));
  }

  // Padding for next month to complete the grid (usually to 35 or 42 cells)
  const totalCellsNeeded = gridDays.length <= 35 ? 35 : 42;
  const nextMonthDaysCount = totalCellsNeeded - gridDays.length;
  for (let d = 1; d <= nextMonthDaysCount; d++) {
    gridDays.push(new Date(year, month + 1, d));
  }

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
    const targetDateStr = getLocalDateString(date);
    
    return appointments.filter((app) => {
      if (!app.appointmentDate) return false;
      const appDateStr = typeof app.appointmentDate === "string"
        ? app.appointmentDate.split("T")[0]
        : getLocalDateString(new Date(app.appointmentDate));
      return appDateStr === targetDateStr;
    });
  };

  // Calculate dynamic category counts for the visible month
  const visibleMonthApps = appointments.filter((app) => {
    if (!app.appointmentDate) return false;
    const appDate = typeof app.appointmentDate === "string"
      ? new Date(app.appointmentDate.split("T")[0])
      : new Date(app.appointmentDate);
    return appDate.getMonth() === month && appDate.getFullYear() === year;
  });

  const categoryCounts = {
    "Consultation": 0,
    "Cleaning": 0,
    "Root Canal": 0,
    "Filling": 0,
    "Extraction": 0,
    "Follow-up": 0,
  };

  visibleMonthApps.forEach((app) => {
    const cat = getServiceCategory(app.service);
    if (categoryCounts.hasOwnProperty(cat)) {
      categoryCounts[cat as keyof typeof categoryCounts]++;
    } else {
      categoryCounts["Consultation"]++;
    }
  });

  const totalVisibleCount = visibleMonthApps.length;

  const handleCellClick = (date: Date, e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".appointment-card-item")) {
      return;
    }
    const dateStr = getLocalDateString(date);
    setNewAppForm({
      fullName: "",
      phone: "",
      email: "",
      service: "Consultation",
      appointmentDate: dateStr,
      appointmentTime: "10:00",
      notes: "",
    });
    setShowNewAppModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header section & Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Calendar</h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Browse and manage appointments in a monthly calendar view.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start xl:self-auto">
          {/* Today */}
          <button
            onClick={handleToday}
            className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 shadow-sm transition-colors cursor-pointer"
          >
            Today
          </button>

          {/* Prev/Next buttons */}
          <div className="flex items-center -space-x-px">
            <button
              onClick={handlePrevMonth}
              className="p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-l-lg text-slate-600 transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-r-lg text-slate-600 transition-colors cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Date Selector Dropdown */}
          <div className="relative inline-flex items-center bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 shadow-sm">
            <CalendarIcon className="h-4 w-4 mr-2 text-slate-400" />
            <select
              value={`${month}-${year}`}
              onChange={(e) => {
                const [m, y] = e.target.value.split("-").map(Number);
                setCurrentDate(new Date(y, m, 1));
              }}
              className="bg-transparent border-none focus:outline-none appearance-none pr-5 cursor-pointer font-bold text-slate-800"
            >
              {Array.from({ length: 24 }).map((_, i) => {
                const d = new Date();
                d.setMonth(d.getMonth() - 12 + i);
                const mVal = d.getMonth();
                const yVal = d.getFullYear();
                return (
                  <option key={`${mVal}-${yVal}`} value={`${mVal}-${yVal}`}>
                    {monthNames[mVal]} {yVal}
                  </option>
                );
              })}
            </select>
            <div className="absolute right-2.5 pointer-events-none text-slate-400">
              <ChevronRight className="h-3.5 w-3.5 rotate-90" />
            </div>
          </div>

          {/* View Dropdown */}
          <div className="relative inline-flex items-center bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 shadow-sm">
            <select
              value="month"
              disabled
              className="bg-transparent border-none focus:outline-none appearance-none pr-5 cursor-pointer font-bold text-slate-800"
            >
              <option value="month">Month</option>
              <option value="week">Week</option>
              <option value="day">Day</option>
            </select>
            <div className="absolute right-2.5 pointer-events-none text-slate-400">
              <ChevronRight className="h-3.5 w-3.5 rotate-90" />
            </div>
          </div>

          {/* New Appointment Button */}
          <button
            onClick={() => {
              setNewAppForm({
                fullName: "",
                phone: "",
                email: "",
                service: "Consultation",
                appointmentDate: getLocalDateString(new Date()),
                appointmentTime: "10:00",
                notes: "",
              });
              setShowNewAppModal(true);
            }}
            className="inline-flex items-center justify-center space-x-1.5 bg-[#5f22e6] hover:bg-[#4d1bc4] text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4 mr-0.5" />
            <span>New Appointment</span>
          </button>

          {/* Refresh button */}
          <button
            onClick={fetchAppointments}
            disabled={loading}
            className="inline-flex items-center justify-center space-x-1.5 bg-white hover:bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/50 text-center py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 border-collapse bg-white">
          {loading ? (
            <div className="col-span-7 py-36 text-center flex flex-col items-center justify-center space-y-3 text-slate-400 text-xs">
              <Loader2 className="h-6 w-6 animate-spin text-slate-600" />
              <span>Loading appointments data...</span>
            </div>
          ) : (
            gridDays.map((date, idx) => {
              const dateApps = getAppointmentsForDate(date);
              const isToday = getLocalDateString(new Date()) === getLocalDateString(date);
              const isCurrentMonth = date.getMonth() === month;

              return (
                <div
                  key={`day-${date.getMonth()}-${date.getDate()}`}
                  onClick={(e) => handleCellClick(date, e)}
                  className={`border-r border-b border-slate-200 min-h-[140px] p-1.5 flex flex-col justify-between group hover:bg-slate-50/40 transition-colors relative cursor-pointer ${
                    !isCurrentMonth ? "bg-slate-50/20" : ""
                  }`}
                >
                  {/* Day Date Label Container */}
                  <div className="flex justify-end w-full">
                    <span
                      className={`text-[11px] font-extrabold h-6 w-6 rounded-full flex items-center justify-center transition-all ${
                        isToday
                          ? "bg-[#5f22e6] text-white shadow-sm font-bold"
                          : isCurrentMonth
                          ? "text-slate-700"
                          : "text-slate-300"
                      }`}
                    >
                      {date.getDate()}
                    </span>
                  </div>

                  {/* Appointments indicators/list */}
                  <div className="flex-1 mt-1.5 space-y-1.5 max-h-[105px] overflow-y-auto pr-0.5">
                    {dateApps.map((app) => {
                      const cat = getServiceCategory(app.service);
                      const styles = getCategoryStyles(cat);
                      const patientName = app.patientId?.fullName || app.fullName || "Patient";

                      return (
                        <div
                          key={app._id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAppointment(app);
                          }}
                          className={`appointment-card-item p-2 rounded-lg border ${styles.bg} ${styles.border} transition-all hover:shadow-sm cursor-pointer relative flex flex-col space-y-0.5 text-left`}
                        >
                          <span className={`text-[9px] font-extrabold ${styles.timeText} leading-none`}>
                            {app.appointmentTime || "09:00 AM"}
                          </span>
                          <span className={`text-[10px] font-bold ${styles.nameText} leading-tight truncate pr-4`}>
                            {patientName}
                          </span>
                          <span className={`text-[8.5px] font-semibold ${styles.subText} leading-none truncate`}>
                            {app.service}
                          </span>
                          <div className="absolute bottom-2 right-2 text-slate-400">
                            <User className="h-3 w-3 shrink-0 opacity-70" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Dynamic Category Legend Bar */}
        <div className="bg-slate-50/50 border-t border-slate-200 px-6 py-4 flex items-center justify-between flex-wrap gap-4 text-xs font-semibold text-slate-500">
          <div className="flex items-center space-x-6 flex-wrap">
            <div className="flex items-center space-x-2">
              <span className="h-2 w-2 rounded-full bg-[#22c55e]" />
              <span>Consultation</span>
              <span className="text-slate-800 font-extrabold">{categoryCounts["Consultation"]}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="h-2 w-2 rounded-full bg-[#a855f7]" />
              <span>Cleaning</span>
              <span className="text-slate-800 font-extrabold">{categoryCounts["Cleaning"]}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="h-2 w-2 rounded-full bg-[#f59e0b]" />
              <span>Root Canal</span>
              <span className="text-slate-800 font-extrabold">{categoryCounts["Root Canal"]}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="h-2 w-2 rounded-full bg-[#3b82f6]" />
              <span>Filling</span>
              <span className="text-slate-800 font-extrabold">{categoryCounts["Filling"]}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="h-2 w-2 rounded-full bg-[#ec4899]" />
              <span>Extraction</span>
              <span className="text-slate-800 font-extrabold">{categoryCounts["Extraction"]}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="h-2 w-2 rounded-full bg-[#10b981]" />
              <span>Follow-up</span>
              <span className="text-slate-800 font-extrabold">{categoryCounts["Follow-up"]}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-slate-700 font-extrabold">
            <span>Total Appointments</span>
            <span className="text-sm bg-slate-200/50 px-2 py-0.5 rounded text-slate-800">{totalVisibleCount}</span>
          </div>
        </div>
      </div>

      {/* Appointment Detail Popup Modal */}
      {selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2.5px] transition-opacity"
            onClick={() => setSelectedAppointment(null)}
          />
          
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-md p-6 relative z-10 space-y-5 transform transition-all animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Title */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                <CalendarIcon className="h-4.5 w-4.5 text-slate-500" />
                <span>Appointment Details</span>
              </h3>
              <button
                onClick={() => setSelectedAppointment(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-50 focus:outline-none transition-colors"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Profile Detail Card */}
            <div className="space-y-4 text-xs">
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800 text-[14px] flex items-center">
                    <User className="h-4.5 w-4.5 text-slate-400 mr-2 shrink-0" />
                    {selectedAppointment.patientId?.fullName || selectedAppointment.fullName}
                  </span>
                  <span
                    className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border shrink-0 ${
                      selectedAppointment.status === "requested"
                        ? "bg-amber-50 text-amber-600 border-amber-100"
                        : selectedAppointment.status === "confirmed"
                        ? "bg-blue-50 text-blue-600 border-blue-100"
                        : selectedAppointment.status === "arrived"
                        ? "bg-indigo-50 text-indigo-600 border-indigo-100"
                        : selectedAppointment.status === "in_treatment"
                        ? "bg-purple-50 text-purple-650 border-purple-100"
                        : selectedAppointment.status === "completed"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                        : selectedAppointment.status === "no_show"
                        ? "bg-slate-100 text-slate-650 border-slate-200"
                        : "bg-rose-50 text-rose-600 border-rose-100"
                    }`}
                  >
                    {selectedAppointment.status}
                  </span>
                </div>
                
                <div className="text-[12px] text-slate-500 space-y-2 pt-2.5 border-t border-slate-200/60">
                  <p className="flex items-center">
                    <Phone className="h-3.5 w-3.5 text-slate-400 mr-2 shrink-0" />
                    <span className="font-medium text-slate-500 mr-2 w-14">Phone:</span>
                    <a href={`tel:${selectedAppointment.patientId?.phone || selectedAppointment.phone}`} className="text-slate-850 hover:underline font-semibold">
                      {selectedAppointment.patientId?.phone || selectedAppointment.phone}
                    </a>
                  </p>
                  <p className="flex items-center">
                    <Mail className="h-3.5 w-3.5 text-slate-400 mr-2 shrink-0" />
                    <span className="font-medium text-slate-500 mr-2 w-14">Email:</span>
                    <a href={`mailto:${selectedAppointment.patientId?.email || selectedAppointment.email}`} className="text-slate-855 hover:underline font-semibold">
                      {selectedAppointment.patientId?.email || selectedAppointment.email || "No email provided"}
                    </a>
                  </p>
                  <p className="flex items-center">
                    <Activity className="h-3.5 w-3.5 text-slate-400 mr-2 shrink-0" />
                    <span className="font-medium text-slate-500 mr-2 w-14">Service:</span>
                    <span className="text-slate-850 font-bold">{selectedAppointment.service}</span>
                  </p>
                  <p className="flex items-center">
                    <Clock className="h-3.5 w-3.5 text-slate-400 mr-2 shrink-0" />
                    <span className="font-medium text-slate-500 mr-2 w-14">Time:</span>
                    <span className="text-slate-850 font-bold bg-slate-200/40 px-2 py-0.5 rounded">
                      {selectedAppointment.appointmentTime || "12:00 PM"}
                    </span>
                  </p>
                  <p className="flex items-center">
                    <CalendarIcon className="h-3.5 w-3.5 text-slate-400 mr-2 shrink-0" />
                    <span className="font-medium text-slate-500 mr-2 w-14">Scheduled:</span>
                    <span className="text-slate-850 font-bold">
                      {typeof selectedAppointment.appointmentDate === "string" 
                        ? selectedAppointment.appointmentDate.split("T")[0] 
                        : getLocalDateString(new Date(selectedAppointment.appointmentDate))}
                    </span>
                  </p>
                </div>
              </div>

              {/* Patient Message */}
              {selectedAppointment.message && (
                <div className="space-y-1">
                  <span className="font-bold text-slate-500 flex items-center">
                    <MessageSquare className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                    Patient Message:
                  </span>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-[11px] text-slate-605 italic">
                    &ldquo;{selectedAppointment.message}&rdquo;
                  </div>
                </div>
              )}

              {/* Rescheduling Block */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 block">Reschedule Visit:</span>
                  <button
                    onClick={() => setIsRescheduling(!isRescheduling)}
                    type="button"
                    className="text-[10px] text-[#5f22e6] hover:underline font-bold cursor-pointer"
                  >
                    {isRescheduling ? "Cancel" : "Change Date/Time"}
                  </button>
                </div>

                {isRescheduling ? (
                  <div className="space-y-2.5 bg-slate-50 border border-slate-200 p-3 rounded-xl animate-in slide-in-from-top-1 duration-150">
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold text-slate-400">New Date</label>
                        <input
                          type="date"
                          value={newDate}
                          onChange={(e) => setNewDate(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:border-slate-800 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold text-slate-400">New Time</label>
                        <input
                          type="time"
                          value={newTime}
                          onChange={(e) => setNewTime(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:border-slate-800 focus:outline-none"
                        />
                      </div>
                    </div>
                    <button
                      onClick={handleSaveReschedule}
                      disabled={savingReschedule}
                      type="button"
                      className="w-full bg-[#5f22e6] hover:bg-[#4d1bc4] disabled:opacity-75 disabled:cursor-not-allowed text-white text-[10px] font-bold py-1.5 px-3 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
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

              {/* Status Selector */}
              <div className="space-y-1.5 pt-2">
                <label className="font-bold text-slate-700 block">Update Status:</label>
                <div className="relative">
                  <select
                    value={selectedAppointment.status}
                    disabled={updatingId === selectedAppointment._id}
                    onChange={(e) => updateStatus(selectedAppointment._id, e.target.value)}
                    className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 focus:border-slate-800 rounded-xl p-2.5 text-xs text-slate-800 font-semibold focus:outline-none transition-colors appearance-none cursor-pointer pr-10"
                  >
                    <option value="requested">⏳ Requested</option>
                    <option value="confirmed">📅 Confirmed</option>
                    <option value="arrived">🏥 Arrived</option>
                    <option value="in_treatment">🩺 In Treatment</option>
                    <option value="completed">✅ Completed</option>
                    <option value="no_show">🚫 No Show</option>
                    <option value="cancelled">❌ Cancelled</option>
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-450">
                    <Loader2 className={`h-4 w-4 animate-spin ${updatingId === selectedAppointment._id ? "block" : "hidden"}`} />
                    <ChevronRight className={`h-4 w-4 rotate-90 ${updatingId === selectedAppointment._id ? "hidden" : "block"}`} />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal actions */}
            <div className="border-t border-slate-100 pt-4 flex justify-end">
              <button
                onClick={() => setSelectedAppointment(null)}
                className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition-colors"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Appointment Dialog Modal */}
      {showNewAppModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2.5px]"
            onClick={() => setShowNewAppModal(false)}
          />
          
          <form
            onSubmit={handleCreateAppointment}
            className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-lg p-6 relative z-10 space-y-4 transform transition-all animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                <Plus className="h-5 w-5 text-[#5f22e6]" />
                <span>Schedule New Appointment</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowNewAppModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-50 focus:outline-none transition-colors"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Info Message */}
            <p className="text-[10px] text-slate-400 font-semibold bg-slate-50 p-2 rounded-lg leading-normal">
              💡 Tip: Start typing the patient name. If they are an existing patient, selecting their name will auto-fill their phone and email.
            </p>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Full Name */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Patient Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={newAppForm.fullName}
                  list="patient-names"
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                  className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 focus:border-slate-800 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none transition-colors"
                />
                <datalist id="patient-names">
                  {patients.map((p) => (
                    <option key={p._id} value={p.fullName}>
                      {p.phone}
                    </option>
                  ))}
                </datalist>
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Phone Number *</label>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={newAppForm.phone}
                  onChange={(e) => setNewAppForm((prev) => ({ ...prev, phone: e.target.value }))}
                  required
                  className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 focus:border-slate-800 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none transition-colors"
                />
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. patient@example.com"
                  value={newAppForm.email}
                  onChange={(e) => setNewAppForm((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 focus:border-slate-800 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none transition-colors"
                />
              </div>

              {/* Service */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Service / Category *</label>
                <select
                  value={newAppForm.service}
                  onChange={(e) => setNewAppForm((prev) => ({ ...prev, service: e.target.value }))}
                  required
                  className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 focus:border-slate-800 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none transition-colors cursor-pointer"
                >
                  <option value="Consultation">Consultation</option>
                  <option value="Teeth Cleaning">Teeth Cleaning</option>
                  <option value="Root Canal Treatment">Root Canal Treatment</option>
                  <option value="Filling">Filling</option>
                  <option value="Tooth Extraction">Tooth Extraction</option>
                  <option value="Follow-up">Follow-up</option>
                </select>
              </div>

              {/* Date */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Date *</label>
                <input
                  type="date"
                  value={newAppForm.appointmentDate}
                  onChange={(e) => setNewAppForm((prev) => ({ ...prev, appointmentDate: e.target.value }))}
                  required
                  className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 focus:border-slate-800 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none transition-colors"
                />
              </div>

              {/* Time */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Time *</label>
                <input
                  type="time"
                  value={newAppForm.appointmentTime}
                  onChange={(e) => setNewAppForm((prev) => ({ ...prev, appointmentTime: e.target.value }))}
                  required
                  className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 focus:border-slate-800 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1 text-xs">
              <label className="font-bold text-slate-700 block">Notes / Reason for Visit</label>
              <textarea
                placeholder="Write any special instructions or doctor requests..."
                value={newAppForm.notes}
                onChange={(e) => setNewAppForm((prev) => ({ ...prev, notes: e.target.value }))}
                rows={2}
                className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 focus:border-slate-800 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none transition-colors resize-none"
              />
            </div>

            {/* Modal Actions */}
            <div className="border-t border-slate-100 pt-4 flex justify-end space-x-2.5">
              <button
                type="button"
                onClick={() => setShowNewAppModal(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingNewApp}
                className="bg-[#5f22e6] hover:bg-[#4d1bc4] text-white px-5.5 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center space-x-1 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {savingNewApp ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Booking...</span>
                  </>
                ) : (
                  <span>Book Appointment</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
