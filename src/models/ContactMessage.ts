import mongoose, { Schema, Document, Model } from "mongoose";

export interface IContactMessage extends Document {
  clinicId: mongoose.Types.ObjectId;
  fullName: string;
  email: string;
  phone?: string;
  message: string;
  status: "unread" | "read" | "replied" | "archived";
  followUpNotes?: string;
  updatedBy?: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const contactMessageSchema = new Schema<IContactMessage>(
  {
    clinicId: {
      type: Schema.Types.ObjectId,
      ref: "Clinic",
      required: true,
      index: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      default: "",
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["unread", "read", "replied", "archived"],
      default: "unread",
    },
    followUpNotes: {
      type: String,
      default: "",
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

export const ContactMessage =
  (mongoose.models.ContactMessage as Model<IContactMessage>) ||
  mongoose.model<IContactMessage>("ContactMessage", contactMessageSchema);
