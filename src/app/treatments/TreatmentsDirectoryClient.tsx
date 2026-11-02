"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { TREATMENTS, TREATMENT_CATEGORIES, TreatmentItem } from "../../data/treatmentsData";
import {
  Search,
  Clock,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Stethoscope,
  Sparkles,
  ShieldCheck,
  Activity,
  Award,
  Scissors,
  Sun,
  HeartPulse,
  Heart,
  Shield,
  Smile,
  SmilePlus,
} from "lucide-react";

export default function TreatmentsDirectoryClient() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredTreatments = useMemo(() => {
    return TREATMENTS.filter((item) => {
      const matchesCategory =
        selectedCategory === "All" || item.category === selectedCategory;

      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.shortDescription.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.indications.some((ind) => ind.toLowerCase().includes(q));

      return matchesCategory && matchesQuery;
    });
  }, [selectedCategory, searchQuery]);

  const renderIcon = (iconName: string) => {
    const props = { className: "w-6 h-6 text-[#16A6A1]" };
    switch (iconName) {
      case "Stethoscope":
        return <Stethoscope {...props} />;
      case "Sparkles":
        return <Sparkles {...props} />;
      case "ShieldCheck":
        return <ShieldCheck {...props} />;
      case "Activity":
        return <Activity {...props} />;
      case "Award":
        return <Award {...props} />;
      case "Scissors":
        return <Scissors {...props} />;
      case "Sun":
        return <Sun {...props} />;
      case "HeartPulse":
        return <HeartPulse {...props} />;
      case "Heart":
        return <Heart {...props} />;
      case "Shield":
        return <Shield {...props} />;
      case "Smile":
        return <Smile {...props} />;
      case "SmilePlus":
        return <SmilePlus {...props} />;
      default:
        return <ShieldCheck {...props} />;
    }
  };

  return (
    <section className="py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search & Filter Bar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs mb-10 space-y-4">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="relative w-full flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search treatments by name, symptom (e.g. root canal, bleeding gums, toothache)..."
                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-[#F8FAFC] focus:bg-white focus:outline-none focus:border-[#16A6A1] transition"
              />
            </div>

            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                Clear Search
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {TREATMENT_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs font-semibold px-4 py-2 rounded-xl shrink-0 transition ${
                  selectedCategory === cat
                    ? "bg-[#102C46] text-white shadow-xs"
                    : "bg-[#F8FAFC] text-[#64748B] hover:text-[#102C46] border border-slate-100"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Results Count & Clinical Notice */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-8 text-xs text-[#64748B]">
          <p>
            Showing <strong>{filteredTreatments.length}</strong> treatment{filteredTreatments.length === 1 ? "" : "s"}
            {selectedCategory !== "All" && ` in ${selectedCategory}`}
          </p>
          <p className="italic text-slate-500">
            *Clinical eligibility determined during in-person oral examination.
          </p>
        </div>

        {/* Treatments List */}
        {filteredTreatments.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 max-w-lg mx-auto space-y-4">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#102C46]">No matching treatments found</h3>
            <p className="text-xs text-[#64748B]">
              Try searching with different terms or reset your category filter to explore our complete directory.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("All");
                setSearchQuery("");
              }}
              className="inline-flex items-center text-xs font-bold text-[#16A6A1] hover:underline"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filteredTreatments.map((treatment) => (
              <div
                key={treatment.id}
                className="bg-white rounded-3xl p-7 border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#E6F7F6] flex items-center justify-center shrink-0">
                      {renderIcon(treatment.iconName)}
                    </div>
                    <span className="text-[11px] font-bold text-[#16A6A1] bg-[#E6F7F6]/70 px-3 py-1 rounded-full">
                      {treatment.category}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-[#102C46]">
                      {treatment.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#64748B] mt-2 leading-relaxed">
                      {treatment.fullDescription}
                    </p>
                  </div>

                  {/* Indications (When needed) */}
                  <div className="bg-[#F8FAFC] p-4 rounded-xl border border-slate-100 space-y-2">
                    <h4 className="text-[11px] font-bold text-[#102C46] uppercase tracking-wider">
                      When Is This Recommended?
                    </h4>
                    <ul className="space-y-1.5">
                      {treatment.indications.map((ind, i) => (
                        <li key={i} className="text-xs text-[#172B3A] flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#16A6A1] shrink-0 mt-0.5" />
                          <span>{ind}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Benefits */}
                  <div className="space-y-1.5 pt-1">
                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Patient Benefits
                    </h4>
                    <ul className="space-y-1">
                      {treatment.benefits.map((benefit, i) => (
                        <li key={i} className="text-xs text-[#64748B] flex items-start gap-2">
                          <span className="text-[#16A6A1] font-bold shrink-0">•</span>
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="pt-6 mt-6 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                    <Clock className="w-3.5 h-3.5 text-[#16A6A1]" />
                    <span>Estimated time: {treatment.duration}</span>
                  </div>

                  <Link
                    href={`/booking?service=${encodeURIComponent(treatment.title)}`}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#16A6A1] hover:bg-[#128884] text-white font-bold px-4 py-2.5 rounded-xl transition shadow-xs"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Request Appointment</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Ethical Medical Claim Disclosure */}
        <div className="mt-12 bg-[#F8FAFC] border border-slate-200 rounded-2xl p-6 flex items-start gap-3 text-xs text-[#64748B]">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Clinical Notice:</strong> Dental treatments are medical procedures tailored to the individual oral anatomy, tissue health, and medical history of each patient. Guarantees of permanent outcome cannot be provided. Our practice always discusses potential risks, recovery expectations, and alternative options transparently before initiating any procedure.
          </p>
        </div>
      </div>
    </section>
  );
}
