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
    clinicId: mongoose.Types.ObjectId;
    fullName: string;
    patientCode: string;

    phone: string;
    email?: string;

    age?: number;
    gender?: PatientGender;
    address?: string;
    medicalNotes?: string;
    allergies?: string;
    // Physical Register Mode fields
    sNo?: string | number;
    daily?: string | number;
    disease?: string;
    treatment?: string;
    cashRs?: number;
    cashPaise?: string | number;
    creditRs?: number;
    creditPaise?: string | number;
    remarks?: string;
    visitDate?: Date;
    documents?: IPatientDocument[];
    deletedAt?: Date | null;
    deletedBy?: mongoose.Types.ObjectId | null;
    createdBy?: mongoose.Types.ObjectId | null;
    updatedBy?: mongoose.Types.ObjectId | null;
    createdAt: Date;
    updatedAt: Date;
}

const patientSchema = new Schema<IPatient>(
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
            set: function(val: any) {
                if (val === null || val === undefined) return "Patient";
                if (typeof val === "object") {
                    return ("value" in val && val.value) ? String(val.value).trim() || "Patient" : "Patient";
                }
                const s = String(val).trim();
                return s || "Patient";
            },
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
            set: function(val: any) {
                if (val === null || val === undefined || val === "") return "Not Provided";
                if (typeof val === "object") {
                    const raw = ("value" in val && val.value) ? String(val.value).trim() : "";
                    const digits = raw.replace(/\D/g, "");
                    return digits.length >= 7 ? digits.slice(-10) : "Not Provided";
                }
                const digits = String(val).replace(/\D/g, "");
                return digits.length >= 7 ? digits.slice(-10) : "Not Provided";
            },
        },
        email: {
            type: String,
            trim: true,
            set: function(val: any) {
                if (val === null || val === undefined || val === "") return undefined;
                if (typeof val === "object") {
                    return ("value" in val && val.value) ? String(val.value).trim() : undefined;
                }
                const s = String(val).trim();
                return s || undefined;
            },
        },
        age: {
            type: Number,
            min: 0,
            set: function(val: any) {
                if (val === null || val === undefined || val === "") return undefined;
                let raw = val;
                if (typeof raw === "object") {
                    raw = ("value" in raw && raw.value !== undefined) ? raw.value : undefined;
                }
                if (raw === null || raw === undefined || raw === "") return undefined;
                if (typeof raw === "number") {
                    return (!isNaN(raw) && isFinite(raw) && raw >= 0) ? raw : undefined;
                }
                const cleaned = String(raw).replace(/[^0-9.-]/g, "").trim();
                if (!cleaned) return undefined;
                const num = Number(cleaned);
                return (!isNaN(num) && isFinite(num) && num >= 0) ? num : undefined;
            },
        },
        gender: {
            type: String,
            enum: ["Male", "Female", "Other"],
            set: function(val: any) {
                if (val === null || val === undefined || val === "") return undefined;
                let raw = val;
                if (typeof raw === "object") {
                    raw = ("value" in raw && raw.value !== undefined) ? raw.value : undefined;
                }
                if (raw === null || raw === undefined || raw === "") return undefined;
                const s = String(raw).trim().toLowerCase();
                if (s === "male" || s === "m" || s.startsWith("m/") || s === "man" || s === "boy") return "Male";
                if (s === "female" || s === "f" || s.startsWith("f/") || s === "woman" || s === "girl") return "Female";
                if (s === "other" || s === "o") return "Other";
                return undefined;
            },
        },
        address: {
            type: String,
            trim: true,
            set: function(val: any) {
                if (val === null || val === undefined || val === "") return undefined;
                let raw = val;
                if (typeof raw === "object") {
                    raw = ("value" in raw && raw.value !== undefined) ? raw.value : undefined;
                }
                if (raw === null || raw === undefined || raw === "") return undefined;
                const s = String(raw).trim();
                return s || undefined;
            },
        },
        medicalNotes: {
            type: String,
            trim: true,
        },
        allergies: {
            type: String,
            trim: true,
        },
        // Physical Register Mode optional fields
        sNo: {
            type: Schema.Types.Mixed,
        },
        daily: {
            type: Schema.Types.Mixed,
        },
        disease: {
            type: String,
            trim: true,
        },
        treatment: {
            type: String,
            trim: true,
        },
        cashRs: {
            type: Number,
            min: 0,
        },
        cashPaise: {
            type: Schema.Types.Mixed,
        },
        creditRs: {
            type: Number,
            min: 0,
        },
        creditPaise: {
            type: Schema.Types.Mixed,
        },
        remarks: {
            type: String,
            trim: true,
        },
        visitDate: {
            type: Date,
            index: true,
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
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null,
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
patientSchema.pre("save", function () {
    if (!this.clinicId) {
        throw new Error("clinicId is required for Patient");
    }
});

// Compound unique index for multi-tenant patient code uniqueness
patientSchema.index({ clinicId: 1, patientCode: 1 }, { unique: true });

export const Patient =
    (mongoose.models.Patient as Model<IPatient>) ||
    mongoose.model<IPatient>("Patient", patientSchema);
