import mongoose, { Schema, Document, Model } from "mongoose";
 
export interface ISaaSSettings extends Document {
  allowRegistrations: boolean;
  maintenanceMode: boolean;
  defaultTrialDays: number;
  createdAt: Date;
  updatedAt: Date;
}
 
const saaSSettingsSchema = new Schema<ISaaSSettings>(
  {
    allowRegistrations: {
      type: Boolean,
      default: true,
      required: true,
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
      required: true,
    },
    defaultTrialDays: {
      type: Number,
      default: 14,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);
 
export const SaaSSettings =
  (mongoose.models.SaaSSettings as Model<ISaaSSettings>) ||
  mongoose.model<ISaaSSettings>("SaaSSettings", saaSSettingsSchema);
 
export async function getSaaSSettings(): Promise<ISaaSSettings> {
  let settings = await SaaSSettings.findOne();
  if (!settings) {
    try {
      settings = await SaaSSettings.create({
        allowRegistrations: true,
        maintenanceMode: false,
        defaultTrialDays: 14,
      });
    } catch (err) {
      // Return a mock object if DB write fails during concurrent initialization
      return {
        allowRegistrations: true,
        maintenanceMode: false,
        defaultTrialDays: 14,
      } as any;
    }
  }
  return settings;
}
