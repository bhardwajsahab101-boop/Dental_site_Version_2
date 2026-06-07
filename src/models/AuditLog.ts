import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAuditLog extends Document {
  clinicId?: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  userName: string;
  userRole: string;
  action: string;
  details: string;
  targetId?: mongoose.Types.ObjectId;
  targetType?: "Patient" | "Appointment" | "Treatment" | "User";
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    clinicId: {
      type: Schema.Types.ObjectId,
      ref: "Clinic",
      required: false,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    userName: {
      type: String,
      required: true,
      trim: true,
    },
    userRole: {
      type: String,
      required: true,
      trim: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
    },
    details: {
      type: String,
      required: true,
      trim: true,
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: false,
      index: true,
    },
    targetType: {
      type: String,
      enum: ["Patient", "Appointment", "Treatment", "User"],
      required: false,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const AuditLog =
  (mongoose.models.AuditLog as Model<IAuditLog>) ||
  mongoose.model<IAuditLog>("AuditLog", auditLogSchema);
