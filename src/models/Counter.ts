import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICounter extends Document {
  name: string;
  sequence: number;
}

const counterSchema = new Schema<ICounter>({
  name: { type: String, required: true, unique: true },
  sequence: { type: Number, required: true, default: 0 },
});

export const Counter =
  (mongoose.models.Counter as Model<ICounter>) ||
  mongoose.model<ICounter>("Counter", counterSchema);
