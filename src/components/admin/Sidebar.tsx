"use client";

import React, { useState, useEffect } from "react";
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
  Settings,
  Users,
  Coins,
  GraduationCap
} from "lucide-react";
import { hasPageAccess } from "../../lib/permissions";

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/admin/me");
        const data = await res.json();
        if (data.success) {
          setUser(data.user);
        }
      } catch (err) {
        console.error("Failed to fetch user context in sidebar:", err);
      }
    }
    fetchUser();
  }, []);

  const role = user?.role || "receptionist";
  const userName = user?.name || "Clinic Staff";
  const userInitials = userName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "AD";

  const navigation = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Appointments", href: "/admin/appointments", icon: Calendar },
    { name: "Calendar", href: "/admin/calendar", icon: Calendar },
    { name: "Finance", href: "/admin/finance", icon: Coins },
    { name: "Analytics", href: "/admin/analytics", icon: TrendingUp },
    { name: "Messages", href: "/admin/messages", icon: Activity },
    { name: "Patients", href: "/admin/patients", icon: LogOut },
    { name: "Staff Management", href: "/admin/users", icon: Users },
    { name: "Settings", href: "/admin/settings", icon: Settings },
    { name: "Register Clinic", href: "/admin/register", icon: Settings }
  ];

  // Filter navigation items by page access rules based on user role
  const filteredNavigation = navigation.filter((item) => hasPageAccess(role, item.href));

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
        
        // Dynamically resolve central root domain for redirection
        const currentHost = window.location.host;
        const protocol = window.location.protocol;
        
        if (currentHost.includes("lvh.me")) {
          const port = currentHost.split(":")[1] || "3000";
          window.location.href = `${protocol}//localhost:${port}/admin/login`;
        } else if (currentHost.includes("launchstack.in")) {
          const parts = currentHost.split(".");
          let mainDomain = "launchstack.in";
          if (parts.length > 2) {
            mainDomain = parts.slice(parts.length - 2).join(".");
          }
          window.location.href = `${protocol}//${mainDomain}/admin/login`;
        } else {
          window.location.href = "/admin/login";
        }
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
            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">🦷</span>
                  <span className="text-[14px] font-semibold text-slate-955 tracking-tight">
                    Dental Clinic
                  </span>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-955 focus:outline-none"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="space-y-1">
                {filteredNavigation.map((item) => {
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

              <div className="flex-1" />

              {hasPageAccess(role, "/admin/academy") && (
                <Link
                  href="/admin/academy"
                  onClick={() => setIsOpen(false)}
                  className={`group relative flex flex-col items-start p-3 bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-950 text-white rounded-xl shadow-sm border border-slate-800 transition-all hover:scale-[1.02] cursor-pointer mb-4 ${
                    isActive("/admin/academy") ? "ring-2 ring-indigo-500 ring-offset-2 ring-offset-white" : ""
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <GraduationCap className="h-4 w-4 text-indigo-400 shrink-0" />
                    <span className="text-[11.5px] font-extrabold tracking-tight">Dental OS Academy</span>
                  </div>
                  <p className="text-[9px] text-slate-400 mt-1 font-semibold leading-normal">
                    Self-guided training & interactive guides.
                  </p>
                  <span className="absolute right-2.5 bottom-2.5 opacity-0 group-hover:opacity-100 transition-all text-indigo-400 group-hover:translate-x-0.5">
                    ➔
                  </span>
                </Link>
              )}
            </div>

            <div className="border-t border-slate-50 pt-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-6.5 w-6.5 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-semibold text-[10px]">
                  {userInitials}
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-800 leading-none truncate max-w-[120px]">
                    {userName}
                  </p>
                  <span className="text-[9px] text-slate-400 capitalize">{role} Portal</span>
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
        <div className="flex-1 flex flex-col">
          {/* Logo / Brand */}
          <div className="flex items-center space-x-2 px-1 mb-8 mt-1">
            <span className="text-xl">🦷</span>
            <span className="text-[14px] font-bold text-slate-955 tracking-tight">
              Clinic Portal
            </span>
          </div>

          {/* Nav links */}
          <nav className="space-y-0.5">
            {filteredNavigation.map((item) => {
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

          <div className="flex-1" />

          {hasPageAccess(role, "/admin/academy") && (
            <Link
              href="/admin/academy"
              className={`group relative flex flex-col items-start p-3 bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-950 text-white rounded-xl shadow-sm border border-slate-800 transition-all hover:scale-[1.02] cursor-pointer mb-4 ${
                isActive("/admin/academy") ? "ring-2 ring-indigo-500 ring-offset-2 ring-offset-white" : ""
              }`}
            >
              <div className="flex items-center space-x-2">
                <GraduationCap className="h-4 w-4 text-indigo-400 shrink-0" />
                <span className="text-[11.5px] font-extrabold tracking-tight">Dental OS Academy</span>
              </div>
              <p className="text-[9px] text-slate-400 mt-1 font-semibold leading-normal">
                Self-guided training & interactive guides.
              </p>
              <span className="absolute right-2.5 bottom-2.5 opacity-0 group-hover:opacity-100 transition-all text-indigo-400 group-hover:translate-x-0.5">
                ➔
              </span>
            </Link>
          )}
        </div>

        {/* Footer profile area with Logout button */}
        <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
          <div className="flex items-center space-x-2 min-w-0">
            <div className="h-7 w-7 bg-slate-100 rounded-full flex items-center justify-center text-slate-705 font-semibold text-[11px] border border-slate-200/50 shrink-0">
              {userInitials}
            </div>
            <div className="overflow-hidden min-w-0">
              <p className="text-[11px] font-semibold text-slate-850 truncate leading-none" title={userName}>
                {userName}
              </p>
              <span className="text-[9px] text-slate-400 font-medium capitalize mt-0.5 block">{role} Portal</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Log Out"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50/50 rounded-lg transition-all focus:outline-none shrink-0"
          >
            <LogOut className="h-4 w-4 shrink-0" />
          </button>
        </div>
      </aside>
    </>
  );
}
