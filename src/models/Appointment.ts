import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAppointment extends Document {
  patientId: mongoose.Types.ObjectId;
  service: string;
  appointmentDate: Date;
  appointmentTime: string;
  notes?: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
}

export type AppointmentStatus = IAppointment["status"];


const appointmentSchema = new Schema<IAppointment>(
  {
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
      enum: ["pending", "confirmed", "completed", "cancelled"],
      default: "pending",
    },

    notes: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Appointment =
  (mongoose.models.Appointment as Model<IAppointment>) ||
  mongoose.model<IAppointment>("Appointment", appointmentSchema);
