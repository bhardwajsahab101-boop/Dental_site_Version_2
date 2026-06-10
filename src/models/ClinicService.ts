import mongoose, { Schema, Document, Model } from "mongoose";

export interface IClinicService extends Document {
  clinicId: mongoose.Types.ObjectId;
  name: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const clinicServiceSchema = new Schema<IClinicService>(
  {
    clinicId: {
      type: Schema.Types.ObjectId,
      ref: "Clinic",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    active: {
      type: Boolean,
      default: true,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Enforce that service names should be unique per clinic
clinicServiceSchema.index({ clinicId: 1, name: 1 }, { unique: true });

export const ClinicService =
  (mongoose.models.ClinicService as Model<IClinicService>) ||
  mongoose.model<IClinicService>("ClinicService", clinicServiceSchema);

/**
 * Seeding helper to create default services for a clinic.
 * Uses findOneAndUpdate with upsert to prevent duplicates.
 */
export async function seedDefaultServicesForClinic(clinicId: string | mongoose.Types.ObjectId) {
  const defaultServices = [
    "Consultation",
    "Cleaning",
    "Root Canal Treatment",
    "Tooth Extraction",
    "Crown",
    "Bridge",
    "Implant",
    "Teeth Whitening",
  ];

  const targetClinicId = typeof clinicId === "string" ? new mongoose.Types.ObjectId(clinicId) : clinicId;

  for (const name of defaultServices) {
    await ClinicService.findOneAndUpdate(
      { clinicId: targetClinicId, name },
      { clinicId: targetClinicId, name, active: true },
      { upsert: true, new: true }
    );
  }
}
