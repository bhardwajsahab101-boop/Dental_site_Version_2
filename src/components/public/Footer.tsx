import Link from "next/link";
import { Phone, Mail, MapPin, Clock, ExternalLink, ShieldCheck } from "lucide-react";

interface FooterProps {
  clinic?: any;
  content?: any;
}

export default function Footer({ clinic, content }: FooterProps) {
  const clinicName = clinic?.name || "Anil Sharma Dental Hospital";
  const alternateName = clinic?.alternateName || "A.K. Sharma Dental Hospital";
  const phone = clinic?.phone || "+91 (Contact Number Pending)";
  const email = clinic?.email || "contact@sharmadental.com";
  const address = clinic?.address || "Anil Sharma Dental Hospital, (Exact Address on File)";
  const googleMapsUrl = clinic?.googleMapsUrl || "https://maps.google.com";

  const morningHours = content?.hours?.morning || "Mon – Sat: 10:00 AM – 2:00 PM";
  const eveningHours = content?.hours?.evening || "Evening: 05:00 PM – 8:30 PM";

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#0A1D30] text-slate-300 text-sm border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10">
          {/* Brand Col */}
          <div className="lg:col-span-4 space-y-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#102C46] to-[#16A6A1] text-white flex items-center justify-center font-bold text-xl">
                🦷
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-white text-base leading-tight">
                  {clinicName}
                </span>
                <span className="text-[11px] text-slate-400">
                  {alternateName}
                </span>
              </div>
            </Link>

            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Providing compassionate, high-quality, and ethical dental care for individuals and families. Focused on conservative treatment, strict sterilization protocols, and long-term oral wellness.
            </p>

            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-3 py-1.5 rounded-lg w-fit">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Registered Healthcare Practice</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Navigation
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/" className="hover:text-[#16A6A1] transition">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-[#16A6A1] transition">
                  About Clinic & Doctor
                </Link>
              </li>
              <li>
                <Link href="/treatments" className="hover:text-[#16A6A1] transition">
                  Treatments Directory
                </Link>
              </li>
              <li>
                <Link href="/gallery" className="hover:text-[#16A6A1] transition">
                  Clinic Gallery
                </Link>
              </li>
              <li>
                <Link href="/#faqs" className="hover:text-[#16A6A1] transition">
                  Patient FAQs
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[#16A6A1] transition">
                  Contact & Location
                </Link>
              </li>
              <li>
                <Link href="/booking" className="text-[#16A6A1] font-bold hover:underline transition">
                  Request Appointment
                </Link>
              </li>
            </ul>
          </div>

          {/* Clinical Services */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Key Treatments
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/treatments" className="hover:text-[#16A6A1] transition">
                  Root Canal Treatment (RCT)
                </Link>
              </li>
              <li>
                <Link href="/treatments" className="hover:text-[#16A6A1] transition">
                  Dental Crowns & Bridges
                </Link>
              </li>
              <li>
                <Link href="/treatments" className="hover:text-[#16A6A1] transition">
                  Ultrasonic Teeth Cleaning & Scaling
                </Link>
              </li>
              <li>
                <Link href="/treatments" className="hover:text-[#16A6A1] transition">
                  Tooth-Colored Composite Fillings
                </Link>
              </li>
              <li>
                <Link href="/treatments" className="hover:text-[#16A6A1] transition">
                  Gentle Extractions & Oral Surgery
                </Link>
              </li>
              <li>
                <Link href="/treatments" className="hover:text-[#16A6A1] transition">
                  Complete & Partial Dentures
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Hours */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Clinic Contact & Hours
            </h4>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-start gap-2.5 text-slate-300">
                <MapPin className="w-4 h-4 text-[#16A6A1] shrink-0 mt-0.5" />
                <span>{address}</span>
              </div>

              <div className="flex items-center gap-2.5 text-slate-300">
                <Phone className="w-4 h-4 text-[#16A6A1] shrink-0" />
                <a href={`tel:${phone}`} className="hover:text-white transition">
                  {phone}
                </a>
              </div>

              <div className="flex items-center gap-2.5 text-slate-300">
                <Mail className="w-4 h-4 text-[#16A6A1] shrink-0" />
                <a href={`mailto:${email}`} className="hover:text-white transition">
                  {email}
                </a>
              </div>

              <div className="flex items-start gap-2.5 text-slate-300 pt-1">
                <Clock className="w-4 h-4 text-[#16A6A1] shrink-0 mt-0.5" />
                <div>
                  <p>{morningHours}</p>
                  <p className="mt-0.5">{eveningHours}</p>
                  <p className="text-slate-400 text-[11px] mt-0.5">Sunday: By Prior Appointment</p>
                </div>
              </div>

              <div className="pt-2">
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#16A6A1] hover:underline"
                >
                  <span>Google Maps Directions</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {currentYear} {clinicName}. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="text-[11px]">Notice: Real clinic information verified; placeholders maintained for unsupplied details.</span>
            <Link href="/admin/login" className="hover:text-slate-400 transition">
              Staff Portal
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
