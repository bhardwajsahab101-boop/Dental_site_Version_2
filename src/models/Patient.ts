import mongoose, { Schema, Document, Model } from "mongoose";

export type PatientGender = "Male" | "Female" | "Other";

export interface IPatientDocument {
    name: string;
    category: "X-Rays" | "Reports" | "Prescriptions" | "Photos" | "Other";
    url: string;
    uploadedAt: Date;
    uploadedBy: string;
}

export interface IPatient extends Document {
    clinicId?: mongoose.Types.ObjectId;
    fullName: string;
    patientCode: string;

    phone: string;
    email?: string;

    age?: number;
    gender?: PatientGender;
    address?: string;
    medicalNotes?: string;
    allergies?: string;
    documents?: IPatientDocument[];
    deletedAt?: Date | null;
    deletedBy?: mongoose.Types.ObjectId | null;
    createdAt: Date;
    updatedAt: Date;
}

const patientSchema = new Schema<IPatient>(
    {
        clinicId: {
            type: Schema.Types.ObjectId,
            ref: "Clinic",
            required: false,
            index: true,
        },
        fullName: {
            type: String,
            required: true,
            trim: true,
        },
        patientCode: {
            type: String,
            required: true,
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
        documents: [
            {
                name: { type: String, required: true },
                category: {
                    type: String,
                    enum: ["X-Rays", "Reports", "Prescriptions", "Photos", "Other"],
                    required: true,
                },
                url: { type: String, required: true },
                uploadedAt: { type: Date, default: Date.now },
                uploadedBy: { type: String, required: true },
            },
        ],
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

// Compound unique index for multi-tenant patient code uniqueness
patientSchema.index({ clinicId: 1, patientCode: 1 }, { unique: true });

export const Patient =
    (mongoose.models.Patient as Model<IPatient>) ||
    mongoose.model<IPatient>("Patient", patientSchema);
