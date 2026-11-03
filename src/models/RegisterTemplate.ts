import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBoxDefinition {
  boxIndex: number;
  col: number;
  row: number;
  x: number; // Percentage 0 - 100
  y: number; // Percentage 0 - 100
  width: number; // Percentage 0 - 100
  height: number; // Percentage 0 - 100
  label?: string;
}

export interface IRegisterTemplate extends Document {
  clinicId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  columnsCount: number;
  rowsPerColumn: number;
  totalBoxes: number;
  readingOrder: "column_first" | "row_first";
  boxes: IBoxDefinition[];
  fieldLayout: string[]; // e.g. ["Name", "Age/Sex", "Phone", "Treatment", "Fee", "Notes"]
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const boxDefinitionSchema = new Schema<IBoxDefinition>(
  {
    boxIndex: { type: Number, required: true },
    col: { type: Number, required: true },
    row: { type: Number, required: true },
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    label: { type: String },
  },
  { _id: false }
);

const registerTemplateSchema = new Schema<IRegisterTemplate>(
  {
    clinicId: {
      type: Schema.Types.ObjectId,
      ref: "Clinic",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    columnsCount: { type: Number, required: true, default: 2, min: 1, max: 8 },
    rowsPerColumn: { type: Number, required: true, default: 4, min: 1, max: 20 },
    totalBoxes: { type: Number, required: true, default: 8 },
    readingOrder: {
      type: String,
      enum: ["column_first", "row_first"],
      default: "column_first",
    },
    boxes: [boxDefinitionSchema],
    fieldLayout: [{ type: String }],
    isDefault: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

registerTemplateSchema.pre("save", function () {
  if (!this.clinicId) {
    throw new Error("clinicId is required for RegisterTemplate");
  }
  this.totalBoxes = this.columnsCount * this.rowsPerColumn;
});

export const RegisterTemplate =
  (mongoose.models.RegisterTemplate as Model<IRegisterTemplate>) ||
  mongoose.model<IRegisterTemplate>("RegisterTemplate", registerTemplateSchema);
