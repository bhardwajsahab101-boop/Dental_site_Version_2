import type { Metadata } from "next";
import Navbar from "../../components/public/Navbar";
import Footer from "../../components/public/Footer";
import JsonLd from "../../components/public/JsonLd";
import TreatmentsDirectoryClient from "./TreatmentsDirectoryClient";
import { getClinic } from "../../lib/clinic";
import { getWebsiteContent } from "../../lib/content";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const clinic = await getClinic();
  const clinicName = clinic?.name || "Anil Sharma Dental Hospital";
  return {
    title: `Treatments & Dental Services Directory | ${clinicName}`,
    description: `Comprehensive treatment directory at ${clinicName}: Root canal therapy, dental crowns, scaling, tooth fillings, dentures, extractions, and preventive care.`,
  };
}

export default async function TreatmentsPage() {
  const clinic = await getClinic();
  const content = await getWebsiteContent();

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <JsonLd clinic={clinic} content={content} />
      <Navbar clinic={clinic} />

      <main className="flex-1">
        {/* Banner */}
        <section className="bg-gradient-to-b from-[#F0F8F8] to-white py-14 sm:py-20 border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#16A6A1] bg-[#E6F7F6] px-3.5 py-1 rounded-full">
              Clinical Directory
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#102C46]">
              Treatments & Dental Services
            </h1>
            <p className="text-base sm:text-lg text-[#64748B] max-w-2xl mx-auto leading-relaxed">
              Explore our full directory of restorative, preventive, endodontic, and prosthetic dental treatments. Every procedure is customized to your oral health requirements.
            </p>
          </div>
        </section>

        {/* Interactive Client Directory Component */}
        <TreatmentsDirectoryClient />
      </main>

      <Footer clinic={clinic} content={content} />
    </div>
  );
}

