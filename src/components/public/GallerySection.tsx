"use client";

import { useState } from "react";
import Link from "next/link";
import { INITIAL_GALLERY, GalleryPhoto } from "../../data/galleryData";
import { Maximize2, X, ChevronLeft, ChevronRight, ArrowRight, ShieldCheck } from "lucide-react";

export default function GallerySection({ initialPhotos }: { initialPhotos?: GalleryPhoto[] }) {
  const photos = initialPhotos && initialPhotos.length > 0 ? initialPhotos : INITIAL_GALLERY;
  const [selectedImage, setSelectedImage] = useState<GalleryPhoto | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const categories = ["All", "Clinic & Operatory", "Sterilization & Safety", "Dental Procedures", "Patient Smiles"];

  const filteredPhotos =
    activeCategory === "All"
      ? photos
      : photos.filter((p) => p.category === activeCategory);

  const currentIndex = selectedImage ? filteredPhotos.findIndex((p) => p.id === selectedImage.id) : -1;

  const handleNext = () => {
    if (currentIndex >= 0 && currentIndex < filteredPhotos.length - 1) {
      setSelectedImage(filteredPhotos[currentIndex + 1]);
    } else {
      setSelectedImage(filteredPhotos[0]);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setSelectedImage(filteredPhotos[currentIndex - 1]);
    } else {
      setSelectedImage(filteredPhotos[filteredPhotos.length - 1]);
    }
  };

  return (
    <section id="gallery" className="py-16 sm:py-24 bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="space-y-3 max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-wider text-[#16A6A1] bg-[#E6F7F6] px-3 py-1 rounded-full">
              Clinic Atmosphere & Facilities
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#102C46]">
              Inside Anil Sharma Dental Hospital
            </h2>
            <p className="text-sm sm:text-base text-[#64748B]">
              Take a visual tour of our clean, sterile clinical operatories, patient reception lounge, and medical-grade autoclave sterilization setup.
            </p>
          </div>

          <Link
            href="/gallery"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-[#102C46] hover:text-[#16A6A1] transition group shrink-0"
          >
            <span>Open Dedicated Gallery</span>
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`text-xs font-semibold px-4 py-2 rounded-xl transition ${
                activeCategory === cat
                  ? "bg-[#102C46] text-white shadow-xs"
                  : "bg-white text-[#64748B] hover:text-[#102C46] border border-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Responsive Photo Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPhotos.map((photo) => (
            <div
              key={photo.id}
              onClick={() => setSelectedImage(photo)}
              className="group relative rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-xs cursor-pointer hover:shadow-lg transition-all duration-200"
            >
              <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100">
                <img
                  src={photo.imageUrl}
                  alt={photo.alt}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              <div className="p-4 bg-white flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#16A6A1]">
                    {photo.category}
                  </span>
                  <p className="text-xs font-bold text-[#102C46] mt-0.5 line-clamp-1">
                    {photo.title}
                  </p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] group-hover:bg-[#E6F7F6] text-slate-500 group-hover:text-[#16A6A1] flex items-center justify-center transition">
                  <Maximize2 className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-[#102C46] rounded-2xl overflow-hidden shadow-2xl border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Bar */}
            <div className="p-4 bg-[#0A1D30] text-white flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#16A6A1]" />
                <span className="text-xs font-semibold text-slate-200">
                  {selectedImage.category}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition"
                aria-label="Close image lightbox"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Main Image Container */}
            <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full bg-black/60 flex items-center justify-center">
              <img
                src={selectedImage.imageUrl}
                alt={selectedImage.alt}
                className="max-h-full max-w-full object-contain"
              />

              {/* Prev / Next buttons */}
              <button
                type="button"
                onClick={handlePrev}
                className="absolute left-3 p-2 rounded-full bg-black/50 text-white hover:bg-[#16A6A1] transition focus:outline-none"
                aria-label="Previous photograph"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="absolute right-3 p-2 rounded-full bg-black/50 text-white hover:bg-[#16A6A1] transition focus:outline-none"
                aria-label="Next photograph"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Caption Footer */}
            <div className="p-4 bg-[#0A1D30] text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-t border-white/10 text-xs">
              <div>
                <p className="font-bold text-sm text-white">{selectedImage.title}</p>
                <p className="text-slate-300 text-[11px] mt-0.5">{selectedImage.alt}</p>
              </div>
              <span className="text-slate-400 text-[11px] shrink-0">
                Photo {currentIndex + 1} of {filteredPhotos.length}
              </span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

