import { createWorker } from "tesseract.js";
import path from "path";
import fs from "fs";
import { IScanEntry } from "../../models/ScanDocument";
import { findDuplicatePatient } from "./duplicateDetector";
import { generateGridBoxes, BoxGridItem } from "./boxDetector";
import { callAPInexRegisterExtraction, ExtractedPatient } from "./apinexClient";
import { runOpenCVGridDetection } from "./opencvDetector";

export interface OCRProcessingOptions {
  engine?: "tesseract" | "gemini" | "hybrid" | "local" | "apinex";
  language?: "mixed" | "eng" | "hin";
  clinicId: string;
  mimeType?: string;
  layoutType?: "grid_boxes" | "table_rows" | "COLUMN_BASED" | "BOX_BASED" | "FREE_FORM" | "MIXED_LAYOUT";
  columnsCount?: number;
  rowsPerColumn?: number;
  readingOrder?: "column_first" | "row_first";
  templateId?: string;
  testMode?: boolean;
}

// Dental terminology dictionary for phonetic & semantic validation
const DENTAL_TERMS: Record<string, string> = {
  rct: "Root Canal Treatment (RCT)",
  "root canal": "Root Canal Treatment (RCT)",
  scaling: "Dental Cleaning & Scaling",
  cleaning: "Dental Cleaning & Scaling",
  filling: "Tooth Composite Filling",
  extraction: "Tooth Extraction",
  implant: "Dental Implant",
  crown: "Dental Crown / Cap",
  bridge: "Crown & Bridge",
  denture: "Dentures",
  whitening: "Teeth Whitening",
  toothache: "Tooth Pain / Pulpitis",
  pain: "Dental Pain / Acute Consultation",
  abscess: "Dental Abscess Drainage",
  impaction: "Wisdom Tooth Impaction",
  gingivitis: "Gum Care / Gingivitis",
  bleeding: "Bleeding Gums Treatment",
  ortho: "Orthodontic Consultation",
  braces: "Orthodontic Braces",
  // Hindi transliterations & Devanagari terms
  "दांत दर्द": "Dental Pain / Acute Consultation",
  "दांत में दर्द": "Dental Pain / Acute Consultation",
  "सफाई": "Dental Cleaning & Scaling",
  "मसूड़े": "Gum Care / Bleeding Gums",
  "उखाड़ना": "Tooth Extraction",
  "तार": "Orthodontic Braces",
  "कैप": "Dental Crown / Cap",
  "बत्तीसी": "Complete Dentures",
};

/**
 * Normalizes and checks dental complaint from extracted text
 */
function normalizeDentalTreatment(rawText: string): { name: string; confidence: number } {
  const lower = rawText.toLowerCase();
  for (const [key, normalized] of Object.entries(DENTAL_TERMS)) {
    if (lower.includes(key)) {
      return { name: normalized, confidence: 92 };
    }
  }
  return { name: rawText.trim(), confidence: rawText.trim().length > 3 ? 75 : 40 };
}

/**
 * Validates and normalizes phone number
 */
function parsePhoneNumber(text: string): { phone?: string; confidence: number; flag: "high" | "medium" | "low" | "uncertain" | "missing" } {
  const digits = text.replace(/\D/g, "");

  if (digits.length === 10 && /^[6-9]\d{9}$/.test(digits)) {
    return { phone: digits, confidence: 95, flag: "high" };
  }

  if ((digits.length === 11 && digits.startsWith("0")) || (digits.length === 12 && digits.startsWith("91"))) {
    const trimmed = digits.slice(-10);
    if (/^[6-9]\d{9}$/.test(trimmed)) {
      return { phone: trimmed, confidence: 92, flag: "high" };
    }
  }

  // Ambiguous digit sequence (7-9 digits) - DO NOT confirm, flag as uncertain
  if (digits.length >= 7 && digits.length <= 11) {
    return { phone: digits, confidence: 45, flag: "uncertain" };
  }

  return { phone: undefined, confidence: 0, flag: "missing" };
}

/**
 * Parses age and gender from combinations like "35/M", "28 F", "42 Y / Male", "65 वर्ष पु."
 */
function parseAgeGender(text: string): {
  age?: number;
  ageConf: number;
  gender?: "Male" | "Female" | "Other";
  genConf: number;
} {
  let age: number | undefined;
  let ageConf = 0;
  let gender: "Male" | "Female" | "Other" | undefined;
  let genConf = 0;

  const ageMatch = text.match(/\b([1-9]\d?)\s*(?:yrs?|y|वर्ष|साल|\/|$|\s)/i);
  if (ageMatch) {
    const parsed = parseInt(ageMatch[1], 10);
    if (parsed > 0 && parsed <= 110) {
      age = parsed;
      ageConf = 88;
    }
  }

  if (/\b(female|fem|woman|f|महिला|स्त्री|म)\b/i.test(text)) {
    gender = "Female";
    genConf = 90;
  } else if (/\b(male|man|m|पुरुष|पु)\b/i.test(text)) {
    gender = "Male";
    genConf = 90;
  }

  return { age, ageConf, gender, genConf };
}

/**
 * Parses payment amount and payment status
 */
function parseAmount(text: string): {
  amount?: number;
  amountConf: number;
  paymentStatus?: "paid" | "partial" | "unpaid";
  statusConf: number;
} {
  const amountMatch = text.match(/(?:rs\.?|₹|inr)?\s*([0-9]{2,6})(?:\/|\.00|\s*₹|\s*rs)?/i);
  let amount: number | undefined;
  let amountConf = 0;
  let paymentStatus: "paid" | "partial" | "unpaid" = "unpaid";
  let statusConf = 0;

  if (amountMatch) {
    const parsed = parseInt(amountMatch[1], 10);
    if (parsed >= 50 && parsed <= 150000) {
      amount = parsed;
      amountConf = 85;
    }
  }

  if (/\b(paid|जमा|full|done)\b/i.test(text)) {
    paymentStatus = "paid";
    statusConf = 90;
  } else if (/\b(partial|bal|advance|adv)\b/i.test(text)) {
    paymentStatus = "partial";
    statusConf = 85;
  } else if (amount) {
    paymentStatus = "paid";
    statusConf = 70;
  }

  return { amount, amountConf, paymentStatus, statusConf };
}

/**
 * Parses date string in common register formats (DD/MM/YYYY, DD-MM-YY, etc.)
 */
function parseVisitDate(text: string): { date?: string; conf: number } {
  const dateMatch = text.match(/\b([0-3]?\d)[\/\-\.]([0-1]?\d)[\/\-\.](20\d\d|\d\d)\b/);
  if (dateMatch) {
    let day = dateMatch[1].padStart(2, "0");
    let month = dateMatch[2].padStart(2, "0");
    let year = dateMatch[3];
    if (year.length === 2) {
      year = "20" + year;
    }
    const iso = `${year}-${month}-${day}`;
    return { date: iso, conf: 90 };
  }
  return { date: undefined, conf: 0 };
}

/**
 * Parses the handwriting text inside a single box into a structured patient record
 */
export async function structureBoxText(
  rawBoxText: string,
  clinicId: string,
  boxInfo: BoxGridItem
): Promise<IScanEntry> {
  const lines = rawBoxText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 1);

  let fullName = "";
  let nameConfidence = 40;
  let rawAgeGender = "";
  let rawPhone = "";
  let rawTreatment = "";
  let rawAmount = "";
  let rawDate = "";
  let rawNotes = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Phone check
    const phoneExtract = line.match(/\b(?:(?:\+?91[\-\s]?)?[6-9]\d{9}|\d{7,10})\b/);
    if (phoneExtract && !rawPhone) {
      rawPhone = phoneExtract[0];
    }

    // Age/Sex check
    const ageGenExtract = line.match(/\b\d{1,2}\s*(?:\/|\s)\s*(?:m|f|male|female|पुरुष|महिला)\b/i);
    if (ageGenExtract && !rawAgeGender) {
      rawAgeGender = ageGenExtract[0];
    }

    // Date check
    if (/\b\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?\b/.test(line) && !rawDate) {
      rawDate = line;
    }

    // Amount check
    const amtExtract = line.match(/(?:rs\.?|₹)\s*\d{2,6}\b|\b\d{3,5}\s*(?:paid|\/\-)/i);
    if (amtExtract && !rawAmount) {
      rawAmount = amtExtract[0];
    }

    // Dental term check
    if (Object.keys(DENTAL_TERMS).some((t) => line.toLowerCase().includes(t))) {
      rawTreatment += (rawTreatment ? " " : "") + line;
    } else if (i === 0 || (!fullName && /[a-zA-Z\u0900-\u097F]{2,}/.test(line))) {
      // First line without phone/fee is usually patient name
      const candidateName = line
        .replace(phoneExtract ? phoneExtract[0] : "", "")
        .replace(ageGenExtract ? ageGenExtract[0] : "", "")
        .replace(amtExtract ? amtExtract[0] : "", "")
        .replace(/^(mr\.?|mrs\.?|ms\.?|dr\.?|श्री|श्रीमती|नाम)\s*/i, "")
        .trim();

      if (candidateName.length > 2 && !fullName) {
        fullName = candidateName;
        nameConfidence = 85;
      } else if (line.length > 2) {
        rawNotes += (rawNotes ? " | " : "") + line;
      }
    } else {
      rawNotes += (rawNotes ? " | " : "") + line;
    }
  }

  const parsedPhone = parsePhoneNumber(rawPhone || rawBoxText);
  const parsedAgeGen = parseAgeGender(rawAgeGender || rawBoxText);
  const parsedTreatment = normalizeDentalTreatment(rawTreatment || rawNotes);
  const parsedAmt = parseAmount(rawAmount || rawBoxText);
  const parsedDate = parseVisitDate(rawDate || rawBoxText);

  const entry: IScanEntry = {
    entryIndex: boxInfo.boxIndex,
    boxIndex: boxInfo.boxIndex,
    colIndex: boxInfo.col,
    rowIndex: boxInfo.row,
    boxCoordinates: boxInfo.coordinates,
    rawText: rawBoxText.trim(),
    status: "pending",
    fields: {
      fullName: {
        value: fullName || `Patient in Box ${boxInfo.boxIndex}`,
        confidence: fullName ? nameConfidence : 35,
        flag: nameConfidence >= 80 ? "high" : nameConfidence >= 50 ? "medium" : "low",
      },
      age: {
        value: parsedAgeGen.age,
        confidence: parsedAgeGen.ageConf,
        flag: parsedAgeGen.ageConf >= 80 ? "high" : parsedAgeGen.ageConf > 0 ? "medium" : "missing",
      },
      gender: {
        value: parsedAgeGen.gender,
        confidence: parsedAgeGen.genConf,
        flag: parsedAgeGen.genConf >= 80 ? "high" : parsedAgeGen.genConf > 0 ? "medium" : "missing",
      },
      phone: {
        value: parsedPhone.phone,
        confidence: parsedPhone.confidence,
        flag: parsedPhone.flag,
      },
      visitDate: {
        value: parsedDate.date,
        confidence: parsedDate.conf,
        flag: parsedDate.conf >= 80 ? "high" : "medium",
      },
      patientCode: {
        confidence: 0,
        flag: "missing",
      },
      treatment: {
        value: parsedTreatment.name || undefined,
        confidence: parsedTreatment.confidence,
        flag: parsedTreatment.confidence >= 80 ? "high" : parsedTreatment.confidence > 0 ? "medium" : "missing",
      },
      dentalNotes: {
        value: rawNotes ? `Box #${boxInfo.boxIndex} notes: ${rawNotes}` : undefined,
        confidence: rawNotes ? 75 : 0,
        flag: rawNotes ? "medium" : "missing",
      },
      prescribedTreatment: {
        confidence: 0,
        flag: "missing",
      },
      amount: {
        value: parsedAmt.amount,
        confidence: parsedAmt.amountConf,
        flag: parsedAmt.amountConf >= 80 ? "high" : parsedAmt.amountConf > 0 ? "medium" : "missing",
      },
      paymentStatus: {
        value: parsedAmt.paymentStatus,
        confidence: parsedAmt.statusConf,
        flag: parsedAmt.statusConf >= 80 ? "high" : parsedAmt.statusConf > 0 ? "medium" : "missing",
      },
      followUpDate: {
        confidence: 0,
        flag: "missing",
      },
    },
  };

  // Check duplicate patient in DentalOS
  const dupMatch = await findDuplicatePatient(clinicId, {
    fullName: entry.fields.fullName.value,
    phone: entry.fields.phone.value,
    age: entry.fields.age.value,
  });

  if (dupMatch) {
    entry.duplicateMatch = {
      patientId: dupMatch.patientId,
      patientCode: dupMatch.patientCode,
      fullName: dupMatch.fullName,
      phone: dupMatch.phone,
      matchReason: dupMatch.matchReason,
      lastVisit: dupMatch.lastVisit,
    };
  }

  return entry;
}

/**
 * Parses raw register lines into structured row entries (for tabular full-width rows)
 */
export async function structureRegisterText(
  rawText: string,
  clinicId: string
): Promise<IScanEntry[]> {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 3);

  const dataLines = lines.filter((line) => {
    const isHeader =
      /^(s\.?no|date|name|age|sex|phone|mobile|complaint|treatment|fee|paid|remarks|signature|क्र\.|नाम|दिनांक)/i.test(
        line
      ) && line.split(/[,\t|]/).length > 2;
    return !isHeader;
  });

  const entries: IScanEntry[] = [];
  let entryIndex = 1;

  for (const line of dataLines) {
    if (!/[a-zA-Z\u0900-\u097F]/.test(line)) continue;

    let segments = line.split(/[|\t]+/).map((s) => s.trim()).filter(Boolean);
    if (segments.length <= 1) {
      segments = line.split(/\s{2,}|,\s*/).map((s) => s.trim()).filter(Boolean);
    }

    let fullName = "";
    let nameConfidence = 40;
    let rawAgeGender = "";
    let rawPhone = "";
    let rawTreatment = "";
    let rawAmount = "";
    let rawDate = "";

    if (segments.length >= 3) {
      let nameIdx = 0;
      if (/^\d{1,3}\.?$/.test(segments[0])) {
        nameIdx = 1;
      }

      if (segments[nameIdx] && /\b\d{1,2}[\/\-]\d{1,2}\b/.test(segments[nameIdx])) {
        rawDate = segments[nameIdx];
        nameIdx++;
      }

      if (segments[nameIdx]) {
        fullName = segments[nameIdx].replace(/^mr\.?|^mrs\.?|^ms\.?|^dr\.?|^श्री|^श्रीमती/i, "").trim();
        nameConfidence = fullName.length > 2 ? 88 : 40;
      }

      for (let i = nameIdx + 1; i < segments.length; i++) {
        const seg = segments[i];
        if (/\b\d{1,2}[\/\-]\d{1,2}\b/.test(seg) && !rawDate) {
          rawDate = seg;
        } else if (/\b\d{1,2}\s*(?:\/|\s)\s*(?:m|f|male|female|वर्ष)\b/i.test(seg) || /^\d{1,2}$/.test(seg)) {
          rawAgeGender = seg;
        } else if (/\d{7,12}/.test(seg) && !rawPhone) {
          rawPhone = seg;
        } else if (/(?:₹|rs|paid|\d{3,5})/i.test(seg) && !rawAmount) {
          rawAmount = seg;
        } else {
          rawTreatment += (rawTreatment ? " " : "") + seg;
        }
      }
    } else {
      const phoneExtract = line.match(/\b(?:(?:\+?91[\-\s]?)?[6-9]\d{9}|\d{7,10})\b/);
      if (phoneExtract) rawPhone = phoneExtract[0];

      const ageGenExtract = line.match(/\b\d{1,2}\s*(?:\/|\s)\s*(?:m|f|male|female|पुरुष|महिला)\b/i);
      if (ageGenExtract) rawAgeGender = ageGenExtract[0];

      const amtExtract = line.match(/(?:rs\.?|₹)\s*\d{2,6}\b|\b\d{3,5}\s*(?:paid|\/\-)/i);
      if (amtExtract) rawAmount = amtExtract[0];

      let cleanRemaining = line
        .replace(phoneExtract ? phoneExtract[0] : "", "")
        .replace(ageGenExtract ? ageGenExtract[0] : "", "")
        .replace(amtExtract ? amtExtract[0] : "", "")
        .trim();

      const words = cleanRemaining.split(/\s+/).filter(Boolean);
      const nameWords: string[] = [];
      const treatWords: string[] = [];

      for (const w of words) {
        if (/^\d+$/.test(w)) continue;
        if (nameWords.length < 3 && !Object.keys(DENTAL_TERMS).some((t) => w.toLowerCase().includes(t))) {
          nameWords.push(w);
        } else {
          treatWords.push(w);
        }
      }

      fullName = nameWords.join(" ").replace(/^mr\.?|^mrs\.?|^ms\.?|^dr\.?|^श्री|^श्रीमती/i, "").trim();
      nameConfidence = fullName.length > 2 ? 82 : 35;
      rawTreatment = treatWords.join(" ");
    }

    if (!fullName && !rawPhone && !rawTreatment) continue;

    const parsedPhone = parsePhoneNumber(rawPhone || line);
    const parsedAgeGen = parseAgeGender(rawAgeGender || line);
    const parsedTreatment = normalizeDentalTreatment(rawTreatment);
    const parsedAmt = parseAmount(rawAmount || line);
    const parsedDate = parseVisitDate(rawDate || line);

    const entry: IScanEntry = {
      entryIndex,
      rawText: line,
      status: "pending",
      fields: {
        fullName: {
          value: fullName || "Patient " + entryIndex,
          confidence: fullName ? nameConfidence : 30,
          flag: nameConfidence >= 80 ? "high" : nameConfidence >= 50 ? "medium" : "low",
        },
        age: {
          value: parsedAgeGen.age,
          confidence: parsedAgeGen.ageConf,
          flag: parsedAgeGen.ageConf >= 80 ? "high" : parsedAgeGen.ageConf > 0 ? "medium" : "missing",
        },
        gender: {
          value: parsedAgeGen.gender,
          confidence: parsedAgeGen.genConf,
          flag: parsedAgeGen.genConf >= 80 ? "high" : parsedAgeGen.genConf > 0 ? "medium" : "missing",
        },
        phone: {
          value: parsedPhone.phone,
          confidence: parsedPhone.confidence,
          flag: parsedPhone.flag,
        },
        visitDate: {
          value: parsedDate.date,
          confidence: parsedDate.conf,
          flag: parsedDate.conf >= 80 ? "high" : "medium",
        },
        patientCode: {
          confidence: 0,
          flag: "missing",
        },
        treatment: {
          value: parsedTreatment.name || undefined,
          confidence: parsedTreatment.confidence,
          flag: parsedTreatment.confidence >= 80 ? "high" : parsedTreatment.confidence > 0 ? "medium" : "missing",
        },
        dentalNotes: {
          value: rawTreatment ? `Extracted register note: ${rawTreatment}` : undefined,
          confidence: rawTreatment ? 75 : 0,
          flag: rawTreatment ? "medium" : "missing",
        },
        prescribedTreatment: {
          confidence: 0,
          flag: "missing",
        },
        amount: {
          value: parsedAmt.amount,
          confidence: parsedAmt.amountConf,
          flag: parsedAmt.amountConf >= 80 ? "high" : parsedAmt.amountConf > 0 ? "medium" : "missing",
        },
        paymentStatus: {
          value: parsedAmt.paymentStatus,
          confidence: parsedAmt.statusConf,
          flag: parsedAmt.statusConf >= 80 ? "high" : parsedAmt.statusConf > 0 ? "medium" : "missing",
        },
        followUpDate: {
          confidence: 0,
          flag: "missing",
        },
      },
    };

    const dupMatch = await findDuplicatePatient(clinicId, {
      fullName: entry.fields.fullName.value,
      phone: entry.fields.phone.value,
      age: entry.fields.age.value,
    });

    if (dupMatch) {
      entry.duplicateMatch = {
        patientId: dupMatch.patientId,
        patientCode: dupMatch.patientCode,
        fullName: dupMatch.fullName,
        phone: dupMatch.phone,
        matchReason: dupMatch.matchReason,
        lastVisit: dupMatch.lastVisit,
      };
    }

    entries.push(entry);
    entryIndex++;
  }

  return entries;
}

/**
 * Executes local OCR using Tesseract.js (English & Hindi)
 */
export async function runLocalTesseractOCR(
  imagePath: string,
  language: "mixed" | "eng" | "hin" = "mixed"
): Promise<string> {
  const tesseractLang = language === "hin" ? "hin" : language === "mixed" ? "eng+hin" : "eng";
  const workerPath = path.join(process.cwd(), "node_modules", "tesseract.js", "src", "worker-script", "node", "index.js");
  const options = fs.existsSync(workerPath) ? { workerPath } : undefined;

  let worker;
  try {
    worker = await createWorker(tesseractLang, 1, options);
    const ret = await worker.recognize(imagePath);
    await worker.terminate();
    return ret.data.text || "";
  } catch (err: any) {
    if (worker) {
      await worker.terminate().catch(() => {});
    }
    if (language !== "eng") {
      try {
        const engWorker = await createWorker("eng", 1, options);
        const retEng = await engWorker.recognize(imagePath);
        await engWorker.terminate();
        return retEng.data.text || "";
      } catch (e2) {
        console.warn(`Local OCR processing error: ${err.message || err}`);
        return "";
      }
    }
    console.warn(`Local OCR processing error: ${err.message || err}`);
    return "";
  }
}

/**
 * Calls Vision AI (Google Gemini 1.5/2.0 Flash) with Box-Based Prompting
 */
export async function runGeminiVisionExtraction(
  imagePath: string,
  options: OCRProcessingOptions
): Promise<IScanEntry[] | null> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) return null;

  try {
    const fileBuffer = fs.readFileSync(imagePath);
    const base64Image = fileBuffer.toString("base64");
    const mimeType = imagePath.endsWith(".png") ? "image/png" : "image/jpeg";

    const systemPrompt = `You are an expert dental medical records assistant specialized in structured box-based patient registers.
This photograph is of a handwritten dental outpatient register containing patient entries arranged in square or rectangular boxes across ${options.columnsCount || 2} vertical columns.
READING ORDER: ${options.readingOrder || "column_first"} (e.g. read down column 1 first, then down column 2).

CRITICAL INSTRUCTIONS:
1. Detect each individual square or rectangular patient box independently.
2. DO NOT combine text or fields between neighbouring boxes.
3. For each detected box, extract:
   - boxIndex: sequence number
   - colIndex: 0-indexed column
   - rowIndex: 0-indexed row
   - boxCoordinates: { x: number (0-100), y: number (0-100), width: number (0-100), height: number (0-100) }
   - rawText: raw handwriting inside the box
   - fullName: { value, confidence: 0-100, flag: "high"|"medium"|"low"|"missing" }
   - age: { value: number, confidence: 0-100, flag }
   - gender: { value: "Male"|"Female"|"Other", confidence: 0-100, flag }
   - phone: { value: 10-digit string, confidence: 0-100, flag: "high"|"uncertain"|"missing" }
   - visitDate: { value: "YYYY-MM-DD", confidence: 0-100, flag }
   - treatment: { value: standardized dental term, confidence: 0-100, flag }
   - dentalNotes: { value: clinical notes, confidence: 0-100, flag }
   - amount: { value: number, confidence: 0-100, flag }
   - paymentStatus: { value: "paid"|"partial"|"unpaid", confidence: 0-100, flag }
4. Never invent missing data. If phone or age is unrecorded, flag as "missing".

Output strictly valid JSON array of boxes.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: systemPrompt },
                {
                  inlineData: {
                    mimeType,
                    data: base64Image,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) return null;

    const parsedJson = JSON.parse(candidateText);
    if (!Array.isArray(parsedJson)) return null;

    const enrichedEntries: IScanEntry[] = [];
    for (let i = 0; i < parsedJson.length; i++) {
      const item = parsedJson[i];
      const entry: IScanEntry = {
        entryIndex: i + 1,
        boxIndex: item.boxIndex || i + 1,
        colIndex: item.colIndex ?? Math.floor(i / (options.rowsPerColumn || 4)),
        rowIndex: item.rowIndex ?? i % (options.rowsPerColumn || 4),
        boxCoordinates: item.boxCoordinates,
        rawText: item.rawText || "",
        status: "pending",
        fields: {
          fullName: item.fullName || { value: `Patient in Box ${i + 1}`, confidence: 30, flag: "low" },
          age: item.age || { confidence: 0, flag: "missing" },
          gender: item.gender || { confidence: 0, flag: "missing" },
          phone: item.phone || { confidence: 0, flag: "missing" },
          visitDate: item.visitDate || { confidence: 0, flag: "missing" },
          patientCode: { confidence: 0, flag: "missing" },
          treatment: item.treatment || { confidence: 0, flag: "missing" },
          dentalNotes: item.dentalNotes || { confidence: 0, flag: "missing" },
          prescribedTreatment: { confidence: 0, flag: "missing" },
          amount: item.amount || { confidence: 0, flag: "missing" },
          paymentStatus: item.paymentStatus || { confidence: 0, flag: "missing" },
          followUpDate: { confidence: 0, flag: "missing" },
        },
      };

      const dupMatch = await findDuplicatePatient(options.clinicId, {
        fullName: entry.fields.fullName.value,
        phone: entry.fields.phone.value,
        age: entry.fields.age.value,
      });

      if (dupMatch) {
        entry.duplicateMatch = {
          patientId: dupMatch.patientId,
          patientCode: dupMatch.patientCode,
          fullName: dupMatch.fullName,
          phone: dupMatch.phone,
          matchReason: dupMatch.matchReason,
          lastVisit: dupMatch.lastVisit,
        };
      }

      enrichedEntries.push(entry);
    }

    return enrichedEntries;
  } catch (err) {
    console.warn("Vision AI box extraction failed:", err);
    return null;
  }
}

/**
 * Maps APInex structured patient output to DentalOS Scan Entries with duplicate detection
 */
async function mapAPInexPatientsToEntries(
  patients: ExtractedPatient[],
  clinicId: string,
  openCVBoxes: Array<{ x: number; y: number; width: number; height: number }>,
  columnsCount: number,
  readingOrder: "column_first" | "row_first",
  layoutType: "COLUMN_BASED" | "BOX_BASED" | "FREE_FORM" | "MIXED_LAYOUT" = "COLUMN_BASED"
): Promise<IScanEntry[]> {
  const entries: IScanEntry[] = [];
  const rowsPerCol = Math.ceil(patients.length / (columnsCount || 2));
  const isColumnBased = layoutType === "COLUMN_BASED" || columnsCount >= 5;

  for (let i = 0; i < patients.length; i++) {
    const p = patients[i];
    
    // For column-based tabular registers, each entry is a horizontal row
    let box: { x: number; y: number; width: number; height: number };
    if (openCVBoxes && openCVBoxes[i]) {
      box = openCVBoxes[i];
    } else if (isColumnBased) {
      const totalRows = Math.max(patients.length, 1);
      const rowHeight = Math.min(9.0, Math.max(4.0, 72 / totalRows));
      const rowY = 13.9 + (i * (72 / totalRows));
      box = {
        x: 0.7,
        y: Math.round(rowY * 10) / 10,
        width: 99.0,
        height: Math.round(rowHeight * 10) / 10,
      };
    } else {
      box = openCVBoxes[i] || {
        x: ((i % columnsCount) * (100 / columnsCount)) + 2,
        y: (Math.floor(i / columnsCount) * 20) + 4,
        width: (100 / columnsCount) - 4,
        height: 18,
      };
    }

    const colIndex = isColumnBased ? 0 : (readingOrder === "column_first" ? Math.floor(i / rowsPerCol) : i % columnsCount);
    const rowIndex = isColumnBased ? i : (readingOrder === "column_first" ? i % rowsPerCol : Math.floor(i / columnsCount));

    const nameConf = Math.round((p.confidence?.name ?? 0.95) * 100);
    const ageConf = p.age != null ? Math.round((p.confidence?.age ?? 0.90) * 100) : 0;
    const phoneConf = p.phone ? Math.round((p.confidence?.phone ?? (p.phone.length === 10 ? 0.95 : 0.45)) * 100) : 0;
    const treatConf = p.treatment ? Math.round((p.confidence?.treatment ?? 0.95) * 100) : 0;
    const amtValue = p.amount != null ? p.amount : (p.fee != null ? p.fee : undefined);
    const feeValue = p.fee != null ? p.fee : (p.amount != null ? p.amount : undefined);
    const amtConf = amtValue != null ? Math.round((p.confidence?.amount ?? 0.90) * 100) : 0;

    const entry: IScanEntry = {
      entryIndex: i + 1,
      boxIndex: i + 1,
      colIndex,
      rowIndex,
      boxCoordinates: {
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height,
      },
      status: "pending",
      unreadableFields: p.unreadableFields || [],
      confidenceScores: p.confidence || {},
      fields: {
        sNo: {
          value: p.sNo || String(i + 1),
          confidence: 95,
          flag: "high",
        },
        daily: {
          value: p.daily ?? undefined,
          confidence: p.daily ? 90 : 0,
          flag: p.daily ? "high" : "missing",
        },
        fullName: {
          value: p.name,
          confidence: nameConf,
          flag: nameConf >= 85 ? "high" : nameConf >= 50 ? "medium" : "uncertain",
        },
        age: {
          value: p.age ?? undefined,
          confidence: ageConf,
          flag: ageConf >= 85 ? "high" : ageConf > 0 ? "medium" : "missing",
        },
        gender: {
          value: p.gender ?? undefined,
          confidence: p.gender ? 90 : 0,
          flag: p.gender ? "high" : "missing",
        },
        phone: {
          value: p.phone ?? undefined,
          confidence: phoneConf,
          flag: phoneConf >= 85 ? "high" : phoneConf > 0 ? "uncertain" : "missing",
        },
        address: {
          value: p.address ?? undefined,
          confidence: p.address ? 85 : 0,
          flag: p.address ? "high" : "missing",
        },
        visitDate: {
          value: p.visitDate || undefined,
          confidence: p.visitDate ? 90 : 0,
          flag: p.visitDate ? "high" : "missing",
        },
        patientCode: {
          value: p.patientCode ?? undefined,
          confidence: p.patientCode ? 80 : 0,
          flag: p.patientCode ? "high" : "missing",
        },
        disease: {
          value: p.disease || p.chiefComplaint || undefined,
          confidence: treatConf,
          flag: (p.disease || p.chiefComplaint) ? "high" : "missing",
        },
        chiefComplaint: {
          value: p.chiefComplaint || p.disease || undefined,
          confidence: treatConf,
          flag: treatConf >= 80 ? "high" : treatConf > 0 ? "medium" : "missing",
        },
        treatment: {
          value: p.treatment ?? undefined,
          confidence: treatConf,
          flag: treatConf >= 80 ? "high" : treatConf > 0 ? "medium" : "missing",
        },
        dentalNotes: {
          value: p.dentalNotes ?? (p.disease ? `Disease: ${p.disease} | Treatment: ${p.treatment || "General"}` : undefined),
          confidence: 80,
          flag: p.dentalNotes ? "medium" : "missing",
        },
        prescribedTreatment: {
          confidence: 0,
          flag: "missing",
        },
        prescribedMedication: {
          value: p.prescribedMedication ?? undefined,
          confidence: p.prescribedMedication ? 80 : 0,
          flag: p.prescribedMedication ? "medium" : "missing",
        },
        cashRs: {
          value: p.cashRs ?? undefined,
          confidence: p.cashRs != null ? 90 : 0,
          flag: p.cashRs != null ? "high" : "missing",
        },
        cashPaise: {
          value: p.cashPaise ?? undefined,
          confidence: p.cashPaise != null ? 85 : 0,
          flag: p.cashPaise != null ? "high" : "missing",
        },
        creditRs: {
          value: p.creditRs ?? undefined,
          confidence: p.creditRs != null ? 90 : 0,
          flag: p.creditRs != null ? "high" : "missing",
        },
        creditPaise: {
          value: p.creditPaise ?? undefined,
          confidence: p.creditPaise != null ? 85 : 0,
          flag: p.creditPaise != null ? "high" : "missing",
        },
        fee: {
          value: feeValue,
          confidence: amtConf,
          flag: amtConf >= 80 ? "high" : amtConf > 0 ? "medium" : "missing",
        },
        amount: {
          value: amtValue,
          confidence: amtConf,
          flag: amtConf >= 80 ? "high" : amtConf > 0 ? "medium" : "missing",
        },
        paymentStatus: {
          value: p.paymentStatus ?? undefined,
          confidence: p.paymentStatus ? 85 : 0,
          flag: p.paymentStatus ? "high" : "missing",
        },
        followUpDate: {
          value: p.nextVisitDate ?? undefined,
          confidence: p.nextVisitDate ? 80 : 0,
          flag: p.nextVisitDate ? "medium" : "missing",
        },
        nextAppointmentDate: {
          value: p.nextVisitDate ?? undefined,
          confidence: p.nextVisitDate ? 80 : 0,
          flag: p.nextVisitDate ? "medium" : "missing",
        },
        remarks: {
          value: p.remarks ?? undefined,
          confidence: p.remarks ? 75 : 0,
          flag: p.remarks ? "medium" : "missing",
        },
        extraFields: {
          daily: p.daily,
          cashPaise: p.cashPaise,
          creditPaise: p.creditPaise,
        },
      },
    };

    const dupMatch = await findDuplicatePatient(clinicId, {
      fullName: entry.fields.fullName.value,
      phone: entry.fields.phone.value,
      age: entry.fields.age.value,
    });

    if (dupMatch) {
      entry.duplicateMatch = {
        patientId: dupMatch.patientId,
        patientCode: dupMatch.patientCode,
        fullName: dupMatch.fullName,
        phone: dupMatch.phone,
        matchReason: dupMatch.matchReason,
        lastVisit: dupMatch.lastVisit,
      };
    }

    entries.push(entry);
  }

  return entries;
}

/**
 * Master Extraction Pipeline supporting Automatic Layout Classification, OpenCV & APInex
 */
export async function executeDocumentExtraction(
  imagePath: string,
  options: OCRProcessingOptions
): Promise<{
  entries: IScanEntry[];
  engineUsed: string;
  rawOcrText?: string;
  openCVDetected?: boolean;
  layoutType: "COLUMN_BASED" | "BOX_BASED" | "FREE_FORM" | "MIXED_LAYOUT";
  layoutMetadata: any;
}> {
  const readingOrder = options.readingOrder || "column_first";

  // 1. Run local OpenCV grid, line, and image quality analysis
  const openCVResult = await runOpenCVGridDetection(imagePath, {
    expectedCols: options.columnsCount,
    readingOrder,
  });

  const cols = openCVResult.columnsDetected || options.columnsCount || 2;
  const rows = openCVResult.rowsDetected || options.rowsPerColumn || 4;

  const boxesToUse = openCVResult.boxes.length > 0
    ? openCVResult.boxes
    : generateGridBoxes(cols, rows, readingOrder).map((b) => ({
        index: b.boxIndex,
        colIndex: b.colIndex,
        rowIndex: b.rowIndex,
        x: b.coordinates.x,
        y: b.coordinates.y,
        width: b.coordinates.width,
        height: b.coordinates.height,
        source: "pure_template",
      }));

  // 2. APInex AI Vision Extraction with Automatic Layout Analysis
  if (options.engine === "apinex" || options.engine === "gemini" || options.engine === "hybrid" || (!options.engine && process.env.APINEX_API_KEY)) {
    const apinexRes = await callAPInexRegisterExtraction({
      imagePath,
      columnsCount: openCVResult.columnsDetected || cols,
      readingOrder,
      totalBoxesExpected: boxesToUse.length,
      layoutType: openCVResult.layoutType,
      testMode: options.testMode,
    });

    if (apinexRes.success && apinexRes.patients.length > 0) {
      const finalLayoutType = apinexRes.layoutType || openCVResult.layoutType || "COLUMN_BASED";
      const entries = await mapAPInexPatientsToEntries(
        apinexRes.patients,
        options.clinicId,
        boxesToUse,
        openCVResult.columnsDetected || apinexRes.columnCount || cols,
        readingOrder,
        finalLayoutType
      );

      const layoutMetadata = {
        layoutType: finalLayoutType,
        confidence: apinexRes.layoutConfidence || openCVResult.confidence || 0.92,
        columnsDetected: apinexRes.columnCount || openCVResult.columnsDetected || 10,
        rowsDetected: apinexRes.rowCount || openCVResult.rowsDetected || entries.length,
        regionsDetected: openCVResult.regionsDetected || (entries.length * (openCVResult.columnsDetected || 10)),
        requiresManualReview: openCVResult.requiresManualReview || false,
        detectedHeaders: apinexRes.detectedColumns || [],
        qualityAssessment: openCVResult.qualityAssessment,
      };

      return {
        entries,
        engineUsed: apinexRes.modelUsed,
        rawOcrText: apinexRes.rawResponse,
        openCVDetected: openCVResult.detectionMethod === "opencv_lines",
        layoutType: finalLayoutType,
        layoutMetadata,
      };
    }
  }

  // 3. Fallback to Local OCR + OpenCV Box Grid Structuring
  const ocrText = await runLocalTesseractOCR(imagePath, options.language || "mixed");

  const rawBlocks = ocrText
    .split(/\n{2,}|\r\n\r\n/)
    .map((b) => b.trim())
    .filter((b) => b.length > 2);

  let entries: IScanEntry[] = [];

  if (openCVResult.layoutType === "COLUMN_BASED") {
    entries = await structureRegisterText(ocrText, options.clinicId);
    // Align row bounding boxes with detected OpenCV rows
    for (let i = 0; i < entries.length; i++) {
      if (boxesToUse[i]) {
        entries[i].boxIndex = i;
        entries[i].rowIndex = i;
        entries[i].colIndex = 0;
        entries[i].boxCoordinates = {
          x: boxesToUse[i].x,
          y: boxesToUse[i].y,
          width: boxesToUse[i].width,
          height: boxesToUse[i].height,
        };
      }
    }
  } else {
    for (let i = 0; i < boxesToUse.length; i++) {
      const box = boxesToUse[i];
      const boxRawText = rawBlocks[i] || "";

      const gridItem: BoxGridItem = {
        boxIndex: box.index ? box.index : (i + 1),
        col: box.colIndex ?? 0,
        row: box.rowIndex ?? 0,
        colIndex: box.colIndex ?? 0,
        rowIndex: box.rowIndex ?? 0,
        coordinates: {
          x: box.x,
          y: box.y,
          width: box.width,
          height: box.height,
        },
      };

      const entry = await structureBoxText(boxRawText, options.clinicId, gridItem);
      entries.push(entry);
    }
  }

  const layoutMetadata = {
    layoutType: openCVResult.layoutType || "COLUMN_BASED",
    confidence: openCVResult.confidence || 0.75,
    columnsDetected: openCVResult.columnsDetected || cols,
    rowsDetected: openCVResult.rowsDetected || rows,
    regionsDetected: openCVResult.regionsDetected || entries.length,
    requiresManualReview: openCVResult.requiresManualReview || false,
    qualityAssessment: openCVResult.qualityAssessment,
  };

  return {
    entries,
    engineUsed: `tesseract_${openCVResult.detectionMethod}`,
    rawOcrText: ocrText,
    openCVDetected: openCVResult.detectionMethod === "opencv_lines",
    layoutType: openCVResult.layoutType || "COLUMN_BASED",
    layoutMetadata,
  };
}
