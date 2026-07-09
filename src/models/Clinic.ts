import mongoose, { Schema, Document, Model } from "mongoose";
 
export interface IClinic extends Document {
  slug: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  logo?: string;
  gstNumber?: string;
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
    status: {
      type: String,
      enum: ["active", "suspended", "trial"],
      default: "trial",
      required: true,
    },
    trialEndsAt: {
      type: Date,
      default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
      required: true,
    },
    subscriptionPlan: {
      type: String,
      default: "Trial",
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
      default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
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
    },
  },
  {
    timestamps: true,
  }
);
 
export const Clinic =
  (mongoose.models.Clinic as Model<IClinic>) ||
  mongoose.model<IClinic>("Clinic", clinicSchema);
