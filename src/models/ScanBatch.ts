import mongoose, { Schema, Document, Model } from "mongoose";

export interface IScanBatch extends Document {
  clinicId: mongoose.Types.ObjectId;
  batchName: string;
  batchCode: string;
  totalPages: number;
  totalDetected: number;
  totalApproved: number;
  totalRejected: number;
  status:
    | "uploaded"
    | "processing"
    | "extraction_completed"
    | "needs_review"
    | "partially_approved"
    | "approved"
    | "failed";
  pages: mongoose.Types.ObjectId[];
  testMode: boolean;
  notes?: string;
  createdBy?: mongoose.Types.ObjectId;
  createdByName: string;
  createdAt: Date;
  updatedAt: Date;
}

const scanBatchSchema = new Schema<IScanBatch>(
  {
    clinicId: {
      type: Schema.Types.ObjectId,
      ref: "Clinic",
      required: true,
      index: true,
    },
    batchName: {
      type: String,
      required: true,
      trim: true,
    },
    batchCode: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    totalPages: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalDetected: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalApproved: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalRejected: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: [
        "uploaded",
        "processing",
        "extraction_completed",
        "needs_review",
        "partially_approved",
        "approved",
        "failed",
      ],
      default: "uploaded",
      index: true,
    },
    pages: [
      {
        type: Schema.Types.ObjectId,
        ref: "ScanDocument",
      },
    ],
    testMode: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    createdByName: {
      type: String,
      default: "Staff",
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save tenant validation hook
scanBatchSchema.pre("save", function () {
  if (!this.clinicId) {
    throw new Error("clinicId is required for ScanBatch");
  }
});

export const ScanBatch =
  (mongoose.models.ScanBatch as Model<IScanBatch>) ||
  mongoose.model<IScanBatch>("ScanBatch", scanBatchSchema);

