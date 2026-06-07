import mongoose, { Document, Schema, Model } from "mongoose";

export interface ITreatment extends Document {
  clinicId?: mongoose.Types.ObjectId;
  patientId: Schema.Types.ObjectId;
  appointmentId?: Schema.Types.ObjectId | null;

  treatmentName: string;
  diagnosis: string;
  toothNumber: string;

  notes?: string;

  cost: number;
  paidAmount: number;
  paymentStatus: "paid" | "partial" | "unpaid";

  status: "planned" | "in_progress" | "completed" | "cancelled";
  deletedAt?: Date | null;
  deletedBy?: mongoose.Types.ObjectId | null;

  createdAt: Date;
  updatedAt: Date;
}

export function computePaymentFields(cost: number, paidAmount?: number | null | string) {
  let parsedCost = Number(cost || 0);
  if (Number.isNaN(parsedCost) || parsedCost < 0) parsedCost = 0;

  let actualPaid: number;
  if (paidAmount === undefined || paidAmount === null || paidAmount === "" || (typeof paidAmount === "number" && Number.isNaN(paidAmount))) {
    actualPaid = parsedCost;
  } else {
    actualPaid = Number(paidAmount);
    if (Number.isNaN(actualPaid) || actualPaid < 0) actualPaid = 0;
  }

  let paymentStatus: "paid" | "partial" | "unpaid" = "unpaid";
  if (actualPaid >= parsedCost) {
    paymentStatus = "paid";
  } else if (actualPaid > 0 && actualPaid < parsedCost) {
    paymentStatus = "partial";
  } else {
    paymentStatus = "unpaid";
  }

  return {
    cost: parsedCost,
    paidAmount: actualPaid,
    paymentStatus,
  };
}

const treatmentSchema = new Schema<ITreatment>(
  {
    clinicId: {
      type: Schema.Types.ObjectId,
      ref: "Clinic",
      required: false,
      index: true,
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true,
    },

    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: "Appointment",
      required: false,
      index: true,
      default: null,
    },

    treatmentName: {
      type: String,
      required: true,
      trim: true,
    },

    diagnosis: {
      type: String,
      required: true,
      trim: true,
    },

    toothNumber: {
      type: String,
      required: true,
      trim: true,
    },

    notes: {
      type: String,
      default: "",
      trim: true,
    },

    cost: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    paidAmount: {
      type: Number,
      min: 0,
      default: 0,
    },

    paymentStatus: {
      type: String,
      enum: ["paid", "partial", "unpaid"],
      default: "unpaid",
    },

    status: {
      type: String,
      enum: ["planned", "in_progress", "completed", "cancelled"],
      default: "planned",
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
  },
  {
    timestamps: true,
  }
);

export const Treatment =
  (mongoose.models.Treatment as Model<ITreatment>) ||
  mongoose.model<ITreatment>("Treatment", treatmentSchema);