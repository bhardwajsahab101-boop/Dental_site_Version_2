import mongoose, { Schema, Document, Model } from "mongoose";
 
export interface IContactMessage extends Document {
  clinicId: mongoose.Types.ObjectId;
  fullName: string;
  email: string;
  message: string;
  status: "unread" | "read" | "replied";
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
    message: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["unread", "read", "replied"],
      default: "unread",
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
contactMessageSchema.pre("save", function () {
  if (!this.clinicId) {
    throw new Error("clinicId is required for ContactMessage");
  }
});
 
export const ContactMessage =
  (mongoose.models.ContactMessage as Model<IContactMessage>) ||
  mongoose.model<IContactMessage>("ContactMessage", contactMessageSchema);
