import mongoose from "mongoose";
import { Patient } from "../../models/Patient";
import { Appointment } from "../../models/Appointment";

export interface DuplicateMatchResult {
  patientId: mongoose.Types.ObjectId;
  patientCode: string;
  fullName: string;
  phone: string;
  matchReason: string;
  matchConfidence: "exact" | "high" | "possible";
  lastVisit?: Date;
  existingAge?: number;
  existingGender?: string;
  appointmentCount?: number;
}

/**
 * Searches for existing patients in the same clinic that potentially match
 * extracted candidate fields.
 */
export async function findDuplicatePatient(
  clinicId: string | mongoose.Types.ObjectId,
  candidate: {
    fullName?: string;
    phone?: string;
    patientCode?: string;
    age?: number;
  }
): Promise<DuplicateMatchResult | null> {
  const clinicObjectId = typeof clinicId === "string" ? new mongoose.Types.ObjectId(clinicId) : clinicId;

  const cleanedPhone = candidate.phone ? candidate.phone.replace(/\D/g, "") : "";
  const cleanedName = candidate.fullName ? candidate.fullName.trim() : "";
  const cleanedCode = candidate.patientCode ? candidate.patientCode.trim().toUpperCase() : "";

  // 1. Direct match on Patient Code
  if (cleanedCode) {
    const codeMatch = await Patient.findOne({
      clinicId: clinicObjectId,
      deletedAt: null,
      patientCode: cleanedCode,
    }).lean();

    if (codeMatch) {
      const lastAppt = await Appointment.findOne({
        clinicId: clinicObjectId,
        patientId: codeMatch._id,
      })
        .sort({ appointmentDate: -1 })
        .lean();

      return {
        patientId: codeMatch._id as mongoose.Types.ObjectId,
        patientCode: codeMatch.patientCode,
        fullName: codeMatch.fullName,
        phone: codeMatch.phone,
        matchReason: `Exact Patient ID match: ${cleanedCode}`,
        matchConfidence: "exact",
        lastVisit: lastAppt?.appointmentDate,
        existingAge: codeMatch.age,
        existingGender: codeMatch.gender,
      };
    }
  }

  // 2. High confidence match on Phone Number (digits only, >= 7 digits)
  if (cleanedPhone.length >= 7) {
    // Check phone regex or substring
    const lastDigits = cleanedPhone.slice(-10);
    const phoneCandidates = await Patient.find({
      clinicId: clinicObjectId,
      deletedAt: null,
    }).lean();

    for (const p of phoneCandidates) {
      const pClean = (p.phone || "").replace(/\D/g, "");
      if (pClean && (pClean.endsWith(lastDigits) || lastDigits.endsWith(pClean))) {
        // Phone matches
        const lastAppt = await Appointment.findOne({
          clinicId: clinicObjectId,
          patientId: p._id,
        })
          .sort({ appointmentDate: -1 })
          .lean();

        const nameMatches = cleanedName && p.fullName.toLowerCase() === cleanedName.toLowerCase();

        return {
          patientId: p._id as mongoose.Types.ObjectId,
          patientCode: p.patientCode,
          fullName: p.fullName,
          phone: p.phone,
          matchReason: nameMatches
            ? `Exact phone and name match: ${p.phone} (${p.fullName})`
            : `Phone number matches existing patient: ${p.phone} (${p.fullName})`,
          matchConfidence: nameMatches ? "exact" : "high",
          lastVisit: lastAppt?.appointmentDate,
          existingAge: p.age,
          existingGender: p.gender,
        };
      }
    }
  }

  // 3. Name match with matching Age/Gender or fuzzy match
  if (cleanedName && cleanedName.length > 2) {
    const nameMatches = await Patient.find({
      clinicId: clinicObjectId,
      deletedAt: null,
      fullName: { $regex: new RegExp(`^${cleanedName.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")}$`, "i") },
    }).lean();

    if (nameMatches.length > 0) {
      const first = nameMatches[0];
      const ageMatches = candidate.age && first.age && Math.abs(candidate.age - first.age) <= 2;

      const lastAppt = await Appointment.findOne({
        clinicId: clinicObjectId,
        patientId: first._id,
      })
        .sort({ appointmentDate: -1 })
        .lean();

      return {
        patientId: first._id as mongoose.Types.ObjectId,
        patientCode: first.patientCode,
        fullName: first.fullName,
        phone: first.phone,
        matchReason: ageMatches
          ? `Same patient name & approximate age (${first.fullName}, ~${first.age} yrs)`
          : `Patient with same name exists (${first.fullName})`,
        matchConfidence: ageMatches ? "high" : "possible",
        lastVisit: lastAppt?.appointmentDate,
        existingAge: first.age,
        existingGender: first.gender,
      };
    }
  }

  return null;
}
