import type { Metadata } from "next";
import Hero from "../sections/Hero";
import Navbar from "../components/navbar"; 
import Services from "../sections/Services";
import Doctors from "../sections/Doctors";
import Testimonials from "../sections/Testimonials";
import Contact from "../sections/Contact";
import Footer from "../sections/Footer";
import { getClinic } from "../lib/clinic";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const clinic = await getClinic();
    return {
      title: clinic?.clinicName || "AK Sharma Dental Clinic",
      description: `Welcome to ${clinic?.clinicName || "AK Sharma Dental Clinic"}. Modern and trusted dental care for your family.`,
    };
  } catch (error) {
    console.error("generateMetadata error:", error);
    return {
      title: "AK Sharma Dental Clinic",
      description: "Modern and trusted dental clinic providing complete dental care for your family.",
    };
  }
}

export default async function Home() {
  const clinic = await getClinic();
 
  if (!clinic) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-100 shadow-xl p-8 space-y-6">
          <div className="inline-flex items-center justify-center h-12 w-12 bg-rose-50 text-rose-500 rounded-xl text-xl font-bold">
            🦷
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Clinic Not Found</h1>
          <p className="text-slate-400 text-xs font-semibold">
            The requested clinic is invalid or does not exist. Please check the domain slug and try again.
          </p>
        </div>
      </div>
    );
  }
 
  return (
    <div>
      <Navbar clinic={clinic} />
      <main>
        <Hero clinic={clinic} />
        <Services clinic={clinic} />
        <Doctors clinic={clinic} />
        <Testimonials clinic={clinic} />
        <Contact clinic={clinic} />
        <Footer clinic={clinic} />
      </main>
    </div>
  );
}

