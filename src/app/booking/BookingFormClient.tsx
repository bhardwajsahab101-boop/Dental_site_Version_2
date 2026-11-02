"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { TREATMENTS } from "../../data/treatmentsData";
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Phone,
  Mail,
  FileText,
  CheckCircle2,
  Loader2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

interface BookingFormClientProps {
  clinicId?: string;
  initialService?: string;
  clinicPhone?: string;
}

export default function BookingFormClient({
  clinicId,
  initialService = "",
  clinicPhone = "+91 (Contact Number Pending)",
}: BookingFormClientProps) {
  // Today's date in YYYY-MM-DD
  const todayStr = new Date().toISOString().split("T")[0];

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [appointmentDate, setAppointmentDate] = useState(todayStr);
  const [appointmentTime, setAppointmentTime] = useState("10:30 AM");
  const [service, setService] = useState(initialService || "General Dentistry & Comprehensive Consultation");
  const [message, setMessage] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const timeSlots = [
    { label: "Morning: 10:00 AM", value: "10:00 AM" },
    { label: "Morning: 10:30 AM", value: "10:30 AM" },
    { label: "Morning: 11:00 AM", value: "11:00 AM" },
    { label: "Morning: 11:30 AM", value: "11:30 AM" },
    { label: "Morning: 12:00 PM", value: "12:00 PM" },
    { label: "Morning: 12:30 PM", value: "12:30 PM" },
    { label: "Morning: 01:00 PM", value: "01:00 PM" },
    { label: "Morning: 01:30 PM", value: "01:30 PM" },
    { label: "Evening: 05:00 PM", value: "05:00 PM" },
    { label: "Evening: 05:30 PM", value: "05:30 PM" },
    { label: "Evening: 06:00 PM", value: "06:00 PM" },
    { label: "Evening: 06:30 PM", value: "06:30 PM" },
    { label: "Evening: 07:00 PM", value: "07:00 PM" },
    { label: "Evening: 07:30 PM", value: "07:30 PM" },
    { label: "Evening: 08:00 PM", value: "08:00 PM" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    // Validate Name
    if (!fullName || fullName.trim().length < 2) {
      setErrorMsg("Please enter the patient's full name.");
      return;
    }

    // Validate Phone (digits count check)
    const digitsOnly = phone.replace(/\D/g, "");
    if (digitsOnly.length < 8) {
      setErrorMsg("Please enter a valid phone number so our clinic staff can reach you.");
      return;
    }

    // Validate Date
    if (!appointmentDate) {
      setErrorMsg("Please choose your preferred appointment date.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clinicId,
          fullName: fullName.trim(),
          phone: phone.trim(),
          email: email.trim().toLowerCase() || undefined,
          appointmentDate,
          appointmentTime,
          service,
          notes: message.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccessData({
          fullName,
          phone,
          service,
          date: appointmentDate,
          time: appointmentTime,
        });
        toast.success("Appointment request submitted successfully!");
      } else {
        throw new Error(data.message || "Failed to submit request. Please try again.");
      }
    } catch (err: any) {
      console.error("Booking error:", err);
      setErrorMsg(err.message || "An unexpected error occurred. Please contact the clinic.");
      toast.error(err.message || "Failed to submit appointment request");
    } finally {
      setSubmitting(false);
    }
  };

  if (successData) {
    return (
      <div className="bg-[#E6F7F6] border border-[#16A6A1]/40 rounded-3xl p-6 sm:p-10 text-center space-y-6 animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-2xl bg-[#16A6A1] text-white flex items-center justify-center mx-auto shadow-md">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#16A6A1] bg-white px-3 py-1 rounded-full shadow-2xs">
            Request Logged
          </span>
          <h3 className="text-2xl font-extrabold text-[#102C46]">
            Appointment Request Received!
          </h3>
          <p className="text-xs sm:text-sm text-[#172B3A] max-w-lg mx-auto leading-relaxed">
            Thank you, <strong>{successData.fullName}</strong>. Your request for{" "}
            <strong>{successData.service}</strong> has been saved in our clinic system.
          </p>
        </div>

        {/* Summary Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 max-w-md mx-auto text-left text-xs text-[#172B3A] space-y-2.5 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-slate-500">Requested Date:</span>
            <span className="font-bold text-[#102C46]">{successData.date}</span>
          </div>
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-slate-500">Preferred Slot:</span>
            <span className="font-bold text-[#102C46]">{successData.time}</span>
          </div>
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-slate-500">Contact Phone:</span>
            <span className="font-bold text-[#102C46]">{successData.phone}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Request Status:</span>
            <span className="font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
              Pending Clinic Staff Confirmation
            </span>
          </div>
        </div>

        {/* Next Steps Guidance */}
        <div className="bg-white/70 p-4 rounded-xl text-xs text-[#64748B] max-w-lg mx-auto text-left space-y-1.5 border border-slate-200/60">
          <p className="font-bold text-[#102C46] text-xs">What happens next?</p>
          <p>
            1. Our staff verifies Dr. Anil Sharma&apos;s daily patient queue for your requested date.
          </p>
          <p>
            2. You will receive a phone call or WhatsApp message to confirm the exact time and answer any pre-visit questions.
          </p>
          <p>
            3. For acute pain or urgent toothache, please call reception directly at{" "}
            <strong className="text-[#102C46]">{clinicPhone}</strong>.
          </p>
        </div>

        <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => {
              setSuccessData(null);
              setFullName("");
              setPhone("");
              setEmail("");
              setMessage("");
            }}
            className="text-xs font-bold text-[#16A6A1] hover:underline"
          >
            Submit Another Request
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 bg-[#102C46] hover:bg-[#1A3E61] text-white text-xs font-bold px-4 py-2 rounded-xl transition"
          >
            <span>Return to Homepage</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3.5 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Row 1: Name and Phone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="fullName" className="block text-xs font-bold text-[#102C46] mb-1.5">
            Patient Full Name <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="fullName"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Suman Verma"
              className="w-full text-xs sm:text-sm pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-[#F8FAFC] focus:bg-white focus:outline-none focus:border-[#16A6A1] transition"
            />
          </div>
        </div>

        <div>
          <label htmlFor="phone" className="block text-xs font-bold text-[#102C46] mb-1.5">
            Primary Phone Number <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="phone"
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +91 98765 43210"
              className="w-full text-xs sm:text-sm pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-[#F8FAFC] focus:bg-white focus:outline-none focus:border-[#16A6A1] transition"
            />
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Used for appointment confirmation call/WhatsApp.
          </span>
        </div>
      </div>

      {/* Row 2: Email and Treatment Interest */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="email" className="block text-xs font-bold text-[#102C46] mb-1.5">
            Email Address <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. suman@example.com"
              className="w-full text-xs sm:text-sm pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-[#F8FAFC] focus:bg-white focus:outline-none focus:border-[#16A6A1] transition"
            />
          </div>
        </div>

        <div>
          <label htmlFor="service" className="block text-xs font-bold text-[#102C46] mb-1.5">
            Treatment Interest <span className="text-rose-500">*</span>
          </label>
          <select
            id="service"
            required
            value={service}
            onChange={(e) => setService(e.target.value)}
            className="w-full text-xs sm:text-sm px-4 py-3 rounded-xl border border-slate-200 bg-[#F8FAFC] focus:bg-white focus:outline-none focus:border-[#16A6A1] transition"
          >
            {TREATMENTS.map((t) => (
              <option key={t.id} value={t.title}>
                {t.title}
              </option>
            ))}
            <option value="Other Dental Concern">Other Dental Concern / Unsure</option>
          </select>
        </div>
      </div>

      {/* Row 3: Requested Date and Preferred Time Slot */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="appointmentDate" className="block text-xs font-bold text-[#102C46] mb-1.5">
            Requested Date <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <CalendarIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="appointmentDate"
              type="date"
              required
              min={todayStr}
              value={appointmentDate}
              onChange={(e) => setAppointmentDate(e.target.value)}
              className="w-full text-xs sm:text-sm pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-[#F8FAFC] focus:bg-white focus:outline-none focus:border-[#16A6A1] transition"
            />
          </div>
        </div>

        <div>
          <label htmlFor="appointmentTime" className="block text-xs font-bold text-[#102C46] mb-1.5">
            Preferred Time Window <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <select
              id="appointmentTime"
              required
              value={appointmentTime}
              onChange={(e) => setAppointmentTime(e.target.value)}
              className="w-full text-xs sm:text-sm pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-[#F8FAFC] focus:bg-white focus:outline-none focus:border-[#16A6A1] transition"
            >
              {timeSlots.map((slot) => (
                <option key={slot.value} value={slot.value}>
                  {slot.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Row 4: Optional Message */}
      <div>
        <label htmlFor="message" className="block text-xs font-bold text-[#102C46] mb-1.5">
          Optional Notes or Symptoms <span className="text-slate-400 font-normal">(Brief description)</span>
        </label>
        <div className="relative">
          <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <textarea
            id="message"
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="e.g. Sensitivity in upper left molar when drinking cold water..."
            className="w-full text-xs sm:text-sm pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-[#F8FAFC] focus:bg-white focus:outline-none focus:border-[#16A6A1] transition resize-y"
          />
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={submitting}
        className="w-full inline-flex items-center justify-center gap-2 bg-[#16A6A1] hover:bg-[#128884] text-white font-bold text-sm py-4 rounded-xl shadow-md hover:shadow-lg transition active:scale-98 disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Submitting Request...</span>
          </>
        ) : (
          <>
            <CalendarIcon className="w-4 h-4" />
            <span>Submit Appointment Request</span>
          </>
        )}
      </button>

      <p className="text-[11px] text-slate-400 text-center">
        🔒 This form does not collect sensitive health records. Confirmation will be provided verbally by clinic staff.
      </p>
    </form>
  );
}
