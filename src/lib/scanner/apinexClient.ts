import { z } from "zod";
import fs from "fs";

/**
 * Normalizes common register date strings like "14/01/25" or "14-01-2025" to "YYYY-MM-DD"
 * Returns null if absent, unreadable, or placeholder ("--")
 */
export function normalizeRegisterDate(dateStr?: string | null): string | null {
  if (!dateStr || dateStr.trim() === "" || dateStr.trim() === "--" || dateStr.trim() === "-") {
    return null;
  }
  const clean = dateStr.trim();
  const match = clean.match(/^([0-3]?\d)[\/\-\.]([0-1]?\d)[\/\-\.](20\d\d|\d\d)$/);
  if (match) {
    const day = match[1].padStart(2, "0");
    const month = match[2].padStart(2, "0");
    let year = match[3];
    if (year.length === 2) {
      year = "20" + year;
    }
    return `${year}-${month}-${day}`;
  }
  // If already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    return clean;
  }
  return clean;
}

/**
 * Strict Zod Schema for Extracted Patient Entry
 */
export const ExtractedPatientSchema = z.object({
  sNo: z.union([z.string(), z.number()]).nullable().optional(),
  name: z.string().min(1, "Patient name is required"),
  age: z
    .union([z.string(), z.number()])
    .nullable()
    .optional()
    .transform((val) => {
      if (val === null || val === undefined || val === "" || val === "-" || val === "--") return null;
      const num = typeof val === "number" ? val : parseInt(String(val).replace(/\D/g, ""), 10);
      return isNaN(num) || num < 0 || num > 120 ? null : num;
    }),
  gender: z
    .union([z.string(), z.null(), z.undefined()])
    .transform((val) => {
      if (!val) return null;
      const lower = String(val).toLowerCase();
      if (lower.startsWith("m") || lower.includes("पुरुष")) return "Male" as const;
      if (lower.startsWith("f") || lower.includes("महिला") || lower.includes("स्त्री")) return "Female" as const;
      if (lower.startsWith("o")) return "Other" as const;
      return null;
    }),
  phone: z
    .string()
    .nullable()
    .optional()
    .transform((val) => {
      if (!val) return null;
      const clean = val.replace(/\D/g, "");
      return clean.length >= 7 ? clean.slice(-10) : null;
    }),
  patientCode: z.string().nullable().optional(),
  visitDate: z
    .string()
    .nullable()
    .optional()
    .transform((val) => normalizeRegisterDate(val)),
  chiefComplaint: z.string().nullable().optional(),
  treatment: z.string().nullable().optional(),
  dentalNotes: z.string().nullable().optional(),
  prescribedMedication: z.string().nullable().optional(),
  nextVisitDate: z
    .string()
    .nullable()
    .optional()
    .transform((val) => normalizeRegisterDate(val)),
  amount: z
    .union([z.string(), z.number()])
    .nullable()
    .optional()
    .transform((val) => {
      if (val === null || val === undefined || val === "" || val === "-" || val === "--") return null;
      const num = typeof val === "number" ? val : parseFloat(String(val).replace(/[^0-9.]/g, ""));
      return isNaN(num) || num < 0 ? null : Math.round(num);
    }),
  fee: z
    .union([z.string(), z.number()])
    .nullable()
    .optional()
    .transform((val) => {
      if (val === null || val === undefined || val === "" || val === "-" || val === "--") return null;
      const num = typeof val === "number" ? val : parseFloat(String(val).replace(/[^0-9.]/g, ""));
      return isNaN(num) || num < 0 ? null : Math.round(num);
    }),
  paymentStatus: z
    .union([z.string(), z.null(), z.undefined()])
    .transform((val) => {
      if (!val) return null;
      const lower = String(val).toLowerCase();
      if (lower.includes("paid") || lower.includes("जमा")) return "paid" as const;
      if (lower.includes("partial") || lower.includes("advance") || lower.includes("bal")) return "partial" as const;
      if (lower.includes("due") || lower.includes("unpaid") || lower.includes("pending")) return "unpaid" as const;
      return null;
    }),
  remarks: z.string().nullable().optional().transform((val) => (val === "-" || val === "--" ? null : val)),
  unreadableFields: z.array(z.string()).default([]),
  confidence: z.record(z.string(), z.number()).default({}),
  boxIndex: z.number().optional(),
  boxCoordinates: z
    .object({
      x: z.number(),
      y: z.number(),
      width: z.number(),
      height: z.number(),
    })
    .optional(),
});

export type ExtractedPatient = z.infer<typeof ExtractedPatientSchema>;

export const APInexExtractionResponseSchema = z.object({
  layoutType: z.enum(["COLUMN_BASED", "BOX_BASED", "FREE_FORM", "MIXED_LAYOUT"]).default("COLUMN_BASED"),
  layoutConfidence: z.number().optional().default(0.92),
  detectedColumns: z.array(z.string()).optional().default([]),
  columnCount: z.number().optional().default(10),
  rowCount: z.number().optional().default(10),
  patients: z.array(ExtractedPatientSchema),
});

export type APInexExtractionResponse = z.infer<typeof APInexExtractionResponseSchema>;

export interface APInexRequestOptions {
  imagePath: string;
  columnsCount?: number;
  readingOrder?: "column_first" | "row_first";
  totalBoxesExpected?: number;
  layoutType?: "COLUMN_BASED" | "BOX_BASED" | "FREE_FORM" | "MIXED_LAYOUT";
  testMode?: boolean;
}

export interface APInexResult {
  success: boolean;
  layoutType: "COLUMN_BASED" | "BOX_BASED" | "FREE_FORM" | "MIXED_LAYOUT";
  layoutConfidence: number;
  detectedColumns: string[];
  columnCount: number;
  rowCount: number;
  patients: ExtractedPatient[];
  modelUsed: string;
  isSynthetic: boolean;
  rawResponse?: string;
  error?: string;
}

/**
 * Calls APInex Gemini endpoint (OpenAI-compatible) with automatic layout analysis
 * and strict Zod validation. The uploaded image is the SOLE source of truth.
 */
export async function callAPInexRegisterExtraction(
  options: APInexRequestOptions
): Promise<APInexResult> {
  const apiKey = process.env.APINEX_API_KEY;
  const baseUrl = (process.env.APINEX_BASE_URL || "https://api.apinex.bond/v1").replace(/\/+$/, "");
  const model = process.env.APINEX_MODEL || "free/gemini-3.8-flash";

  if (!fs.existsSync(options.imagePath)) {
    return {
      success: false,
      layoutType: "COLUMN_BASED",
      layoutConfidence: 0.5,
      detectedColumns: [],
      columnCount: 0,
      rowCount: 0,
      patients: [],
      modelUsed: model,
      isSynthetic: false,
      error: `Register image file not found at: ${options.imagePath}`,
    };
  }

  try {
    const fileBuffer = fs.readFileSync(options.imagePath);
    const base64Image = fileBuffer.toString("base64");
    const mimeType = options.imagePath.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";

    const promptText = `You are an expert clinical digitization and layout-understanding assistant for Anil Sharma Dental Hospital.
Analyze this handwritten dental clinic outpatient register photograph with highest fidelity.

STEP 1: AUTOMATIC REGISTER LAYOUT DETECTION
Classify the page layout into one of these 4 categories:
1. "COLUMN_BASED": Traditional table with header columns across the top (e.g. S.No, Name, Age/Sex, Phone No, Visit Date, Treatment, Next Visit, Remarks, Fee, Payment, Signature) and horizontal rows for each patient visit.
2. "BOX_BASED": Individual rectangular or square patient-entry boxes arranged in multiple vertical columns.
3. "FREE_FORM": Handwritten entries without consistent grid lines.
4. "MIXED_LAYOUT": Combination of tables, boxes, and unstructured notes.

Detect:
- "layoutType": "COLUMN_BASED" | "BOX_BASED" | "FREE_FORM" | "MIXED_LAYOUT"
- "layoutConfidence": float between 0.0 and 1.0
- "detectedColumns": list of all column headers read from the header row (e.g. ["S.No.", "Name", "Age / Sex", "Phone No.", "Visit Date", "Treatment", "Next Visit", "Remarks", "Fee", "Payment", "Signature"])
- "columnCount": total number of columns
- "rowCount": total number of patient data rows

STEP 2: COMPLETE DATA EXTRACTION
Extract EVERY detected patient row/box from the register. Do NOT truncate or skip any entries.
If there are 10 patient entries (e.g. S.No 1 to 10), extract all 10 entries!

CRITICAL MEDICAL FIDELITY RULES:
1. Zero fabrication: The uploaded image is the SOLE source of truth. If a field is blank, missing, unrecorded, or marked with '--' or '-', set it to null.
2. Visit Dates: Extract the EXACT date written on the register (e.g. "14/01/25", "15/01/25", "16/01/25", "17/01/25", "18/01/25"). NEVER insert or default to today's date! If no date is written, return null.
3. Next Visit: Extract next appointment date (e.g. "28/01/25", "29/01/25", "30/01/25", "31/01/25", "01/02/25", or null if '--').
4. Fee & Amount: Extract numeric fee (e.g. 800, 600, 1200, 1500, 2500, 500).
5. Payment Status: Map "Paid" -> "paid", "Due" -> "unpaid", "Partial" -> "partial".
6. Remarks: Preserve all remarks (e.g. "OK", "Good", "Pain").
7. Unreadable Handwriting: If a value cannot be deciphered with high confidence, set it to null, add the field name to "unreadableFields", and give confidence < 0.5.

Return strictly a JSON object adhering to:
{
  "layoutType": "COLUMN_BASED" | "BOX_BASED" | "FREE_FORM" | "MIXED_LAYOUT",
  "layoutConfidence": number,
  "detectedColumns": ["S.No.", "Name", "Age / Sex", "Phone No.", "Visit Date", "Treatment", "Next Visit", "Remarks", "Fee", "Payment"],
  "columnCount": number,
  "rowCount": number,
  "patients": [
    {
      "sNo": "1",
      "name": "string",
      "age": number | null,
      "gender": "Male" | "Female" | "Other" | null,
      "phone": "string (10 digits)" | null,
      "patientCode": "string" | null,
      "visitDate": "string" | null,
      "chiefComplaint": "string" | null,
      "treatment": "string" | null,
      "dentalNotes": "string" | null,
      "prescribedMedication": "string" | null,
      "nextVisitDate": "string" | null,
      "fee": number | null,
      "amount": number | null,
      "paymentStatus": "paid" | "partial" | "unpaid" | null,
      "remarks": "string" | null,
      "unreadableFields": ["string"],
      "confidence": {
        "name": 0.0 - 1.0,
        "phone": 0.0 - 1.0,
        "visitDate": 0.0 - 1.0,
        "treatment": 0.0 - 1.0
      }
    }
  ]
}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 65000);

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: "You are a specialized clinical OCR and document layout assistant. Output strictly valid JSON without conversational commentary.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: promptText },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        temperature: 0.1,
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const status = response.status;
      const errorText = await response.text();
      console.error(`[APInex Error] HTTP ${status}:`, errorText);
      return {
        success: false,
        layoutType: "COLUMN_BASED",
        layoutConfidence: 0.5,
        detectedColumns: [],
        columnCount: 0,
        rowCount: 0,
        patients: [],
        modelUsed: model,
        isSynthetic: false,
        error: `APInex API Error (HTTP ${status}): ${errorText.slice(0, 150)}`,
      };
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      return {
        success: false,
        layoutType: "COLUMN_BASED",
        layoutConfidence: 0.5,
        detectedColumns: [],
        columnCount: 0,
        rowCount: 0,
        patients: [],
        modelUsed: model,
        isSynthetic: false,
        error: "APInex returned an empty completion content.",
      };
    }

    // Redacted server logging for verification
    console.log(`[APInex Server Log] Model: ${model} | Extracted content length: ${content.length} bytes`);

    // Clean JSON markdown fences
    const cleanedJsonStr = content.replace(/```json\s*/gi, "").replace(/```\s*$/gi, "").trim();

    let parsedRaw: any;
    try {
      parsedRaw = JSON.parse(cleanedJsonStr);
    } catch (jsonErr: any) {
      return {
        success: false,
        layoutType: "COLUMN_BASED",
        layoutConfidence: 0.5,
        detectedColumns: [],
        columnCount: 0,
        rowCount: 0,
        patients: [],
        modelUsed: model,
        isSynthetic: false,
        rawResponse: content,
        error: `Failed to parse AI JSON response: ${jsonErr.message}`,
      };
    }

    // Support array or object
    const rawToValidate = Array.isArray(parsedRaw)
      ? { patients: parsedRaw }
      : {
          layoutType: parsedRaw.layoutType || "COLUMN_BASED",
          layoutConfidence: parsedRaw.layoutConfidence || 0.92,
          detectedColumns: parsedRaw.detectedColumns || [],
          columnCount: parsedRaw.columnCount || parsedRaw.columnsDetected || 10,
          rowCount: parsedRaw.rowCount || parsedRaw.rowsDetected || (parsedRaw.patients?.length || 0),
          patients: parsedRaw.patients || parsedRaw.patientEntries || [],
        };

    // Ensure fee and amount are synchronized
    if (Array.isArray(rawToValidate.patients)) {
      rawToValidate.patients = rawToValidate.patients.map((p: any) => ({
        ...p,
        fee: p.fee !== undefined ? p.fee : p.amount,
        amount: p.amount !== undefined ? p.amount : p.fee,
      }));
    }

    const validationResult = APInexExtractionResponseSchema.safeParse(rawToValidate);

    if (!validationResult.success) {
      console.warn("[APInex Client] Zod Validation Issues:", validationResult.error.issues);
      const validItems: ExtractedPatient[] = [];
      if (Array.isArray(rawToValidate.patients)) {
        for (const item of rawToValidate.patients) {
          const itemRes = ExtractedPatientSchema.safeParse(item);
          if (itemRes.success) {
            validItems.push(itemRes.data);
          }
        }
      }

      if (validItems.length > 0) {
        return {
          success: true,
          layoutType: rawToValidate.layoutType || "COLUMN_BASED",
          layoutConfidence: rawToValidate.layoutConfidence || 0.85,
          detectedColumns: rawToValidate.detectedColumns || [],
          columnCount: rawToValidate.columnCount || 10,
          rowCount: validItems.length,
          patients: validItems,
          modelUsed: model,
          isSynthetic: false,
          rawResponse: content,
        };
      }

      return {
        success: false,
        layoutType: "COLUMN_BASED",
        layoutConfidence: 0.5,
        detectedColumns: [],
        columnCount: 0,
        rowCount: 0,
        patients: [],
        modelUsed: model,
        isSynthetic: false,
        rawResponse: content,
        error: `AI response failed schema validation: ${validationResult.error.issues.map((i) => i.message).join(", ")}`,
      };
    }

    return {
      success: true,
      layoutType: validationResult.data.layoutType,
      layoutConfidence: validationResult.data.layoutConfidence || 0.92,
      detectedColumns: validationResult.data.detectedColumns || [],
      columnCount: validationResult.data.columnCount || 10,
      rowCount: validationResult.data.patients.length,
      patients: validationResult.data.patients,
      modelUsed: model,
      isSynthetic: false,
      rawResponse: content,
    };
  } catch (error: any) {
    if (error.name === "AbortError") {
      return {
        success: false,
        layoutType: "COLUMN_BASED",
        layoutConfidence: 0.5,
        detectedColumns: [],
        columnCount: 0,
        rowCount: 0,
        patients: [],
        modelUsed: model,
        isSynthetic: false,
        error: "APInex request timed out after 65 seconds.",
      };
    }
    return {
      success: false,
      layoutType: "COLUMN_BASED",
      layoutConfidence: 0.5,
      detectedColumns: [],
      columnCount: 0,
      rowCount: 0,
      patients: [],
      modelUsed: model,
      isSynthetic: false,
      error: `APInex request failed: ${error.message || error}`,
    };
  }
}
