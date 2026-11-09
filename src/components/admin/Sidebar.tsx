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
  LogOut,
  TrendingUp,
  Settings,
  Users,
  Coins,
  GraduationCap,
  CreditCard,
  Globe,
  Image as ImageIcon,
  MessageSquare,
  ScanLine,
  Sparkles,
  CalendarDays,
  Building2,
  ChevronRight
} from "lucide-react";
import { hasPageAccess } from "../../lib/permissions";

const MedicalLogoIcon = () => (
  <div className="relative flex items-center justify-center h-8 w-8 rounded-xl bg-[#14213D] text-[#14B8A6] shadow-xs">
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C8.5 2 6 4.5 6 8.5C6 11.5 7.5 13 8 14C8.5 15 8.5 17 8.5 19C8.5 20.5 9.5 21.5 11 21.5C12 21.5 12 20.5 12 19.5C12 20.5 12 21.5 13 21.5C14.5 21.5 15.5 20.5 15.5 19C15.5 17 15.5 15 16 14C16.5 13 18 11.5 18 8.5C18 4.5 15.5 2 12 2Z" fill="currentColor" fillOpacity="0.18" />
    </svg>
    <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[#14B8A6] border-2 border-white" />
  </div>
);

type NavItem = {
  name: string;
  href: string;
  icon: any;
  badge?: string;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

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
    .slice(0, 2) || "DS";

  const navigationGroups: NavGroup[] = [
    {
      label: "Clinical Core",
      items: [
        { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
        { name: "AI Register Scanner", href: "/admin/patient-scanner", icon: ScanLine, badge: "AI" },
        { name: "Patients", href: "/admin/patients", icon: Users },
        { name: "Appointments", href: "/admin/appointments", icon: Calendar },
        { name: "Calendar", href: "/admin/calendar", icon: CalendarDays },
      ],
    },
    {
      label: "Practice & Growth",
      items: [
        { name: "Finance & Billing", href: "/admin/finance", icon: Coins },
        { name: "Analytics", href: "/admin/analytics", icon: TrendingUp },
        { name: "Enquiries & Messages", href: "/admin/messages", icon: MessageSquare },
        { name: "Website CMS", href: "/admin/content", icon: Globe },
        { name: "Clinic Gallery", href: "/admin/gallery", icon: ImageIcon },
      ],
    },
    {
      label: "System & Admin",
      items: [
        { name: "Staff Management", href: "/admin/users", icon: Users },
        { name: "Settings", href: "/admin/settings", icon: Settings },
        { name: "Subscriptions", href: "/admin/subscriptions", icon: CreditCard },
        { name: "Register Clinic", href: "/admin/register", icon: Building2 },
      ],
    },
  ];

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin";
    }
    return pathname.startsWith(href);
  };

  const navClasses = (href: string) => {
    const active = isActive(href);
    if (active) {
      return "flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold bg-[#14213D] text-white shadow-xs transition-all duration-150 group";
    }
    return "flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-[#64748B] hover:text-[#182230] hover:bg-slate-100/70 transition-all duration-150 group";
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

  const renderNavGroup = (group: NavGroup, isMobile = false) => {
    const accessibleItems = group.items.filter((item) => hasPageAccess(role, item.href));
    if (accessibleItems.length === 0) return null;

    return (
      <div key={group.label} className="space-y-1">
        <p className="px-3 pt-3 pb-1 text-[10px] font-bold tracking-wider text-[#64748B]/80 uppercase">
          {group.label}
        </p>
        <div className="space-y-0.5">
          {accessibleItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => isMobile && setIsOpen(false)}
                className={navClasses(item.href)}
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <Icon
                    className={`h-4 w-4 shrink-0 transition-colors ${
                      active ? "text-[#14B8A6]" : "text-[#64748B] group-hover:text-[#182230]"
                    }`}
                  />
                  <span className="truncate">{item.name}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[9px] font-black tracking-widest px-1.5 py-0.5 rounded uppercase ${
                      active
                        ? "bg-[#14B8A6] text-white"
                        : "bg-[#CCFBF1] text-[#0D9488]"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between px-4 h-14 bg-white border-b border-[#E2E8F0] sticky top-0 z-40 w-full shrink-0">
        <div className="flex items-center space-x-2.5">
          <MedicalLogoIcon />
          <div>
            <span className="text-sm font-bold text-[#14213D] tracking-tight block leading-tight">
              DentalOS
            </span>
            <span className="text-[9px] font-semibold text-[#64748B] uppercase tracking-wider block">
              Clinic Operations
            </span>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 text-[#64748B] hover:text-[#14213D] hover:bg-slate-100 rounded-lg focus:outline-none transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* Mobile Overlay & Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-[#14213D]/40 backdrop-blur-[2px] transition-opacity"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed top-0 bottom-0 left-0 w-72 max-w-[85vw] bg-white border-r border-[#E2E8F0] p-4 flex flex-col justify-between shadow-2xl z-50 overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2.5">
                  <MedicalLogoIcon />
                  <div>
                    <span className="text-sm font-bold text-[#14213D] tracking-tight block leading-tight">
                      DentalOS
                    </span>
                    <span className="text-[9px] font-semibold text-[#64748B] uppercase tracking-wider block">
                      Clinic Portal
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-[#64748B] hover:text-[#14213D] hover:bg-slate-100 rounded-lg focus:outline-none"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="space-y-1">
                {navigationGroups.map((group) => renderNavGroup(group, true))}
              </nav>

              {hasPageAccess(role, "/admin/academy") && (
                <Link
                  href="/admin/academy"
                  onClick={() => setIsOpen(false)}
                  className={`group relative flex flex-col items-start p-3 bg-[#14213D] text-white rounded-xl shadow-xs border border-[#1D2D52] transition-all hover:border-[#14B8A6] cursor-pointer mt-4 ${
                    isActive("/admin/academy") ? "ring-2 ring-[#14B8A6]" : ""
                  }`}
                >
                  <div className="flex items-center space-x-2 text-[#14B8A6]">
                    <GraduationCap className="h-4 w-4 shrink-0" />
                    <span className="text-xs font-bold tracking-tight text-white">DentalOS Academy</span>
                  </div>
                  <p className="text-[10px] text-slate-300 mt-1 font-medium leading-normal">
                    Self-guided operational training & protocols.
                  </p>
                </Link>
              )}
            </div>

            <div className="border-t border-[#E2E8F0] pt-4 mt-6 flex items-center justify-between">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="h-8 w-8 bg-[#14213D] text-[#14B8A6] rounded-full flex items-center justify-center font-bold text-xs shrink-0">
                  {userInitials}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#182230] leading-tight truncate">
                    {userName}
                  </p>
                  <span className="text-[10px] text-[#64748B] font-medium capitalize block truncate">
                    {role} • Dental Clinic
                  </span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-[#64748B] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors focus:outline-none shrink-0"
                title="Log Out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Permanent Sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col justify-between border-r border-[#E2E8F0] bg-white p-4 h-screen sticky top-0 overflow-hidden shadow-xs">
        <div className="flex-1 flex flex-col min-h-0">
          {/* Logo / Brand Header */}
          <div className="flex items-center space-x-3 px-2 py-2 mb-2">
            <MedicalLogoIcon />
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-base font-extrabold text-[#14213D] tracking-tight">
                  DentalOS
                </span>
                <span className="text-[9px] font-bold bg-[#CCFBF1] text-[#0D9488] px-1.5 py-0.25 rounded">
                  PRO
                </span>
              </div>
              <span className="text-[9.5px] font-semibold text-[#64748B] uppercase tracking-wider block">
                Healthcare Suite
              </span>
            </div>
          </div>

          {/* Grouped Nav links */}
          <div className="flex-1 overflow-y-auto pr-1 -mr-1 space-y-1">
            {navigationGroups.map((group) => renderNavGroup(group))}

            {hasPageAccess(role, "/admin/academy") && (
              <div className="pt-3 px-1">
                <Link
                  href="/admin/academy"
                  className={`group relative flex flex-col items-start p-3 bg-[#14213D] text-white rounded-xl shadow-xs border border-[#1D2D52] transition-all hover:border-[#14B8A6] cursor-pointer ${
                    isActive("/admin/academy") ? "ring-2 ring-[#14B8A6]" : ""
                  }`}
                >
                  <div className="flex items-center space-x-2 text-[#14B8A6]">
                    <GraduationCap className="h-4 w-4 shrink-0" />
                    <span className="text-xs font-bold tracking-tight text-white">DentalOS Academy</span>
                  </div>
                  <p className="text-[10px] text-slate-300 mt-1 font-medium leading-normal">
                    Self-guided training & interactive guides.
                  </p>
                  <ChevronRight className="h-3.5 w-3.5 text-[#14B8A6] absolute right-2.5 bottom-2.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Footer Profile Area */}
        <div className="border-t border-[#E2E8F0] pt-3 mt-2 flex items-center justify-between">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="h-8 w-8 bg-[#14213D] text-[#14B8A6] rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
              {userInitials}
            </div>
            <div className="overflow-hidden min-w-0">
              <p className="text-xs font-bold text-[#182230] truncate leading-tight" title={userName}>
                {userName}
              </p>
              <span className="text-[10px] text-[#64748B] font-semibold capitalize block truncate">
                {role} Portal
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Log Out"
            className="p-1.5 text-[#64748B] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors focus:outline-none shrink-0"
          >
            <LogOut className="h-4 w-4 shrink-0" />
          </button>
        </div>
      </aside>
    </>
  );
}
