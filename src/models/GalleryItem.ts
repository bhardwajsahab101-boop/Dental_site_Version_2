import mongoose, { Schema, Document, Model } from "mongoose";

export interface IGalleryItem extends Document {
  clinicId: mongoose.Types.ObjectId;
  title: string;
  alt: string;
  imageUrl: string;
  category: "Clinic & Operatory" | "Dental Procedures" | "Sterilization & Safety" | "Patient Smiles";
  isFeatured: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const galleryItemSchema = new Schema<IGalleryItem>(
  {
    clinicId: {
      type: Schema.Types.ObjectId,
      ref: "Clinic",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    alt: {
      type: String,
      required: true,
      trim: true,
    },
    imageUrl: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ["Clinic & Operatory", "Dental Procedures", "Sterilization & Safety", "Patient Smiles"],
      default: "Clinic & Operatory",
    },
    isFeatured: {
      type: Boolean,
      default: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const GalleryItem =
  (mongoose.models.GalleryItem as Model<IGalleryItem>) ||
  mongoose.model<IGalleryItem>("GalleryItem", galleryItemSchema);

