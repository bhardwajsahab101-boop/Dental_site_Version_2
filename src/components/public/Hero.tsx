import Link from "next/link";
import { Calendar, ArrowRight, ShieldCheck, HeartHandshake, Sparkles, Phone } from "lucide-react";

interface HeroProps {
  clinic?: any;
  content?: any;
}

export default function Hero({ clinic, content }: HeroProps) {
  const clinicName = clinic?.name || "Anil Sharma Dental Hospital";
  const alternateName = clinic?.alternateName || "A.K. Sharma Dental Hospital";
  const phone = clinic?.phone || "+91 (Contact Number Pending)";

  const heroBadge =
    content?.hero?.badge || `${clinicName} • Patient-Centered Care`;
  const headline =
    content?.hero?.headline ||
    "Gentle, Professional Dental Care for Confident, Healthy Smiles";
  const subheadline =
    content?.hero?.subheadline ||
    "Experience comprehensive oral healthcare in a clean, welcoming environment. From preventive checkups to advanced restorations, our dedicated team prioritizes your comfort.";
  const ctaPrimary = content?.hero?.ctaPrimaryText || "Request Appointment";
  const ctaSecondary = content?.hero?.ctaSecondaryText || "Explore Treatments";
  const noticeBadge =
    content?.hero?.noticeBadge ||
    "Accepting new patient requests • Consultations by appointment";

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#F0F8F8] via-[#F8FAFC] to-white pt-10 pb-16 lg:pt-16 lg:pb-24 border-b border-slate-100">
      {/* Decorative ambient background glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-[#16A6A1]/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-20 right-0 h-96 w-96 rounded-full bg-[#102C46]/5 blur-3xl"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Value Proposition & Actions */}
          <div className="lg:col-span-7 space-y-6">
            {/* Trust badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#16A6A1]/30 shadow-xs">
              <span className="flex h-2 w-2 rounded-full bg-[#16A6A1] animate-pulse" />
              <span className="text-xs font-semibold text-[#102C46]">
                {heroBadge}
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#102C46] leading-[1.15] tracking-tight">
              {headline}
            </h1>

            {/* Sub-headline description */}
            <p className="text-base sm:text-lg text-[#64748B] leading-relaxed max-w-2xl font-normal">
              {subheadline}
            </p>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="/booking"
                className="inline-flex items-center justify-center gap-2.5 bg-[#16A6A1] hover:bg-[#128884] text-white font-bold text-base px-7 py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all transform active:scale-98"
              >
                <Calendar className="w-5 h-5" />
                <span>{ctaPrimary}</span>
              </Link>

              <Link
                href="/treatments"
                className="inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-[#102C46] font-semibold text-base px-6 py-3.5 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all"
              >
                <span>{ctaSecondary}</span>
                <ArrowRight className="w-4 h-4 text-[#16A6A1]" />
              </Link>
            </div>

            {/* Verified Trust Pillars (Truthful clinical standards - NOT fake stats) */}
            <div className="pt-6 border-t border-slate-200/80">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-start gap-3 bg-white p-3.5 rounded-xl border border-slate-100 shadow-xs">
                  <div className="p-2 rounded-lg bg-[#E6F7F6] text-[#16A6A1]">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#102C46]">Sterilized Equipment</h4>
                    <p className="text-[11px] text-[#64748B] leading-tight mt-0.5">
                      Class-B Autoclave multi-stage infection control
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-white p-3.5 rounded-xl border border-slate-100 shadow-xs">
                  <div className="p-2 rounded-lg bg-[#E6F7F6] text-[#16A6A1]">
                    <HeartHandshake className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#102C46]">Gentle Dentistry</h4>
                    <p className="text-[11px] text-[#64748B] leading-tight mt-0.5">
                      Patient comfort & conservative tooth preservation
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-white p-3.5 rounded-xl border border-slate-100 shadow-xs">
                  <div className="p-2 rounded-lg bg-[#E6F7F6] text-[#16A6A1]">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#102C46]">Doctor Consultation</h4>
                    <p className="text-[11px] text-[#64748B] leading-tight mt-0.5">
                      Transparent guidance before any procedure
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Micro notice disclaimer */}
            <p className="text-xs text-[#64748B] italic flex items-center gap-1.5">
              <span>ℹ️</span>
              <span>{noticeBadge}</span>
            </p>
          </div>

          {/* Right Column: Premium Clinic Visual Composition */}
          <div className="lg:col-span-5">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Outer decorative card frame */}
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-slate-100">
                <img
                  src="https://images.unsplash.com/photo-1629909613654-28e377c37b09?q=80&w=1200&auto=format&fit=crop"
                  alt="Anil Sharma Dental Hospital Operatory"
                  className="w-full h-[360px] sm:h-[440px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#102C46]/80 via-transparent to-transparent" />
                <div className="absolute bottom-5 left-5 right-5 text-white">
                  <div className="bg-white/15 backdrop-blur-md p-4 rounded-2xl border border-white/20">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#16A6A1]">
                      Clinical Facility
                    </p>
                    <p className="text-sm font-bold text-white mt-0.5">
                      Clean Operatory & Modern Patient Chair
                    </p>
                    <p className="text-[11px] text-slate-200 mt-1">
                      Signboard listing: {clinicName} / {alternateName}
                    </p>
                  </div>
                </div>
              </div>

              {/* Floating emergency badge */}
              <div className="absolute -bottom-4 -left-4 sm:bottom-6 sm:-left-6 bg-white p-3.5 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#102C46] text-white flex items-center justify-center font-bold">
                  <Phone className="w-4 h-4 text-[#16A6A1]" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-[#64748B]">Appointments & Enquiries</p>
                  <p className="text-xs font-bold text-[#102C46]">{phone}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

