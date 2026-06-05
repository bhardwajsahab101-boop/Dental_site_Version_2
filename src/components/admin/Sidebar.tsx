"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import toast from "react-hot-toast";
import {
  LayoutDashboard,
  Calendar,
  Menu,
  X,
  Activity,
  LogOut,
  TrendingUp,
  Settings
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const navigation = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Appointments", href: "/admin/appointments", icon: Calendar },
    { name: "Calendar", href: "/admin/calendar", icon: Calendar },
    { name: "Analytics", href: "/admin/analytics", icon: TrendingUp },
    { name: "Messages", href: "/admin/messages", icon: Activity },
    { name: "Patients", href: "/admin/patients", icon: LogOut },
    { name: "Settings", href: "/admin/settings", icon: Settings }
  ];

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin";
    }
    return pathname.startsWith(href);
  };

  const navClasses = (href: string) => {
    const base =
      "flex items-center space-x-2.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-150";
    if (isActive(href)) {
      return `${base} bg-slate-900 text-white shadow-sm`;
    }
    return `${base} text-slate-600 hover:text-slate-900 hover:bg-slate-50`;
  };

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/admin/logout", {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Logged out successfully");
        window.location.href = "/admin/login";
      } else {
        throw new Error(data.message || "Failed to log out");
      }
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Logout failed");
    }
  };

  return (
    <>
      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between px-4 h-12 bg-white border-b border-slate-100 sticky top-0 z-40 w-full shrink-0">
        <div className="flex items-center space-x-2">
          <span className="text-xl">🦷</span>
          <span className="text-[14px] font-semibold text-slate-900 tracking-tight">
            Clinic Admin
          </span>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="p-1 text-slate-500 hover:text-slate-950 focus:outline-none"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* Mobile Overlay & Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-[2px]"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed top-0 bottom-0 left-0 w-64 max-w-[80vw] bg-white border-r border-slate-100 p-5 flex flex-col justify-between shadow-xl">
            <div>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">🦷</span>
                  <span className="text-[14px] font-semibold text-slate-950 tracking-tight">
                    Dental Clinic
                  </span>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-950 focus:outline-none"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="space-y-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={navClasses(item.href)}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="border-t border-slate-50 pt-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-6.5 w-6.5 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-semibold text-[10px]">
                  AD
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-800 leading-none">
                    Receptionist
                  </p>
                  <span className="text-[9px] text-slate-400">Admin Account</span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="inline-flex items-center space-x-1 text-slate-400 hover:text-rose-600 font-semibold text-[10.5px] transition-colors focus:outline-none"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Exit</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Permanent Sidebar */}
      <aside className="hidden md:flex w-56 shrink-0 flex-col justify-between border-r border-slate-100 bg-white p-4 h-screen sticky top-0">
        <div>
          {/* Logo / Brand */}
          <div className="flex items-center space-x-2 px-1 mb-8 mt-1">
            <span className="text-xl">🦷</span>
            <span className="text-[14px] font-bold text-slate-950 tracking-tight">
              Clinic Portal
            </span>
          </div>

          {/* Nav links */}
          <nav className="space-y-0.5">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={navClasses(item.href)}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer profile area with Logout button */}
        <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-7 w-7 bg-slate-100 rounded-full flex items-center justify-center text-slate-700 font-semibold text-[11px] border border-slate-200/50">
              AD
            </div>
            <div className="overflow-hidden">
              <p className="text-[11px] font-semibold text-slate-850 truncate leading-none">
                Receptionist
              </p>
              <span className="text-[9px] text-slate-400 font-medium">Dental Office</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Log Out"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50/50 rounded-lg transition-all focus:outline-none"
          >
            <LogOut className="h-4 w-4 shrink-0" />
          </button>
        </div>
      </aside>
    </>
  );
}
