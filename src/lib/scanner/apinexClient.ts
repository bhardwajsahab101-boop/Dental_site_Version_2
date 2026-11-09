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
 * Strict Zod Schema for Extracted Patient Entry adhering to Clinic Register
 */
export const ExtractedPatientSchema = z.object({
  sNo: z.union([z.string(), z.number()]).nullable().optional(),
  daily: z.union([z.string(), z.number()]).nullable().optional(),
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
      if (lower.startsWith("m") || lower.includes("पुरुष") || lower === "m") return "Male" as const;
      if (lower.startsWith("f") || lower.includes("महिला") || lower.includes("स्त्री") || lower === "f") return "Female" as const;
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
  address: z.string().nullable().optional().transform((v) => (v === "-" || v === "--" || !v ? null : v.trim())),
  patientCode: z.string().nullable().optional(),
  visitDate: z
    .string()
    .nullable()
    .optional()
    .transform((val) => normalizeRegisterDate(val)),
  disease: z.string().nullable().optional().transform((v) => (v === "-" || v === "--" || !v ? null : v.trim())),
  chiefComplaint: z.string().nullable().optional(),
  treatment: z.string().nullable().optional().transform((v) => (v === "-" || v === "--" || !v ? null : v.trim())),
  dentalNotes: z.string().nullable().optional(),
  prescribedMedication: z.string().nullable().optional(),
  nextVisitDate: z
    .string()
    .nullable()
    .optional()
    .transform((val) => normalizeRegisterDate(val)),
  cashRs: z
    .union([z.string(), z.number()])
    .nullable()
    .optional()
    .transform((val) => {
      if (val === null || val === undefined || val === "" || val === "-" || val === "--") return null;
      const num = typeof val === "number" ? val : parseFloat(String(val).replace(/[^0-9.]/g, ""));
      return isNaN(num) || num < 0 ? null : Math.round(num);
    }),
  cashPaise: z.union([z.string(), z.number()]).nullable().optional(),
  creditRs: z
    .union([z.string(), z.number()])
    .nullable()
    .optional()
    .transform((val) => {
      if (val === null || val === undefined || val === "" || val === "-" || val === "--") return null;
      const num = typeof val === "number" ? val : parseFloat(String(val).replace(/[^0-9.]/g, ""));
      return isNaN(num) || num < 0 ? null : Math.round(num);
    }),
  creditPaise: z.union([z.string(), z.number()]).nullable().optional(),
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
      if (lower.includes("due") || lower.includes("unpaid") || lower.includes("credit") || lower.includes("उधार") || lower.includes("pending")) return "unpaid" as const;
      return null;
    }),
  remarks: z.string().nullable().optional().transform((val) => (val === "-" || val === "--" || !val ? null : val.trim())),
  lineCount: z.number().optional().default(1),
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

PHYSICAL REGISTER LAYOUT & COLUMN STRUCTURE:
The ledger has 11 main columns (Cash and Credit contain separate subcolumns for Rs. and Paise):
1. "Date": Visit date (DD/MM/YYYY, DD-MM-YY, etc.).
2. "Serial Number": Entry serial number (1, 2, 3, etc.).
3. "Daily": Daily OPD token / patient sequence number.
4. "Name": Patient name. Note: Phone numbers are often written alongside or underneath the name (e.g. "Rakesh 9876543210" or "Suman (9123456789)").
5. "Age": Patient age (often includes gender e.g. "34/M", "28/F", "45 Y Male").
6. "Address": Patient locality, village, city, or address notes.
7. "Disease": Chief complaint, clinical diagnosis, dental condition (e.g. toothache, pulpitis, caries, swelling).
8. "Treatment": Procedure done, medication prescribed, or clinical advice (e.g. Filling, Extraction, RCT, Scaling, Crown).
9. "Cash": Subcolumns: "Rs." (Cash Rupees) and "Paise".
10. "Credit": Subcolumns: "Rs." (Credit / Balance Due Rupees) and "Paise".
11. "Remark": Remarks, follow-up date, doctor notes, or signature.

CRITICAL LOGICAL PATIENT ENTRY GROUPING (DO NOT SPLIT MULTILINE ENTRIES):
1. In this register, a patient's information CAN OCCUPY MULTIPLE HANDWRITTEN LINES (1, 2, or 3 lines vertically)!
   - Long addresses, disease details, and treatment notes frequently wrap onto subsequent lines.
   - DO NOT treat each horizontal line or cell as a separate patient.
   - Anchor each logical patient entry by the Serial Number, Daily number, and Date at the start of the row.
   - Group all lines and text within the vertical span of that patient into ONE complete record.
2. Repeated Dates & Ditto Marks:
   - If the Date column has a ditto mark ('"', 'do', '—') or is left blank below a previous date, it represents the SAME date as the entry above.
3. Financial Subcolumns:
   - Extract "cashRs" and "cashPaise" from the Cash subcolumns.
   - Extract "creditRs" and "creditPaise" from the Credit subcolumns.
   - Compute total amount / fee as (cashRs + creditRs).
   - If creditRs > 0 and cashRs > 0, paymentStatus is "partial".
   - If creditRs > 0 and cashRs == 0, paymentStatus is "unpaid".
   - If creditRs == 0 and cashRs > 0, paymentStatus is "paid".
4. Embedded Phone Numbers:
   - If a 10-digit mobile number is written in the Name or Address column, extract it to "phone" and remove it from the patient name.
5. Zero Fabrication:
   - The photograph is the SOLE source of truth. If a field is blank, unwritten, or dashed ("-", "--"), return null. Never fabricate fake names or default dates to today!

Return strictly a JSON object adhering to:
{
  "layoutType": "COLUMN_BASED",
  "layoutConfidence": number,
  "detectedColumns": ["Date", "Serial Number", "Daily", "Name", "Age", "Address", "Disease", "Treatment", "Cash (Rs., Paise)", "Credit (Rs., Paise)", "Remark"],
  "columnCount": 11,
  "rowCount": number,
  "patients": [
    {
      "sNo": "1",
      "daily": "1",
      "visitDate": "YYYY-MM-DD",
      "name": "string",
      "phone": "string (10 digits)" | null,
      "age": number | null,
      "gender": "Male" | "Female" | "Other" | null,
      "address": "string" | null,
      "disease": "string" | null,
      "treatment": "string" | null,
      "cashRs": number | null,
      "cashPaise": "string" | null,
      "creditRs": number | null,
      "creditPaise": "string" | null,
      "amount": number | null,
      "fee": number | null,
      "paymentStatus": "paid" | "partial" | "unpaid" | null,
      "remarks": "string" | null,
      "lineCount": number,
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

    // Ensure fee, amount, financial subcolumns, and embedded details are synchronized
    if (Array.isArray(rawToValidate.patients)) {
      let lastKnownDate: string | null = null;

      rawToValidate.patients = rawToValidate.patients.map((p: any) => {
        // 1. Inherit date for repeated ditto marks or blank rows
        let vDate = p.visitDate || p.date;
        if (vDate && vDate !== '"' && vDate !== "do" && vDate !== "—" && vDate !== "-") {
          lastKnownDate = vDate;
        } else if ((!vDate || vDate === '"' || vDate === "do" || vDate === "—" || vDate === "-") && lastKnownDate) {
          vDate = lastKnownDate;
        }

        // 2. Extract phone embedded in Name if phone is absent
        let pName = p.name || p.fullName || "";
        let pPhone = p.phone;
        if (!pPhone && pName) {
          const match = pName.match(/\b(?:(?:\+?91[\-\s]?)?[6-9]\d{9}|\d{10})\b/);
          if (match) {
            pPhone = match[0].replace(/\D/g, "");
            pName = pName.replace(match[0], "").replace(/[\(\)\[\]\/\-,]/g, " ").trim();
          }
        }

        // 3. Extract gender from Age if noted like "34/M" or "28 F"
        let pAge = p.age;
        let pGender = p.gender;
        if (typeof pAge === "string" && !pGender) {
          if (/\b(m|male|पुरुष)\b/i.test(pAge)) pGender = "Male";
          else if (/\b(f|female|महिला|स्त्री)\b/i.test(pAge)) pGender = "Female";
        }

        // 4. Financial calculation from Cash and Credit subcolumns
        const cash = Number(p.cashRs ?? p.cash ?? 0);
        const credit = Number(p.creditRs ?? p.credit ?? 0);
        let totalAmt = p.amount !== undefined ? Number(p.amount) : (p.fee !== undefined ? Number(p.fee) : (cash + credit));
        if (totalAmt === 0 && (cash > 0 || credit > 0)) {
          totalAmt = cash + credit;
        }

        let pStatus = p.paymentStatus;
        if (!pStatus) {
          if (credit > 0 && cash > 0) pStatus = "partial";
          else if (credit > 0 && cash === 0) pStatus = "unpaid";
          else if (cash > 0) pStatus = "paid";
          else if (totalAmt > 0) pStatus = "paid";
        }

        return {
          ...p,
          name: pName,
          phone: pPhone,
          age: pAge,
          gender: pGender,
          visitDate: vDate,
          disease: p.disease || p.chiefComplaint || null,
          treatment: p.treatment || null,
          address: p.address || null,
          cashRs: p.cashRs !== undefined ? p.cashRs : (cash > 0 ? cash : null),
          cashPaise: p.cashPaise !== undefined ? p.cashPaise : null,
          creditRs: p.creditRs !== undefined ? p.creditRs : (credit > 0 ? credit : null),
          creditPaise: p.creditPaise !== undefined ? p.creditPaise : null,
          fee: totalAmt > 0 ? totalAmt : null,
          amount: totalAmt > 0 ? totalAmt : null,
          paymentStatus: pStatus,
        };
      });
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
