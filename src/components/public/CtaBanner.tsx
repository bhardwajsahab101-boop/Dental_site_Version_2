import Link from "next/link";
import { Calendar, Phone, MessageSquare, Clock, MapPin } from "lucide-react";

interface CtaBannerProps {
  clinic?: any;
}

export default function CtaBanner({ clinic }: CtaBannerProps) {
  const clinicName = clinic?.name || "Anil Sharma Dental Hospital";
  const phone = clinic?.phone || "+91 (Contact Number Pending)";
  const whatsappPhone = clinic?.whatsappPhone || clinic?.phone || "+91 (Contact Number Pending)";
  const cleanPhone = phone.replace(/[^\d+]/g, "");
  const cleanWhatsApp = whatsappPhone.replace(/[^\d+]/g, "");

  return (
    <section className="relative overflow-hidden bg-[#102C46] py-16 sm:py-20 text-white">
      {/* Decorative ambient elements */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -bottom-24 h-96 w-96 rounded-full bg-[#16A6A1]/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#0A1D30]/80 border border-white/10 rounded-3xl p-8 sm:p-12 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[#16A6A1] bg-white/10 px-3 py-1 rounded-full">
                Schedule Your Consultation
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight">
                Prioritize Your Oral Health with Dedicated, Gentle Dental Care
              </h2>
              <p className="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
                Whether you need a routine checkup at {clinicName}, relief from acute toothache, or restorative crowns, our clinic team is here to assist you with care and professionalism.
              </p>

              <div className="flex flex-wrap items-center gap-6 pt-2 text-xs text-slate-300">
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#16A6A1]" />
                  <span>Mon–Sat: 10AM–2PM & 5PM–8:30PM</span>
                </span>
                <span className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#16A6A1]" />
                  <span>Verified Clinic Location</span>
                </span>
              </div>
            </div>

            {/* Right Action Buttons */}
            <div className="lg:col-span-5 flex flex-col sm:flex-row lg:flex-col gap-3.5 lg:justify-end">
              <Link
                href="/booking"
                className="w-full inline-flex items-center justify-center gap-2.5 bg-[#16A6A1] hover:bg-[#128884] text-white font-bold text-sm px-6 py-3.5 rounded-xl shadow-lg transition active:scale-98"
              >
                <Calendar className="w-4 h-4" />
                <span>Request Appointment Online</span>
              </Link>

              <a
                href={`tel:${cleanPhone || phone}`}
                className="w-full inline-flex items-center justify-center gap-2.5 bg-white/10 hover:bg-white/15 text-white font-semibold text-sm px-6 py-3.5 rounded-xl border border-white/15 transition"
              >
                <Phone className="w-4 h-4 text-[#16A6A1]" />
                <span>Call Clinic Reception</span>
              </a>

              <a
                href={`https://wa.me/${cleanWhatsApp.replace(/\+/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2.5 bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] border border-[#25D366]/30 font-semibold text-sm px-6 py-3.5 rounded-xl transition"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Quick Connect on WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
