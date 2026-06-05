"use client";

import React, { useState, useMemo } from "react";
import { Search, User, Phone, Hash, X, Users, Filter } from "lucide-react";

// 9. Generate production-quality code with proper TypeScript types.
export interface Patient {
  _id: string;
  patientCode: string;
  fullName: string;
  phone: string;
  gender: string;
}

// 6. Assume patient data comes from this structure. Providing robust mock data by default.
const defaultPatients: Patient[] = [
  {
    _id: "p1",
    patientCode: "PT-2026-001",
    fullName: "Alexander Wright",
    phone: "9876543210",
    gender: "Male",
  },
  {
    _id: "p2",
    patientCode: "PT-2026-002",
    fullName: "Elena Rostova",
    phone: "8765432109",
    gender: "Female",
  },
  {
    _id: "p3",
    patientCode: "PT-2026-003",
    fullName: "Jordan Lee",
    phone: "7654321098",
    gender: "Other",
  },
  {
    _id: "p4",
    patientCode: "PT-2026-004",
    fullName: "Marcus Aurelius",
    phone: "6543210987",
    gender: "Male",
  },
  {
    _id: "p5",
    patientCode: "PT-2026-005",
    fullName: "Sophia Martinez",
    phone: "5432109876",
    gender: "Female",
  },
  {
    _id: "p6",
    patientCode: "PT-2026-006",
    fullName: "Dr. Avery Chen",
    phone: "4321098765",
    gender: "Other",
  },
  {
    _id: "p7",
    patientCode: "PT-2026-007",
    fullName: "Chloe Henderson",
    phone: "3210987654",
    gender: "Female",
  },
];

interface PatientSearchFilterProps {
  initialPatients?: Patient[];
}

export default function PatientSearchFilter({ initialPatients = defaultPatients }: PatientSearchFilterProps) {
  // 5. Use local React state only.
  const [searchQuery, setSearchQuery] = useState("");
  const [genderFilter, setGenderFilter] = useState<"All" | "Male" | "Female" | "Other">("All");

  // Calculate dynamic stats for filters based on all initial patients
  const stats = useMemo(() => {
    const total = initialPatients.length;
    const male = initialPatients.filter((p) => p.gender === "Male").length;
    const female = initialPatients.filter((p) => p.gender === "Female").length;
    const other = initialPatients.filter((p) => p.gender === "Other").length;
    return { total, male, female, other };
  }, [initialPatients]);

  // 7. Create filteredPatients using useMemo.
  // 3. Add search input that can search by: Patient Name, Patient Code, Phone Number
  // 2. Add filters: All, Male, Female, Other
  const filteredPatients = useMemo(() => {
    return initialPatients.filter((patient) => {
      // Gender Filter logic
      if (genderFilter !== "All" && patient.gender !== genderFilter) {
        return false;
      }

      // Search Query logic (Name, Code, Phone)
      const query = searchQuery.trim().toLowerCase();
      if (!query) return true;

      const nameMatch = patient.fullName?.toLowerCase().includes(query);
      const codeMatch = patient.patientCode?.toLowerCase().includes(query);
      const phoneMatch = patient.phone?.includes(query);

      return nameMatch || codeMatch || phoneMatch;
    });
  }, [initialPatients, searchQuery, genderFilter]);

  const handleClearFilters = () => {
    setSearchQuery("");
    setGenderFilter("All");
  };

  // Gender label styling helpers
  const getGenderBadgeStyles = (gender: string) => {
    switch (gender) {
      case "Male":
        return "bg-blue-50 text-blue-700 border-blue-100/80";
      case "Female":
        return "bg-pink-50 text-pink-700 border-pink-100/80";
      default:
        return "bg-purple-50 text-purple-700 border-purple-100/80";
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* 4. Modern SaaS healthcare dashboard design container */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md/50 transition-all duration-300 p-6 space-y-6">
        
        {/* Top Header / Stats and Search Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-800 tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-500" />
              Patient Database
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {/* 8. Patient count display */}
              Showing {filteredPatients.length} of {stats.total} total patients
            </p>
          </div>

          {/* 1. Responsive search bar at the top of the Patients page */}
          <div className="relative flex-1 max-w-md w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {/* 8. Search icon */}
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, patient code, or phone number..."
              className="block w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200/80 focus:border-indigo-500 rounded-xl focus:ring-1 focus:ring-indigo-100 outline-none transition-all placeholder:text-slate-400 text-slate-800"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                title="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* 2 & 8. Filter buttons & Category Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-50">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mr-2">
              <Filter className="w-3.5 h-3.5" />
              Filter Gender:
            </span>

            {/* All Patients */}
            <button
              onClick={() => setGenderFilter("All")}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-medium border transition-all duration-200 ${
                genderFilter === "All"
                  ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              All Patients
              <span
                className={`ml-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                  genderFilter === "All" ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-500"
                }`}
              >
                {stats.total}
              </span>
            </button>

            {/* Male */}
            <button
              onClick={() => setGenderFilter("Male")}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-medium border transition-all duration-200 ${
                genderFilter === "Male"
                  ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              Male
              <span
                className={`ml-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                  genderFilter === "Male" ? "bg-indigo-700/80 text-white" : "bg-slate-100 text-slate-500"
                }`}
              >
                {stats.male}
              </span>
            </button>

            {/* Female */}
            <button
              onClick={() => setGenderFilter("Female")}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-medium border transition-all duration-200 ${
                genderFilter === "Female"
                  ? "bg-pink-600 border-pink-600 text-white shadow-sm"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              Female
              <span
                className={`ml-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                  genderFilter === "Female" ? "bg-pink-700/80 text-white" : "bg-slate-100 text-slate-500"
                }`}
              >
                {stats.female}
              </span>
            </button>

            {/* Other */}
            <button
              onClick={() => setGenderFilter("Other")}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-medium border transition-all duration-200 ${
                genderFilter === "Other"
                  ? "bg-purple-600 border-purple-600 text-white shadow-sm"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              Other
              <span
                className={`ml-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                  genderFilter === "Other" ? "bg-purple-700/80 text-white" : "bg-slate-100 text-slate-500"
                }`}
              >
                {stats.other}
              </span>
            </button>
          </div>

          {/* Active filter clear indicator */}
          {(searchQuery || genderFilter !== "All") && (
            <button
              onClick={handleClearFilters}
              className="text-xs font-medium text-slate-400 hover:text-rose-600 transition-colors flex items-center gap-1 py-1"
            >
              <X className="w-3.5 h-3.5" />
              Reset Filters
            </button>
          )}
        </div>

        {/* Patients Grid / Table Area */}
        <div className="overflow-hidden">
          {filteredPatients.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPatients.map((patient) => (
                <div
                  key={patient._id}
                  className="bg-white border border-slate-100 hover:border-indigo-100 rounded-xl p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Patient Header (Name & Gender Badge) */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                          <User className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-slate-800 line-clamp-1">{patient.fullName}</h4>
                          <span className="text-[10px] text-slate-400 block font-mono">{patient._id}</span>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${getGenderBadgeStyles(patient.gender)}`}>
                        {patient.gender}
                      </span>
                    </div>

                    {/* Patient Details (Code & Phone) */}
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-50">
                      <div className="space-y-0.5 text-slate-500">
                        <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                          <Hash className="w-3 h-3" />
                          Code
                        </span>
                        <span className="font-medium text-slate-700 font-mono text-[11px] block truncate">
                          {patient.patientCode}
                        </span>
                      </div>
                      <div className="space-y-0.5 text-slate-500">
                        <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          Phone
                        </span>
                        <span className="font-medium text-slate-700 block truncate">
                          {patient.phone || "—"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-end">
                    <button className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-0.5">
                      View Details
                      <span className="text-sm line-height-1">&rarr;</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* 8. Empty state UI */
            <div className="bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl p-10 text-center max-w-md mx-auto my-4 space-y-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <Users className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-slate-800">No patients found</h3>
                <p className="text-xs text-slate-500 max-w-[280px] mx-auto">
                  We couldn&apos;t find any patient matching your current search queries or gender filters.
                </p>
              </div>
              <div>
                <button
                  onClick={handleClearFilters}
                  className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold text-indigo-600 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-xl transition-all shadow-sm"
                >
                  Clear search & filters
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
