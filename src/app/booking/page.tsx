import type { Metadata } from "next";
import Navbar from "../../components/public/Navbar";
import Footer from "../../components/public/Footer";
import JsonLd from "../../components/public/JsonLd";
import BookingFormClient from "./BookingFormClient";
import { getClinic } from "../../lib/clinic";
import { getWebsiteContent } from "../../lib/content";
import { ShieldCheck, Clock, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const clinic = await getClinic();
  const clinicName = clinic?.name || "Anil Sharma Dental Hospital";
  return {
    title: `Request Dental Appointment | ${clinicName}`,
    description: `Request an in-person dental consultation at ${clinicName}. Quick, secure appointment request with doctor confirmation.`,
  };
}

export default async function BookingPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string }>;
}) {
  const params = await searchParams;
  const initialService = params?.service || "";

  const clinic = await getClinic();
  const content = await getWebsiteContent();
  const phone = clinic?.phone || "+91 (Contact Number Pending)";

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <JsonLd clinic={clinic} content={content} />
      <Navbar clinic={clinic} />

      <main className="flex-1">
        {/* Banner */}
        <section className="bg-gradient-to-b from-[#F0F8F8] to-white py-12 sm:py-16 border-b border-slate-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#16A6A1] bg-[#E6F7F6] px-3.5 py-1 rounded-full">
              Patient Scheduling
            </span>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#102C46]">
              Request an In-Person Consultation
            </h1>
            <p className="text-sm sm:text-base text-[#64748B] max-w-xl mx-auto">
              Choose your preferred date, time window, and treatment interest. Our clinic reception will review availability and confirm your scheduled slot.
            </p>
          </div>
        </section>

        {/* Main Request Form Container */}
        <section className="py-12 sm:py-16">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Prominent Request Disclaimer Box */}
            <div className="mb-8 bg-amber-50/80 border border-amber-200/90 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 text-xs text-amber-900 shadow-xs">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-sm text-amber-950">Important Notice for Patients:</p>
                <p className="leading-relaxed">
                  Submitting this form submits an <strong>appointment request</strong>, not an immediate confirmed booking. Our clinic staff will review the doctor&apos;s daily clinical schedule and contact you directly via phone or WhatsApp to verify and confirm your exact appointment time.
                </p>
              </div>
            </div>

            {/* Form Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-5">
                <h2 className="text-xl font-bold text-[#102C46]">
                  Patient & Visit Details
                </h2>
                <p className="text-xs text-[#64748B] mt-1">
                  All fields marked with <span className="text-rose-500 font-bold">*</span> are required.
                </p>
              </div>

              <BookingFormClient
                clinicId={clinic?.id}
                initialService={initialService}
                clinicPhone={phone}
              />
            </div>

            {/* Security & Confidentiality Footer */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#64748B] px-2">
              <span className="flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-4 h-4 text-[#16A6A1]" />
                <span>Private & Secure Medical Data Handling</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#16A6A1]" />
                <span>Confirmation typically within clinical hours</span>
              </span>
            </div>
          </div>
        </section>
      </main>

      <Footer clinic={clinic} content={content} />
    </div>
  );
}
