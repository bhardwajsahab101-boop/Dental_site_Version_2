"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Compass,
  Users,
  Calendar,
  Activity,
  Coins,
  Settings,
  TrendingUp,
  GraduationCap,
  Search,
  Check,
  ChevronDown,
  ChevronRight,
  Info,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  Sparkles,
  BookOpen,
  ArrowDown,
  Camera
} from "lucide-react";
import {
  trainingCategories,
  workflowSteps,
  faqs,
  TrainingCategory,
  Topic,
  FAQItem
} from "../../../data/academyData";

const iconMap: { [key: string]: any } = {
  Compass: Compass,
  Users: Users,
  Calendar: Calendar,
  Activity: Activity,
  Coins: Coins,
  Settings: Settings,
  TrendingUp: TrendingUp,
};

function ScreenshotMockup({ type, title }: { type: string; title: string }) {
  return (
    <div className="border border-slate-150 rounded-xl overflow-hidden shadow-sm bg-slate-50 text-slate-800 my-3 animate-in fade-in duration-200">
      {/* Mock Browser/Window Header */}
      <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center space-x-1.5">
          <div className="w-2 h-2 rounded-full bg-rose-400" />
          <div className="w-2 h-2 rounded-full bg-amber-400" />
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
        </div>
        <div className="text-[9px] font-mono text-slate-400 bg-white border border-slate-200/60 px-5 py-0.5 rounded-md truncate max-w-[200px] select-none">
          dentalos.clinic/admin/{type}
        </div>
        <div className="w-10" />
      </div>

      {/* Mock Screen Content Area */}
      <div className="p-4 bg-white text-left font-sans text-xs">
        {type === "settings" && (
          <div className="space-y-4">
            <div className="flex border-b border-slate-100 pb-1 space-x-3">
              <span className="font-bold text-indigo-650 border-b-2 border-indigo-600 pb-1 text-[10.5px]">General Settings</span>
              <span className="font-semibold text-slate-400 pb-1 text-[10.5px]">Services Catalog</span>
            </div>
            <div className="space-y-2.5 max-w-md">
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <div className="h-1.5 w-12 bg-slate-100 rounded" />
                  <div className="h-6 w-full border border-slate-155 rounded-lg px-2 flex items-center text-[9px] font-bold text-slate-600 bg-slate-50/50">Apex Dental Clinic</div>
                </div>
                <div className="space-y-1">
                  <div className="h-1.5 w-16 bg-slate-100 rounded" />
                  <div className="h-6 w-full border border-slate-155 rounded-lg px-2 flex items-center text-[9px] font-bold text-slate-600 bg-slate-50/50 font-mono">apex-dental</div>
                </div>
              </div>
              <div className="space-y-1">
                <div className="h-1.5 w-12 bg-slate-100 rounded" />
                <div className="h-6 w-full border border-slate-155 rounded-lg px-2 flex items-center text-[9px] font-bold text-slate-600 bg-slate-50/50">123 Health Ave, Medical District</div>
              </div>
              <div className="flex justify-end">
                <div className="h-6 w-24 bg-indigo-700 rounded-lg flex items-center justify-center text-[9px] font-bold text-white shadow-sm">Save Configuration</div>
              </div>
            </div>
          </div>
        )}

        {type === "staff" && (
          <div className="space-y-2.5">
            <div className="flex justify-between items-center">
              <div className="h-2 w-16 bg-slate-150 rounded" />
              <div className="h-5.5 w-16 bg-indigo-700 rounded-lg flex items-center justify-center text-[8.5px] font-bold text-white shadow-sm">+ Add Staff</div>
            </div>
            <div className="border border-slate-100 rounded-lg divide-y divide-slate-100 overflow-hidden">
              <div className="p-2 flex items-center justify-between hover:bg-slate-50">
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-600">DM</div>
                  <div>
                    <div className="font-bold text-slate-800 text-[10px]">Dr. Alex Mercer</div>
                    <div className="text-[8px] text-slate-400">doctor@clinic.com</div>
                  </div>
                </div>
                <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 text-[7.5px] font-bold px-1.5 py-0.25 rounded-full uppercase">Doctor</span>
              </div>
              <div className="p-2 flex items-center justify-between hover:bg-slate-50">
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-600">JS</div>
                  <div>
                    <div className="font-bold text-slate-800 text-[10px]">Jessica Simpson</div>
                    <div className="text-[8px] text-slate-400">reception@clinic.com</div>
                  </div>
                </div>
                <span className="bg-amber-50 border border-amber-100 text-amber-700 text-[7.5px] font-bold px-1.5 py-0.25 rounded-full uppercase">Receptionist</span>
              </div>
            </div>
          </div>
        )}

        {type === "patients" && (
          <div className="space-y-2.5">
            <div className="flex items-center space-x-2 border border-slate-150 rounded-lg px-2 py-1.5 bg-slate-50/50">
              <div className="h-2.5 w-2.5 bg-slate-300 rounded-full" />
              <div className="h-2 w-32 bg-slate-150 rounded" />
            </div>
            <div className="border border-slate-100 rounded-lg divide-y divide-slate-100 overflow-hidden">
              <div className="p-2 flex items-center justify-between hover:bg-slate-50">
                <div>
                  <div className="font-bold text-slate-800 text-[10px]">Aria Stark</div>
                  <div className="text-[8px] text-slate-400">Age: 18 • Phone: +91 98765 43210</div>
                </div>
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[8px] font-bold px-1.5 py-0.25 rounded-full">Paid • $0.00 Outstanding</span>
              </div>
              <div className="p-2 flex items-center justify-between hover:bg-slate-50">
                <div>
                  <div className="font-bold text-slate-800 text-[10px]">Bruce Wayne</div>
                  <div className="text-[8px] text-slate-400">Age: 35 • Phone: +1 888 123 4567</div>
                </div>
                <span className="bg-rose-50 text-rose-700 border border-rose-100 text-[8px] font-bold px-1.5 py-0.25 rounded-full font-semibold">Partial • $350.00 Dues</span>
              </div>
            </div>
          </div>
        )}

        {type === "calendar" && (
          <div className="space-y-2.5">
            <div className="flex justify-between items-end border-b border-slate-100 pb-1.5">
              <div className="font-bold text-slate-800 text-[10px]">June 2026</div>
              <div className="flex space-x-1">
                <span className="bg-slate-100 text-[8px] font-bold px-1.5 py-0.5 rounded-md">Day</span>
                <span className="bg-slate-900 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-md shadow-sm">Week</span>
                <span className="bg-slate-100 text-[8px] font-bold px-1.5 py-0.5 rounded-md">Month</span>
              </div>
            </div>
            <div className="grid grid-cols-5 gap-1 border border-slate-100 rounded-lg p-1 bg-slate-50/50">
              {["Mon 09", "Tue 10", "Wed 11", "Thu 12", "Fri 13"].map((day, dIdx) => (
                <div key={dIdx} className="bg-white border border-slate-100 rounded-lg p-1 min-h-[60px] space-y-1">
                  <span className="text-[8px] font-black text-slate-350 block">{day}</span>
                  {dIdx === 0 && (
                    <div className="bg-indigo-50 border border-indigo-100 rounded p-0.5 text-[7px] text-indigo-950 font-bold leading-tight shadow-sm">
                      9 AM - Consultation
                    </div>
                  )}
                  {dIdx === 2 && (
                    <div className="bg-amber-50 border border-amber-100 rounded p-0.5 text-[7px] text-amber-955 font-bold leading-tight shadow-sm">
                      11 AM - Cleaning
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {type === "treatments" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <div className="h-1.5 w-16 bg-slate-150 rounded" />
                <div className="h-6 border border-slate-200 rounded-lg px-2 flex items-center text-[9px] font-bold text-slate-700 bg-slate-50/50">Tooth Extraction</div>
              </div>
              <div className="space-y-1">
                <div className="h-1.5 w-12 bg-slate-150 rounded" />
                <div className="h-6 border border-slate-200 rounded-lg px-2 flex items-center text-[9px] font-bold text-slate-700 bg-slate-50/50">Tooth #18</div>
              </div>
              <div className="space-y-1">
                <div className="h-1.5 w-12 bg-slate-150 rounded" />
                <div className="h-6 border border-slate-200 rounded-lg px-2 flex items-center text-[9px] font-mono text-slate-700 bg-slate-50/50">$150</div>
              </div>
              <div className="space-y-1">
                <div className="h-1.5 w-20 bg-slate-150 rounded" />
                <div className="h-6 border border-slate-200 rounded-lg px-2 flex items-center text-[9px] font-mono text-slate-405 bg-slate-50/50">
                  [Blank matches $150]
                </div>
              </div>
            </div>
            <div className="bg-amber-50/40 border border-amber-100 p-2 rounded-lg text-[8.5px] text-amber-800 font-semibold leading-relaxed">
              💡 Leaving Paid Amount empty defaults to the total cost ($150) and sets status to "Fully Paid".
            </div>
          </div>
        )}

        {type === "finance" && (
          <div className="space-y-2.5">
            <div className="grid grid-cols-3 gap-1.5">
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 text-center">
                <span className="text-[7.5px] font-bold text-slate-400 block uppercase tracking-wider">Revenue</span>
                <span className="text-[10px] font-black text-slate-900 font-mono mt-0.5 block">$25,500</span>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 text-center">
                <span className="text-[7.5px] font-bold text-slate-400 block uppercase tracking-wider">Collected</span>
                <span className="text-[10px] font-black text-indigo-650 font-mono mt-0.5 block">$18,200</span>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 text-center">
                <span className="text-[7.5px] font-bold text-slate-400 block uppercase tracking-wider">Outstanding</span>
                <span className="text-[10px] font-black text-rose-650 font-mono mt-0.5 block">$7,300</span>
              </div>
            </div>
            <div className="border border-slate-100 rounded-lg p-2">
              <div className="flex justify-between items-center text-[8px] font-bold text-slate-450 uppercase pb-1 border-b border-slate-50">
                <span>Patient</span>
                <span>Outstanding Dues</span>
              </div>
              <div className="flex justify-between items-center py-0.5 font-semibold text-[9.5px]">
                <span>Bruce Wayne</span>
                <span className="font-mono text-rose-600 font-bold">$350.00</span>
              </div>
            </div>
          </div>
        )}

        {type === "analytics" && (
          <div className="space-y-3">
            <div className="flex justify-between items-end border-b border-slate-100 pb-1.5">
              <div className="font-bold text-slate-800 text-[10px]">Revenue Growth Trend</div>
              <span className="text-[8.5px] text-emerald-600 font-bold">▲ +12.4% vs Last Month</span>
            </div>
            <div className="h-20 flex items-end justify-between px-4 bg-slate-50/50 border border-slate-100 rounded-lg pt-3 pb-1.5">
              {[35, 48, 42, 55, 62, 70].map((height, i) => (
                <div key={i} className="flex flex-col items-center space-y-1">
                  <div
                    className="bg-indigo-600 w-4.5 rounded-t transition-all hover:bg-indigo-500 duration-300 animate-in slide-in-from-bottom-2"
                    style={{ height: `${height}px` }}
                  />
                  <span className="text-[8px] font-bold text-slate-400">M{i+1}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function NavigationMockup({ stepText }: { stepText: string }) {
  const lower = stepText.toLowerCase();
  const activeItem = lower.includes("settings") ? "Settings" :
                     lower.includes("staff") ? "Staff" :
                     lower.includes("patient") ? "Patients" :
                     lower.includes("calendar") || lower.includes("appointment") ? "Calendar" :
                     lower.includes("treatment") ? "Treatments" :
                     lower.includes("finance") || lower.includes("revenue") || lower.includes("collected") || lower.includes("outstanding") ? "Finance" :
                     lower.includes("analytics") || lower.includes("report") || lower.includes("growth") ? "Analytics" : "Dashboard";

  const items = [
    { name: "Dashboard", icon: Activity },
    { name: "Patients", icon: Users },
    { name: "Calendar", icon: Calendar },
    { name: "Finance", icon: Coins },
    { name: "Settings", icon: Settings }
  ];

  return (
    <div className="bg-slate-950 border border-slate-900 rounded-xl p-3 flex items-start space-x-3 font-sans h-[95px] select-none overflow-hidden relative shadow-inner">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.03] to-transparent pointer-events-none" />
      {/* Mini Sidebar */}
      <div className="w-[85px] border-r border-slate-900 pr-2 space-y-1 shrink-0 h-full flex flex-col justify-center">
        {items.slice(0, 4).map((item) => {
          const isActive = item.name === activeItem;
          const Icon = item.icon;
          return (
            <div key={item.name} className={`flex items-center space-x-1.5 px-1.5 py-0.5 rounded text-[8px] font-bold transition-all ${
              isActive ? "bg-indigo-600/90 text-white shadow-sm shadow-indigo-600/10" : "text-slate-500"
            }`}>
              <Icon className="h-2.5 w-2.5 shrink-0" />
              <span className="truncate">{item.name}</span>
            </div>
          );
        })}
      </div>
      {/* Mini View */}
      <div className="flex-1 flex flex-col justify-center h-full space-y-1.5">
        <div className="text-[9px] font-extrabold text-slate-200 flex items-center space-x-1">
          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
          <span>Sidebar Navigation</span>
        </div>
        <div className="text-[8px] text-slate-450 leading-relaxed line-clamp-2">
          Select <span className="text-indigo-400 font-extrabold">{activeItem}</span> from the main sidebar to access controls.
        </div>
      </div>
    </div>
  );
}

function FormMockup({ stepText }: { stepText: string }) {
  let label1 = "Full Name";
  let val1 = "John Doe";
  let label2 = "Phone Number";
  let val2 = "+1 (555) 123-4567";

  if (stepText.toLowerCase().includes("clinic") || stepText.toLowerCase().includes("profile")) {
    label1 = "Clinic Name";
    val1 = "Apex Dental Care";
    label2 = "Address";
    val2 = "123 Health Ave";
  } else if (stepText.toLowerCase().includes("staff") || stepText.toLowerCase().includes("role")) {
    label1 = "Staff Name";
    val1 = "Dr. Sarah Conner";
    label2 = "Role";
    val2 = "Doctor";
  } else if (stepText.toLowerCase().includes("treatment") || stepText.toLowerCase().includes("diagnosis") || stepText.toLowerCase().includes("tooth")) {
    label1 = "Diagnosis";
    val1 = "Deep Caries Restored";
    label2 = "Tooth #";
    val2 = "18";
  } else if (stepText.toLowerCase().includes("cost") || stepText.toLowerCase().includes("pay")) {
    label1 = "Cost ($)";
    val1 = "350.00";
    label2 = "Paid Amount";
    val2 = "350.00";
  }

  return (
    <div className="bg-slate-950 border border-slate-900 rounded-xl p-3 flex flex-col justify-center space-y-2 h-[95px] font-sans overflow-hidden select-none relative shadow-inner">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.03] to-transparent pointer-events-none" />
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <div className="text-[7px] text-slate-500 font-extrabold uppercase tracking-wider">{label1}</div>
          <div className="h-5 px-1.5 border border-slate-900 rounded-lg bg-slate-900/40 flex items-center text-[8px] font-bold text-slate-300">
            <span className="truncate">{val1}</span>
            <span className="w-0.5 h-2.5 bg-indigo-500 ml-0.5 animate-pulse shrink-0" />
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-[7px] text-slate-500 font-extrabold uppercase tracking-wider">{label2}</div>
          <div className="h-5 px-1.5 border border-slate-900 rounded-lg bg-slate-900/40 flex items-center text-[8px] font-bold text-slate-300 truncate">
            <span className="truncate">{val2}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionMockup({ stepText }: { stepText: string }) {
  let btnText = "Save Changes";
  let status = "Changes saved successfully!";
  if (stepText.toLowerCase().includes("register") || stepText.toLowerCase().includes("patient")) {
    btnText = "Register Patient";
    status = "Patient registered!";
  } else if (stepText.toLowerCase().includes("staff")) {
    btnText = "Add Staff";
    status = "Staff profile created!";
  } else if (stepText.toLowerCase().includes("book") || stepText.toLowerCase().includes("appointment")) {
    btnText = "Book Appointment";
    status = "Appointment scheduled!";
  } else if (stepText.toLowerCase().includes("delete") || stepText.toLowerCase().includes("remove")) {
    btnText = "Confirm Delete";
    status = "Deleted successfully.";
  } else if (stepText.toLowerCase().includes("service")) {
    btnText = "Add New Service";
    status = "Service added to catalog!";
  }

  const [clicked, setClicked] = useState(false);

  return (
    <div className="bg-slate-950 border border-slate-900 rounded-xl p-3 flex flex-col justify-center items-center h-[95px] font-sans select-none overflow-hidden space-y-2 relative shadow-inner">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.03] to-transparent pointer-events-none" />
      <button
        onClick={() => {
          setClicked(true);
          const t = setTimeout(() => setClicked(false), 2500);
          return () => clearTimeout(t);
        }}
        className={`px-3.5 py-1.5 text-[8.5px] font-extrabold rounded-lg shadow-sm border transition-all duration-200 cursor-pointer ${
          clicked
            ? "bg-emerald-600 border-emerald-500 text-white scale-95"
            : "bg-indigo-600 hover:bg-indigo-500 border-indigo-500 text-white active:scale-95 shadow-indigo-650/10"
        }`}
      >
        {clicked ? "✓ Done" : btnText}
      </button>
      <div className={`text-[7.5px] font-bold transition-all duration-300 ${
        clicked ? "text-emerald-400 opacity-100 translate-y-0" : "text-slate-500 opacity-0 -translate-y-1"
      }`}>
        {status}
      </div>
    </div>
  );
}

function SearchMockup({ stepText }: { stepText: string }) {
  const [query, setQuery] = useState("");
  useEffect(() => {
    let index = 0;
    const target = "Aria Stark";
    const timer = setInterval(() => {
      setQuery(target.slice(0, index + 1));
      index++;
      if (index >= target.length) {
        setTimeout(() => {
          index = 0;
          setQuery("");
        }, 2000);
      }
    }, 150);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-slate-950 border border-slate-900 rounded-xl p-2.5 flex flex-col justify-between h-[95px] font-sans select-none overflow-hidden relative shadow-inner">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.03] to-transparent pointer-events-none" />
      <div className="flex items-center space-x-1.5 border border-slate-900 rounded-lg bg-slate-900/40 px-2 py-1">
        <Search className="h-2.5 w-2.5 text-slate-500 shrink-0" />
        <div className="text-[8.5px] font-bold text-slate-300 flex-1 truncate">
          {query || <span className="text-slate-655 font-medium">Search records...</span>}
        </div>
      </div>
      
      <div className="border border-slate-900/60 rounded-lg bg-slate-900/20 p-1.5 flex items-center justify-between text-[7.5px]">
        <div className="font-extrabold text-slate-350 flex items-center space-x-1">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
          <span>Aria Stark</span>
        </div>
        <div className="text-slate-500 text-[6.5px] font-mono">+91 98765 XXXXX</div>
      </div>
    </div>
  );
}

function AnalyticsMockup() {
  return (
    <div className="bg-slate-950 border border-slate-900 rounded-xl p-3 flex items-center justify-between h-[95px] font-sans select-none overflow-hidden relative shadow-inner">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.03] to-transparent pointer-events-none" />
      <div className="space-y-1 flex-1">
        <span className="text-[7px] font-extrabold text-slate-500 uppercase tracking-wider block">Gross Income</span>
        <span className="text-[11px] font-black text-white font-mono block">$25,500</span>
        <span className="text-[6.5px] text-emerald-400 font-extrabold block">▲ +12.4% vs last mo</span>
      </div>
      <div className="flex items-end space-x-1 h-full pt-4 max-w-[80px]">
        {[30, 45, 60, 40, 75].map((h, i) => (
          <div
            key={i}
            className="bg-indigo-650 w-2 rounded-t transition-all hover:bg-indigo-550"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>
  );
}

function ListMockup({ stepText }: { stepText: string }) {
  let item1 = { name: "Dr. Alex Mercer", sub: "doctor@clinic.com", badge: "Doctor", badgeBg: "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" };
  let item2 = { name: "Jessica Simpson", sub: "reception@clinic.com", badge: "Reception", badgeBg: "bg-amber-500/10 text-amber-400 border border-amber-500/20" };

  if (stepText.toLowerCase().includes("patient")) {
    item1 = { name: "Aria Stark", sub: "Age: 18 • Consultation", badge: "Paid", badgeBg: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" };
    item2 = { name: "Bruce Wayne", sub: "Age: 35 • Cleaning", badge: "Partial", badgeBg: "bg-rose-500/10 text-rose-400 border border-rose-500/20" };
  } else if (stepText.toLowerCase().includes("service")) {
    item1 = { name: "Tooth Extraction", sub: "General Surgery", badge: "Active", badgeBg: "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" };
    item2 = { name: "Root Canal", sub: "Endodontics", badge: "Active", badgeBg: "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" };
  }

  return (
    <div className="bg-slate-950 border border-slate-900 rounded-xl p-2 flex flex-col justify-center space-y-1.5 h-[95px] font-sans select-none overflow-hidden relative shadow-inner">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.03] to-transparent pointer-events-none" />
      {[item1, item2].map((item, idx) => (
        <div key={idx} className="p-1 rounded-lg bg-slate-900/30 border border-slate-900/60 flex items-center justify-between text-[7px]">
          <div>
            <div className="font-extrabold text-slate-300 text-[8px] leading-tight">{item.name}</div>
            <div className="text-slate-550 text-[6.5px] font-semibold mt-0.5 leading-none">{item.sub}</div>
          </div>
          <span className={`text-[6px] font-black px-1 py-0.25 rounded-md uppercase shrink-0 leading-none ${item.badgeBg}`}>
            {item.badge}
          </span>
        </div>
      ))}
    </div>
  );
}

function GenericMockup({ topicTitle }: { topicTitle: string }) {
  return (
    <div className="bg-slate-950 border border-slate-900 rounded-xl p-3 flex flex-col justify-center items-center h-[95px] font-sans select-none overflow-hidden relative shadow-inner">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.04] via-transparent to-transparent pointer-events-none" />
      <div className="flex flex-col items-center text-center space-y-1">
        <Camera className="h-4 w-4 text-indigo-400 animate-pulse" />
        <span className="text-[7.5px] font-extrabold text-indigo-350 uppercase tracking-widest leading-none mt-1">{topicTitle}</span>
        <span className="text-[6.5px] text-slate-550 uppercase tracking-wider font-semibold">Ready to Preview</span>
      </div>
    </div>
  );
}

function StepDemoPlaceholder({ stepText, topicTitle }: { stepText: string; topicTitle: string }) {
  const text = stepText.toLowerCase();
  if (text.includes("navigate") || text.includes("go to") || text.includes("switch to") || text.includes("open the") || text.includes("sidebar") || text.includes("locate")) {
    return <NavigationMockup stepText={stepText} />;
  }
  if (text.includes("fill") || text.includes("enter") || text.includes("input") || text.includes("type") || text.includes("specify") || text.includes("choose") || text.includes("select")) {
    return <FormMockup stepText={stepText} />;
  }
  if (text.includes("click") || text.includes("save") || text.includes("submit") || text.includes("confirm") || text.includes("toggle") || text.includes("delete") || text.includes("turn") || text.includes("remove")) {
    return <ActionMockup stepText={stepText} />;
  }
  if (text.includes("search") || text.includes("filter") || text.includes("find")) {
    return <SearchMockup stepText={stepText} />;
  }
  if (text.includes("graph") || text.includes("chart") || text.includes("analytics") || text.includes("dashboard") || text.includes("revenue") || text.includes("collected") || text.includes("outstanding") || text.includes("sum") || text.includes("finance")) {
    return <AnalyticsMockup />;
  }
  if (text.includes("list") || text.includes("history") || text.includes("records") || text.includes("table") || text.includes("details") || text.includes("view") || text.includes("review")) {
    return <ListMockup stepText={stepText} />;
  }
  return <GenericMockup topicTitle={topicTitle} />;
}

function TopicItem({ topic }: { topic: Topic }) {
  const [showScreenshot, setShowScreenshot] = useState(false);

  return (
    <div className="bg-white border border-slate-100 rounded-xl p-4.5 space-y-4">
      <div className="flex justify-between items-start">
        <h4 className="text-[12px] font-bold text-slate-800 flex items-center space-x-1.5">
          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
          <span>{topic.title}</span>
        </h4>
        {topic.screenshotType && (
          <button
            onClick={() => setShowScreenshot(!showScreenshot)}
            className={`inline-flex items-center space-x-1.5 text-[9px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer select-none ${
              showScreenshot
                ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm"
                : "bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100"
            }`}
          >
            <Camera className="h-3 w-3" />
            <span>{showScreenshot ? "Hide Preview" : "Show Screenshot"}</span>
          </button>
        )}
      </div>

      {/* Step list */}
      <div className="space-y-3">
        <h5 className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-wider">
          Steps to Perform
        </h5>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {topic.steps.map((step, sIdx) => (
            <div key={sIdx} className="bg-slate-50/50 border border-slate-150 rounded-2xl p-4 flex flex-col justify-between space-y-3 hover:border-slate-350 hover:shadow-sm transition-all duration-200">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="flex items-center justify-center bg-indigo-50 text-indigo-700 text-[10px] font-black h-5 w-5 rounded-full border border-indigo-100">
                    {sIdx + 1}
                  </span>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Step {sIdx + 1}</span>
                </div>
                <p className="text-[11.5px] text-slate-600 font-medium leading-relaxed">
                  {step}
                </p>
              </div>
              <div className="mt-2">
                <StepDemoPlaceholder stepText={step} topicTitle={topic.title} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Screenshot Mockup Container */}
      {showScreenshot && topic.screenshotType && (
        <ScreenshotMockup type={topic.screenshotType} title={topic.title} />
      )}

      {/* Important Notes warning boxes */}
      {topic.importantNotes && topic.importantNotes.length > 0 && (
        <div className="bg-amber-50/40 border border-amber-100/70 p-3 rounded-lg space-y-1">
          <div className="flex items-center space-x-1.5 text-amber-700">
            <Info className="h-3.5 w-3.5" />
            <span className="text-[9.5px] font-black uppercase tracking-wider">
              Important Notes
            </span>
          </div>
          <ul className="list-disc pl-4 text-[10.5px] text-amber-800 space-y-1 font-semibold leading-relaxed">
            {topic.importantNotes.map((note, nIdx) => (
              <li key={nIdx}>{note}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Best Practices alert boxes */}
      {topic.bestPractices && topic.bestPractices.length > 0 && (
        <div className="bg-emerald-50/40 border border-emerald-100/70 p-3 rounded-lg space-y-1">
          <div className="flex items-center space-x-1.5 text-emerald-700">
            <Check className="h-3.5 w-3.5" />
            <span className="text-[9.5px] font-black uppercase tracking-wider">
              Best Practices
            </span>
          </div>
          <ul className="list-disc pl-4 text-[10.5px] text-emerald-800 space-y-1 font-semibold leading-relaxed">
            {topic.bestPractices.map((bp, bIdx) => (
              <li key={bIdx}>{bp}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function AcademyPage() {
  const [completedGuides, setCompletedGuides] = useState<string[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>("getting-started");
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
    const stored = localStorage.getItem("academy_progress");
    if (stored) {
      try {
        setCompletedGuides(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse academy progress:", e);
      }
    }
  }, []);

  const toggleGuideProgress = (guideId: string) => {
    const next = completedGuides.includes(guideId)
      ? completedGuides.filter((id) => id !== guideId)
      : [...completedGuides, guideId];
    setCompletedGuides(next);
    localStorage.setItem("academy_progress", JSON.stringify(next));
  };

  const isGuideCompleted = (guideId: string) => {
    return completedGuides.includes(guideId);
  };

  // Calculate progress stats
  const totalGuidesCount = trainingCategories.length;
  const completedCount = useMemo(() => {
    return trainingCategories.filter((cat) => isGuideCompleted(cat.id)).length;
  }, [completedGuides]);

  const progressPercent = useMemo(() => {
    if (totalGuidesCount === 0) return 0;
    return Math.round((completedCount / totalGuidesCount) * 100);
  }, [completedCount, totalGuidesCount]);

  // Handle Search filtering
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return { categories: [], faqs: [] };

    const query = searchQuery.toLowerCase();

    // Match guide categories or their internal topics
    const matchedCategories: { category: TrainingCategory; matchedTopics: Topic[] }[] = [];
    trainingCategories.forEach((cat) => {
      const categoryMatchesQuery =
        cat.title.toLowerCase().includes(query) ||
        cat.description.toLowerCase().includes(query);

      const matchedTopics = cat.topics.filter((topic) => {
        return (
          topic.title.toLowerCase().includes(query) ||
          topic.steps.some((step) => step.toLowerCase().includes(query)) ||
          (topic.importantNotes &&
            topic.importantNotes.some((note) => note.toLowerCase().includes(query))) ||
          (topic.bestPractices &&
            topic.bestPractices.some((bp) => bp.toLowerCase().includes(query)))
        );
      });

      if (categoryMatchesQuery || matchedTopics.length > 0) {
        matchedCategories.push({
          category: cat,
          // If category matches but topics don't, return all topics. Otherwise return matching topics.
          matchedTopics: matchedTopics.length > 0 ? matchedTopics : cat.topics,
        });
      }
    });

    // Match FAQs
    const matchedFaqs = faqs.filter((faq) => {
      return (
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query)
      );
    });

    return {
      categories: matchedCategories,
      faqs: matchedFaqs,
    };
  }, [searchQuery]);

  const handleSearchResultClick = (categoryId: string) => {
    setExpandedCategoryId(categoryId);
    setSearchQuery(""); // Clear search
    // Scroll to feature guides section
    const element = document.getElementById("guides-section");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleFaqResultClick = (faqId: string) => {
    setExpandedFaqId(faqId);
    setSearchQuery(""); // Clear search
    // Scroll to faq section
    const element = document.getElementById("faq-section");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-16 animate-in fade-in duration-300">
      
      {/* 1. Welcome Section & Progress Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Welcome Card */}
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-lg border border-slate-800">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-10 pointer-events-none">
            <GraduationCap className="h-64 w-64 text-indigo-400" />
          </div>
          <div className="relative z-10 space-y-4">
            <div className="inline-flex items-center space-x-2 bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-indigo-500/35">
              <Sparkles className="h-3 w-3" />
              <span>Dental OS Academy</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Master Your Dental Practice OS
            </h1>
            <p className="text-slate-300 text-xs md:text-[13px] leading-relaxed max-w-xl">
              Welcome to the Interactive Help Center. Learn how to manage patient profiles, schedule appointments, record treatments, review clinic finances, configure services, and manage staff operations without external support.
            </p>
            <div className="pt-2 flex items-center space-x-4">
              <a
                href="#workflow-section"
                className="inline-flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold px-4 py-2 rounded-xl transition-all shadow-md hover:scale-[1.02]"
              >
                <span>View Clinic Workflow</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Progress Tracker Card */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 text-indigo-600" />
              <span>Academy Progress</span>
            </h3>
            <p className="text-[11px] text-slate-400 font-semibold mt-1">
              Track viewed training sections locally in your browser.
            </p>
          </div>

          <div className="space-y-2.5">
            <div className="flex justify-between items-end">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase">
                {isMounted ? `${completedCount} of ${totalGuidesCount} read` : "0 of 9 read"}
              </span>
              <span className="text-xs font-black text-indigo-600">
                {isMounted ? `${progressPercent}%` : "0%"}
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                style={{ width: isMounted ? `${progressPercent}%` : "0%" }}
              />
            </div>
          </div>

          {/* Quick tracker ticks */}
          <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-100">
            {trainingCategories.map((cat) => {
              const completed = isMounted && isGuideCompleted(cat.id);
              return (
                <div
                  key={cat.id}
                  onClick={() => {
                    const el = document.getElementById(`guide-header-${cat.id}`);
                    if (el) {
                      setExpandedCategoryId(cat.id);
                      el.scrollIntoView({ behavior: "smooth" });
                    }
                  }}
                  className="flex items-center space-x-1.5 cursor-pointer hover:bg-slate-50/50 p-1 rounded-md transition-colors"
                >
                  <span className="text-[11px] leading-none">{completed ? "✓" : "⏳"}</span>
                  <span
                    className={`text-[10px] font-bold truncate leading-none ${
                      completed ? "text-emerald-600" : "text-slate-400 font-semibold"
                    }`}
                  >
                    {cat.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* 2. Quick Start Workflow Section */}
      <div id="workflow-section" className="space-y-4">
        <div>
          <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
            <span>🚀</span>
            <span>Quick Start Clinic Workflow</span>
          </h2>
          <p className="text-slate-400 text-xs font-semibold mt-1">
            A visual guide to the standard clinical operations inside Dental OS.
          </p>
        </div>

        {/* Mobile vertical flow vs desktop horizontal flow */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3 relative items-stretch">
          {workflowSteps.map((step, idx) => {
            return (
              <React.Fragment key={step.id}>
                {/* Step Card */}
                <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative group hover:border-indigo-150">
                  <div className="space-y-2">
                    <div className="h-6 w-6 bg-slate-900 text-white rounded-full flex items-center justify-center text-[10px] font-black">
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="text-[12px] font-bold text-slate-800 leading-tight">
                        {step.title}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-semibold mt-1 leading-normal">
                        {step.description}
                      </p>
                    </div>
                  </div>

                  {/* Connective Chevron details on mobile/desktop */}
                  {idx < workflowSteps.length - 1 && (
                    <>
                      {/* Desktop arrow right */}
                      <div className="hidden md:flex absolute -right-2.5 top-1/2 -translate-y-1/2 z-20 items-center justify-center bg-slate-50 border border-slate-100 rounded-full h-5 w-5 text-slate-400 group-hover:text-indigo-600 transition-colors shadow-sm">
                        <ArrowRight className="h-3 w-3" />
                      </div>
                      {/* Mobile arrow down */}
                      <div className="md:hidden flex my-2 justify-center text-slate-350">
                        <ArrowDown className="h-4 w-4" />
                      </div>
                    </>
                  )}
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* 3. Search Help Bar */}
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="relative flex items-center rounded-2xl bg-white border border-slate-150 shadow-sm focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-100 transition-all overflow-hidden p-1.5">
          <Search className="h-4 w-4 text-slate-400 ml-3 shrink-0" />
          <input
            type="text"
            placeholder="Search Help: guide titles, descriptions, and FAQs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full px-3 py-2 text-xs bg-transparent border-0 outline-none text-slate-700 font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="px-3 py-1.5 text-[10px] font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer shrink-0"
            >
              Clear
            </button>
          )}
        </div>

        {/* Instant Search Results Panel */}
        {searchQuery.trim() && (
          <div className="bg-white border border-slate-150 rounded-2xl shadow-md p-5 space-y-4 max-h-[400px] overflow-y-auto animate-in slide-in-from-top-2 duration-250">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Search Results
            </h3>

            {searchResults.categories.length === 0 && searchResults.faqs.length === 0 ? (
              <p className="text-xs text-slate-450 text-center py-4 font-semibold">
                No matching results found for "{searchQuery}". Try different keywords.
              </p>
            ) : (
              <div className="space-y-4 divide-y divide-slate-100">
                {/* Categorized Guides */}
                {searchResults.categories.length > 0 && (
                  <div className="space-y-2 pt-2 first:pt-0">
                    <h4 className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                      Academy Guides ({searchResults.categories.length})
                    </h4>
                    <div className="space-y-2">
                      {searchResults.categories.map(({ category, matchedTopics }) => (
                        <div
                          key={category.id}
                          className="p-2.5 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-slate-100"
                          onClick={() => handleSearchResultClick(category.id)}
                        >
                          <span className="text-xs font-extrabold text-slate-800 block">
                            {category.title}
                          </span>
                          <span className="text-[10.5px] text-slate-450 block mt-0.5 line-clamp-1">
                            {category.description}
                          </span>
                          {matchedTopics.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {matchedTopics.map((topic, i) => (
                                <span
                                  key={i}
                                  className="text-[9px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold"
                                >
                                  {topic.title}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* FAQs */}
                {searchResults.faqs.length > 0 && (
                  <div className="space-y-2 pt-3 first:pt-0">
                    <h4 className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
                      FAQs ({searchResults.faqs.length})
                    </h4>
                    <div className="space-y-2">
                      {searchResults.faqs.map((faq) => (
                        <div
                          key={faq.id}
                          className="p-2.5 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-slate-100"
                          onClick={() => handleFaqResultClick(faq.id)}
                        >
                          <span className="text-xs font-bold text-slate-850 block">
                            Q: {faq.question}
                          </span>
                          <span className="text-[10.5px] text-slate-550 block mt-0.5 leading-relaxed line-clamp-2">
                            A: {faq.answer}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. Feature Guides Section */}
      <div id="guides-section" className="space-y-4">
        <div>
          <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
            <span>📖</span>
            <span>Feature Guides & Interactive Academy</span>
          </h2>
          <p className="text-slate-400 text-xs font-semibold mt-1">
            Deep dive into configurations, workflows, and best practices. Check them off as you read.
          </p>
        </div>

        {/* Guides List */}
        <div className="space-y-3">
          {trainingCategories.map((cat) => {
            const isExpanded = expandedCategoryId === cat.id;
            const CategoryIcon = iconMap[cat.iconName] || BookOpen;
            const isCompleted = isGuideCompleted(cat.id);

            return (
              <div
                key={cat.id}
                id={`guide-header-${cat.id}`}
                className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm transition-all duration-200"
              >
                {/* Header Row */}
                <div
                  onClick={() => setExpandedCategoryId(isExpanded ? null : cat.id)}
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50/50 transition-colors select-none"
                >
                  <div className="flex items-center space-x-3.5 min-w-0">
                    <div
                      className={`h-8 w-8 rounded-xl flex items-center justify-center border transition-all ${
                        isExpanded
                          ? "bg-indigo-50 border-indigo-100 text-indigo-600"
                          : "bg-slate-50 border-slate-100 text-slate-450"
                      }`}
                    >
                      <CategoryIcon className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-xs font-extrabold text-slate-850 tracking-tight">
                          {cat.title}
                        </h3>
                        {isCompleted && (
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[8.5px] font-black px-1.5 py-0.25 rounded-full uppercase tracking-wider">
                            Read
                          </span>
                        )}
                      </div>
                      <p className="text-[10.5px] text-slate-450 mt-0.5 truncate max-w-sm sm:max-w-xl font-medium">
                        {cat.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0">
                    {/* Mark read button in header for convenience */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleGuideProgress(cat.id);
                      }}
                      className={`p-1.5 rounded-lg border transition-all ${
                        isCompleted
                          ? "bg-emerald-50 border-emerald-100 text-emerald-600"
                          : "bg-slate-50 border-slate-150 text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                      }`}
                      title={isCompleted ? "Mark as Uncompleted" : "Mark as Completed"}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <ChevronDown
                      className={`h-4 w-4 text-slate-450 transition-transform duration-200 ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </div>

                {/* Expanded guide body */}
                {isExpanded && (
                  <div className="border-t border-slate-100 p-5 bg-slate-50/20 space-y-6 animate-in slide-in-from-top-1.5 duration-200">
                    {cat.topics.map((topic, tIdx) => (
                      <TopicItem key={tIdx} topic={topic} />
                    ))}

                    {/* Checkbox item at bottom of category */}
                    <div className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-xl">
                      <span className="text-[10.5px] font-bold text-slate-500">
                        Finished reading the {cat.title} section?
                      </span>
                      <button
                        onClick={() => toggleGuideProgress(cat.id)}
                        className={`inline-flex items-center space-x-1.5 text-[11px] font-bold px-3.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                          isCompleted
                            ? "bg-emerald-600 hover:bg-emerald-700 border-transparent text-white shadow-sm"
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <Check className="h-3.5 w-3.5 shrink-0" />
                        <span>{isCompleted ? "Completed ✓" : "Mark as Completed"}</span>
                      </button>
                    </div>

                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. FAQ Section */}
      <div id="faq-section" className="space-y-4">
        <div>
          <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
            <HelpCircle className="h-4.5 w-4.5 text-indigo-600" />
            <span>Frequently Asked Questions</span>
          </h2>
          <p className="text-slate-400 text-xs font-semibold mt-1">
            Quick answers to common procedural and configuration questions.
          </p>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl divide-y divide-slate-100 overflow-hidden shadow-sm">
          {faqs.map((faq) => {
            const isFaqExpanded = expandedFaqId === faq.id;
            return (
              <div key={faq.id} className="transition-colors">
                <button
                  onClick={() => setExpandedFaqId(isFaqExpanded ? null : faq.id)}
                  className="w-full text-left p-4 hover:bg-slate-50/50 flex items-center justify-between font-bold text-xs text-slate-800 focus:outline-none select-none"
                >
                  <span className="pr-4 leading-normal">{faq.question}</span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
                      isFaqExpanded ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isFaqExpanded && (
                  <div className="p-4 bg-slate-50/30 border-t border-slate-100 text-[11px] text-slate-600 font-semibold leading-relaxed animate-in fade-in duration-150">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. Support / Help Center Callout Section */}
      <div className="bg-indigo-50/50 border border-indigo-100 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <h3 className="text-sm font-extrabold text-indigo-950 flex items-center justify-center md:justify-start space-x-2">
            <span>📞</span>
            <span>Still Need Assistance?</span>
          </h3>
          <p className="text-indigo-900 text-xs font-semibold leading-relaxed max-w-lg">
            Our support desk is operational Monday through Saturday. If you are experiencing technical difficulties, database access issues, or want to schedule a live video demonstration with our training coordinators, feel free to contact us.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
          <a
            href="mailto:support@dentalos.com"
            className="flex-1 text-center bg-indigo-700 hover:bg-indigo-750 text-white text-[11px] font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer whitespace-nowrap"
          >
            Email Support
          </a>
          <a
            href="tel:+18005553368"
            className="flex-1 text-center bg-white hover:bg-slate-50 border border-indigo-150 text-indigo-750 text-[11px] font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer whitespace-nowrap"
          >
            Call 1-800-DENTAL
          </a>
        </div>
      </div>

    </div>
  );
}
