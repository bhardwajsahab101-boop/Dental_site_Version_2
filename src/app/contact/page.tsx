import type { Metadata } from "next";
import Navbar from "../../components/public/Navbar";
import Footer from "../../components/public/Footer";
import JsonLd from "../../components/public/JsonLd";
import ContactFormClient from "./ContactFormClient";
import { getClinic } from "../../lib/clinic";
import { getWebsiteContent } from "../../lib/content";
import { Phone, Mail, MapPin, Clock, MessageSquare, ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const clinic = await getClinic();
  const clinicName = clinic?.name || "Anil Sharma Dental Hospital";
  return {
    title: `Contact Us & Clinic Location | ${clinicName}`,
    description: `Get in touch with ${clinicName}. Find our address, phone number, consultation hours, Google Maps directions, and send us an enquiry.`,
  };
}

export default async function ContactPage() {
  const clinic = await getClinic();
  const content = await getWebsiteContent();
  const clinicName = clinic?.name || "Anil Sharma Dental Hospital";
  const alternateName = clinic?.alternateName || "A.K. Sharma Dental Hospital";
  const phone = clinic?.phone || "+91 (Contact Number Pending)";
  const whatsappPhone = clinic?.whatsappPhone || clinic?.phone || "+91 (Contact Number Pending)";
  const email = clinic?.email || "contact@sharmadental.com";
  const address = clinic?.address || "Anil Sharma Dental Hospital, (Exact Address Placeholder)";
  const googleMapsUrl = clinic?.googleMapsUrl || "https://maps.google.com";

  const cleanPhone = phone.replace(/[^\d+]/g, "");
  const cleanWhatsApp = whatsappPhone.replace(/[^\d+]/g, "");

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <JsonLd clinic={clinic} content={content} />
      <Navbar clinic={clinic} />

      <main className="flex-1">
        {/* Banner */}
        <section className="bg-gradient-to-b from-[#F0F8F8] to-white py-14 sm:py-20 border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#16A6A1] bg-[#E6F7F6] px-3.5 py-1 rounded-full">
              Get In Touch
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#102C46]">
              Contact Anil Sharma Dental Hospital
            </h1>
            <p className="text-base sm:text-lg text-[#64748B] max-w-2xl mx-auto leading-relaxed">
              We welcome your questions regarding dental procedures, consultation scheduling, or finding our clinic.
            </p>
          </div>
        </section>

        {/* Contact Layout */}
        <section className="py-14 sm:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              {/* Left Column: Direct Info & Quick Mobile Actions */}
              <div className="lg:col-span-5 space-y-6">
                <div>
                  <h2 className="text-2xl font-extrabold text-[#102C46]">
                    Clinic Details & Location
                  </h2>
                  <p className="text-xs text-[#64748B] mt-1">
                    Listed also as <strong>{alternateName}</strong> on the clinic signboard.
                  </p>
                </div>

                {/* Mobile Quick Action Strip (Extremely convenient on phones) */}
                <div className="grid grid-cols-2 gap-3">
                  <a
                    href={`tel:${cleanPhone || phone}`}
                    className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[#102C46] text-white hover:bg-[#1A3E61] transition shadow-xs"
                  >
                    <Phone className="w-5 h-5 text-[#16A6A1] mb-1.5" />
                    <span className="text-xs font-bold">Call Clinic</span>
                    <span className="text-[10px] text-slate-300">Instant Phone Link</span>
                  </a>

                  <a
                    href={`https://wa.me/${cleanWhatsApp.replace(/\+/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[#25D366] text-white hover:bg-[#20b859] transition shadow-xs"
                  >
                    <MessageSquare className="w-5 h-5 mb-1.5" />
                    <span className="text-xs font-bold">WhatsApp</span>
                    <span className="text-[10px] text-white/90">Message Directly</span>
                  </a>
                </div>

                {/* Information cards */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-5 text-xs text-[#172B3A]">
                  <div className="flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-[#E6F7F6] text-[#16A6A1] flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[#102C46] text-sm">Clinic Address</h4>
                      <p className="text-[#64748B] mt-1 leading-relaxed">{address}</p>
                      <a
                        href={googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[#16A6A1] font-bold mt-1.5 hover:underline"
                      >
                        <span>Open in Google Maps</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-4 flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-[#E6F7F6] text-[#16A6A1] flex items-center justify-center shrink-0 mt-0.5">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[#102C46] text-sm">Consultation Hours</h4>
                      <div className="text-[#64748B] mt-1 space-y-0.5">
                        <p><strong>Morning:</strong> 10:00 AM – 02:00 PM (Mon–Sat)</p>
                        <p><strong>Evening:</strong> 05:00 PM – 08:30 PM (Mon–Sat)</p>
                        <p><strong>Sunday:</strong> By Prior Appointment Only</p>
                        <p className="text-[11px] text-slate-400 mt-1 italic">
                          *Pre-booking strongly recommended to ensure dedicated doctor time.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-4 flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-[#E6F7F6] text-[#16A6A1] flex items-center justify-center shrink-0 mt-0.5">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[#102C46] text-sm">Email Reception</h4>
                      <p className="text-[#64748B] mt-1">{email}</p>
                    </div>
                  </div>
                </div>

                {/* Location Map Placeholder / Embed Note */}
                <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-3">
                  <h4 className="font-bold text-[#102C46] text-xs uppercase tracking-wider">
                    Google Maps Verification
                  </h4>
                  <div className="h-44 w-full rounded-2xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center text-center p-4 text-xs text-slate-500">
                    <MapPin className="w-6 h-6 text-[#16A6A1] mb-1" />
                    <span className="font-bold text-slate-700">{clinicName}</span>
                    <span className="text-[11px] text-slate-400 mt-0.5">
                      Google Maps Directions & Verified Business Profile
                    </span>
                    <a
                      href={googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#16A6A1] bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs hover:bg-slate-50"
                    >
                      <span>Get Navigation Directions</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Right Column: Send Message Form */}
              <div className="lg:col-span-7">
                <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-sm space-y-6">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#16A6A1]">
                      Send An Enquiry
                    </span>
                    <h3 className="text-2xl font-extrabold text-[#102C46] mt-1">
                      Message the Hospital
                    </h3>
                    <p className="text-xs text-[#64748B] mt-1">
                      Have questions regarding a treatment, pricing estimates, or general care? Send us a message and our clinic staff will get back to you.
                    </p>
                  </div>

                  <ContactFormClient clinicId={clinic?.id} />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer clinic={clinic} content={content} />
    </div>
  );
}

