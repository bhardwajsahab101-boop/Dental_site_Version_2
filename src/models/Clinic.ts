import mongoose, { Schema, Document, Model } from "mongoose";
 
export interface IClinic extends Document {
  slug: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  logo?: string;
  gstNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}
 
const clinicSchema = new Schema<IClinic>(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      default: "default",
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    logo: {
      type: String,
      default: "",
    },
    gstNumber: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);
 
export const Clinic =
  (mongoose.models.Clinic as Model<IClinic>) ||
  mongoose.model<IClinic>("Clinic", clinicSchema);
