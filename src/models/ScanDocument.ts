import mongoose, { Schema, Document, Model } from "mongoose";

export interface IScanField<T = string | number | undefined> {
  value?: T;
  confidence: number; // 0 to 100
  flag?: "high" | "medium" | "low" | "uncertain" | "missing";
}

export interface IBoxCoordinates {
  x: number; // percentage 0 - 100
  y: number; // percentage 0 - 100
  width: number; // percentage 0 - 100
  height: number; // percentage 0 - 100
}

export interface IScanEntry {
  entryIndex: number;
  boxIndex?: number;
  colIndex?: number;
  rowIndex?: number;
  boxCoordinates?: IBoxCoordinates;
  croppedBoxUrl?: string;
  rawText?: string;
  status: "pending" | "approved" | "rejected" | "saved";
  unreadableFields?: string[];
  fields: {
    sNo?: IScanField<string | number>;
    daily?: IScanField<string | number>;
    fullName: IScanField<string>;
    age: IScanField<number>;
    gender: IScanField<"Male" | "Female" | "Other">;
    phone: IScanField<string>;
    address?: IScanField<string>;
    visitDate: IScanField<string>;
    patientCode: IScanField<string>;
    disease?: IScanField<string>;
    chiefComplaint?: IScanField<string>;
    treatment: IScanField<string>;
    dentalNotes: IScanField<string>;
    prescribedTreatment: IScanField<string>;
    prescribedMedication?: IScanField<string>;
    cashRs?: IScanField<number>;
    cashPaise?: IScanField<string | number>;
    creditRs?: IScanField<number>;
    creditPaise?: IScanField<string | number>;
    fee?: IScanField<number>;
    amount: IScanField<number>;
    paymentStatus: IScanField<"paid" | "partial" | "unpaid">;
    followUpDate: IScanField<string>;
    nextAppointmentDate?: IScanField<string>;
    remarks?: IScanField<string>;
    extraFields?: Record<string, any>;
  };
  confidenceScores?: Record<string, number>;
  savedPatientId?: mongoose.Types.ObjectId;
  savedPatientCode?: string;
  savedAppointmentId?: mongoose.Types.ObjectId;
  duplicateMatch?: {
    patientId: mongoose.Types.ObjectId;
    patientCode: string;
    fullName: string;
    phone: string;
    matchReason: string;
    lastVisit?: Date;
  };
  rejectionReason?: string;
}

export interface ILayoutMetadata {
  layoutType: "COLUMN_BASED" | "BOX_BASED" | "FREE_FORM" | "MIXED_LAYOUT";
  confidence: number;
  columnsDetected: number;
  rowsDetected: number;
  regionsDetected: number;
  totalCellsDetected?: number;
  totalRowsDetected?: number;
  columnDividers?: number[];
  rowDividers?: number[];
  requiresManualReview: boolean;
  detectedHeaders?: string[];
  qualityAssessment?: {
    sharpness: number;
    brightness: number;
    contrast: number;
    isBlurry: boolean;
    isTooDark?: boolean;
    isTooBright?: boolean;
    qualityScore: number;
  };
}

export interface IScanDocument extends Document {
  clinicId: mongoose.Types.ObjectId;
  batchId?: mongoose.Types.ObjectId;
  pageNumber?: number;
  fileName: string;
  storedFileName: string;
  imageBase64?: string;
  fileSize: number;
  mimeType: string;
  status:
    | "uploaded"
    | "processing"
    | "extraction_completed"
    | "needs_review"
    | "partially_approved"
    | "approved"
    | "completed"
    | "failed";
  ocrEngine: "tesseract" | "gemini" | "hybrid" | "local" | "apinex";
  language: "mixed" | "eng" | "hin";
  layoutType: "COLUMN_BASED" | "BOX_BASED" | "FREE_FORM" | "MIXED_LAYOUT" | "grid_boxes" | "table_rows";
  layoutMetadata?: ILayoutMetadata;
  columnsDetected: number;
  readingOrder: "column_first" | "row_first";
  templateId?: mongoose.Types.ObjectId;
  preprocessingSettings?: {
    brightness?: number;
    contrast?: number;
    grayscale?: boolean;
    rotation?: number;
    sharpen?: boolean;
  };
  detectedCount: number;
  approvedCount: number;
  rejectedCount: number;
  entries: IScanEntry[];
  errorMessage?: string;
  uploadedBy?: mongoose.Types.ObjectId;
  uploadedByName: string;
  createdAt: Date;
  updatedAt: Date;
}

const scanFieldSchema = new Schema(
  {
    value: Schema.Types.Mixed,
    confidence: { type: Number, default: 0, min: 0, max: 100 },
    flag: {
      type: String,
      enum: ["high", "medium", "low", "uncertain", "missing"],
      default: "medium",
    },
  },
  { _id: false }
);

const boxCoordinatesSchema = new Schema(
  {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    width: { type: Number, default: 100 },
    height: { type: Number, default: 100 },
  },
  { _id: false }
);

const scanEntrySchema = new Schema<IScanEntry>(
  {
    entryIndex: { type: Number, required: true },
    boxIndex: { type: Number },
    colIndex: { type: Number },
    rowIndex: { type: Number },
    boxCoordinates: { type: boxCoordinatesSchema },
    croppedBoxUrl: { type: String },
    rawText: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "saved"],
      default: "pending",
    },
    unreadableFields: [{ type: String }],
    confidenceScores: { type: Schema.Types.Mixed },
    fields: {
      sNo: { type: scanFieldSchema },
      daily: { type: scanFieldSchema, default: () => ({ confidence: 0, flag: "missing" }) },
      fullName: { type: scanFieldSchema, required: true },
      age: { type: scanFieldSchema, default: () => ({ confidence: 0, flag: "missing" }) },
      gender: { type: scanFieldSchema, default: () => ({ confidence: 0, flag: "missing" }) },
      phone: { type: scanFieldSchema, default: () => ({ confidence: 0, flag: "missing" }) },
      address: { type: scanFieldSchema, default: () => ({ confidence: 0, flag: "missing" }) },
      visitDate: { type: scanFieldSchema, default: () => ({ confidence: 0, flag: "missing" }) },
      patientCode: { type: scanFieldSchema, default: () => ({ confidence: 0, flag: "missing" }) },
      disease: { type: scanFieldSchema, default: () => ({ confidence: 0, flag: "missing" }) },
      chiefComplaint: { type: scanFieldSchema, default: () => ({ confidence: 0, flag: "missing" }) },
      treatment: { type: scanFieldSchema, default: () => ({ confidence: 0, flag: "missing" }) },
      dentalNotes: { type: scanFieldSchema, default: () => ({ confidence: 0, flag: "missing" }) },
      prescribedTreatment: { type: scanFieldSchema, default: () => ({ confidence: 0, flag: "missing" }) },
      prescribedMedication: { type: scanFieldSchema, default: () => ({ confidence: 0, flag: "missing" }) },
      cashRs: { type: scanFieldSchema, default: () => ({ confidence: 0, flag: "missing" }) },
      cashPaise: { type: scanFieldSchema, default: () => ({ confidence: 0, flag: "missing" }) },
      creditRs: { type: scanFieldSchema, default: () => ({ confidence: 0, flag: "missing" }) },
      creditPaise: { type: scanFieldSchema, default: () => ({ confidence: 0, flag: "missing" }) },
      fee: { type: scanFieldSchema, default: () => ({ confidence: 0, flag: "missing" }) },
      amount: { type: scanFieldSchema, default: () => ({ confidence: 0, flag: "missing" }) },
      paymentStatus: { type: scanFieldSchema, default: () => ({ confidence: 0, flag: "missing" }) },
      followUpDate: { type: scanFieldSchema, default: () => ({ confidence: 0, flag: "missing" }) },
      nextAppointmentDate: { type: scanFieldSchema, default: () => ({ confidence: 0, flag: "missing" }) },
      remarks: { type: scanFieldSchema, default: () => ({ confidence: 0, flag: "missing" }) },
      extraFields: { type: Schema.Types.Mixed },
    },
    savedPatientId: { type: Schema.Types.ObjectId, ref: "Patient" },
    savedPatientCode: { type: String },
    savedAppointmentId: { type: Schema.Types.ObjectId, ref: "Appointment" },
    duplicateMatch: {
      patientId: { type: Schema.Types.ObjectId, ref: "Patient" },
      patientCode: { type: String },
      fullName: { type: String },
      phone: { type: String },
      matchReason: { type: String },
      lastVisit: { type: Date },
    },
    rejectionReason: { type: String },
  },
  { _id: true }
);

const scanDocumentSchema = new Schema<IScanDocument>(
  {
    clinicId: {
      type: Schema.Types.ObjectId,
      ref: "Clinic",
      required: true,
      index: true,
    },
    batchId: {
      type: Schema.Types.ObjectId,
      ref: "ScanBatch",
      index: true,
    },
    pageNumber: {
      type: Number,
      default: 1,
    },
    fileName: { type: String, required: true },
    storedFileName: { type: String, required: true },
    imageBase64: { type: String },
    fileSize: { type: Number, required: true },
    mimeType: { type: String, required: true },
    status: {
      type: String,
      enum: [
        "uploaded",
        "processing",
        "extraction_completed",
        "needs_review",
        "partially_approved",
        "approved",
        "completed",
        "failed",
      ],
      default: "uploaded",
      index: true,
    },
    ocrEngine: {
      type: String,
      enum: ["tesseract", "gemini", "hybrid", "local", "apinex"],
      default: "apinex",
    },
    language: {
      type: String,
      enum: ["mixed", "eng", "hin"],
      default: "mixed",
    },
    layoutType: {
      type: String,
      enum: ["COLUMN_BASED", "BOX_BASED", "FREE_FORM", "MIXED_LAYOUT", "grid_boxes", "table_rows"],
      default: "COLUMN_BASED",
    },
    layoutMetadata: {
      layoutType: { type: String },
      confidence: { type: Number, default: 0.9 },
      columnsDetected: { type: Number },
      rowsDetected: { type: Number },
      regionsDetected: { type: Number },
      totalCellsDetected: { type: Number },
      totalRowsDetected: { type: Number },
      columnDividers: [{ type: Number }],
      rowDividers: [{ type: Number }],
      requiresManualReview: { type: Boolean, default: false },
      detectedHeaders: [{ type: String }],
      qualityAssessment: { type: Schema.Types.Mixed },
    },
    columnsDetected: { type: Number, default: 2 },
    readingOrder: {
      type: String,
      enum: ["column_first", "row_first"],
      default: "column_first",
    },
    templateId: { type: Schema.Types.ObjectId, ref: "RegisterTemplate" },
    preprocessingSettings: {
      brightness: { type: Number, default: 0 },
      contrast: { type: Number, default: 0 },
      grayscale: { type: Boolean, default: false },
      rotation: { type: Number, default: 0 },
      sharpen: { type: Boolean, default: false },
    },
    detectedCount: { type: Number, default: 0 },
    approvedCount: { type: Number, default: 0 },
    rejectedCount: { type: Number, default: 0 },
    entries: [scanEntrySchema],
    errorMessage: { type: String },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User" },
    uploadedByName: { type: String, default: "Staff" },
  },
  {
    timestamps: true,
  }
);

// Pre-save tenant validation hook
scanDocumentSchema.pre("save", function () {
  if (!this.clinicId) {
    throw new Error("clinicId is required for ScanDocument");
  }
});

export const ScanDocument =
  (mongoose.models.ScanDocument as Model<IScanDocument>) ||
  mongoose.model<IScanDocument>("ScanDocument", scanDocumentSchema);
