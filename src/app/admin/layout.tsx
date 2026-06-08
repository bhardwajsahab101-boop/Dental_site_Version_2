"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Sidebar from "../../components/admin/Sidebar";
import Topbar from "../../components/admin/Topbar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isPublicPage =
    pathname === "/admin/login" ||
    pathname === "/admin/login/";

  const [authorized, setAuthorized] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (isPublicPage) {
      setAuthorized(true);
      setLoading(false);
      return;
    }

    async function checkAuth() {
      try {
        const res = await fetch("/api/admin/me");
        const data = await res.json();
        if (data.success) {
          setAuthorized(true);
        } else {
          // Clear any stale tokens and redirect to login
          await fetch("/api/admin/logout", { method: "POST" }).catch(() => {});
          window.location.href = "/admin/login";
        }
      } catch (err) {
        console.error("Auth check failed in layout:", err);
        window.location.href = "/admin/login";
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, [pathname, isPublicPage]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
          <p className="text-slate-400 text-[11px] font-semibold">Verifying session...</p>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  if (isPublicPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Panel */}
        <Topbar />

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          <div className="max-w-6xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
