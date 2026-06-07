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
    { id: "all", name: "All", count: statusCounts.all },
    { id: "requested", name: "Requested", count: statusCounts.requested },
    { id: "confirmed", name: "Confirmed", count: statusCounts.confirmed },
    { id: "arrived", name: "Arrived", count: statusCounts.arrived },
    { id: "in_treatment", name: "In Treatment", count: statusCounts.in_treatment },
    { id: "completed", name: "Completed", count: statusCounts.completed },
    { id: "no_show", name: "No Show", count: statusCounts.no_show },
    { id: "cancelled", name: "Cancelled", count: statusCounts.cancelled },
  ];

  return (
    <div className="space-y-3 bg-white border border-slate-100 p-3 rounded-xl shadow-sm">
      {/* Top controls: Search & Service filter */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by patient name, phone, or email..."
            className="w-full bg-slate-50/50 border border-slate-100 hover:border-slate-200/80 focus:border-slate-900 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition-colors"
          />
        </div>

        {/* Service filter */}
        <div className="sm:w-48">
          <select
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            className="w-full bg-slate-50/50 border border-slate-100 hover:border-slate-200/80 focus:border-slate-900 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none transition-colors"
          >
            <option value="all">All Treatments</option>
            {services.map((service) => (
              <option key={service} value={service}>
                {service}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs list (Status filter) */}
      <div className="flex items-center overflow-x-auto scrollbar-none border-t border-slate-50 pt-2 -mx-1 px-1">
        <div className="flex space-x-1">
          {tabs.map((tab) => {
            const active = selectedStatus === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedStatus(tab.id)}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-[11px] font-semibold transition-all duration-150 shrink-0 ${
                  active
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                }`}
              >
                <span>{tab.name}</span>
                <span
                  className={`px-1.5 py-0.25 rounded text-[9px] font-bold ${
                    active
                      ? "bg-slate-800 text-slate-200"
                      : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
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
