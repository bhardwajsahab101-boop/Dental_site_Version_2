import type { Metadata } from "next";
import Navbar from "../../components/public/Navbar";
import Footer from "../../components/public/Footer";
import JsonLd from "../../components/public/JsonLd";
import { getClinic } from "../../lib/clinic";
import { getWebsiteContent } from "../../lib/content";
import Link from "next/link";
import { UserCheck, Calendar, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const clinic = await getClinic();
  const clinicName = clinic?.name || "Anil Sharma Dental Hospital";
  return {
    title: `About the Clinic & Doctor | ${clinicName}`,
    description: `Learn about ${clinicName}, Dr. Anil Sharma, our patient care philosophy, sterilization protocols, and comprehensive dental treatments.`,
  };
}

export default async function AboutPage() {
  const clinic = await getClinic();
  const content = await getWebsiteContent();
  const clinicName = clinic?.name || "Anil Sharma Dental Hospital";
  const alternateName = clinic?.alternateName || "A.K. Sharma Dental Hospital";
  const doctor = content?.doctor || {};

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <JsonLd clinic={clinic} content={content} />
      <Navbar clinic={clinic} />

      <main className="flex-1">
        {/* Page Header Banner */}
        <section className="bg-gradient-to-b from-[#F0F8F8] to-white py-14 sm:py-20 border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#16A6A1] bg-[#E6F7F6] px-3.5 py-1 rounded-full">
              About Our Practice
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#102C46]">
              Clinical Excellence, Compassion & Patient Trust
            </h1>
            <p className="text-base sm:text-lg text-[#64748B] max-w-2xl mx-auto leading-relaxed">
              Serving the community with dedicated oral healthcare, advanced sterilization standards, and conservative, gentle dentistry.
            </p>
          </div>
        </section>

        {/* Section 1: Clinic Overview & Philosophy */}
        <section className="py-16 sm:py-20 bg-white border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-7 space-y-6">
                <span className="text-xs font-bold uppercase tracking-wider text-[#16A6A1]">
                  Our Story & Mission
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#102C46]">
                  Dedicated to Preserving Your Natural Smile
                </h2>
                <p className="text-sm sm:text-base text-[#64748B] leading-relaxed">
                  {content?.about?.description ||
                    "Anil Sharma Dental Hospital is dedicated to providing high-quality, ethical, and gentle dental treatments. We combine clinical precision with a calm, patient-friendly environment to ensure every visit is comfortable and reassuring."}
                </p>
                <p className="text-sm sm:text-base text-[#64748B] leading-relaxed">
                  The clinic signboard also identifies the hospital as <strong>{alternateName}</strong>. Regardless of the reference, our core commitment remains unwavering: providing accessible, medically sound, and pain-free dental treatments without unnecessary procedures or exaggerated claims.
                </p>

                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#102C46]">
                    Our Core Principles:
                  </h4>
                  {(content?.about?.highlights || [
                    "Strict multi-stage autoclave sterilization protocols",
                    "Thorough pre-treatment consultation & transparent guidance",
                    "Gentle techniques designed to minimize patient anxiety",
                    "Comprehensive care for adults, seniors, and children",
                  ]).map((item: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-[#16A6A1] shrink-0 mt-0.5" />
                      <span className="text-sm text-[#172B3A] font-medium">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-5">
                <div className="rounded-3xl overflow-hidden border border-slate-200 shadow-xl bg-slate-100">
                  <img
                    src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=1200&auto=format&fit=crop"
                    alt="Reception & Patient Care Area"
                    className="w-full h-80 sm:h-96 object-cover"
                  />
                  <div className="p-5 bg-white">
                    <p className="text-xs font-bold text-[#102C46]">Hygienic Clinical Environment</p>
                    <p className="text-[11px] text-[#64748B] mt-1">
                      Designed for patient tranquility and hospital-grade infection barrier protection.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: In-Depth Doctor Profile */}
        <section className="py-16 sm:py-20 bg-[#F8FAFC] border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm space-y-8">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
                <div className="w-28 h-28 rounded-2xl bg-[#102C46] text-white flex flex-col items-center justify-center shrink-0 shadow-md">
                  <UserCheck className="w-12 h-12 text-[#16A6A1]" />
                  <span className="text-[9px] uppercase tracking-wider font-bold text-slate-300 mt-1">
                    Dental Surgeon
                  </span>
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#16A6A1]">
                    Lead Clinician
                  </span>
                  <h3 className="text-2xl font-extrabold text-[#102C46]">
                    {doctor.name || "Dr. Anil Sharma"}
                  </h3>
                  <p className="text-sm font-semibold text-slate-600">
                    {doctor.title || "Lead Dental Surgeon & Clinical Director"}
                  </p>
                  <p className="text-xs text-[#64748B]">
                    {clinicName} (Also referred to as {alternateName})
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 text-xs text-[#172B3A]">
                <div className="bg-[#F8FAFC] p-4 rounded-xl border border-slate-100 space-y-1">
                  <p className="font-bold text-[#102C46]">Academic Qualifications</p>
                  <p className="text-[#64748B]">{doctor.qualificationPlaceholder || "BDS / Dental Surgeon (Verified on File)"}</p>
                </div>

                <div className="bg-[#F8FAFC] p-4 rounded-xl border border-slate-100 space-y-1">
                  <p className="font-bold text-[#102C46]">Council Registration</p>
                  <p className="text-[#64748B]">{doctor.registrationPlaceholder || "State Dental Council Registered Practitioner"}</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-bold text-[#102C46]">Clinical Philosophy & Background</h4>
                <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                  {doctor.bio ||
                    "Dr. Anil Sharma brings dedicated clinical commitment to every patient, with a focus on conservative dentistry, root canal treatments, and preventative care. He believes that quality dental treatment starts with active listening, clear explanations, and treating every patient with utmost respect and gentleness."}
                </p>
              </div>

              <div className="pt-4 flex flex-wrap gap-4 items-center justify-between">
                <p className="text-[11px] text-slate-400 italic">
                  *Doctor qualifications & medical council registrations are maintained on record at the hospital.
                </p>
                <Link
                  href="/booking"
                  className="inline-flex items-center gap-2 bg-[#16A6A1] hover:bg-[#128884] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Request Consultation</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Sterilization Protocols & Hospital Safety */}
        <section className="py-16 sm:py-20 bg-white border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
              <span className="text-xs font-bold uppercase tracking-wider text-[#16A6A1] bg-[#E6F7F6] px-3 py-1 rounded-full">
                Hospital Safety
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#102C46]">
                Our Multi-Stage Sterilization Protocol
              </h2>
              <p className="text-sm text-[#64748B]">
                Infection control is non-negotiable. Every instrument and contact surface adheres to rigorous sterilization routines.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-slate-200/80 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#E6F7F6] text-[#16A6A1] flex items-center justify-center font-bold text-sm">
                  01
                </div>
                <h4 className="text-sm font-bold text-[#102C46]">Ultrasonic Decontamination</h4>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  Instruments undergo ultrasonic immersion baths using medical disinfectants to dislodge bio-debris.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-slate-200/80 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#E6F7F6] text-[#16A6A1] flex items-center justify-center font-bold text-sm">
                  02
                </div>
                <h4 className="text-sm font-bold text-[#102C46]">Pouch Sealing with Indicators</h4>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  Cleaned instruments are sealed in individual medical-grade pouches containing chemical thermal indicators.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-slate-200/80 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#E6F7F6] text-[#16A6A1] flex items-center justify-center font-bold text-sm">
                  03
                </div>
                <h4 className="text-sm font-bold text-[#102C46]">Class-B Autoclave Cycle</h4>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  High-temperature pressurized saturated steam kills 100% of bacterial spores and viral pathogens.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-slate-200/80 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#E6F7F6] text-[#16A6A1] flex items-center justify-center font-bold text-sm">
                  04
                </div>
                <h4 className="text-sm font-bold text-[#102C46]">Opened in Patient View</h4>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  Sealed sterile pouches are only broken open in the operatory immediately prior to commencing your procedure.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Strip */}
        <section className="py-12 bg-[#102C46] text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="text-lg font-bold">Have Questions About Your Upcoming Visit?</h3>
              <p className="text-xs text-slate-300">
                Our reception team will be glad to assist you with scheduling or preparation details.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/contact"
                className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-4 py-2.5 rounded-xl border border-white/20 transition"
              >
                Contact Clinic
              </Link>
              <Link
                href="/booking"
                className="bg-[#16A6A1] hover:bg-[#128884] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition shadow-sm"
              >
                Request Appointment
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer clinic={clinic} content={content} />
    </div>
  );
}
