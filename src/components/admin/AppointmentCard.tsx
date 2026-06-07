"use client";

import React, { useState } from "react";
import {
  User,
  Phone,
  Mail,
  Calendar,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Loader2,
  Clock
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
        return "bg-amber-50 text-amber-700 border-amber-100";
      case "confirmed":
        return "bg-blue-50 text-blue-700 border-blue-100";
      case "arrived":
        return "bg-indigo-50 text-indigo-700 border-indigo-100";
      case "in_treatment":
        return "bg-purple-50 text-purple-700 border-purple-100";
      case "completed":
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "no_show":
        return "bg-slate-100 text-slate-600 border-slate-200";
      case "cancelled":
        return "bg-rose-50 text-rose-700 border-rose-100";
      default:
        return "bg-slate-50 text-slate-700 border-slate-150";
    }
  };

  const patient = appointment.patientId;
  const fullName = patient?.fullName || "Unknown Patient";
  const phone = patient?.phone || "—";
  const email = patient?.email || "—";
  const note = appointment.notes || "";

  return (
    <div
      className={`bg-white border border-slate-100 hover:border-slate-200/80 rounded-xl transition-all duration-150 relative overflow-hidden ${
        isUpdating ? "opacity-70 bg-slate-50/50" : ""
      }`}
    >
      {/* Loading Overlay */}
      {isUpdating && (
        <div className="absolute inset-0 bg-white/30 flex items-center justify-center z-10">
          <Loader2 className="h-5 w-5 animate-spin text-slate-800" />
        </div>
      )}

      {/* Main card row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-3 gap-3">
        {/* Patient Details & Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xs font-bold text-slate-850 truncate flex items-center space-x-1">
              <User className="h-3.5 w-3.5 text-slate-400" />
              <span>{fullName}</span>
            </h3>

            {/* Service Type */}
            <span className="text-[10px] font-semibold bg-slate-50 text-slate-500 px-1.5 py-0.25 rounded border border-slate-150/50">
              {appointment.service}
            </span>

            {/* Status Badge */}
            <span
              className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.25 rounded border ${getStatusStyles(
                appointment.status
              )}`}
            >
              {appointment.status}
            </span>

            {/* Note Badge Button */}
            {note && (
              <button
                onClick={() => setShowNote(!showNote)}
                className={`text-[9px] font-semibold flex items-center space-x-1 px-1.5 py-0.25 rounded border transition-colors ${
                  showNote
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-500 border-slate-150 hover:bg-slate-50"
                }`}
              >
                <MessageSquare className="h-3 w-3" />
                <span>Note</span>
                {showNote ? (
                  <ChevronUp className="h-2.5 w-2.5 ml-0.5" />
                ) : (
                  <ChevronDown className="h-2.5 w-2.5 ml-0.5" />
                )}
              </button>
            )}
          </div>

          {/* Contact Details & Appointment Date */}
          <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 mt-2 text-[11px] text-slate-500 font-medium">
            {phone !== "—" && (
              <a
                href={`tel:${phone}`}
                className="inline-flex items-center space-x-1 hover:text-slate-950 transition-colors"
              >
                <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>{phone}</span>
              </a>
            )}

            {email !== "—" && (
              <a
                href={`mailto:${email}`}
                className="inline-flex items-center space-x-1 hover:text-slate-950 transition-colors"
              >
                <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="truncate max-w-[150px] sm:max-w-none">{email}</span>
              </a>
            )}

            <div className="inline-flex items-center space-x-1 text-slate-700">
              <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="font-semibold">
                {typeof appointment.appointmentDate === "string" 
                  ? new Date(appointment.appointmentDate).toLocaleDateString()
                  : appointment.appointmentDate}
              </span>
            </div>

            {appointment.appointmentTime && (
              <div className="inline-flex items-center space-x-1 text-slate-700">
                <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="font-semibold">{appointment.appointmentTime}</span>
              </div>
            )}
          </div>
        </div>

        {/* Change Status Dropdown Action */}
        <div className="flex items-center justify-end shrink-0 border-t md:border-t-0 pt-2.5 md:pt-0 border-slate-50">
          <div className="relative inline-block w-full sm:w-36">
            <select
              value={appointment.status}
              disabled={isUpdating}
              onChange={(e) => onUpdateStatus(appointment._id, e.target.value)}
              className="w-full bg-slate-50 hover:bg-slate-100/80 border border-slate-100 rounded-lg px-2.5 py-1 text-[11px] font-semibold text-slate-700 focus:outline-none transition-colors disabled:opacity-50 appearance-none cursor-pointer pr-8"
            >
              <option value="requested">⏳ Requested</option>
              <option value="confirmed">📅 Confirmed</option>
              <option value="arrived">🏥 Arrived</option>
              <option value="in_treatment">🩺 In Treatment</option>
              <option value="completed">✅ Completed</option>
              <option value="no_show">🚫 No Show</option>
              <option value="cancelled">❌ Cancelled</option>
            </select>
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <ChevronDown className="h-3 w-3" />
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Note Area */}
      {showNote && note && (
        <div className="bg-slate-50/50 border-t border-slate-50 px-3.5 py-2.5 text-[11px] text-slate-600 flex items-start space-x-2">
          <MessageSquare className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
          <p className="italic leading-normal">"{note}"</p>
        </div>
      )}
    </div>
  );
}
