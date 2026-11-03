import Link from "next/link";
import { UserCheck, Award, GraduationCap, ShieldCheck, Calendar, ArrowRight } from "lucide-react";

interface DoctorSectionProps {
  clinic?: any;
  content?: any;
}

export default function DoctorSection({ clinic, content }: DoctorSectionProps) {
  const clinicName = clinic?.name || "Anil Sharma Dental Hospital";
  const doctor = content?.doctor || {
    name: "Dr. Anil Sharma",
    title: "Lead Dental Surgeon & Clinical Director",
    qualificationPlaceholder: "BDS / Dental Surgeon (Verified on Clinic Records)",
    registrationPlaceholder: "State Dental Council Registered Practitioner",
    experiencePlaceholder: "Extensive clinical practice focused on restorative and gentle dentistry",
    bio: "Dr. Anil Sharma brings dedicated clinical commitment to every patient, with a focus on conservative dentistry, root canal treatments, and preventative care. He believes that quality dental treatment starts with active listening, clear explanations, and treating every patient with utmost respect and gentleness.",
    specialties: [
      "Comprehensive Dental Examinations",
      "Root Canal Therapy (Endodontics)",
      "Crowns, Bridges & Restorations",
      "Preventive Care & Gum Health",
      "Painless Tooth Extractions",
    ],
  };

  return (
    <section id="about-doctor" className="py-16 sm:py-24 bg-white border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Authentic Doctor Profile Portrait / Placeholder */}
          <div className="lg:col-span-5">
            <div className="relative mx-auto max-w-sm lg:max-w-none">
              {/* Doctor card styling */}
              <div className="rounded-3xl overflow-hidden border-2 border-slate-200 bg-[#F8FAFC] shadow-lg p-6 flex flex-col items-center text-center">
                {/* Doctor Avatar / Portrait placeholder */}
                <div className="w-36 h-36 rounded-2xl bg-gradient-to-br from-[#102C46] to-[#16A6A1] text-white flex flex-col items-center justify-center shadow-md mb-5 border-4 border-white">
                  <UserCheck className="w-16 h-16 text-[#E6F7F6]" />
                  <span className="text-[10px] font-bold tracking-wider uppercase mt-1 text-[#E6F7F6]">
                    Verified Doctor
                  </span>
                </div>

                <h3 className="text-xl font-bold text-[#102C46]">{doctor.name}</h3>
                <p className="text-xs font-semibold text-[#16A6A1] mt-1">{doctor.title}</p>
                <p className="text-[11px] text-[#64748B] mt-0.5">{clinicName}</p>

                <div className="w-full my-5 border-t border-slate-200" />

                <div className="w-full space-y-3 text-left">
                  <div className="flex items-start gap-2.5">
                    <GraduationCap className="w-4 h-4 text-[#16A6A1] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[11px] font-bold text-[#102C46]">Qualifications</p>
                      <p className="text-xs text-[#64748B]">{doctor.qualificationPlaceholder}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-[#16A6A1] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[11px] font-bold text-[#102C46]">Registration</p>
                      <p className="text-xs text-[#64748B]">{doctor.registrationPlaceholder}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Award className="w-4 h-4 text-[#16A6A1] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[11px] font-bold text-[#102C46]">Clinical Ethics</p>
                      <p className="text-xs text-[#64748B]">
                        Conservative dentistry prioritizing tooth preservation
                      </p>
                    </div>
                  </div>
                </div>

                <div className="w-full pt-4 mt-2">
                  <span className="text-[10px] text-slate-400 italic">
                    *Doctor credentials and council registrations are maintained on official clinic file.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Doctor Introduction & Care Philosophy */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#16A6A1] bg-[#E6F7F6] px-3 py-1 rounded-full">
                Meet Your Dentist
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#102C46]">
                Dedicated to Gentle, Ethical & Conservative Dental Care
              </h2>
            </div>

            <p className="text-sm sm:text-base text-[#64748B] leading-relaxed">
              {doctor.bio}
            </p>

            <div className="bg-[#F8FAFC] p-5 rounded-2xl border border-slate-200/80 space-y-3">
              <h4 className="text-xs font-bold text-[#102C46] uppercase tracking-wider">
                Clinical Focus & Areas of Practice
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {(doctor.specialties || []).map((spec: string, idx: number) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-[#172B3A]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#16A6A1]" />
                    <span>{spec}</span>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-xs text-[#64748B] leading-relaxed">
              &ldquo;My philosophy is simple: we never rush a patient. We diagnose carefully, explain all treatment possibilities clearly, and ensure every procedure is as pain-free and comfortable as possible.&rdquo;
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <Link
                href="/booking"
                className="inline-flex items-center gap-2 bg-[#16A6A1] hover:bg-[#128884] text-white text-sm font-bold px-6 py-3 rounded-xl shadow-sm transition"
              >
                <Calendar className="w-4 h-4" />
                <span>Request Doctor Consultation</span>
              </Link>

              <Link
                href="/about"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#102C46] hover:text-[#16A6A1] transition"
              >
                <span>Learn More About the Hospital</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

