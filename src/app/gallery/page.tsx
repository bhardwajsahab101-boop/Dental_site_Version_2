import type { Metadata } from "next";
import Navbar from "../../components/public/Navbar";
import Footer from "../../components/public/Footer";
import JsonLd from "../../components/public/JsonLd";
import GallerySection from "../../components/public/GallerySection";
import { getClinic } from "../../lib/clinic";
import { getWebsiteContent } from "../../lib/content";
import { connectDB } from "../../lib/mongodb";
import { GalleryItem } from "../../models/GalleryItem";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const clinic = await getClinic();
  const clinicName = clinic?.name || "Anil Sharma Dental Hospital";
  return {
    title: `Clinic Gallery & Facilities Tour | ${clinicName}`,
    description: `Take a visual tour of ${clinicName}. Explore our clean operatory, autoclave sterilization suite, patient reception, and clinical care setup.`,
  };
}

export default async function GalleryPage() {
  await connectDB();
  const clinic = await getClinic();
  const content = await getWebsiteContent();

  let galleryItems: any[] = [];
  try {
    if (clinic?.id && clinic.id !== "fallback-id") {
      galleryItems = await GalleryItem.find({ clinicId: clinic.id })
        .sort({ displayOrder: 1, createdAt: -1 })
        .lean();
    }
  } catch (err) {
    console.error("Error loading gallery page items:", err);
  }

  const formatted = galleryItems.map((item: any) => ({
    id: String(item._id),
    title: item.title,
    alt: item.alt,
    imageUrl: item.imageUrl,
    category: item.category,
    isFeatured: item.isFeatured,
  }));

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <JsonLd clinic={clinic} content={content} />
      <Navbar clinic={clinic} />

      <main className="flex-1">
        {/* Banner */}
        <section className="bg-gradient-to-b from-[#F0F8F8] to-white py-14 sm:py-20 border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#16A6A1] bg-[#E6F7F6] px-3.5 py-1 rounded-full">
              Hospital Tour
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#102C46]">
              Clinic Gallery & Operatory Tour
            </h1>
            <p className="text-base sm:text-lg text-[#64748B] max-w-2xl mx-auto leading-relaxed">
              Explore photographs of our clinical facilities, instrument sterilization stations, modern ergonomic patient chairs, and clean environment.
            </p>
          </div>
        </section>

        {/* Gallery Section */}
        <GallerySection initialPhotos={formatted.length > 0 ? formatted : undefined} />
      </main>

      <Footer clinic={clinic} content={content} />
    </div>
  );
}
