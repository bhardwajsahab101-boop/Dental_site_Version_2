import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAppointment extends Document {
  clinicId: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
  service: string;
  appointmentDate: Date;
  appointmentTime: string;
  notes?: string;
  status: "requested" | "confirmed" | "arrived" | "in_treatment" | "completed" | "no_show" | "cancelled";
  deletedAt?: Date | null;
  deletedBy?: mongoose.Types.ObjectId | null;
  createdBy?: mongoose.Types.ObjectId | null;
  updatedBy?: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

export type AppointmentStatus = IAppointment["status"];


const appointmentSchema = new Schema<IAppointment>(
  {
    clinicId: {
      type: Schema.Types.ObjectId,
      ref: "Clinic",
      required: true,
      index: true,
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true,
    },

    service: {
      type: String,
      required: true,
      trim: true,
    },

    appointmentDate: {
      type: Date,
      required: true,
    },

    appointmentTime: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["requested", "confirmed", "arrived", "in_treatment", "completed", "no_show", "cancelled"],
      default: "requested",
    },

    notes: {
      type: String,
      default: "",
      trim: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    deletedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to prevent orphaned documents and cross-tenant access leaks
appointmentSchema.pre("save", function () {
  if (!this.clinicId) {
    throw new Error("clinicId is required for Appointment");
  }
});

export const Appointment =
  (mongoose.models.Appointment as Model<IAppointment>) ||
  mongoose.model<IAppointment>("Appointment", appointmentSchema);
