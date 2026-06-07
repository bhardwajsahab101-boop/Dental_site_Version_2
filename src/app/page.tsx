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

