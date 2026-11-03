export interface GalleryPhoto {
  id: string;
  title: string;
  alt: string;
  imageUrl: string;
  category: "Clinic & Operatory" | "Dental Procedures" | "Sterilization & Safety" | "Patient Smiles";
  isFeatured: boolean;
}

export const INITIAL_GALLERY: GalleryPhoto[] = [
  {
    id: "gal-1",
    title: "Ergonomic Patient Dental Chair & Operatory",
    alt: "Modern dental treatment room with ergonomic patient chair and sterile instruments at Anil Sharma Dental Hospital",
    imageUrl: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?q=80&w=1200&auto=format&fit=crop",
    category: "Clinic & Operatory",
    isFeatured: true,
  },
  {
    id: "gal-2",
    title: "Medical-Grade Autoclave Sterilization Station",
    alt: "Multi-stage instrument sterilization station ensuring patient safety and infection control",
    imageUrl: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?q=80&w=1200&auto=format&fit=crop",
    category: "Sterilization & Safety",
    isFeatured: true,
  },
  {
    id: "gal-3",
    title: "Precision Dental Examination & Procedure Instruments",
    alt: "High-grade sterile stainless steel dental diagnostic mirrors, probes and instruments",
    imageUrl: "https://images.unsplash.com/photo-1598256989800-fe5f95da9787?q=80&w=1200&auto=format&fit=crop",
    category: "Dental Procedures",
    isFeatured: true,
  },
  {
    id: "gal-4",
    title: "Welcoming Clinic Reception & Consultation Lounge",
    alt: "Clean, hygienic and comfortable reception and patient waiting lounge",
    imageUrl: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=1200&auto=format&fit=crop",
    category: "Clinic & Operatory",
    isFeatured: true,
  },
  {
    id: "gal-5",
    title: "Patient Consultation & Oral Health Discussion",
    alt: "Dentist explaining dental treatment plan and oral hygiene directly with patient",
    imageUrl: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?q=80&w=1200&auto=format&fit=crop",
    category: "Dental Procedures",
    isFeatured: true,
  },
  {
    id: "gal-6",
    title: "Healthy, Confident Smile Post-Restoration",
    alt: "Clean, radiant smile restored through gentle conservative dental treatment",
    imageUrl: "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?q=80&w=1200&auto=format&fit=crop",
    category: "Patient Smiles",
    isFeatured: true,
  },
];

