import mongoose, { Schema, Document, Model } from "mongoose";

export interface IFaqItem {
  question: string;
  answer: string;
  category?: string;
}

export interface IWebsiteContent extends Document {
  clinicId: mongoose.Types.ObjectId;
  hero: {
    badge: string;
    headline: string;
    subheadline: string;
    ctaPrimaryText: string;
    ctaSecondaryText: string;
    noticeBadge: string;
  };
  about: {
    tagline: string;
    title: string;
    description: string;
    highlights: string[];
    sterilizationProtocol: string;
  };
  doctor: {
    name: string;
    title: string;
    qualificationPlaceholder: string;
    registrationPlaceholder: string;
    experiencePlaceholder: string;
    bio: string;
    specialties: string[];
    photoUrl?: string;
  };
  hours: {
    morning: string;
    evening: string;
    sunday: string;
    notes: string;
  };
  faqs: IFaqItem[];
  seo: {
    metaTitle: string;
    metaDescription: string;
    keywords: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const websiteContentSchema = new Schema<IWebsiteContent>(
  {
    clinicId: {
      type: Schema.Types.ObjectId,
      ref: "Clinic",
      required: true,
      unique: true,
      index: true,
    },
    hero: {
      badge: {
        type: String,
        default: "Anil Sharma Dental Hospital • Patient-Centered Care",
      },
      headline: {
        type: String,
        default: "Gentle, Professional Dental Care for Confident, Healthy Smiles",
      },
      subheadline: {
        type: String,
        default:
          "Experience comprehensive oral healthcare in a clean, welcoming environment. From preventive checkups to advanced restorations, our dedicated team prioritizes your comfort.",
      },
      ctaPrimaryText: {
        type: String,
        default: "Request Appointment",
      },
      ctaSecondaryText: {
        type: String,
        default: "Explore Treatments",
      },
      noticeBadge: {
        type: String,
        default: "Accepting new patient requests • Consultations by appointment",
      },
    },
    about: {
      tagline: {
        type: String,
        default: "Compassionate Care Meets Clinical Precision",
      },
      title: {
        type: String,
        default: "About Anil Sharma Dental Hospital",
      },
      description: {
        type: String,
        default:
          "Anil Sharma Dental Hospital is dedicated to providing high-quality, ethical, and gentle dental treatments. We combine clinical precision with a calm, patient-friendly environment to ensure every visit is comfortable and reassuring. Our focus is preserving natural teeth, eliminating dental discomfort, and restoring confident smiles.",
      },
      highlights: {
        type: [String],
        default: [
          "Strict multi-stage autoclave sterilization protocols",
          "Thorough pre-treatment consultation & transparent guidance",
          "Gentle techniques designed to minimize patient anxiety",
          "Comprehensive care for adults, seniors, and children",
        ],
      },
      sterilizationProtocol: {
        type: String,
        default:
          "Patient safety is paramount. All instruments undergo ultrasonic cleaning, barrier pouch sealing, and medical-grade autoclave sterilization for every procedure.",
      },
    },
    doctor: {
      name: {
        type: String,
        default: "Dr. Anil Sharma",
      },
      title: {
        type: String,
        default: "Lead Dental Surgeon & Clinical Director",
      },
      qualificationPlaceholder: {
        type: String,
        default: "BDS / Dental Surgeon (Verified on Clinic Records)",
      },
      registrationPlaceholder: {
        type: String,
        default: "State Dental Council Registered Practitioner",
      },
      experiencePlaceholder: {
        type: String,
        default: "Extensive clinical practice focused on restorative and gentle dentistry",
      },
      bio: {
        type: String,
        default:
          "Dr. Anil Sharma brings dedicated clinical commitment to every patient, with a focus on conservative dentistry, root canal treatments, and preventative care. He believes that quality dental treatment starts with active listening, clear explanations, and treating every patient with utmost respect and gentleness.",
      },
      specialties: {
        type: [String],
        default: [
          "Comprehensive Dental Examinations",
          "Root Canal Therapy (Endodontics)",
          "Crowns, Bridges & Restorations",
          "Preventive Care & Gum Health",
          "Painless Tooth Extractions",
        ],
      },
      photoUrl: {
        type: String,
        default: "",
      },
    },
    hours: {
      morning: {
        type: String,
        default: "10:00 AM – 02:00 PM (Monday to Saturday)",
      },
      evening: {
        type: String,
        default: "05:00 PM – 08:30 PM (Monday to Saturday)",
      },
      sunday: {
        type: String,
        default: "By Prior Appointment Only",
      },
      notes: {
        type: String,
        default: "Walk-ins subject to doctor availability. Pre-booking recommended.",
      },
    },
    faqs: {
      type: [
        {
          question: { type: String, required: true },
          answer: { type: String, required: true },
          category: { type: String, default: "General" },
        },
      ],
      default: [
        {
          question: "How do I request an appointment at Anil Sharma Dental Hospital?",
          answer:
            "You can submit an online request using our appointment form, or call/WhatsApp our clinic reception directly. Our team will verify slot availability and confirm your scheduled time.",
          category: "Appointments",
        },
        {
          question: "Is root canal treatment painful?",
          answer:
            "Modern root canal therapy is performed with local anesthesia, making the procedure virtually painless. Its purpose is to relieve severe toothache caused by infected nerve tissue and save your natural tooth.",
          category: "Treatments",
        },
        {
          question: "How often should I have a dental cleaning and checkup?",
          answer:
            "Dental associations recommend a routine checkup and professional scaling every 6 months to prevent plaque buildup, cavities, and gum diseases before they become severe.",
          category: "Preventive",
        },
        {
          question: "What safety and hygiene protocols are followed at the clinic?",
          answer:
            "We adhere strictly to hospital-grade disinfection, utilizing ultrasonic instrument baths, Class-B autoclave sterilization, disposable single-use barriers, and sanitized treatment operatories for every patient.",
          category: "Safety",
        },
        {
          question: "Can I walk in without an appointment?",
          answer:
            "While emergency cases are accommodated promptly, scheduling in advance helps minimize waiting time and ensures the doctor has dedicated focus for your procedure.",
          category: "Appointments",
        },
      ],
    },
    seo: {
      metaTitle: {
        type: String,
        default: "Anil Sharma Dental Hospital | Trusted Dental Care & Clinic",
      },
      metaDescription: {
        type: String,
        default:
          "Anil Sharma Dental Hospital provides trusted, gentle dental care. Services include checkups, root canal treatment, crowns, scaling, tooth fillings, and preventive care.",
      },
      keywords: {
        type: String,
        default:
          "Anil Sharma Dental Hospital, AK Sharma Dental Clinic, dentist near me, dental clinic, root canal treatment, dental crowns, teeth cleaning, dental surgeon",
      },
    },
  },
  {
    timestamps: true,
  }
);

export const WebsiteContent =
  (mongoose.models.WebsiteContent as Model<IWebsiteContent>) ||
  mongoose.model<IWebsiteContent>("WebsiteContent", websiteContentSchema);

