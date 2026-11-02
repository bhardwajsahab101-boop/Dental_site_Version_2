import Link from "next/link";
import { CheckCircle2, ShieldAlert, Award, FileText, ArrowRight } from "lucide-react";

interface TrustSectionProps {
  clinic?: any;
  content?: any;
}

export default function TrustSection({ clinic, content }: TrustSectionProps) {
  const clinicName = clinic?.name || "Anil Sharma Dental Hospital";
  const doctor = content?.doctor || {
    name: "Dr. Anil Sharma",
    title: "Lead Dental Surgeon & Clinical Director",
    qualificationPlaceholder: "BDS / Dental Surgeon (Verified on Clinic Records)",
    registrationPlaceholder: "State Dental Council Registered Practitioner",
    experiencePlaceholder: "Extensive clinical practice focused on restorative and gentle dentistry",
  };

  return (
    <section className="py-14 sm:py-20 bg-white border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-[#16A6A1] bg-[#E6F7F6] px-3 py-1 rounded-full">
            Clinical Standards & Trust
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#102C46]">
            Transparent Care, Proven Sterilization & Ethical Treatment
          </h2>
          <p className="text-sm sm:text-base text-[#64748B]">
            At {clinicName}, we operate on strict medical ethics. No false claims, no unnecessary procedures. Every patient receives honest diagnostics and gentle dental treatment.
          </p>
        </div>

        {/* 3 Core Trust Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1: Verified Practitioner Credentials */}
          <div className="bg-[#F8FAFC] rounded-2xl p-7 border border-slate-200/70 hover:border-[#16A6A1]/40 transition-colors shadow-xs flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#102C46] text-white flex items-center justify-center">
                <Award className="w-6 h-6 text-[#16A6A1]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#102C46]">Doctor Credentials</h3>
                <p className="text-xs text-[#64748B] mt-1 font-medium">
                  {doctor.title}
                </p>
              </div>
              <ul className="space-y-2.5 text-xs text-[#172B3A] pt-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#16A6A1] shrink-0 mt-0.5" />
                  <span><strong>Practitioner:</strong> {doctor.name}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#16A6A1] shrink-0 mt-0.5" />
                  <span><strong>Qualifications:</strong> {doctor.qualificationPlaceholder}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#16A6A1] shrink-0 mt-0.5" />
                  <span><strong>Registration:</strong> {doctor.registrationPlaceholder}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#16A6A1] shrink-0 mt-0.5" />
                  <span><strong>Practice Focus:</strong> Conservative Endodontics & Tooth Preservation</span>
                </li>
              </ul>
            </div>
            <div className="pt-6 mt-6 border-t border-slate-200">
              <Link
                href="/about"
                className="text-xs font-bold text-[#102C46] hover:text-[#16A6A1] inline-flex items-center gap-1.5 transition"
              >
                <span>Read Full Doctor Profile</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Card 2: Strict Infection Control & Sterilization */}
          <div className="bg-[#F8FAFC] rounded-2xl p-7 border border-slate-200/70 hover:border-[#16A6A1]/40 transition-colors shadow-xs flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#16A6A1] text-white flex items-center justify-center">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#102C46]">Multi-Stage Infection Control</h3>
                <p className="text-xs text-[#64748B] mt-1 font-medium">
                  Patient safety without compromise
                </p>
              </div>
              <ul className="space-y-2.5 text-xs text-[#172B3A] pt-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#16A6A1] shrink-0 mt-0.5" />
                  <span>High-pressure autoclave sterilization for every non-disposable instrument</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#16A6A1] shrink-0 mt-0.5" />
                  <span>Sealed sterilization indicator pouches opened in front of the patient</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#16A6A1] shrink-0 mt-0.5" />
                  <span>Hospital-grade surface disinfection of dental chairs between all appointments</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#16A6A1] shrink-0 mt-0.5" />
                  <span>Strict disposable barrier gloves, bibs, and suction tips</span>
                </li>
              </ul>
            </div>
            <div className="pt-6 mt-6 border-t border-slate-200">
              <Link
                href="/gallery"
                className="text-xs font-bold text-[#102C46] hover:text-[#16A6A1] inline-flex items-center gap-1.5 transition"
              >
                <span>Inspect Sterilization Facility</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Card 3: Patient Care Philosophy & Informed Consent */}
          <div className="bg-[#F8FAFC] rounded-2xl p-7 border border-slate-200/70 hover:border-[#16A6A1]/40 transition-colors shadow-xs flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#102C46] text-white flex items-center justify-center">
                <FileText className="w-6 h-6 text-[#16A6A1]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#102C46]">Ethical Care Philosophy</h3>
                <p className="text-xs text-[#64748B] mt-1 font-medium">
                  Clear explanations, zero pressure
                </p>
              </div>
              <ul className="space-y-2.5 text-xs text-[#172B3A] pt-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#16A6A1] shrink-0 mt-0.5" />
                  <span>We prioritize saving your natural teeth wherever clinically viable</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#16A6A1] shrink-0 mt-0.5" />
                  <span>Complete transparency regarding diagnosis, options, and expected healing times</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#16A6A1] shrink-0 mt-0.5" />
                  <span>Gentle numbing techniques for pain-free procedures</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#16A6A1] shrink-0 mt-0.5" />
                  <span>Clear post-procedure instructions and scheduled follow-up guidance</span>
                </li>
              </ul>
            </div>
            <div className="pt-6 mt-6 border-t border-slate-200">
              <Link
                href="/booking"
                className="text-xs font-bold text-[#102C46] hover:text-[#16A6A1] inline-flex items-center gap-1.5 transition"
              >
                <span>Request a Consultation</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
