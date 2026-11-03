import { createWorker } from "tesseract.js";
import path from "path";
import fs from "fs";
import { IScanEntry } from "../../models/ScanDocument";
import { findDuplicatePatient } from "./duplicateDetector";
import { generateGridBoxes, BoxGridItem } from "./boxDetector";

export interface OCRProcessingOptions {
  engine?: "tesseract" | "gemini" | "hybrid" | "local";
  language?: "mixed" | "eng" | "hin";
  clinicId: string;
  layoutType?: "grid_boxes" | "table_rows";
  columnsCount?: number;
  rowsPerColumn?: number;
  readingOrder?: "column_first" | "row_first";
  templateId?: string;
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
  const today = new Date().toISOString().split("T")[0];
  return { date: today, conf: 60 };
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
          visitDate: item.visitDate || { value: new Date().toISOString().split("T")[0], confidence: 70, flag: "medium" },
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
 * Master Extraction Pipeline supporting Box-Based and Column-Based Registers
 */
export async function executeDocumentExtraction(
  imagePath: string,
  options: OCRProcessingOptions
): Promise<{ entries: IScanEntry[]; engineUsed: string; rawOcrText?: string }> {
  const layout = options.layoutType || "grid_boxes";
  const cols = options.columnsCount || 2;
  const rows = options.rowsPerColumn || 4;
  const readingOrder = options.readingOrder || "column_first";

  // 1. Try Vision AI if configured
  if (options.engine === "gemini" || options.engine === "hybrid") {
    const aiResult = await runGeminiVisionExtraction(imagePath, options);
    if (aiResult && aiResult.length > 0) {
      return {
        entries: aiResult,
        engineUsed: "gemini_vision",
      };
    }
  }

  // 2. Local OCR + Box Grid Structuring
  const ocrText = await runLocalTesseractOCR(imagePath, options.language || "mixed");

  if (layout === "grid_boxes") {
    // Generate individual box geometries
    const gridBoxes = generateGridBoxes(cols, rows, readingOrder);

    // Segment text into boxes (or distribute raw chunks by box sequence)
    const rawBlocks = ocrText
      .split(/\n{2,}|\r\n\r\n/)
      .map((b) => b.trim())
      .filter((b) => b.length > 2);

    const entries: IScanEntry[] = [];

    for (let i = 0; i < gridBoxes.length; i++) {
      const box = gridBoxes[i];
      const boxRawText = rawBlocks[i] || "";

      // Parse this specific box independently
      const entry = await structureBoxText(boxRawText, options.clinicId, box);
      entries.push(entry);
    }

    return {
      entries,
      engineUsed: "tesseract_box_grid",
      rawOcrText: ocrText,
    };
  }

  // Fallback to table row parsing if selected
  const rowEntries = await structureRegisterText(ocrText, options.clinicId);
  return {
    entries: rowEntries,
    engineUsed: "tesseract_local",
    rawOcrText: ocrText,
  };
}
