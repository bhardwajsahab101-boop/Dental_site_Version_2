"use client";

import React, { use, useEffect, useState, useMemo } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  User,
  Calendar,
  Clock,
  Phone,
  Mail,
  MapPin,
  ShieldAlert,
  FileText,
  Activity,
  Users,
  Plus,
  X,
  Check,
  Loader2,
  CalendarDays,
  ClipboardList,
  Edit3,
  Trash2,
  Printer,
  TrendingUp,
  CheckCircle2,
  MoreVertical
} from "lucide-react";

type Patient = {
  _id: string;
  patientCode?: string;
  fullName?: string;
  phone?: string;
  email?: string;
  gender?: string;
  age?: number;
  address?: string;
  medicalNotes?: string;
  allergies?: string;
  documents?: any[];
};

type Appointment = {
  _id: string;
  service: string;
  appointmentDate: string | Date;
  status: string;
  appointmentTime?: string;
  notes?: string;
};

type Treatment = {
  _id: string;
  appointmentId?: string | null;
  treatmentName: string;
  diagnosis: string;
  toothNumber: string;
  cost: number;
  paidAmount: number;
  paymentStatus: "paid" | "partial" | "unpaid";
  notes?: string;
  status: "planned" | "in_progress" | "completed" | "cancelled";
  createdAt: string;
};

type ProfileResponse = {
  success: boolean;
  patient?: Patient;
  appointments?: Appointment[];
  treatments?: Treatment[];
  auditLogs?: any[];
  stats?: {
    totalAppointments: number;
    completedAppointments: number;
    pendingAppointments: number;
    confirmedAppointments: number;
    cancelledAppointments: number;
  };
  treatmentStats?: {
    totalTreatments: number;
    completedTreatments: number;
    activeTreatments: number;
  };
  financialSummary?: {
    totalRevenue: number;
    totalCollected: number;
    totalOutstanding: number;
  };
  message?: string;
};

type Props = {
  params: Promise<{ id: string }> | { id: string };
};

export default function PatientProfilePage({ params }: Props) {
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const p = await params;
        if (mounted && p?.id) setId(p.id);
      } catch (e) {
        // If params is a plain object, await will just return it
        try {
          // @ts-ignore
          if (params?.id && mounted) setId((params as any).id);
        } catch (_) {
          console.error("Failed to resolve route params", e);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [params]);

  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [treatmentStats, setTreatmentStats] = useState({
    totalTreatments: 0,
    completedTreatments: 0,
    activeTreatments: 0,
  });
  const [financialSummary, setFinancialSummary] = useState({
    totalRevenue: 0,
    totalCollected: 0,
    totalOutstanding: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Booking Modal States
  const [showBookModal, setShowBookModal] = useState(false);
  const [service, setService] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [notes, setNotes] = useState("");
  const [booking, setBooking] = useState(false);

  // Add/Edit Treatment Modal States
  const [showTreatmentModal, setShowTreatmentModal] = useState(false);
  const [editingTreatment, setEditingTreatment] = useState<Treatment | null>(null);
  const [treatmentName, setTreatmentName] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [toothNumber, setToothNumber] = useState("");
  const [cost, setCost] = useState<string>("");
  const [paidAmount, setPaidAmount] = useState<string>("");
  const [treatmentNotes, setTreatmentNotes] = useState("");
  const [treatmentStatus, setTreatmentStatus] = useState<
    "planned" | "in_progress" | "completed" | "cancelled"
  >("planned");
  const [addingTreatment, setAddingTreatment] = useState(false);

  // Invoice States
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // Document Upload States
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docCategory, setDocCategory] = useState<string>("X-Rays");
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [clinicSettings, setClinicSettings] = useState<any>(null);

  async function load() {
    if (!id) {
      setError("Invalid patient ID.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/patients/${id}`, { cache: "no-store" });
      const data: ProfileResponse = await res
        .json()
        .catch(() => ({ success: false } as ProfileResponse));

      if (!res.ok || !data?.success || !data?.patient) {
        throw new Error(data?.message || `Request failed (${res.status})`);
      }

      setPatient(data.patient);
      setAppointments(data.appointments || []);
      setTreatments(data.treatments || []);
      setAuditLogs(data.auditLogs || []);
      if (data.treatmentStats) {
        setTreatmentStats(data.treatmentStats);
      }
      if (data.financialSummary) {
        setFinancialSummary(data.financialSummary);
      }

      // Fetch clinic settings
      try {
        const settingsRes = await fetch("/api/admin/settings");
        const settingsData = await settingsRes.json();
        if (settingsData.success) {
          setClinicSettings(settingsData.settings);
        }
      } catch (settingsErr) {
        console.error("Error loading clinic settings:", settingsErr);
      }
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Failed to load patient profile");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setLoading(true);
    setError(null);
    load();
  }, [id]);

  const totalAppointments = appointments.length;

  const lastVisitDateLabel = useMemo(() => {
    if (appointments.length === 0) return "No visits yet";
    const lastAppt = appointments[0]; // sorted descending
    const dateObj = typeof lastAppt.appointmentDate === "string"
      ? new Date(lastAppt.appointmentDate)
      : lastAppt.appointmentDate;

    if (isNaN(dateObj.getTime())) {
      return String(lastAppt.appointmentDate);
    }

    return dateObj.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }, [appointments]);

  // Status Colors helper
  const getStatusColorStyles = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return {
          badge: "bg-emerald-50 text-emerald-700 border-emerald-100/80",
          dot: "bg-emerald-500 ring-emerald-100",
        };
      case "completed":
        return {
          badge: "bg-blue-50 text-blue-700 border-blue-100/80",
          dot: "bg-blue-500 ring-blue-100",
        };
      case "cancelled":
        return {
          badge: "bg-rose-50 text-rose-700 border-rose-100/80",
          dot: "bg-rose-500 ring-rose-100",
        };
      default:
        return {
          badge: "bg-amber-50 text-amber-700 border-amber-100/80",
          dot: "bg-amber-500 ring-amber-100",
        };
    }
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!service || !appointmentDate || !appointmentTime) {
      toast.error("Please fill in all appointment fields");
      return;
    }

    setBooking(true);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patientId: patient?._id,
          service,
          appointmentDate,
          appointmentTime,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to book appointment");
      }

      toast.success("Appointment booked successfully!");
      setShowBookModal(false);

      // Reset fields
      setService("");
      setAppointmentDate("");
      setAppointmentTime("");
      setNotes("");

      // Reload details page dynamically to sync count and timeline
      await load();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to schedule appointment");
    } finally {
      setBooking(false);
    }
  };

  const handleSubmitTreatment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!patient?._id) {
      toast.error("Patient not loaded yet.");
      return;
    }

    if (!treatmentName.trim() || !diagnosis.trim() || !toothNumber.trim()) {
      toast.error("Please fill Treatment Name, Diagnosis, and Tooth Number.");
      return;
    }

    const parsedCost = Number(cost);
    if (Number.isNaN(parsedCost) || parsedCost < 0) {
      toast.error("Cost must be a valid number (0 or more).");
      return;
    }

    const parsedPaid = paidAmount.trim() !== "" ? Number(paidAmount) : undefined;
    if (parsedPaid !== undefined && (Number.isNaN(parsedPaid) || parsedPaid < 0)) {
      toast.error("Paid Amount must be a valid number (0 or more).");
      return;
    }

    const appointmentId = appointments.length > 0 ? appointments[0]._id : null;

    setAddingTreatment(true);
    try {
      const payload = {
        patientId: patient._id,
        appointmentId: editingTreatment ? editingTreatment.appointmentId : appointmentId,
        treatmentName: treatmentName.trim(),
        diagnosis: diagnosis.trim(),
        toothNumber: toothNumber.trim(),
        notes: treatmentNotes,
        cost: parsedCost,
        paidAmount: parsedPaid,
        status: treatmentStatus,
      };

      const url = editingTreatment
        ? `/api/treatment/${editingTreatment._id}`
        : "/api/treatment";
      const method = editingTreatment ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || `Failed to ${editingTreatment ? 'update' : 'create'} treatment`);
      }

      toast.success(editingTreatment ? "Treatment updated successfully!" : "Treatment added successfully!");
      setShowTreatmentModal(false);
      setEditingTreatment(null);

      // Reset
      setTreatmentName("");
      setDiagnosis("");
      setToothNumber("");
      setCost("");
      setPaidAmount("");
      setTreatmentNotes("");
      setTreatmentStatus("planned");

      await load();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to submit treatment");
    } finally {
      setAddingTreatment(false);
    }
  };

  const handleDeleteTreatment = async (treatmentId: string) => {
    if (!window.confirm("Are you sure you want to delete this treatment?")) return;
    try {
      const res = await fetch(`/api/treatment/${treatmentId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to delete treatment");
      }
      toast.success("Treatment deleted successfully");
      await load();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to delete treatment");
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error("Please select a file to upload");
      return;
    }

    setUploadingDoc(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("category", docCategory);

      const res = await fetch(`/api/patients/${id}/documents`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to upload document");
      }

      toast.success("Document uploaded successfully!");
      setShowUploadModal(false);
      setSelectedFile(null);
      setDocCategory("X-Rays");
      await load();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to upload document");
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return;

    try {
      const res = await fetch(`/api/patients/${id}/documents?documentId=${docId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to delete document");
      }

      toast.success("Document deleted successfully");
      await load();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to delete document");
    }
  };


  // Build unified chronological timeline items
  const timelineItems = useMemo(() => {
    const items: Array<{
      id: string;
      date: Date;
      type: "appointment" | "treatment" | "document" | "activity";
      title: string;
      details: string;
      status?: string;
      meta?: any;
    }> = [];

    // Add Appointments
    appointments.forEach((a) => {
      const d = typeof a.appointmentDate === "string" ? new Date(a.appointmentDate) : a.appointmentDate;
      items.push({
        id: `appt-${a._id}`,
        date: isNaN(d.getTime()) ? new Date() : d,
        type: "appointment",
        title: `Scheduled: ${a.service}`,
        details: `Time: ${a.appointmentTime || "Not set"}. Notes: ${a.notes || "None"}`,
        status: a.status,
        meta: a,
      });
    });

    // Add Treatments
    treatments.forEach((t) => {
      const d = new Date(t.createdAt);
      items.push({
        id: `treatment-${t._id}`,
        date: isNaN(d.getTime()) ? new Date() : d,
        type: "treatment",
        title: `Procedure Plan: ${t.treatmentName}`,
        details: `Diagnosis: ${t.diagnosis} (Tooth ${t.toothNumber}). Cost: ₹${t.cost}, Paid: ₹${t.paidAmount}. Notes: ${t.notes || "None"}`,
        status: t.status,
        meta: t,
      });
    });

    // Add Documents (if any uploaded under patient)
    const patientDocs = (patient as any)?.documents || [];
    patientDocs.forEach((doc: any) => {
      const d = new Date(doc.uploadedAt);
      items.push({
        id: `doc-${doc._id || doc.url}`,
        date: isNaN(d.getTime()) ? new Date() : d,
        type: "document",
        title: `Uploaded Receipt: ${doc.name}`,
        details: `Category: ${doc.category}. Uploaded by: ${doc.uploadedBy || "Clinic Staff"}`,
        meta: doc,
      });
    });

    // Add Notes / Status changes from Audit Logs
    auditLogs.forEach((log) => {
      const d = new Date(log.createdAt);
      items.push({
        id: `audit-${log._id}`,
        date: isNaN(d.getTime()) ? new Date() : d,
        type: "activity",
        title: log.action,
        details: `${log.details} by ${log.userName} (${log.userRole})`,
        meta: log,
      });
    });

    // Sort chronologically ascending
    return items.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [appointments, treatments, patient, auditLogs]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-sm text-slate-500 flex items-center gap-2">
          <svg className="animate-spin h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading patient profile...
        </div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="max-w-md mx-auto my-8 p-6 bg-rose-50 border border-rose-100 rounded-2xl text-center space-y-4">
        <ShieldAlert className="w-10 h-10 text-rose-500 mx-auto" />
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-rose-900">Failed to Load Profile</h3>
          <p className="text-xs text-rose-700">{error || "Patient not found."}</p>
        </div>
        <Link
          href="/admin/patients"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-white hover:bg-rose-100/50 border border-rose-200 rounded-xl px-4 py-2 transition-all shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Patients List
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 px-1 relative">
      {/* Header, Back Button, and Booking Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <Link
            href="/admin/patients"
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Patients
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              {patient.fullName}
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-mono font-semibold bg-slate-100 text-slate-700 border border-slate-200/50 rounded-full">
              {patient.patientCode || patient._id}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Call Action */}
          <a
            href={`tel:${patient.phone}`}
            title="Call Patient"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold shadow-sm transition-all hover:shadow duration-200 shrink-0 cursor-pointer"
          >
            📞 Call Patient
          </a>

          {/* Quick Reminder Action */}
          <button
            onClick={() => {
              const waUrl = `https://wa.me/${(patient.phone || "").replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                `Hello ${patient.fullName}, this is a friendly reminder from ${clinicSettings?.name || "our clinic"} regarding your outstanding due of ₹${financialSummary.totalOutstanding.toLocaleString()}. Please contact us to settle it. Thank you!`
              )}`;
              window.open(waUrl, "_blank");
              toast.success(`WhatsApp reminder opened for ${patient.fullName}`);
            }}
            type="button"
            title="Send WhatsApp Reminder"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold shadow-sm transition-all hover:shadow duration-200 shrink-0 cursor-pointer text-slate-700"
          >
            ✉ Send Reminder
          </button>

          {/* Quick Invoice Action */}
          <button
            onClick={() => {
              if (treatments.length === 0) {
                toast.error("No treatments to generate invoice for.");
                return;
              }
              setSelectedInvoices(treatments.map((t) => t._id));
              setShowInvoiceModal(true);
            }}
            type="button"
            title="Generate Invoice"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold shadow-sm transition-all hover:shadow duration-200 shrink-0 cursor-pointer"
          >
            🧾 Invoice
          </button>

          <button
            onClick={() => {
              setEditingTreatment(null);
              setTreatmentName("");
              setDiagnosis("");
              setToothNumber("");
              setCost("");
              setPaidAmount("");
              setTreatmentNotes("");
              setTreatmentStatus("planned");
              setShowTreatmentModal(true);
            }}
            type="button"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold shadow-sm transition-all hover:shadow duration-200 shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Treatment
          </button>

          {/* Book Appointment Button */}
          <button
            onClick={() => setShowBookModal(true)}
            type="button"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-700 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all hover:shadow duration-200 shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Book Appointment
          </button>
        </div>
      </div>


      {/* Top Level Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="bg-white border border-slate-150 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
            <Users className="w-4.5 h-4.5 text-indigo-600" />
          </div>
          <div className="min-w-0">
            <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block truncate">
              Appointments
            </span>
            <span className="text-lg font-bold text-slate-800 block mt-0.5">
              {totalAppointments}
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-150 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
            <Calendar className="w-4.5 h-4.5 text-emerald-600" />
          </div>
          <div className="min-w-0">
            <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block truncate">
              Last Visit
            </span>
            <span className="text-lg font-bold text-slate-800 block mt-0.5 truncate">
              {lastVisitDateLabel}
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-150 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
            <Activity className="w-4.5 h-4.5 text-amber-600" />
          </div>
          <div className="min-w-0">
            <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block truncate">
              Allergies Summary
            </span>
            <span className="text-xs font-semibold text-slate-700 block mt-1 truncate" title={patient.allergies || "None declared"}>
              {patient.allergies || "No allergies"}
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-150 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <span className="text-blue-600 font-bold text-sm">₹</span>
          </div>
          <div className="min-w-0">
            <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block truncate">
              Total Billed
            </span>
            <span className="text-lg font-bold text-slate-800 block mt-0.5 font-mono">
              ₹{financialSummary.totalRevenue.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-150 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
            <span className="text-emerald-600 font-bold text-sm">₹</span>
          </div>
          <div className="min-w-0">
            <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block truncate">
              Total Collected
            </span>
            <span className="text-lg font-bold text-slate-800 block mt-0.5 font-mono">
              ₹{financialSummary.totalCollected.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-150 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
            <span className="text-rose-600 font-bold text-sm">₹</span>
          </div>
          <div className="min-w-0">
            <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block truncate">
              Outstanding Due
            </span>
            <span className="text-lg font-bold text-rose-650 block mt-0.5 font-mono">
              ₹{financialSummary.totalOutstanding.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Columns - Clinical Information & Step 5: Patient Timeline */}
        <div className="lg:col-span-2 space-y-6">

          {/* Section B: Clinical Information */}
          <section className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
              <Activity className="w-4.5 h-4.5 text-indigo-500" />
              <h2 className="text-base font-semibold text-slate-800">Clinical Information</h2>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  Address
                </span>
                <p className="text-sm text-slate-700 bg-slate-50/50 border border-slate-100 rounded-xl p-3 whitespace-pre-wrap leading-relaxed">
                  {patient.address || "No address on file."}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <FileText className="w-3 h-3 text-slate-400" />
                  Medical Notes
                </span>
                <p className="text-sm text-slate-700 bg-slate-50/50 border border-slate-100 rounded-xl p-3 whitespace-pre-wrap leading-relaxed">
                  {patient.medicalNotes || "No medical notes on file."}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-slate-400" />
                  Known Allergies
                </span>
                <p className={`text-sm bg-slate-50/50 border rounded-xl p-3 whitespace-pre-wrap leading-relaxed ${patient.allergies
                  ? "text-rose-700 border-rose-100/50 bg-rose-50/20"
                  : "text-slate-700 border-slate-100"
                  }`}>
                  {patient.allergies || "No known allergies."}
                </p>
              </div>
            </div>
          </section>

          {/* Treatment History Section */}
          <section className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-50 pb-3">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-4.5 h-4.5 text-indigo-500" />
                <h2 className="text-base font-semibold text-slate-800">Treatment History</h2>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
                <span className="bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full font-bold">
                  Total: {treatmentStats.totalTreatments}
                </span>
                <span className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                  Completed: {treatmentStats.completedTreatments}
                </span>
                <span className="bg-amber-50 border border-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">
                  Active: {treatmentStats.activeTreatments}
                </span>
              </div>
            </div>

            {treatments.length === 0 ? (
              <div className="bg-slate-50/50 border border-dashed border-slate-200 rounded-xl p-8 text-center text-sm text-slate-500">
                No treatment records found. Click "Add Treatment" to log a new procedure.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {treatments.map((t) => {
                  const dateObj = new Date(t.createdAt);
                  const dateLabel = isNaN(dateObj.getTime())
                    ? "Unknown Date"
                    : dateObj.toLocaleDateString("en-US", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      });

                  const outstanding = Math.max(0, t.cost - t.paidAmount);

                  let statusColor = "bg-amber-50 text-amber-700 border-amber-100";
                  if (t.status === "completed") statusColor = "bg-emerald-50 text-emerald-700 border-emerald-100";
                  else if (t.status === "in_progress") statusColor = "bg-blue-50 text-blue-700 border-blue-100";
                  else if (t.status === "cancelled") statusColor = "bg-slate-100 text-slate-600 border-slate-200";

                  let paymentColor = "bg-rose-50 text-rose-700 border-rose-100";
                  if (t.paymentStatus === "paid") paymentColor = "bg-emerald-50 text-emerald-700 border-emerald-100";
                  else if (t.paymentStatus === "partial") paymentColor = "bg-amber-50 text-amber-700 border-amber-100";

                  return (
                    <div
                      key={t._id}
                      onMouseLeave={() => setActiveMenuId(null)}
                      className="bg-slate-50/40 hover:bg-slate-50 border border-slate-100 hover:border-slate-200/80 rounded-xl p-3 flex flex-col justify-between space-y-2 relative group"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs font-bold text-slate-800 truncate" title={t.treatmentName}>
                            {t.treatmentName}
                          </h4>
                          {/* Three-dot dropdown menu */}
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(activeMenuId === t._id ? null : t._id);
                              }}
                              type="button"
                              className="p-1 hover:bg-slate-205 bg-slate-100/30 rounded-full text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>
                            {activeMenuId === t._id && (
                              <div className="absolute right-0 top-6 z-10 bg-white border border-slate-100 shadow-md rounded-xl p-1 flex flex-col space-y-0.5 text-[11px] text-slate-700 min-w-[130px]">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveMenuId(null);
                                    setEditingTreatment(t);
                                    setTreatmentName(t.treatmentName);
                                    setDiagnosis(t.diagnosis);
                                    setToothNumber(t.toothNumber);
                                    setCost(String(t.cost));
                                    setPaidAmount(String(t.paidAmount));
                                    setTreatmentNotes(t.notes || "");
                                    setTreatmentStatus(t.status);
                                    setShowTreatmentModal(true);
                                  }}
                                  type="button"
                                  className="w-full text-left px-2.5 py-1.5 hover:bg-slate-50 rounded-lg flex items-center gap-1.5 text-slate-700 transition-colors cursor-pointer"
                                >
                                  <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Edit Treatment</span>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveMenuId(null);
                                    setSelectedInvoices([t._id]);
                                    setShowInvoiceModal(true);
                                  }}
                                  type="button"
                                  className="w-full text-left px-2.5 py-1.5 hover:bg-slate-50 rounded-lg flex items-center gap-1.5 text-slate-700 transition-colors cursor-pointer"
                                >
                                  <Printer className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Print Invoice</span>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveMenuId(null);
                                    handleDeleteTreatment(t._id);
                                  }}
                                  type="button"
                                  className="w-full text-left px-2.5 py-1.5 hover:bg-rose-50 hover:text-rose-700 rounded-lg flex items-center gap-1.5 text-rose-600 transition-colors font-medium cursor-pointer border-t border-slate-50 mt-1 pt-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Delete Billed</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium">
                          Diagnosis: <span className="text-slate-700 font-semibold">{t.diagnosis}</span>
                        </p>
                        <p className="text-[10px] text-slate-500 font-medium">
                          Tooth Number: <span className="text-slate-805 font-mono font-bold bg-slate-100/85 px-1.5 py-0.5 rounded text-[9.5px]">{t.toothNumber}</span>
                        </p>
                        {t.notes && (
                          <p className="text-[9.5px] text-slate-500 italic mt-1 border-l-2 border-slate-200 pl-2 line-clamp-1" title={t.notes}>
                            "{t.notes}"
                          </p>
                        )}
                      </div>

                      {/* Cost details */}
                      <div className="pt-1.5 border-t border-slate-100/80 space-y-2">
                        <div className="grid grid-cols-3 gap-1.5 text-center text-[9px] font-semibold text-slate-500 bg-slate-100/30 p-1.5 rounded-lg border border-slate-100">
                          <div>
                            <span className="block text-[8px] uppercase tracking-wider text-slate-400">Cost</span>
                            <span className="text-slate-805 font-mono">₹{t.cost}</span>
                          </div>
                          <div>
                            <span className="block text-[8px] uppercase tracking-wider text-slate-400">Paid</span>
                            <span className="text-emerald-600 font-mono">₹{t.paidAmount}</span>
                          </div>
                          <div>
                            <span className="block text-[8px] uppercase tracking-wider text-slate-400">Due</span>
                            <span className={outstanding > 0 ? "text-rose-600 font-bold font-mono" : "text-slate-500 font-mono"}>₹{outstanding}</span>
                          </div>
                        </div>

                        {/* Visual Status Separations */}
                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[9px] font-semibold pt-1 border-t border-slate-100/40">
                          <div className="flex items-center gap-1">
                            <span className="text-slate-400 font-medium text-[9px]">Treatment:</span>
                            <span className={`inline-flex items-center px-1.5 py-0.5 text-[8.5px] font-bold uppercase rounded border shrink-0 ${statusColor}`}>
                              {t.status.replace("_", " ")}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-slate-400 font-medium text-[9px]">Payment:</span>
                            <span className={`inline-flex items-center px-1.5 py-0.5 text-[8.5px] font-bold uppercase rounded border shrink-0 ${paymentColor}`}>
                              {t.paymentStatus}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-[8.5px] text-slate-400 text-right self-end mt-0.5 font-medium font-mono">
                        {dateLabel}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {treatments.length > 0 && (
              <div className="flex justify-end pt-1">
                <button
                  onClick={() => {
                    setSelectedInvoices(treatments.map(t => t._id));
                    setShowInvoiceModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-semibold transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Full Invoice
                </button>
              </div>
            )}
          </section>

          {/* Patient Documents Section */}
          <section className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-50 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm">📁</span>
                <h2 className="text-base font-semibold text-slate-800">Patient Documents</h2>
              </div>
              <button
                onClick={() => {
                  setSelectedFile(null);
                  setDocCategory("X-Rays");
                  setShowUploadModal(true);
                }}
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all hover:shadow cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Upload Document
              </button>
            </div>

            {!patient.documents || patient.documents.length === 0 ? (
              <div className="bg-slate-50/50 border border-dashed border-slate-200 rounded-xl p-8 text-center text-sm text-slate-505">
                No documents uploaded yet. Upload X-Rays, Reports, or Prescriptions.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {patient.documents.map((doc: any) => {
                  let catColor = "bg-slate-100 text-slate-700 border-slate-200";
                  if (doc.category === "X-Rays") catColor = "bg-blue-50 text-blue-700 border-blue-100";
                  else if (doc.category === "Reports") catColor = "bg-emerald-50 text-emerald-700 border-emerald-100";
                  else if (doc.category === "Prescriptions") catColor = "bg-purple-50 text-purple-700 border-purple-100";
                  else if (doc.category === "Photos") catColor = "bg-pink-50 text-pink-700 border-pink-100";

                  const d = new Date(doc.uploadedAt);
                  const dateLabel = isNaN(d.getTime())
                    ? "Unknown Date"
                    : d.toLocaleDateString("en-US", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      });

                  return (
                    <div
                      key={doc._id}
                      className="bg-slate-50/40 hover:bg-slate-50 border border-slate-105 hover:border-slate-200/80 rounded-xl p-3 flex flex-col justify-between space-y-3 relative group transition-all"
                    >
                      <div className="min-w-0 space-y-1 bg-transparent">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs font-bold text-slate-805 truncate pr-6" title={doc.name}>
                            {doc.name}
                          </h4>
                          <button
                            onClick={() => handleDeleteDocument(doc._id)}
                            type="button"
                            className="absolute top-3 right-3 p-1 hover:bg-rose-50 rounded-full text-slate-400 hover:text-rose-600 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                            title="Delete file"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={`inline-flex items-center px-1.5 py-0.25 text-[8.5px] font-bold uppercase rounded border ${catColor}`}>
                            {doc.category}
                          </span>
                          <span className="text-[9px] text-slate-400 font-semibold">
                            Uploaded: {dateLabel}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100/40">
                        <span className="text-[8.5px] text-slate-450 truncate max-w-[120px]" title={`By ${doc.uploadedBy}`}>
                          By: {doc.uploadedBy}
                        </span>
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[9.5px] font-extrabold text-indigo-650 hover:text-indigo-850 hover:underline"
                        >
                          <span>🔗 View Attachment</span>
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Step 5: Patient Timeline */}
          <section className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-50 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4.5 h-4.5 text-indigo-500" />
                <h2 className="text-base font-semibold text-slate-800">Timeline History</h2>
              </div>
              <span className="text-[10px] bg-slate-50 border border-slate-200 text-slate-500 px-2 py-0.5 rounded-full font-bold">
                {timelineItems.length} Events Total
              </span>
            </div>

            {timelineItems.length === 0 ? (
              <div className="bg-slate-50/50 border border-dashed border-slate-200 rounded-xl p-8 text-center text-sm text-slate-500">
                No timeline records found.
              </div>
            ) : (
              <div className="relative pl-6 space-y-6 border-l-2 border-slate-100 ml-3">
                {timelineItems.map((item) => {
                  const dateLabel = item.date.toLocaleDateString("en-US", {
                    day: "numeric",
                    month: "short",
                    year: "numeric"
                  }) + " " + item.date.toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit"
                  });

                  // Setup indicators by event type
                  let icon = "⚪";
                  let typeColor = "bg-slate-105 text-slate-600 border-slate-200";
                  let dotColor = "bg-slate-400 ring-slate-100";
                  let cardBorder = "border-slate-100 hover:border-slate-200";

                  if (item.type === "appointment") {
                    icon = "📅";
                    typeColor = "bg-blue-50 text-blue-700 border-blue-100";
                    dotColor = "bg-blue-500 ring-blue-100";
                    cardBorder = "border-blue-100/40 hover:border-blue-200";
                  } else if (item.type === "treatment") {
                    icon = "🩺";
                    typeColor = "bg-emerald-50 text-emerald-700 border-emerald-100";
                    dotColor = "bg-emerald-500 ring-emerald-100";
                    cardBorder = "border-emerald-100/40 hover:border-emerald-200";
                  } else if (item.type === "document") {
                    icon = "📄";
                    typeColor = "bg-indigo-50 text-indigo-700 border-indigo-100";
                    dotColor = "bg-indigo-500 ring-indigo-100";
                    cardBorder = "border-indigo-100/40 hover:border-indigo-200";
                  } else if (item.type === "activity") {
                    icon = "⚡";
                    typeColor = "bg-amber-50 text-amber-700 border-amber-100";
                    dotColor = "bg-amber-500 ring-amber-100";
                    cardBorder = "border-amber-100/40 hover:border-amber-200";
                  }

                  return (
                    <div key={item.id} className="relative group animate-in fade-in duration-200">
                      {/* Timeline Dot Indicator */}
                      <span className={`absolute -left-[31px] top-2.5 w-3.5 h-3.5 rounded-full border-2 border-white ring-4 ring-white ${dotColor} shadow-sm shrink-0 transition-transform group-hover:scale-110`} />

                      {/* Timeline Card Content */}
                      <div className={`bg-slate-50/40 hover:bg-slate-50 border ${cardBorder} rounded-2xl p-4 transition-all duration-150 space-y-2`}>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[10px] font-bold text-slate-450 tracking-wide uppercase font-mono">
                            {dateLabel}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className={`inline-flex items-center px-1.5 py-0.25 text-[8.5px] font-bold uppercase rounded border ${typeColor}`}>
                              {icon} {item.type}
                            </span>
                            {item.status && (
                              <span className="inline-flex items-center px-1.5 py-0.25 text-[8.5px] font-bold uppercase rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                                {item.status.replace("_", " ")}
                              </span>
                            )}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-xs font-bold text-slate-800">{item.title}</h4>
                          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                            {item.details}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Right Column - Section A: Patient Information */}
        <div className="space-y-6">
          <section className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
              <User className="w-4.5 h-4.5 text-indigo-500" />
              <h2 className="text-base font-semibold text-slate-800">Patient Details</h2>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 border-b border-slate-50 pb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Patient Code
                  </span>
                  <span className="text-sm font-mono font-semibold text-slate-800 block mt-0.5">
                    {patient.patientCode || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Gender
                  </span>
                  <span className="text-sm font-semibold text-slate-800 block mt-0.5 capitalize">
                    {patient.gender || "—"}
                  </span>
                </div>
              </div>

              <div className="border-b border-slate-50 pb-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Full Name
                </span>
                <span className="text-sm font-semibold text-slate-800 block mt-0.5">
                  {patient.fullName || "—"}
                </span>
              </div>

              <div className="border-b border-slate-50 pb-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  Phone Number
                </span>
                <a href={`tel:${patient.phone}`} className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors block mt-0.5">
                  {patient.phone || "—"}
                </a>
              </div>

              <div className="border-b border-slate-50 pb-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  Email Address
                </span>
                {patient.email ? (
                  <a href={`mailto:${patient.email}`} className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors block mt-0.5 truncate">
                    {patient.email}
                  </a>
                ) : (
                  <span className="text-sm font-medium text-slate-400 block mt-0.5">No email on file</span>
                )}
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Age
                </span>
                <span className="text-sm font-semibold text-slate-800 block mt-0.5">
                  {patient.age ? `${patient.age} years old` : "—"}
                </span>
              </div>
            </div>
          </section>
        </div>

      </div>

      {/* Step 4: Book Appointment Modal Form Overlay */}
      {showBookModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-100 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Schedule Appointment</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Booking for {patient.fullName}</p>
              </div>
              <button
                onClick={() => setShowBookModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleBookAppointment} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Select Treatment / Service
                </label>

                <select
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                  required
                  className="block w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 outline-none transition-all text-slate-700"
                >
                  <option value="">Choose service...</option>
                  <option value="Dental Cleaning">Dental Cleaning</option>
                  <option value="Root Canal">Root Canal</option>
                  <option value="Teeth Whitening">Teeth Whitening</option>
                  <option value="Dental Implants">Dental Implants</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Date
                  </label>
                  <input
                    type="date"
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    required
                    min={new Date().toISOString().split("T")[0]}
                    className="block w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 outline-none transition-all text-slate-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Time
                  </label>
                  <input
                    type="time"
                    value={appointmentTime}
                    onChange={(e) => setAppointmentTime(e.target.value)}
                    required
                    className="block w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 outline-none transition-all text-slate-700"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Special Notes
                </label>
                <textarea
                  placeholder="Toothache, follow-up notes, etc..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="block w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 outline-none transition-all text-slate-800 resize-none"
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowBookModal(false)}
                  className="px-4 py-2 bg-slate-150 hover:bg-slate-200/80 text-slate-700 rounded-xl text-xs font-semibold transition-all duration-150"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={booking}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-75 disabled:cursor-not-allowed text-white rounded-xl text-xs font-semibold shadow-sm hover:shadow transition-all duration-150 flex items-center gap-1.5"
                >
                  {booking ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Booking...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Confirm Booking
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Treatment Modal Form Overlay */}
      {showTreatmentModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-100 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  {editingTreatment ? "Edit Treatment" : "Add Treatment"}
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">For {patient.fullName}</p>
              </div>
              <button
                onClick={() => {
                  setShowTreatmentModal(false);
                  setEditingTreatment(null);
                }}
                className="text-slate-400 hover:text-slate-600 transition-colors"
                type="button"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitTreatment} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Treatment Name
                </label>
                <input
                  value={treatmentName}
                  onChange={(e) => setTreatmentName(e.target.value)}
                  required
                  placeholder="e.g. Dental Cleaning"
                  className="block w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 outline-none transition-all text-slate-700"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Diagnosis
                </label>
                <input
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  required
                  placeholder="e.g. Tooth decay / Gum inflammation"
                  className="block w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 outline-none transition-all text-slate-700"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Tooth Number
                </label>
                <input
                  value={toothNumber}
                  onChange={(e) => setToothNumber(e.target.value)}
                  required
                  placeholder="e.g. 18 / 31"
                  className="block w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 outline-none transition-all text-slate-700"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1 col-span-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Cost (₹)
                  </label>
                  <input
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    required
                    inputMode="decimal"
                    placeholder="0"
                    className="block w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 outline-none transition-all text-slate-700 font-mono"
                  />
                </div>

                <div className="space-y-1 col-span-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Paid (₹)
                  </label>
                  <input
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    inputMode="decimal"
                    placeholder="Same as cost"
                    className="block w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 outline-none transition-all text-slate-700"
                  />
                </div>

                <div className="space-y-1 col-span-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Status
                  </label>
                  <select
                    value={treatmentStatus}
                    onChange={(e) => setTreatmentStatus(e.target.value as any)}
                    required
                    className="block w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 outline-none transition-all text-slate-700"
                  >
                    <option value="planned">planned</option>
                    <option value="in_progress">in_progress</option>
                    <option value="completed">completed</option>
                    <option value="cancelled">cancelled</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Notes
                </label>
                <textarea
                  placeholder="Additional notes..."
                  value={treatmentNotes}
                  onChange={(e) => setTreatmentNotes(e.target.value)}
                  className="block w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 outline-none transition-all text-slate-800 resize-none"
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowTreatmentModal(false);
                    setEditingTreatment(null);
                    setTreatmentName("");
                    setDiagnosis("");
                    setToothNumber("");
                    setCost("");
                    setPaidAmount("");
                    setTreatmentNotes("");
                    setTreatmentStatus("planned");
                  }}
                  className="px-4 py-2 bg-slate-150 hover:bg-slate-200/80 text-slate-700 rounded-xl text-xs font-semibold transition-all duration-150"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingTreatment}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-75 disabled:cursor-not-allowed text-white rounded-xl text-xs font-semibold shadow-sm hover:shadow transition-all duration-150 flex items-center gap-1.5"
                >
                  {addingTreatment ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      {editingTreatment ? "Saving..." : "Adding..."}
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      {editingTreatment ? "Save Changes" : "Confirm Treatment"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Modal Overlay */}
      {showInvoiceModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200 print:p-0 print:bg-white">
          <div className="bg-white border border-slate-100 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 print:shadow-none print:border-none print:p-0 print:max-w-full">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 print:hidden">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Print Invoice</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Generate printable PDF invoice</p>
              </div>
              <button
                onClick={() => setShowInvoiceModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
                type="button"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Print Area */}
            <div id="invoice-print-area" className="bg-white p-6 border border-slate-200 rounded-xl space-y-6 print:border-none print:p-0">
              <style>{`
                @media print {
                  body * {
                    visibility: hidden;
                  }
                  #invoice-print-area, #invoice-print-area * {
                    visibility: visible;
                  }
                  #invoice-print-area {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                    border: none !important;
                    padding: 0 !important;
                  }
                }
              `}</style>

              {/* Invoice Header */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🦷</span>
                  <div>
                    <h2 className="text-base font-bold text-slate-800 tracking-tight uppercase">
                      {clinicSettings?.name || "Bright Smile Clinic"}
                    </h2>
                    <p className="text-[9px] text-slate-400 font-medium">
                      {clinicSettings?.address || "123 Health Ave, Medical District"}
                      {clinicSettings?.phone && ` • ${clinicSettings.phone}`}
                      {clinicSettings?.email && ` • ${clinicSettings.email}`}
                      {clinicSettings?.gstNumber && ` • GSTIN: ${clinicSettings.gstNumber}`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <h3 className="text-xs font-bold text-slate-800 tracking-wider">INVOICE</h3>
                  <p className="text-[9px] text-slate-500 font-mono mt-0.5">
                    Date: {new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>

              {/* Patient Details */}
              <div className="grid grid-cols-2 gap-4 text-[11px] bg-slate-50 p-3 rounded-lg border border-slate-100 print:bg-white print:border-slate-200">
                <div>
                  <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Billed To:</h4>
                  <p className="font-bold text-slate-800 mt-1">{patient.fullName}</p>
                  <p className="text-slate-500 mt-0.5">ID: {patient.patientCode || patient._id}</p>
                  <p className="text-slate-500">{patient.phone}</p>
                </div>
                <div className="text-right">
                  <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Clinic Details:</h4>
                  <p className="font-bold text-slate-800 mt-1">Bright Smile Dental Clinic</p>
                  <p className="text-slate-500 mt-0.5">support@brightsmile.com</p>
                  <p className="text-slate-500">Live Billing System</p>
                </div>
              </div>

              {/* Treatments Listing */}
              <div className="space-y-2">
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                      <th className="py-2">Procedure / Diagnosis</th>
                      <th className="py-2 text-center">Tooth</th>
                      <th className="py-2 text-right">Cost</th>
                      <th className="py-2 text-right">Paid</th>
                      <th className="py-2 text-right">Due</th>
                    </tr>
                  </thead>
                  <tbody>
                    {treatments
                      .filter((t) => selectedInvoices.includes(t._id))
                      .map((t) => {
                        const outstanding = Math.max(0, t.cost - t.paidAmount);
                        return (
                          <tr key={t._id} className="border-b border-slate-100 py-1.5">
                            <td className="py-2 pr-4">
                              <p className="font-bold text-slate-800">{t.treatmentName}</p>
                              <p className="text-[9px] text-slate-400 italic">{t.diagnosis}</p>
                            </td>
                            <td className="py-2 text-center font-semibold text-slate-700">{t.toothNumber}</td>
                            <td className="py-2 text-right text-slate-700 font-mono">₹{t.cost.toLocaleString()}</td>
                            <td className="py-2 text-right text-slate-700 font-mono">₹{t.paidAmount.toLocaleString()}</td>
                            <td className="py-2 text-right text-slate-700 font-semibold font-mono">₹{outstanding.toLocaleString()}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>

              {/* Totals Breakdown */}
              <div className="border-t border-slate-200 pt-4 flex justify-end">
                <div className="w-64 text-[11px] space-y-1.5 text-right font-medium">
                  <div className="flex justify-between text-slate-500">
                    <span>Total Cost:</span>
                    <span className="font-semibold text-slate-700 font-mono">
                      ₹{treatments
                        .filter((t) => selectedInvoices.includes(t._id))
                        .reduce((sum, t) => sum + t.cost, 0)
                        .toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Amount Paid:</span>
                    <span className="font-semibold text-emerald-600 font-mono">
                      ₹{treatments
                        .filter((t) => selectedInvoices.includes(t._id))
                        .reduce((sum, t) => sum + t.paidAmount, 0)
                        .toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-800 border-t border-slate-100 pt-1.5 text-xs font-bold font-semibold">
                    <span>Balance Due:</span>
                    <span className="text-rose-600 font-mono">
                      ₹{Math.max(
                        0,
                        treatments
                          .filter((t) => selectedInvoices.includes(t._id))
                          .reduce((sum, t) => sum + (t.cost - t.paidAmount), 0)
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Invoice Footer note */}
              <div className="border-t border-slate-100 pt-4 text-center">
                <p className="text-[9px] text-slate-400 italic">Thank you for choosing Bright Smile. Get in touch for any queries.</p>
              </div>
            </div>

            {/* Print trigger & Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 print:hidden">
              <button
                type="button"
                onClick={() => setShowInvoiceModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-150 text-slate-700 rounded-xl text-xs font-semibold transition-all duration-150"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                type="button"
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm hover:shadow transition-all duration-150 flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                Print / Save PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Upload Modal Overlay */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-100 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Upload Patient Document</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Attach medical files, reports, or photos for {patient.fullName}</p>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-slate-655 transition-colors"
                type="button"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUploadDocument} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Document Category
                </label>
                <select
                  value={docCategory}
                  onChange={(e) => setDocCategory(e.target.value)}
                  required
                  className="block w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 outline-none transition-all text-slate-700"
                >
                  <option value="X-Rays">X-Rays</option>
                  <option value="Reports">Reports</option>
                  <option value="Prescriptions">Prescriptions</option>
                  <option value="Photos">Photos</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Select File
                </label>
                <div className="border-2 border-dashed border-slate-200 hover:border-indigo-300 rounded-xl p-4 transition-colors text-center relative">
                  <input
                    type="file"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setSelectedFile(e.target.files[0]);
                      }
                    }}
                    required
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="text-xs text-slate-505 space-y-1">
                    <p className="font-bold text-indigo-650">Click to upload or drag & drop</p>
                    <p className="text-[10px] text-slate-400">PDF, PNG, JPG up to 10MB</p>
                    {selectedFile && (
                      <p className="text-[10px] font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded inline-block mt-2">
                        📎 Selected: {selectedFile.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false);
                    setSelectedFile(null);
                  }}
                  className="px-4 py-2 bg-slate-150 hover:bg-slate-200/85 text-slate-700 rounded-xl text-xs font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingDoc}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-75 disabled:cursor-not-allowed text-white rounded-xl text-xs font-semibold shadow-sm hover:shadow transition-all flex items-center gap-1.5"
                >
                  {uploadingDoc ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Upload File
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
