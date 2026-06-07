import mongoose, { Document, Schema, Model } from "mongoose";

export interface IClinicSettings extends Document {
  name: string;
  logo?: string;
  phone: string;
  email: string;
  address: string;
  gstNumber?: string;
}

const clinicSettingsSchema = new Schema<IClinicSettings>(
  {
    name: {
      type: String,
      required: true,
      default: "Dental Clinic",
    },
    logo: {
      type: String,
      default: "",
    },
    phone: {
      type: String,
      required: true,
      default: "+91 99999 99999",
    },
    email: {
      type: String,
      required: true,
      default: "support@clinic.com",
    },
    address: {
      type: String,
      required: true,
      default: "Clinic Address",
    },
    gstNumber: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

export const ClinicSettings =
  (mongoose.models.ClinicSettings as Model<IClinicSettings>) ||
  mongoose.model<IClinicSettings>("ClinicSettings", clinicSettingsSchema);
