"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
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
  Trash2,
  Edit,
  Loader2,
  Activity
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
type Notice = {
  type: "success" | "error";
  message: string;
};

export default function PatientsPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/patients", { cache: "no-store" });
        const data = await res.json().catch(() => null);

        if (!res.ok || !data?.success) {
          throw new Error(data?.message || `Request failed (${res.status})`);
        }

        setPatients((data.data || []) as Patient[]);
      } catch (e) {
        console.error(e);
        setError(e instanceof Error ? e.message : "Failed to load patients");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

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
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-500" />
            Patients Directory
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Search, filter, and register patients for the dental clinic
          </p>
        </div>

        <button
          onClick={() => {
            setShowForm(!showForm);
            setNotice(null);
          }}
          type="button"
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all duration-200 ${showForm
              ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
              : "bg-indigo-600 hover:bg-indigo-700 text-white"
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
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-75 disabled:cursor-not-allowed text-white rounded-xl text-xs font-semibold shadow-sm hover:shadow transition-all duration-150 flex items-center gap-1.5"
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

      {/* Mini Stats KPI Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center">
            <Users className="w-4.5 h-4.5 text-indigo-500" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Patients</span>
            <span className="text-base font-bold text-slate-800 block mt-0.5">{stats.total}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
            <User className="w-4.5 h-4.5 text-blue-500" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Male Patients</span>
            <span className="text-base font-bold text-slate-800 block mt-0.5">{stats.male}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-pink-50 flex items-center justify-center">
            <User className="w-4.5 h-4.5 text-pink-550" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Female Patients</span>
            <span className="text-base font-bold text-slate-800 block mt-0.5">{stats.female}</span>
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
          <Search className="h-4 w-4 text-slate-400" />
        </div>
        <input
          type="text"
          placeholder="Search patients by name, code, or phone number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="block w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-slate-200/80 focus:border-indigo-500 rounded-xl focus:ring-1 focus:ring-indigo-100 outline-none transition-all placeholder:text-slate-400 text-slate-800 shadow-sm"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
        </div>
      )}

      {error && (
        <div className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-100 rounded-xl p-4 text-center">
          {error}
        </div>
      )}

      {/* Patients Table */}
      {!loading && !error && (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="py-3 px-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Patient Code</th>
                  <th className="py-3 px-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Name</th>
                  <th className="py-3 px-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Phone</th>
                  <th className="py-3 px-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Appointments</th>
                  <th className="py-3 px-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Last Visit</th>
                  <th className="py-3 px-4 text-right text-[11px] font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredPatients.map((patient) => (
                  <tr key={patient._id} className="hover:bg-slate-50/40 transition-colors group">
                    <td className="py-3.5 px-4 text-xs font-mono font-semibold text-slate-600">
                      {patient.patientCode ?? patient._id}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-bold text-slate-800">
                      {patient.fullName ?? "—"}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      {patient.phone ?? "—"}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-700 font-semibold">
                      {patient.appointmentCount ?? 0}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600 font-medium">
                      {patient.lastVisit ? new Date(patient.lastVisit).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }) : "No visits"}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            const patientId = patient?._id ? String(patient._id) : "";
                            if (patientId) router.push(`/admin/patients/${patientId}`);
                          }}
                          className="inline-flex items-center text-xs font-bold px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-all"
                        >
                          View
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
                          className="inline-flex items-center text-xs font-bold px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-all"
                        >
                          Add Treatment
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredPatients.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-10 px-4 text-center text-xs text-slate-400 font-medium">
                      No patients found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
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
