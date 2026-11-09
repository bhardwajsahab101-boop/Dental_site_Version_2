"use client";

import React, { useState } from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Printer,
  Download,
  Search,
  AlertCircle,
  FileSpreadsheet,
  Users,
  Coins,
  CreditCard,
  TrendingUp,
  X,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

export type RegisterRow = {
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

export type DateOption = {
  date: string;
  count: number;
};

interface PhysicalRegisterViewProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  registerRows: RegisterRow[];
  registerSummary: {
    totalPatients: number;
    totalCash: number;
    totalCredit: number;
    totalRevenue: number;
  };
  availableDates: DateOption[];
  unassignedCount: number;
  loading: boolean;
  onPrevDay: () => void;
  onNextDay: () => void;
  onToday: () => void;
  onPrint: () => void;
  onExportExcel: () => void;
  formatDisplayDate: (dateStr: string) => string;
}

export default function PhysicalRegisterView({
  selectedDate,
  onSelectDate,
  registerRows,
  registerSummary,
  availableDates,
  unassignedCount,
  loading,
  onPrevDay,
  onNextDay,
  onToday,
  onPrint,
  onExportExcel,
  formatDisplayDate,
}: PhysicalRegisterViewProps) {
  const [filterQuery, setFilterQuery] = useState("");

  const filteredRows = registerRows.filter((r) => {
    if (!filterQuery) return true;
    const q = filterQuery.toLowerCase();
    return (
      (r.fullName && r.fullName.toLowerCase().includes(q)) ||
      (r.phone && r.phone.includes(q)) ||
      (r.patientCode && r.patientCode.toLowerCase().includes(q)) ||
      (r.disease && r.disease.toLowerCase().includes(q)) ||
      (r.treatment && r.treatment.toLowerCase().includes(q)) ||
      (r.address && r.address.toLowerCase().includes(q)) ||
      (r.remarks && r.remarks.toLowerCase().includes(q)) ||
      String(r.sNo).includes(q)
    );
  });

  return (
    <div className="space-y-4 printable-physical-register">
      {/* Hidden Print Header (Visible strictly when printing / PDF export) */}
      <div className="hidden print:block text-center border-b-2 border-black pb-3 mb-4 printable-physical-register-header">
        <h1 className="text-2xl font-black uppercase tracking-wider text-black font-serif">
          ANIL SHARMA DENTAL HOSPITAL
        </h1>
        <h2 className="text-sm font-bold uppercase tracking-widest text-black mt-0.5">
          DAILY PATIENT REGISTER
        </h2>
        <p className="text-xs font-semibold text-black mt-1">
          Date: {formatDisplayDate(selectedDate)} ({selectedDate})
        </p>
      </div>

      {/* Date Navigation, KPI Chips & Export Toolbar (Hidden during print) */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-2xs space-y-3 no-print">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Date Picker Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-[#F4F7FA] border border-[#E2E8F0] rounded-xl p-1 shadow-inner">
              <button
                type="button"
                onClick={onPrevDay}
                title="Previous Day"
                className="p-1.5 hover:bg-white rounded-lg text-[#14213D] transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center px-2 space-x-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#14B8A6]" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    if (e.target.value) onSelectDate(e.target.value);
                  }}
                  className="bg-transparent text-xs font-bold text-[#14213D] focus:outline-none cursor-pointer"
                />
              </div>
              <button
                type="button"
                onClick={onNextDay}
                title="Next Day"
                className="p-1.5 hover:bg-white rounded-lg text-[#14213D] transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={onToday}
              className="px-3 py-1.5 text-xs font-bold bg-white border border-[#E2E8F0] hover:bg-[#F4F7FA] text-[#14213D] rounded-xl transition shadow-2xs cursor-pointer"
            >
              Today
            </button>

            <span className="text-xs font-bold text-[#14213D] ml-2 hidden sm:inline">
              {formatDisplayDate(selectedDate)}
            </span>
          </div>

          {/* Action Toolbar: Print & Excel */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onExportExcel}
              className="flex items-center space-x-1.5 px-3 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition-all cursor-pointer"
              title="Download Excel Spreadsheet (.csv)"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Excel</span>
            </button>
            <button
              type="button"
              onClick={onPrint}
              className="flex items-center space-x-1.5 px-3 py-2 text-xs font-bold bg-[#14213D] hover:bg-[#1f3158] text-white rounded-xl shadow-sm transition-all cursor-pointer"
              title="Print Physical Daily Ledger (Landscape)"
            >
              <Printer className="w-4 h-4" />
              <span>Print Register</span>
            </button>
          </div>
        </div>

        {/* Quick Date Pills: Dates with Recorded Patient Visits */}
        {availableDates.length > 0 && (
          <div className="pt-2 border-t border-[#E2E8F0]/60 flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider shrink-0">
              Dates with Visits:
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {availableDates.map((d) => {
                const isSelected = d.date === selectedDate;
                return (
                  <button
                    key={d.date}
                    type="button"
                    onClick={() => onSelectDate(d.date)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition shrink-0 cursor-pointer ${
                      isSelected
                        ? "bg-[#14213D] text-white shadow-xs"
                        : "bg-[#F4F7FA] text-[#64748B] hover:bg-[#E2E8F0] hover:text-[#182230]"
                    }`}
                  >
                    <span>{d.date}</span>
                    <span
                      className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] ${
                        isSelected ? "bg-[#14B8A6] text-white" : "bg-white text-[#64748B]"
                      }`}
                    >
                      {d.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Financial & OPD Daily Summary Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <div className="bg-[#FAF9F5] border border-[#E2E8F0] rounded-xl p-2.5 flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-[#14213D]/5 flex items-center justify-center text-[#14213D]">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-[#64748B] block">
                Total Patients
              </span>
              <span className="text-base font-extrabold text-[#14213D]">
                {registerSummary.totalPatients}
              </span>
            </div>
          </div>

          <div className="bg-[#FAF9F5] border border-[#E2E8F0] rounded-xl p-2.5 flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-[#64748B] block">
                Cash OPD
              </span>
              <span className="text-base font-extrabold text-emerald-700">
                ₹{registerSummary.totalCash.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          <div className="bg-[#FAF9F5] border border-[#E2E8F0] rounded-xl p-2.5 flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-[#64748B] block">
                Credit Due
              </span>
              <span className="text-base font-extrabold text-amber-700">
                ₹{registerSummary.totalCredit.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          <div className="bg-[#FAF9F5] border border-[#E2E8F0] rounded-xl p-2.5 flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-[#64748B] block">
                Total Turnover
              </span>
              <span className="text-base font-extrabold text-indigo-700">
                ₹{registerSummary.totalRevenue.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>

        {/* Real-time search filter */}
        <div className="relative pt-1">
          <div className="absolute inset-y-0 left-0 pl-3 pt-1 flex items-center pointer-events-none">
            <Search className="w-3.5 h-3.5 text-[#64748B]" />
          </div>
          <input
            type="text"
            placeholder="Search within this date's ledger (Name, S.No, Disease, Treatment, Remark)..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs bg-[#F4F7FA] border border-[#E2E8F0] focus:border-[#14B8A6] rounded-xl outline-none transition placeholder:text-[#64748B] text-[#182230]"
          />
          {filterQuery && (
            <button
              type="button"
              onClick={() => setFilterQuery("")}
              className="absolute inset-y-0 right-0 pr-3 pt-1 flex items-center text-[#64748B] hover:text-[#182230]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Unassigned Visit Dates Alert */}
      {unassignedCount > 0 && (
        <div className="no-print bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start space-x-2.5 text-xs text-amber-800">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Notice:</span> {unassignedCount} patient record(s) in
            DentalOS have no recorded visit date and are excluded from the daily register view. You
            can view and update them in the standard directory.
          </div>
        </div>
      )}

      {/* Traditional Physical Register Ledger Table */}
      <div className="bg-[#FAF9F5] border-2 border-slate-400 rounded-xl shadow-sm overflow-hidden printable-physical-register-table">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left font-serif text-[11px] leading-tight">
            <thead>
              <tr className="bg-[#EFECE6] border-b-2 border-slate-500 text-slate-800 font-bold uppercase tracking-wider text-[10px]">
                <th
                  rowSpan={2}
                  className="border-r border-slate-300 py-2 px-2 text-center w-20"
                >
                  Date
                </th>
                <th
                  rowSpan={2}
                  className="border-r border-slate-300 py-2 px-1 text-center w-12"
                >
                  S.No.
                </th>
                <th
                  rowSpan={2}
                  className="border-r border-slate-300 py-2 px-1 text-center w-14"
                >
                  Daily
                </th>
                <th
                  rowSpan={2}
                  className="border-r border-slate-300 py-2 px-3 min-w-[150px]"
                >
                  Name of Patient
                </th>
                <th
                  rowSpan={2}
                  className="border-r border-slate-300 py-2 px-1 text-center w-16"
                >
                  Age / Sex
                </th>
                <th
                  rowSpan={2}
                  className="border-r border-slate-300 py-2 px-2 min-w-[130px]"
                >
                  Address
                </th>
                <th
                  rowSpan={2}
                  className="border-r border-slate-300 py-2 px-2 min-w-[130px]"
                >
                  Disease
                </th>
                <th
                  rowSpan={2}
                  className="border-r border-slate-300 py-2 px-2 min-w-[140px]"
                >
                  Treatment
                </th>
                <th
                  colSpan={2}
                  className="border-r border-slate-300 py-1 px-1 text-center border-b border-slate-300 bg-[#E8E4DC]"
                >
                  Cash
                </th>
                <th
                  colSpan={2}
                  className="border-r border-slate-300 py-1 px-1 text-center border-b border-slate-300 bg-[#E8E4DC]"
                >
                  Credit
                </th>
                <th
                  rowSpan={2}
                  className="py-2 px-2 min-w-[120px]"
                >
                  Remark
                </th>
              </tr>
              <tr className="bg-[#E8E4DC] border-b border-slate-400 text-slate-700 font-bold text-[9px] text-center">
                <th className="border-r border-slate-300 py-1 px-1.5 w-16">Rs.</th>
                <th className="border-r border-slate-300 py-1 px-1 w-8">P.</th>
                <th className="border-r border-slate-300 py-1 px-1.5 w-16">Rs.</th>
                <th className="border-r border-slate-300 py-1 px-1 w-8">P.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300 bg-[#FAF9F5] text-slate-900">
              {loading ? (
                <tr>
                  <td colSpan={13} className="py-12 text-center text-slate-500 font-sans">
                    <div className="inline-block animate-spin w-6 h-6 border-2 border-[#14213D] border-t-transparent rounded-full mb-2" />
                    <p className="text-xs font-bold">Loading physical register entries...</p>
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-12 text-center text-slate-500 font-sans">
                    <p className="text-sm font-bold text-slate-700">
                      No patient visits recorded for {formatDisplayDate(selectedDate)}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Switch dates using the date control above or select an available date.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, idx) => (
                  <tr
                    key={`reg-row-${row.appointmentId || row.patientId || idx}-${idx}`}
                    className="hover:bg-amber-50/60 transition-colors group align-top"
                  >
                    {/* Date */}
                    <td className="border-r border-slate-300 py-2 px-2 text-center whitespace-nowrap font-mono text-[10.5px]">
                      {row.date || selectedDate}
                    </td>

                    {/* S.No. */}
                    <td className="border-r border-slate-300 py-2 px-1 text-center font-bold font-mono">
                      {row.sNo || idx + 1}
                    </td>

                    {/* Daily */}
                    <td className="border-r border-slate-300 py-2 px-1 text-center font-mono text-[10.5px]">
                      {row.daily || "—"}
                    </td>

                    {/* Name of Patient */}
                    <td className="border-r border-slate-300 py-2 px-3 font-bold text-slate-900">
                      <div className="flex items-center justify-between">
                        <span>{row.fullName || "—"}</span>
                        {row.patientId && (
                          <Link
                            href={`/admin/patients/${row.patientId}`}
                            className="no-print ml-1 text-slate-400 hover:text-indigo-600 transition"
                            title="Open digital profile"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        )}
                      </div>
                      {row.phone && (
                        <span className="block text-[10px] text-slate-500 font-sans font-normal">
                          Ph: {row.phone}
                        </span>
                      )}
                    </td>

                    {/* Age / Sex */}
                    <td className="border-r border-slate-300 py-2 px-1 text-center whitespace-nowrap">
                      {row.age ? `${row.age}y` : ""}
                      {row.age && row.gender ? " / " : ""}
                      {row.gender ? (row.gender === "Male" ? "M" : row.gender === "Female" ? "F" : row.gender) : ""}
                      {!row.age && !row.gender && "—"}
                    </td>

                    {/* Address */}
                    <td className="border-r border-slate-300 py-2 px-2 whitespace-normal break-words text-[10.5px]">
                      {row.address || "—"}
                    </td>

                    {/* Disease */}
                    <td className="border-r border-slate-300 py-2 px-2 whitespace-normal break-words text-[10.5px]">
                      {row.disease || "—"}
                    </td>

                    {/* Treatment */}
                    <td className="border-r border-slate-300 py-2 px-2 whitespace-normal break-words font-medium text-[10.5px]">
                      {row.treatment || "—"}
                    </td>

                    {/* Cash Rs. */}
                    <td className="border-r border-slate-300 py-2 px-1.5 text-right font-mono font-bold text-emerald-800">
                      {row.cashRs != null && row.cashRs > 0 ? row.cashRs.toLocaleString("en-IN") : "—"}
                    </td>

                    {/* Cash P. */}
                    <td className="border-r border-slate-300 py-2 px-1 text-center font-mono text-slate-600">
                      {row.cashPaise !== undefined && row.cashPaise !== null && row.cashPaise !== "" ? row.cashPaise : "00"}
                    </td>

                    {/* Credit Rs. */}
                    <td className="border-r border-slate-300 py-2 px-1.5 text-right font-mono font-bold text-amber-800">
                      {row.creditRs != null && row.creditRs > 0 ? row.creditRs.toLocaleString("en-IN") : "—"}
                    </td>

                    {/* Credit P. */}
                    <td className="border-r border-slate-300 py-2 px-1 text-center font-mono text-slate-600">
                      {row.creditPaise !== undefined && row.creditPaise !== null && row.creditPaise !== "" ? row.creditPaise : "00"}
                    </td>

                    {/* Remark */}
                    <td className="py-2 px-2 whitespace-normal break-words text-[10.5px] text-slate-700">
                      {row.remarks || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {/* Table Summary Footer */}
            {filteredRows.length > 0 && (
              <tfoot>
                <tr className="bg-[#EFECE6] border-t-2 border-slate-500 font-bold text-slate-900 text-[10.5px]">
                  <td colSpan={3} className="border-r border-slate-300 py-2 px-2 text-center uppercase">
                    Daily Total
                  </td>
                  <td className="border-r border-slate-300 py-2 px-3">
                    {filteredRows.length} Patient(s)
                  </td>
                  <td colSpan={4} className="border-r border-slate-300 py-2 px-2 text-right uppercase text-slate-600">
                    OPD Collections:
                  </td>
                  <td className="border-r border-slate-300 py-2 px-1.5 text-right font-mono text-emerald-900">
                    ₹{registerSummary.totalCash.toLocaleString("en-IN")}
                  </td>
                  <td className="border-r border-slate-300 py-2 px-1 text-center font-mono">
                    00
                  </td>
                  <td className="border-r border-slate-300 py-2 px-1.5 text-right font-mono text-amber-900">
                    ₹{registerSummary.totalCredit.toLocaleString("en-IN")}
                  </td>
                  <td className="border-r border-slate-300 py-2 px-1 text-center font-mono">
                    00
                  </td>
                  <td className="py-2 px-2 text-[10px] text-slate-600">
                    Turnover: ₹{registerSummary.totalRevenue.toLocaleString("en-IN")}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}

