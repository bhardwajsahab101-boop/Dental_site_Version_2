"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  User,
  Phone,
  Mail,
  Calendar,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Loader2,
  Clock,
  Sparkles
} from "lucide-react";

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

interface AppointmentCardProps {
  appointment: Appointment;
  updatingId: string | null;
  onUpdateStatus: (id: string, status: string) => void;
}

export default function AppointmentCard({
  appointment,
  updatingId,
  onUpdateStatus,
}: AppointmentCardProps) {
  const [showNote, setShowNote] = useState(false);
  const isUpdating = updatingId === appointment._id;

  const getStatusStyles = (status: Appointment["status"]) => {
    switch (status) {
      case "requested":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "confirmed":
        return "bg-sky-50 text-sky-800 border-sky-200";
      case "arrived":
        return "bg-[#CCFBF1] text-[#0D9488] border-[#14B8A6]/30";
      case "in_treatment":
        return "bg-[#14213D]/10 text-[#14213D] border-[#14213D]/20";
      case "completed":
        return "bg-emerald-50 text-emerald-800 border-emerald-200";
      case "no_show":
        return "bg-slate-100 text-slate-700 border-slate-200";
      case "cancelled":
        return "bg-rose-50 text-rose-800 border-rose-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const patient = appointment.patientId;
  const fullName = patient?.fullName || "Registered Patient";
  const phone = patient?.phone || "—";
  const email = patient?.email || "—";
  const note = appointment.notes || "";

  return (
    <div
      className={`bg-white border border-[#E2E8F0] hover:border-[#14B8A6]/40 rounded-xl transition-all duration-150 relative overflow-hidden shadow-2xs hover:shadow-xs ${
        isUpdating ? "opacity-70 bg-[#F4F7FA]" : ""
      }`}
    >
      {/* Loading Overlay */}
      {isUpdating && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10">
          <Loader2 className="h-5 w-5 animate-spin text-[#14B8A6]" />
        </div>
      )}

      {/* Main card row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-3.5 gap-3">
        {/* Patient Details & Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xs font-bold text-[#182230] truncate flex items-center space-x-1.5">
              <User className="h-3.5 w-3.5 text-[#14B8A6]" />
              {patient?._id ? (
                <Link
                  href={`/admin/patients/${patient._id}`}
                  className="hover:text-[#14B8A6] hover:underline transition-colors"
                >
                  {fullName}
                </Link>
              ) : (
                <span>{fullName}</span>
              )}
            </h3>

            {patient?.patientCode && (
              <span className="text-[10px] font-mono bg-[#14213D] text-white px-1.5 py-0.2 rounded font-semibold">
                {patient.patientCode}
              </span>
            )}

            {/* Service Type */}
            <span className="text-[10px] font-semibold bg-[#F4F7FA] text-[#64748B] px-2 py-0.5 rounded border border-[#E2E8F0]">
              {appointment.service}
            </span>

            {/* Status Badge */}
            <span
              className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getStatusStyles(
                appointment.status
              )}`}
            >
              {appointment.status.replace("_", " ")}
            </span>

            {/* Note Badge Button */}
            {note && (
              <button
                onClick={() => setShowNote(!showNote)}
                className={`text-[10px] font-semibold flex items-center space-x-1 px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                  showNote
                    ? "bg-[#14213D] text-white border-[#14213D]"
                    : "bg-white text-[#64748B] border-[#E2E8F0] hover:bg-[#F4F7FA]"
                }`}
              >
                <MessageSquare className="h-3 w-3" />
                <span>Notes</span>
                {showNote ? (
                  <ChevronUp className="h-2.5 w-2.5 ml-0.5" />
                ) : (
                  <ChevronDown className="h-2.5 w-2.5 ml-0.5" />
                )}
              </button>
            )}
          </div>

          {/* Contact Details & Appointment Date */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2.5 text-[11px] text-[#64748B] font-medium">
            {phone !== "—" && (
              <a
                href={`tel:${phone}`}
                className="inline-flex items-center space-x-1 hover:text-[#14B8A6] transition-colors"
              >
                <Phone className="h-3.5 w-3.5 text-[#64748B] shrink-0" />
                <span>{phone}</span>
              </a>
            )}

            {email !== "—" && (
              <a
                href={`mailto:${email}`}
                className="inline-flex items-center space-x-1 hover:text-[#14B8A6] transition-colors"
              >
                <Mail className="h-3.5 w-3.5 text-[#64748B] shrink-0" />
                <span className="truncate max-w-[150px] sm:max-w-none">{email}</span>
              </a>
            )}

            <div className="inline-flex items-center space-x-1 text-[#182230] font-semibold">
              <Calendar className="h-3.5 w-3.5 text-[#14B8A6] shrink-0" />
              <span>
                {typeof appointment.appointmentDate === "string"
                  ? new Date(appointment.appointmentDate).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : appointment.appointmentDate}
              </span>
            </div>

            {appointment.appointmentTime && (
              <div className="inline-flex items-center space-x-1 text-[#182230] font-semibold">
                <Clock className="h-3.5 w-3.5 text-[#14B8A6] shrink-0" />
                <span>{appointment.appointmentTime}</span>
              </div>
            )}
          </div>
        </div>

        {/* Change Status Dropdown Action */}
        <div className="flex items-center justify-end shrink-0 border-t md:border-t-0 pt-2.5 md:pt-0 border-slate-100">
          <div className="relative inline-block w-full sm:w-40">
            <select
              value={appointment.status}
              disabled={isUpdating}
              onChange={(e) => onUpdateStatus(appointment._id, e.target.value)}
              className="w-full bg-[#F4F7FA] hover:bg-white border border-[#E2E8F0] focus:border-[#14B8A6] focus:ring-2 focus:ring-[#14B8A6]/20 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#182230] focus:outline-none transition-all disabled:opacity-50 appearance-none cursor-pointer pr-8"
            >
              <option value="requested">Requested</option>
              <option value="confirmed">Confirmed</option>
              <option value="arrived">Arrived</option>
              <option value="in_treatment">In Treatment</option>
              <option value="completed">Completed</option>
              <option value="no_show">No Show</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#64748B]">
              <ChevronDown className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Note Area */}
      {showNote && note && (
        <div className="bg-[#F4F7FA] border-t border-[#E2E8F0] px-4 py-2.5 text-xs text-[#182230] flex items-start space-x-2">
          <MessageSquare className="h-3.5 w-3.5 text-[#14B8A6] mt-0.5 shrink-0" />
          <p className="italic leading-relaxed font-medium">"{note}"</p>
        </div>
      )}
    </div>
  );
}
