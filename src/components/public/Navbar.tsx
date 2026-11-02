"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Phone, Calendar, Clock } from "lucide-react";

interface NavbarProps {
  clinic?: any;
}

export default function Navbar({ clinic }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "About Clinic", href: "/about" },
    { name: "Treatments", href: "/treatments" },
    { name: "Gallery", href: "/gallery" },
    { name: "FAQs", href: "/#faqs" },
    { name: "Contact", href: "/contact" },
  ];

  const clinicName = clinic?.name || "Anil Sharma Dental Hospital";
  const alternateName = clinic?.alternateName || "A.K. Sharma Dental Hospital";
  const phone = clinic?.phone || "+91 (Contact Number Pending)";

  return (
    <>
      {/* Top micro-announcement banner for emergency & appointment policy */}
      <div className="bg-[#102C46] text-white text-xs py-2 px-4 border-b border-[#1A3E61]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-slate-300">
            <Clock className="w-3.5 h-3.5 text-[#16A6A1]" />
            <span>Consultations by Prior Appointment • Mon–Sat: 10AM–2PM & 5PM–8:30PM</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden md:inline text-slate-400 text-[11px]">
              Signboard verified: {alternateName}
            </span>
            <a
              href={`tel:${phone}`}
              className="inline-flex items-center gap-1.5 text-white hover:text-[#16A6A1] transition font-medium"
            >
              <Phone className="w-3.5 h-3.5 text-[#16A6A1]" />
              <span>{phone}</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main sticky navigation bar */}
      <header
        className={`sticky top-0 z-50 transition-all duration-200 ${
          scrolled
            ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-200 py-3"
            : "bg-white border-b border-slate-100 py-4"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Logo & Brand title */}
          <Link href="/" className="flex items-center gap-3 group focus-visible:outline-none">
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-gradient-to-br from-[#102C46] to-[#16A6A1] text-white flex items-center justify-center font-bold text-xl shadow-sm group-hover:scale-105 transition-transform">
              <span className="text-xl">🦷</span>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base sm:text-lg text-[#102C46] leading-tight tracking-tight">
                {clinicName}
              </span>
              <span className="text-[11px] text-[#64748B] font-medium tracking-wide">
                Healthcare & Multi-Speciality Dental Hospital
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`text-sm font-semibold transition-colors duration-150 py-1 border-b-2 ${
                    isActive
                      ? "text-[#16A6A1] border-[#16A6A1]"
                      : "text-[#172B3A] border-transparent hover:text-[#16A6A1]"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Action CTAs */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              href="/admin/login"
              className="text-xs font-semibold text-[#64748B] hover:text-[#102C46] px-3 py-2 rounded-lg hover:bg-slate-50 transition"
            >
              Staff Portal
            </Link>
            <Link
              href="/booking"
              className="inline-flex items-center gap-2 bg-[#16A6A1] hover:bg-[#128884] text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-sm hover:shadow transition-all transform active:scale-95"
            >
              <Calendar className="w-4 h-4" />
              <span>Request Appointment</span>
            </Link>
          </div>

          {/* Mobile hamburger button */}
          <div className="flex lg:hidden items-center gap-2">
            <Link
              href="/booking"
              className="inline-flex items-center gap-1.5 bg-[#16A6A1] text-white text-xs font-bold px-3 py-2 rounded-lg shadow-sm"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Book</span>
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-700 hover:text-[#102C46] hover:bg-slate-100 rounded-lg focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-x-0 top-[calc(100%+1px)] bg-white border-b border-slate-200 shadow-xl px-6 py-6 space-y-4 animate-in slide-in-from-top-2 duration-150">
            <div className="flex flex-col space-y-3">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-base font-semibold py-2 border-b border-slate-100 ${
                    pathname === link.href ? "text-[#16A6A1]" : "text-[#172B3A]"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>

            <div className="pt-2 flex flex-col gap-3">
              <Link
                href="/booking"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 bg-[#16A6A1] text-white font-bold py-3 rounded-xl shadow-sm"
              >
                <Calendar className="w-4 h-4" />
                <span>Request Appointment</span>
              </Link>
              <div className="flex items-center justify-between text-xs text-[#64748B] pt-2">
                <Link
                  href="/admin/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="font-medium hover:text-[#102C46]"
                >
                  Staff Login
                </Link>
                <span>{clinicName}</span>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
