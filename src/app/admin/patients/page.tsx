"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import PhysicalRegisterView from "./PhysicalRegisterView";
import {
  Plus,
  X,
  User,
  Phone,
  Mail,
  Calendar,
  MapPin,
  FileText,
  ShieldAlert,
  Search,
  Users,
  Check,
  ChevronRight,
  ChevronLeft,
  Trash2,
  Edit,
  Loader2,
  Activity,
  BookOpen,
  Printer,
  Download,
  FileSpreadsheet,
  CalendarDays,
  CheckCircle2,
  Clock,
  Sparkles,
  RotateCcw,
  ArrowRight,
} from "lucide-react";

type Patient = {
  _id: string;
  patientCode?: string;
  fullName?: string;
  phone?: string;
  gender?: string;
  email?: string;
  age?: number;
  appointmentCount?: number;
  lastVisit?: string | Date;
};

type FormData = {
  fullName: string;
  phone: string;
  email: string;
  age: string;
  gender: string;
  address: string;
  medicalNotes: string;
  allergies: string;
};

type Treatmentform = {
  TreatmentName: string;
  Diagnosis: string;
  ToothNumber: string;
  Cost: string;
  PaidAmount: string;
  Notes: string;
  Status: string;
};

type RegisterRow = {
  date: string;
  sNo: string | number;
  daily: string | number;
  patientId: string;
  patientCode: string;
  fullName: string;
  age?: number;
  gender?: string;
  phone?: string;
  address?: string;
  disease?: string;
  treatment?: string;
  cashRs?: number | null;
  cashPaise?: string | number;
  creditRs?: number | null;
  creditPaise?: string | number;
  totalCost?: number | null;
  paymentStatus?: string;
  remarks?: string;
  appointmentId?: string;
  appointmentTime?: string;
};

type DateOption = {
  date: string;
  count: number;
};

type Notice = {
  type: "success" | "error";
  message: string;
};

export default function PatientsPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Physical Register Mode state
  const [viewMode, setViewMode] = useState<"standard" | "register">("standard");
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  });
  const [registerRows, setRegisterRows] = useState<RegisterRow[]>([]);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerSummary, setRegisterSummary] = useState({
    totalPatients: 0,
    totalCash: 0,
    totalCredit: 0,
    totalRevenue: 0,
  });
  const [availableDates, setAvailableDates] = useState<DateOption[]>([]);
  const [unassignedCount, setUnassignedCount] = useState<number>(0);
  const [registerSearchQuery, setRegisterSearchQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showTreatmentForm, setShowTreatmentForm] = useState(false);
  const [treatmentForm, setTreatmentForm] = useState<Treatmentform>({
    TreatmentName: "",
    Diagnosis: "",
    ToothNumber: "",
    Cost: "",
    PaidAmount: "",
    Notes: "",
    Status: "planned",
  });
  const [selectedPatientForTreatment, setSelectedPatientForTreatment] = useState<Patient | null>(null);
  const [treatmentSubmitting, setTreatmentSubmitting] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    phone: "",
    email: "",
    age: "",
    gender: "",
    address: "",
    medicalNotes: "",
    allergies: "",
  });

  const [notice, setNotice] = useState<Notice | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Appointment integration states
  const [bookAppointment, setBookAppointment] = useState(false);
  const [service, setService] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [appointmentNotes, setAppointmentNotes] = useState("");

  // Clinic Services catalog state
  const [clinicServices, setClinicServices] = useState<any[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [newServiceModalName, setNewServiceModalName] = useState("");
  const [modalAddingService, setModalAddingService] = useState(false);

  async function fetchClinicServices() {
    setServicesLoading(true);
    try {
      const res = await fetch("/api/admin/services");
      const data = await res.json();
      if (data.success) {
        setClinicServices(data.services || []);
      }
    } catch (err) {
      console.error("Error fetching clinic services:", err);
    } finally {
      setServicesLoading(false);
    }
  }

  useEffect(() => {
    if (showForm && bookAppointment) {
      fetchClinicServices();
    }
  }, [showForm, bookAppointment]);

  const fetchPatients = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/patients", { cache: "no-store" });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        throw new Error(data?.message || `Request failed (${res.status})`);
      }

      setPatients((data.data || []) as Patient[]);
      if (data.availableDates) setAvailableDates(data.availableDates);
      if (data.unassignedCount !== undefined) setUnassignedCount(data.unassignedCount);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Failed to load patients");
    } finally {
      setLoading(false);
    }
  };

  const fetchRegisterData = async (date: string) => {
    setRegisterLoading(true);
    try {
      const res = await fetch(`/api/patients?mode=register&date=${date}`, { cache: "no-store" });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        throw new Error(data?.message || `Request failed (${res.status})`);
      }

      setRegisterRows(data.registerRows || []);
      setRegisterSummary(
        data.summary || {
          totalPatients: 0,
          totalCash: 0,
          totalCredit: 0,
          totalRevenue: 0,
        }
      );
      if (data.availableDates) setAvailableDates(data.availableDates);
      if (data.unassignedCount !== undefined) setUnassignedCount(data.unassignedCount);
    } catch (e: any) {
      console.error("Failed to load register records:", e);
      toast.error(e.message || "Failed to load physical register for selected date");
    } finally {
      setRegisterLoading(false);
    }
  };

  // Sync with URL query parameters for session persistence
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const modeParam = params.get("mode");
      const dateParam = params.get("date");
      if (modeParam === "register") {
        setViewMode("register");
        if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
          setSelectedDate(dateParam);
        }
      }
    }
  }, []);

  const syncUrlParams = (mode: "standard" | "register", date: string) => {
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (mode === "register") {
        url.searchParams.set("mode", "register");
        url.searchParams.set("date", date);
      } else {
        url.searchParams.delete("mode");
        url.searchParams.delete("date");
      }
      window.history.replaceState({}, "", url.toString());
    }
  };

  useEffect(() => {
    if (viewMode === "register") {
      fetchRegisterData(selectedDate);
      syncUrlParams("register", selectedDate);
    } else {
      syncUrlParams("standard", selectedDate);
    }
  }, [viewMode, selectedDate]);

  const handlePrevDay = () => {
    setSelectedDate((curr) => {
      const d = new Date(curr + "T00:00:00");
      d.setDate(d.getDate() - 1);
      return d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    });
  };

  const handleNextDay = () => {
    setSelectedDate((curr) => {
      const d = new Date(curr + "T00:00:00");
      d.setDate(d.getDate() + 1);
      return d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    });
  };

  const handleToday = () => {
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    setSelectedDate(today);
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr + "T00:00:00");
      return d.toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const handlePrintRegister = () => {
    window.print();
  };

  const handleExportExcel = () => {
    if (registerRows.length === 0) {
      toast.error("No patient records to export for this date.");
      return;
    }

    const dateFormatted = formatDisplayDate(selectedDate);
    let csv = "\uFEFF"; // UTF-8 BOM
    csv += `"ANIL SHARMA DENTAL HOSPITAL - DAILY PATIENT REGISTER"\n`;
    csv += `"Visit Date: ${dateFormatted} (${selectedDate})"\n\n`;

    const headers = [
      "Date",
      "S.No.",
      "Daily Token",
      "Patient Code",
      "Patient Full Name",
      "Age",
      "Gender",
      "Phone Number",
      "Address",
      "Disease / Diagnosis",
      "Treatment / Procedure",
      "Cash (Rs.)",
      "Cash (Paise)",
      "Credit (Rs.)",
      "Credit (Paise)",
      "Total Amount (Rs.)",
      "Payment Status",
      "Remarks",
    ];

    csv += headers.map((h) => `"${h}"`).join(",") + "\n";

    registerRows.forEach((r) => {
      const row = [
        r.date,
        r.sNo ?? "",
        r.daily ?? "",
        r.patientCode ?? "",
        r.fullName ?? "",
        r.age ?? "",
        r.gender ?? "",
        r.phone ?? "",
        r.address ?? "",
        r.disease ?? "",
        r.treatment ?? "",
        r.cashRs !== null && r.cashRs !== undefined ? r.cashRs : "",
        r.cashPaise ?? "",
        r.creditRs !== null && r.creditRs !== undefined ? r.creditRs : "",
        r.creditPaise ?? "",
        r.totalCost !== null && r.totalCost !== undefined ? r.totalCost : "",
        r.paymentStatus ?? "",
        r.remarks ?? "",
      ];
      csv += row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",") + "\n";
    });

    csv += `\n"Totals",,,,,,,,,,,"${registerSummary.totalCash}","00","${registerSummary.totalCredit}","00","${registerSummary.totalRevenue}","Patients: ${registerSummary.totalPatients}"\n`;

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Anil_Sharma_Dental_Register_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${registerRows.length} register entries to Excel / CSV`);
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleClearAllPatients = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete ALL patients? This will remove all patient records, appointments, treatments, and reset patient numbering back to PAT-001. This action cannot be undone."
      )
    ) {
      return;
    }
    try {
      setLoading(true);
      const res = await fetch("/api/patients", { method: "DELETE" });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast.success(data.message || "All patients cleared successfully");
      await fetchPatients();
    } catch (err: any) {
      toast.error(err.message || "Failed to clear patients");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSinglePatient = async (patientId: string, patientName: string) => {
    if (
      !window.confirm(
        `Are you sure you want to delete patient "${patientName}" and all linked records?`
      )
    ) {
      return;
    }
    try {
      const res = await fetch(`/api/patients/${patientId}?hard=true`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast.success(data.message || "Patient deleted successfully");
      await fetchPatients();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete patient");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(null);
    setSubmitting(true);

    try {
      // Basic validation before hitting backend
      const fullName = formData.fullName.trim();
      if (fullName.length < 3) {
        setNotice({ type: "error", message: "Full Name must be at least 3 characters." });
        setSubmitting(false);
        return;
      }

      const digitsOnly = formData.phone.trim().replace(/\D/g, "");
  

      if (!formData.gender || !["Male", "Female", "Other"].includes(formData.gender)) {
        setNotice({ type: "error", message: "Please select a valid gender." });
        setSubmitting(false);
        return;
      }

      if (bookAppointment) {
        if (!service) {
          setNotice({ type: "error", message: "Please select a service for the appointment." });
          setSubmitting(false);
          return;
        }
        if (!appointmentDate) {
          setNotice({ type: "error", message: "Please select a date for the appointment." });
          setSubmitting(false);
          return;
        }
        if (!appointmentTime) {
          setNotice({ type: "error", message: "Please select a time for the appointment." });
          setSubmitting(false);
          return;
        }
      }

      const res = await fetch("/api/patients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName,
          phone: digitsOnly,
          gender: formData.gender,
          email: formData.email.trim() || undefined,
          age: formData.age ? Number(formData.age) : undefined,
          address: formData.address.trim() || undefined,
          medicalNotes: formData.medicalNotes.trim() || undefined,
          allergies: formData.allergies.trim() || undefined,
          bookAppointment,
          service: bookAppointment ? service : undefined,
          appointmentDate: bookAppointment ? appointmentDate : undefined,
          appointmentTime: bookAppointment ? appointmentTime : undefined,
          notes: bookAppointment ? appointmentNotes.trim() : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data?.success) {
        throw new Error(data?.message || `Request failed (${res.status})`);
      }

      // Check if the returned patient was already in the list to prevent duplicates in local state
      const exists = patients.some((p) => p._id === data.data._id);

      let successMessage = "";
      if (exists) {
        successMessage = bookAppointment
          ? "✓ Patient already exists. Linked & Appointment booked successfully!"
          : "✓ Patient already exists. Linked successfully.";
      } else {
        successMessage = bookAppointment
          ? "✓ Patient registered & Appointment booked successfully!"
          : "✓ Patient registered successfully.";
      }

      setNotice({ type: "success", message: successMessage });

      if (exists) {
        // Move the existing patient to the top (since they now have a new appointment/visit activity)
        setPatients((prev) => {
          const filtered = prev.filter((p) => p._id !== data.data._id);
          const updatedPatient = {
            ...prev.find((p) => p._id === data.data._id),
            ...data.data,
            lastVisit: bookAppointment ? appointmentDate : data.data.lastVisit,
            appointmentCount: (prev.find((p) => p._id === data.data._id)?.appointmentCount || 0) + (bookAppointment ? 1 : 0),
          };
          return [updatedPatient, ...filtered];
        });
      } else {
        const newPatient = {
          ...data.data,
          lastVisit: bookAppointment ? appointmentDate : null,
          appointmentCount: bookAppointment ? 1 : 0,
        };
        setPatients((prev) => [newPatient, ...prev]);
      }

      // Reset form
      setFormData({
        fullName: "",
        phone: "",
        email: "",
        age: "",
        gender: "",
        address: "",
        medicalNotes: "",
        allergies: "",
      });
      setBookAppointment(false);
      setService("");
      setAppointmentDate("");
      setAppointmentTime("");
      setAppointmentNotes("");

      setShowForm(false);
    } catch (error) {
      console.error(error);
      setNotice({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to add patient",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleTreatmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientForTreatment) return;

    setNotice(null);
    setTreatmentSubmitting(true);

    try {
      const treatmentName = treatmentForm.TreatmentName.trim();
      const diagnosis = treatmentForm.Diagnosis.trim();
      const toothNumber = treatmentForm.ToothNumber.trim();
      const cost = Number(treatmentForm.Cost || 0);
      const paidAmount = Number(treatmentForm.PaidAmount || 0);

      if (!treatmentName) {
        setNotice({ type: "error", message: "Treatment Name is required." });
        setTreatmentSubmitting(false);
        return;
      }
      if (!diagnosis) {
        setNotice({ type: "error", message: "Diagnosis is required." });
        setTreatmentSubmitting(false);
        return;
      }
      if (!toothNumber) {
        setNotice({ type: "error", message: "Tooth Number is required." });
        setTreatmentSubmitting(false);
        return;
      }
      if (Number.isNaN(cost) || cost < 0) {
        setNotice({ type: "error", message: "Cost must be a valid positive number." });
        setTreatmentSubmitting(false);
        return;
      }
      if (Number.isNaN(paidAmount) || paidAmount < 0) {
        setNotice({ type: "error", message: "Paid Amount must be a valid positive number." });
        setTreatmentSubmitting(false);
        return;
      }

      const res = await fetch("/api/treatment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patientId: selectedPatientForTreatment._id,
          treatmentName,
          diagnosis,
          toothNumber,
          cost,
          paidAmount,
          notes: treatmentForm.Notes.trim(),
          status: treatmentForm.Status,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data?.success) {
        throw new Error(data?.message || "Failed to create treatment");
      }

      setNotice({
        type: "success",
        message: `✓ Treatment "${treatmentName}" added successfully for ${selectedPatientForTreatment.fullName}!`,
      });

      // Reset & close
      setShowTreatmentForm(false);
      setSelectedPatientForTreatment(null);
      setTreatmentForm({
        TreatmentName: "",
        Diagnosis: "",
        ToothNumber: "",
        Cost: "",
        PaidAmount: "",
        Notes: "",
        Status: "planned",
      });

      // Reload patients to refresh visit status / statistics
      const refreshRes = await fetch("/api/patients", { cache: "no-store" });
      const refreshData = await refreshRes.json().catch(() => null);
      if (refreshData?.success) {
        setPatients((refreshData.data || []) as Patient[]);
      }
    } catch (err: any) {
      console.error(err);
      setNotice({
        type: "error",
        message: err.message || "Failed to add treatment",
      });
    } finally {
      setTreatmentSubmitting(false);
    }
  };

  // Compute patients counts for mini dashboard stats
  const stats = useMemo(() => {
    const total = patients.length;
    const male = patients.filter((p) => p.gender === "Male").length;
    const female = patients.filter((p) => p.gender === "Female").length;
    return { total, male, female };
  }, [patients]);

  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      const patientId = (p.patientCode ?? p._id ?? "").toLowerCase();
      const name = (p.fullName ?? "").toLowerCase();
      const phone = (p.phone ?? "").toLowerCase();
      return patientId.includes(q) || name.includes(q) || phone.includes(q);
    });
  }, [patients, searchQuery]);

  const filteredRegisterRows = useMemo(() => {
    const q = registerSearchQuery.trim().toLowerCase();
    if (!q) return registerRows;
    return registerRows.filter((r) => {
      return (
        String(r.sNo || "").toLowerCase().includes(q) ||
        String(r.daily || "").toLowerCase().includes(q) ||
        (r.fullName || "").toLowerCase().includes(q) ||
        (r.patientCode || "").toLowerCase().includes(q) ||
        (r.phone || "").toLowerCase().includes(q) ||
        (r.address || "").toLowerCase().includes(q) ||
        (r.disease || "").toLowerCase().includes(q) ||
        (r.treatment || "").toLowerCase().includes(q) ||
        (r.remarks || "").toLowerCase().includes(q)
      );
    });
  }, [registerRows, registerSearchQuery]);

  const getGenderBadgeStyles = (gender?: string) => {
    switch (gender) {
      case "Male":
        return "bg-blue-50 text-blue-700 border-blue-100/50";
      case "Female":
        return "bg-pink-50 text-pink-700 border-pink-100/50";
      default:
        return "bg-purple-50 text-purple-700 border-purple-100/50";
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-1">
      {/* Title Header & Main Toggle Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#14213D] tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-[#14B8A6]" />
            Patients Directory
          </h1>
          <p className="text-[#64748B] text-xs mt-1 font-medium">
            Electronic health records, clinical triage, and treatment histories
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 no-print">
          {/* Physical Register View Toggle: OFF / ON */}
          <div className="flex items-center p-1 bg-white border border-[#E2E8F0] rounded-xl shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode("standard")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === "standard"
                  ? "bg-[#14213D] text-white shadow-2xs"
                  : "text-[#64748B] hover:text-[#182230]"
              }`}
              title="Standard Patients Directory (Cards / Table)"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Standard Directory</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode("register");
                setShowForm(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === "register"
                  ? "bg-[#0D9488] text-white shadow-2xs"
                  : "text-[#64748B] hover:text-[#182230]"
              }`}
              title="Traditional Handwritten Register Mode"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Physical Register View</span>
              <span
                className={`text-[9.5px] px-1.5 py-0.5 rounded font-black tracking-wider uppercase ${
                  viewMode === "register"
                    ? "bg-white/20 text-white"
                    : "bg-emerald-100 text-emerald-800"
                }`}
              >
                {viewMode === "register" ? "ON" : "OFF"}
              </span>
            </button>
          </div>

          {viewMode === "standard" && patients.length > 0 && (
            <button
              onClick={handleClearAllPatients}
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 shadow-2xs transition-all duration-150 cursor-pointer"
              title="Delete all patients, appointments, treatments and reset numbering"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All Patients</span>
            </button>
          )}

          <button
            onClick={() => {
              setShowForm(!showForm);
              setNotice(null);
            }}
            type="button"
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold shadow-2xs transition-all duration-150 cursor-pointer ${
              showForm
                ? "bg-[#F4F7FA] hover:bg-slate-200 text-[#182230] border border-[#E2E8F0]"
                : "bg-[#14B8A6] hover:bg-[#0D9488] text-white"
            }`}
          >
            {showForm ? (
              <>
                <X className="w-4 h-4" />
                Close Form
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Add Patient
              </>
            )}
          </button>
        </div>
      </div>

      {/* Modern SaaS Redesigned Registration Form Card */}
      {showForm && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-md transition-all duration-300 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Register New Patient</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Please provide accurate personal and clinical records</p>
            </div>
            <button
              onClick={() => setShowForm(false)}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Group 1: Personal Details */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 border-b border-slate-50 pb-1">
                  <User className="w-3.5 h-3.5" />
                  Personal Information
                </h3>

                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-500">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      placeholder=" Name"
                      value={formData.fullName}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, fullName: e.target.value }))
                      }
                      className="block w-full pl-9 pr-3 py-2 text-xs bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 outline-none transition-all placeholder:text-slate-400 text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-500">
                      Phone Number <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
                        type="tel"
                        placeholder="10-digit mobile"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData((p) => ({ ...p, phone: e.target.value }))
                        }
                        
                        className="block w-full pl-9 pr-3 py-2 text-xs bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 outline-none transition-all placeholder:text-slate-400 text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-500">
                      Gender <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.gender}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, gender: e.target.value }))
                      }
                      required
                      className="block w-full px-3 py-2 text-xs bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 outline-none transition-all text-slate-700"
                    >
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-500">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
                        type="email"
                        placeholder="email@example.com"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData((p) => ({ ...p, email: e.target.value }))
                        }
                        className="block w-full pl-9 pr-3 py-2 text-xs bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 outline-none transition-all placeholder:text-slate-400 text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-500">
                      Age
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Calendar className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
                        type="number"
                        placeholder="Years"
                        value={formData.age}
                        onChange={(e) =>
                          setFormData((p) => ({ ...p, age: e.target.value }))
                        }
                        min={0}
                        className="block w-full pl-9 pr-3 py-2 text-xs bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 outline-none transition-all placeholder:text-slate-400 text-slate-800"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Group 2: Clinical Details */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 border-b border-slate-50 pb-1">
                  <Activity className="w-3.5 h-3.5" />
                  Clinical Records
                </h3>

                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-500">
                    Residential Address
                  </label>
                  <div className="relative">
                    <div className="absolute top-2.5 left-3 flex items-start pointer-events-none">
                      <MapPin className="h-4 w-4 text-slate-400" />
                    </div>
                    <textarea
                      placeholder="Home or postal address..."
                      value={formData.address}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, address: e.target.value }))
                      }
                      className="block w-full pl-9 pr-3 py-2 text-xs bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 outline-none transition-all placeholder:text-slate-400 text-slate-800 resize-none"
                      rows={2}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-500">
                    Medical Notes
                  </label>
                  <div className="relative">
                    <div className="absolute top-2.5 left-3 flex items-start pointer-events-none">
                      <FileText className="h-4 w-4 text-slate-400" />
                    </div>
                    <textarea
                      placeholder="Chronic conditions, medications, etc..."
                      value={formData.medicalNotes}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, medicalNotes: e.target.value }))
                      }
                      className="block w-full pl-9 pr-3 py-2 text-xs bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 outline-none transition-all placeholder:text-slate-400 text-slate-800 resize-none"
                      rows={2}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-500">
                    Known Allergies
                  </label>
                  <div className="relative">
                    <div className="absolute top-2.5 left-3 flex items-start pointer-events-none">
                      <ShieldAlert className="h-4 w-4 text-slate-400 animate-pulse text-amber-500" />
                    </div>
                    <textarea
                      placeholder="Food, medicine, or substance allergies..."
                      value={formData.allergies}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, allergies: e.target.value }))
                      }
                      className="block w-full pl-9 pr-3 py-2 text-xs bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 outline-none transition-all placeholder:text-slate-400 text-slate-800 resize-none"
                      rows={2}
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Schedule Appointment Section */}
            <div className="border-t border-slate-100 pt-5 mt-5 space-y-4">
              <label className="inline-flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={bookAppointment}
                  onChange={(e) => setBookAppointment(e.target.checked)}
                  className="rounded border-slate-350 text-indigo-650 focus:ring-indigo-500 w-4 h-4 transition-colors"
                />
                <span className="text-xs font-bold text-slate-700 select-none group-hover:text-indigo-600 transition-colors">
                  Schedule an appointment for this patient?
                </span>
              </label>

              {bookAppointment && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50/50 p-4 border border-slate-100 rounded-xl animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-500">
                      Service / Treatment <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={service}
                      onChange={(e) => {
                        if (e.target.value === "ADD_NEW_SERVICE") {
                          setShowAddServiceModal(true);
                        } else {
                          setService(e.target.value);
                        }
                      }}
                      required={bookAppointment}
                      className="block w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 outline-none transition-all text-slate-700"
                    >
                      <option value="">Select service...</option>
                      {servicesLoading ? (
                        <option disabled>Loading services...</option>
                      ) : (
                        clinicServices.map((s) => (
                          <option key={s._id} value={s.name}>
                            {s.name}
                          </option>
                        ))
                      )}
                      {service && service !== "ADD_NEW_SERVICE" && !clinicServices.some(s => s.name === service) && (
                        <option value={service}>{service}</option>
                      )}
                      <option value="ADD_NEW_SERVICE">✨ Add New Service...</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-500">
                      Appointment Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={appointmentDate}
                      onChange={(e) => setAppointmentDate(e.target.value)}
                      required={bookAppointment}
                      min={new Date().toISOString().split("T")[0]}
                      className="block w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 outline-none transition-all text-slate-700"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-500">
                      Appointment Time <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="time"
                      value={appointmentTime}
                      onChange={(e) => setAppointmentTime(e.target.value)}
                      required={bookAppointment}
                      className="block w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 outline-none transition-all text-slate-700"
                    />
                  </div>

                  <div className="md:col-span-3 space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-500">
                      Appointment Notes
                    </label>
                    <textarea
                      placeholder="Special instructions or notes for this visit..."
                      value={appointmentNotes}
                      onChange={(e) => setAppointmentNotes(e.target.value)}
                      className="block w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 outline-none transition-all text-slate-800 resize-none"
                      rows={2}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions Row */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setNotice(null);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all duration-150"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-[#14B8A6] hover:bg-[#0D9488] disabled:opacity-75 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold shadow-2xs hover:shadow-xs transition-all duration-150 flex items-center gap-1.5 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Registering...
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Register Patient
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {viewMode === "register" ? (
        <PhysicalRegisterView
          selectedDate={selectedDate}
          onSelectDate={(d) => setSelectedDate(d)}
          registerRows={registerRows}
          registerSummary={registerSummary}
          availableDates={availableDates}
          unassignedCount={unassignedCount}
          loading={registerLoading}
          onPrevDay={handlePrevDay}
          onNextDay={handleNextDay}
          onToday={handleToday}
          onPrint={handlePrintRegister}
          onExportExcel={handleExportExcel}
          formatDisplayDate={formatDisplayDate}
        />
      ) : (
        <>
          {/* Mini Stats KPI Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#14213D]/5 border border-[#14213D]/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-[#14213D]" />
          </div>
          <div>
            <span className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider">Total Patients</span>
            <span className="text-lg font-extrabold text-[#14213D] block mt-0.5">{stats.total}</span>
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center">
            <User className="w-5 h-5 text-sky-700" />
          </div>
          <div>
            <span className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider">Male Patients</span>
            <span className="text-lg font-extrabold text-[#14213D] block mt-0.5">{stats.male}</span>
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center">
            <User className="w-5 h-5 text-rose-600" />
          </div>
          <div>
            <span className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider">Female Patients</span>
            <span className="text-lg font-extrabold text-[#14213D] block mt-0.5">{stats.female}</span>
          </div>
        </div>
      </div>

      {/* Action Notification Notices */}
      {notice && (
        <div
          className={`text-xs font-semibold rounded-xl px-4 py-3 border animate-in fade-in duration-200 ${notice.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-rose-50 border-rose-200 text-rose-700"
            }`}
        >
          {notice.message}
        </div>
      )}

      {/* Search Input Bar Section */}
      <div className="relative w-full">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-[#64748B]" />
        </div>
        <input
          type="text"
          placeholder="Search patients by name, patient code, or contact number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="block w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-[#E2E8F0] focus:border-[#14B8A6] rounded-xl focus:ring-2 focus:ring-[#14B8A6]/20 outline-none transition-all placeholder:text-[#64748B] text-[#182230] shadow-2xs font-medium"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#64748B] hover:text-[#182230] transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-7 h-7 animate-spin text-[#14B8A6]" />
        </div>
      )}

      {error && (
        <div className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-4 text-center">
          {error}
        </div>
      )}

      {/* Patients Table */}
      {!loading && !error && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#F4F7FA] border-b border-[#E2E8F0]">
                  <th className="py-3 px-4 text-left text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Patient Code</th>
                  <th className="py-3 px-4 text-left text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Full Name</th>
                  <th className="py-3 px-4 text-left text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Contact Phone</th>
                  <th className="py-3 px-4 text-left text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Visits</th>
                  <th className="py-3 px-4 text-left text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Last Visit</th>
                  <th className="py-3 px-4 text-right text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]/60">
                {filteredPatients.map((patient) => (
                  <tr key={patient._id} className="hover:bg-[#F4F7FA]/70 transition-colors group">
                    <td className="py-3 px-4 text-xs">
                      <span className="font-mono font-bold bg-[#14213D] text-white px-2 py-0.5 rounded text-[10.5px]">
                        {patient.patientCode ?? patient._id}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs font-bold text-[#182230]">
                      <button
                        type="button"
                        onClick={() => {
                          const patientId = patient?._id ? String(patient._id) : "";
                          if (patientId) router.push(`/admin/patients/${patientId}`);
                        }}
                        className="hover:text-[#14B8A6] text-left transition-colors cursor-pointer"
                      >
                        {patient.fullName ?? "—"}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-xs text-[#64748B] font-medium">
                      {patient.phone ?? "—"}
                    </td>
                    <td className="py-3 px-4 text-xs text-[#182230] font-semibold">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px]">
                        {patient.appointmentCount ?? 0}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-[#64748B] font-medium">
                      {patient.lastVisit ? new Date(patient.lastVisit).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }) : "No visits recorded"}
                    </td>
                    <td className="py-3 px-4 text-xs text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const patientId = patient?._id ? String(patient._id) : "";
                            if (patientId) router.push(`/admin/patients/${patientId}`);
                          }}
                          className="inline-flex items-center text-xs font-bold px-3 py-1.5 bg-[#14213D] hover:bg-[#0D1629] text-white rounded-lg transition-all cursor-pointer shadow-2xs"
                        >
                          View Profile
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPatientForTreatment(patient);
                            setTreatmentForm({
                              TreatmentName: "",
                              Diagnosis: "",
                              ToothNumber: "",
                              Cost: "",
                              PaidAmount: "",
                              Notes: "",
                              Status: "planned",
                            });
                            setShowTreatmentForm(true);
                          }}
                          className="inline-flex items-center text-xs font-bold px-3 py-1.5 bg-[#CCFBF1] hover:bg-[#14B8A6] text-[#0D9488] hover:text-white rounded-lg transition-all cursor-pointer shadow-2xs"
                        >
                          + Treatment
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSinglePatient(String(patient._id), patient.fullName || "Patient")}
                          className="p-1.5 text-[#64748B] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200 cursor-pointer"
                          title="Delete Patient and linked records"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredPatients.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 px-4 text-center text-xs text-[#64748B] font-medium">
                      No patients found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
        </>
      )}

      {/* Quick Add Treatment Modal */}
      {showTreatmentForm && selectedPatientForTreatment && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Quick Add Treatment
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  For patient: <span className="font-semibold text-indigo-600">{selectedPatientForTreatment.fullName}</span> ({selectedPatientForTreatment.patientCode ?? selectedPatientForTreatment._id})
                </p>
              </div>
              <button
                onClick={() => {
                  setShowTreatmentForm(false);
                  setSelectedPatientForTreatment(null);
                }}
                className="text-slate-400 hover:text-slate-600 transition-colors"
                type="button"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleTreatmentSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Treatment Name <span className="text-rose-500">*</span>
                </label>
                <input
                  value={treatmentForm.TreatmentName}
                  onChange={(e) => setTreatmentForm(prev => ({ ...prev, TreatmentName: e.target.value }))}
                  required
                  placeholder="e.g. Dental Cleaning"
                  className="block w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 outline-none transition-all text-slate-700"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Diagnosis <span className="text-rose-500">*</span>
                </label>
                <input
                  value={treatmentForm.Diagnosis}
                  onChange={(e) => setTreatmentForm(prev => ({ ...prev, Diagnosis: e.target.value }))}
                  required
                  placeholder="e.g. Gingivitis, plaque accumulation"
                  className="block w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 outline-none transition-all text-slate-700"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Tooth Number(s) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    value={treatmentForm.ToothNumber}
                    onChange={(e) => setTreatmentForm(prev => ({ ...prev, ToothNumber: e.target.value }))}
                    required
                    placeholder="e.g. 14, 15 or General"
                    className="block w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 outline-none transition-all text-slate-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Treatment Status
                  </label>
                  <select
                    value={treatmentForm.Status}
                    onChange={(e) => setTreatmentForm(prev => ({ ...prev, Status: e.target.value }))}
                    className="block w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 outline-none transition-all text-slate-700"
                  >
                    <option value="planned">Planned</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Cost (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={treatmentForm.Cost}
                    onChange={(e) => setTreatmentForm(prev => ({ ...prev, Cost: e.target.value }))}
                    required
                    min={0}
                    placeholder="Total treatment cost"
                    className="block w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 outline-none transition-all text-slate-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Paid Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={treatmentForm.PaidAmount}
                    onChange={(e) => setTreatmentForm(prev => ({ ...prev, PaidAmount: e.target.value }))}
                    min={0}
                    placeholder="Paid amount (default 0)"
                    className="block w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 outline-none transition-all text-slate-700"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Treatment Notes
                </label>
                <textarea
                  value={treatmentForm.Notes}
                  onChange={(e) => setTreatmentForm(prev => ({ ...prev, Notes: e.target.value }))}
                  placeholder="Notes, recommendations, prescriptions..."
                  className="block w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 outline-none transition-all text-slate-700 resize-none"
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowTreatmentForm(false);
                    setSelectedPatientForTreatment(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={treatmentSubmitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-75 disabled:cursor-not-allowed text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all"
                >
                  {treatmentSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Save Treatment
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddServiceModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-100 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-slate-800">Add New Service</h3>
              <button
                type="button"
                onClick={() => {
                  setShowAddServiceModal(false);
                  setNewServiceModalName("");
                }}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Service Name
                </label>
                <input
                  type="text"
                  value={newServiceModalName}
                  onChange={(e) => setNewServiceModalName(e.target.value)}
                  placeholder="e.g. Tooth Extraction"
                  className="block w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 outline-none text-slate-700 font-medium"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddServiceModal(false);
                    setNewServiceModalName("");
                  }}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-150 text-slate-700 rounded-xl text-[11px] font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={modalAddingService || !newServiceModalName.trim()}
                  onClick={async () => {
                    setModalAddingService(true);
                    try {
                      const res = await fetch("/api/admin/services", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ name: newServiceModalName.trim() }),
                      });
                      const data = await res.json();
                      if (data.success) {
                        toast.success("Service created successfully!");
                        const newSvcName = data.service.name;
                        
                        const updatedRes = await fetch("/api/admin/services");
                        const updatedData = await updatedRes.json();
                        if (updatedData.success) {
                          setClinicServices(updatedData.services || []);
                        }
                        
                        setService(newSvcName);
                        setShowAddServiceModal(false);
                        setNewServiceModalName("");
                      } else {
                        throw new Error(data.message || "Failed to create service");
                      }
                    } catch (err: any) {
                      console.error(err);
                      toast.error(err.message || "Error creating service");
                    } finally {
                      setModalAddingService(false);
                    }
                  }}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[11px] font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {modalAddingService && <Loader2 className="w-3 h-3 animate-spin" />}
                  <span>Create Service</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
