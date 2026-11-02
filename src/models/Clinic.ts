import mongoose, { Schema, Document, Model } from "mongoose";

export interface IClinic extends Document {
  slug: string;
  name: string;
  alternateName?: string;
  email: string;
  phone: string;
  whatsappPhone?: string;
  address: string;
  logo?: string;
  gstNumber?: string;
  googleMapsUrl?: string;
  googleBusinessUrl?: string;
  emergencyPhone?: string;
  status: "active" | "suspended" | "trial";
  trialEndsAt: Date;
  subscriptionPlan?: string;
  subscriptionStatus?: string;
  subscriptionStartDate?: Date;
  subscriptionEndDate?: Date;
  isActive?: boolean;
  productType?: string;
  lastSubscriptionWarningDaysLeft?: number;
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
    alternateName: {
      type: String,
      default: "A.K. Sharma Dental Hospital",
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
    whatsappPhone: {
      type: String,
      default: "",
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
    googleMapsUrl: {
      type: String,
      default: "",
      trim: true,
    },
    googleBusinessUrl: {
      type: String,
      default: "",
      trim: true,
    },
    emergencyPhone: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "suspended", "trial"],
      default: "active",
      required: true,
    },
    trialEndsAt: {
      type: Date,
      default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      required: true,
    },
    subscriptionPlan: {
      type: String,
      default: "Professional",
    },
    subscriptionStatus: {
      type: String,
      default: "active",
    },
    subscriptionStartDate: {
      type: Date,
      default: () => new Date(),
    },
    subscriptionEndDate: {
      type: Date,
      default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    productType: {
      type: String,
      default: "DentalOS",
    },
    lastSubscriptionWarningDaysLeft: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const Clinic =
  (mongoose.models.Clinic as Model<IClinic>) ||
  mongoose.model<IClinic>("Clinic", clinicSchema);
