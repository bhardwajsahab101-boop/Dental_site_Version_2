import type { Metadata } from "next";
import Navbar from "../components/public/Navbar";
import Hero from "../components/public/Hero";
import TrustSection from "../components/public/TrustSection";
import TreatmentsPreview from "../components/public/TreatmentsPreview";
import DoctorSection from "../components/public/DoctorSection";
import GallerySection from "../components/public/GallerySection";
import ReviewsSection from "../components/public/ReviewsSection";
import FaqSection from "../components/public/FaqSection";
import CtaBanner from "../components/public/CtaBanner";
import Footer from "../components/public/Footer";
import JsonLd from "../components/public/JsonLd";
import { getClinic } from "../lib/clinic";
import { getWebsiteContent } from "../lib/content";
import { connectDB } from "../lib/mongodb";
import { GalleryItem } from "../models/GalleryItem";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const clinic = await getClinic();
    const content = await getWebsiteContent();
    const clinicName = clinic?.name || "Anil Sharma Dental Hospital";

    return {
      title: content?.seo?.metaTitle || `${clinicName} | Gentle, Professional Dental Care`,
      description:
        content?.seo?.metaDescription ||
        `Welcome to ${clinicName}. Providing comprehensive, gentle dental care, root canal treatments, crowns, scaling, and preventive checkups.`,
      keywords: content?.seo?.keywords || "dental clinic, dentist, root canal, teeth cleaning",
    };
  } catch (err) {
    return {
      title: "Anil Sharma Dental Hospital | Gentle, Professional Dental Care",
      description: "Comprehensive oral healthcare and modern dental clinic.",
    };
  }
}

export default async function Home() {
  await connectDB();
  const clinic = await getClinic();
  const content = await getWebsiteContent();

  // Fetch featured gallery items from database if available
  let galleryItems: any[] = [];
  try {
    if (clinic?.id && clinic.id !== "fallback-id") {
      galleryItems = await GalleryItem.find({ clinicId: clinic.id, isFeatured: true })
        .sort({ displayOrder: 1, createdAt: -1 })
        .lean();
    }
  } catch (e) {
    console.error("Error fetching homepage gallery items:", e);
  }

  const formattedGallery = galleryItems.map((item: any) => ({
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
        <Hero clinic={clinic} content={content} />
        <TrustSection clinic={clinic} content={content} />
        <TreatmentsPreview />
        <DoctorSection clinic={clinic} content={content} />
        <GallerySection initialPhotos={formattedGallery.length > 0 ? formattedGallery : undefined} />
        <ReviewsSection clinic={clinic} />
        <FaqSection content={content} />
        <CtaBanner clinic={clinic} />
      </main>
      <Footer clinic={clinic} content={content} />
    </div>
  );
}
