"use client";

import React from "react";
import { Search } from "lucide-react";

interface SearchFilterUIProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedStatus: string;
  setSelectedStatus: (status: string) => void;
  selectedService: string;
  setSelectedService: (service: string) => void;
  services: string[];
  statusCounts: {
    all: number;
    requested: number;
    confirmed: number;
    arrived: number;
    in_treatment: number;
    completed: number;
    no_show: number;
    cancelled: number;
  };
}

export default function SearchFilterUI({
  searchQuery,
  setSearchQuery,
  selectedStatus,
  setSelectedStatus,
  selectedService,
  setSelectedService,
  services,
  statusCounts,
}: SearchFilterUIProps) {
  const tabs = [
    { id: "all", name: "All Visits", count: statusCounts.all },
    { id: "requested", name: "Requested", count: statusCounts.requested },
    { id: "confirmed", name: "Confirmed", count: statusCounts.confirmed },
    { id: "arrived", name: "Arrived", count: statusCounts.arrived },
    { id: "in_treatment", name: "In Treatment", count: statusCounts.in_treatment },
    { id: "completed", name: "Completed", count: statusCounts.completed },
    { id: "no_show", name: "No Show", count: statusCounts.no_show },
    { id: "cancelled", name: "Cancelled", count: statusCounts.cancelled },
  ];

  return (
    <div className="space-y-3 bg-white border border-[#E2E8F0] p-3.5 rounded-xl shadow-2xs">
      {/* Top controls: Search & Service filter */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#64748B]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by patient name, contact number, or email..."
            className="w-full bg-[#F4F7FA] border border-[#E2E8F0] hover:border-slate-300 focus:bg-white focus:border-[#14B8A6] focus:ring-2 focus:ring-[#14B8A6]/20 rounded-lg pl-9 pr-3.5 py-2 text-xs text-[#182230] placeholder-[#64748B] focus:outline-none transition-all font-medium"
          />
        </div>

        {/* Service filter */}
        <div className="sm:w-56">
          <select
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            className="w-full bg-[#F4F7FA] border border-[#E2E8F0] hover:border-slate-300 focus:bg-white focus:border-[#14B8A6] focus:ring-2 focus:ring-[#14B8A6]/20 rounded-lg px-3 py-2 text-xs font-semibold text-[#182230] focus:outline-none transition-all cursor-pointer"
          >
            <option value="all">All Dental Procedures</option>
            {services.map((service) => (
              <option key={service} value={service}>
                {service}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs list (Status filter) */}
      <div className="flex items-center overflow-x-auto scrollbar-none border-t border-slate-100 pt-2.5 -mx-1 px-1">
        <div className="flex space-x-1.5">
          {tabs.map((tab) => {
            const active = selectedStatus === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedStatus(tab.id)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 shrink-0 cursor-pointer ${
                  active
                    ? "bg-[#14213D] text-white shadow-2xs"
                    : "text-[#64748B] hover:text-[#182230] hover:bg-[#F4F7FA]"
                }`}
              >
                <span>{tab.name}</span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                    active
                      ? "bg-[#14B8A6] text-white"
                      : "bg-slate-100 text-[#64748B] group-hover:bg-slate-200"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
