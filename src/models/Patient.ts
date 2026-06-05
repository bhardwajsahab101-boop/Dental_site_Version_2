import mongoose, { Schema, Document, Model } from "mongoose";

export type PatientGender = "Male" | "Female" | "Other";

export interface IPatient extends Document {
    fullName: string;
    patientCode: string;

    phone: string;
    email?: string;

    age?: number;
    gender?: PatientGender;
    address?: string;
    medicalNotes?: string;
    allergies?: string;
    createdAt: Date;
    updatedAt: Date;
}

const patientSchema = new Schema<IPatient>(
    {
        fullName: {
            type: String,
            required: true,
            trim: true,
        },
        patientCode: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        phone: {
            trim: true,
            type: String,
            required: true,
        },

        email: {
            type: String,
            trim: true,
        },
        age: {
            type: Number,
            min: 0,
        },
        gender: {
            type: String,
            enum: ["Male", "Female", "Other"],
        },
        address: {
            type: String,
            trim: true,
        },
        medicalNotes: {
            type: String,
            trim: true,
        },
        allergies: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

export const Patient =
    (mongoose.models.Patient as Model<IPatient>) ||
    mongoose.model<IPatient>("Patient", patientSchema);

