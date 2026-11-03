import { z } from "zod";
import fs from "fs";

/**
 * Strict Zod Schema for Extracted Patient Entry
 */
export const ExtractedPatientSchema = z.object({
  name: z.string().min(1, "Patient name is required"),
  age: z
    .union([z.string(), z.number()])
    .nullable()
    .optional()
    .transform((val) => {
      if (val === null || val === undefined || val === "") return null;
      const num = typeof val === "number" ? val : parseInt(val, 10);
      return isNaN(num) || num < 0 || num > 120 ? null : num;
    }),
  gender: z
    .enum(["Male", "Female", "Other"])
    .nullable()
    .optional(),
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
  visitDate: z.string().nullable().optional(),
  chiefComplaint: z.string().nullable().optional(),
  treatment: z.string().nullable().optional(),
  dentalNotes: z.string().nullable().optional(),
  prescribedMedication: z.string().nullable().optional(),
  nextVisitDate: z.string().nullable().optional(),
  amount: z
    .union([z.string(), z.number()])
    .nullable()
    .optional()
    .transform((val) => {
      if (val === null || val === undefined || val === "") return null;
      const num = typeof val === "number" ? val : parseFloat(val);
      return isNaN(num) || num < 0 ? null : Math.round(num);
    }),
  paymentStatus: z
    .enum(["paid", "partial", "unpaid"])
    .nullable()
    .optional(),
  remarks: z.string().nullable().optional(),
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
  patients: z.array(ExtractedPatientSchema),
});

export type APInexExtractionResponse = z.infer<typeof APInexExtractionResponseSchema>;

export interface APInexRequestOptions {
  imagePath: string;
  columnsCount?: number;
  readingOrder?: "column_first" | "row_first";
  totalBoxesExpected?: number;
  testMode?: boolean;
}

export interface APInexResult {
  success: boolean;
  patients: ExtractedPatient[];
  modelUsed: string;
  isSynthetic: boolean;
  rawResponse?: string;
  error?: string;
}

/**
 * Generates synthetic patient register entries for development, offline testing,
 * or when clinic staff choose test mode to prevent sending real PII to third-party endpoints.
 */
export function generateSyntheticRegisterEntries(
  totalBoxes = 8,
  columnsCount = 2,
  readingOrder: "column_first" | "row_first" = "column_first"
): ExtractedPatient[] {
  const syntheticNames = [
    "Rajesh Gupta",
    "Pooja Sharma",
    "Amitabh Verma",
    "Sunita Devi",
    "Vikram Singh",
    "Neha Joshi",
    "Manoj Yadav",
    "Kavita Kumari",
    "Deepak Chopra",
    "Ananya Sengupta",
  ];

  const syntheticTreatments = [
    { treatment: "Root Canal Treatment (RCT)", complaint: "Severe lower molar pain", amount: 2500, paid: "paid" },
    { treatment: "Dental Cleaning & Scaling", complaint: "Tartar and bleeding gums", amount: 800, paid: "paid" },
    { treatment: "Tooth Composite Filling", complaint: "Sensitivity to cold water", amount: 1200, paid: "partial" },
    { treatment: "Tooth Extraction", complaint: "Decayed wisdom tooth", amount: 1500, paid: "paid" },
    { treatment: "Dental Crown / Cap", complaint: "Post-RCT crown placement", amount: 3500, paid: "unpaid" },
    { treatment: "Orthodontic Consultation", complaint: "Irregular front teeth", amount: 500, paid: "paid" },
    { treatment: "Gum Care / Gingivitis", complaint: "Swollen gums", amount: 900, paid: "paid" },
    { treatment: "Teeth Whitening", complaint: "Yellow stains", amount: 4000, paid: "paid" },
  ];

  const results: ExtractedPatient[] = [];
  const rowsPerCol = Math.ceil(totalBoxes / (columnsCount || 2));

  for (let i = 0; i < totalBoxes; i++) {
    const name = syntheticNames[i % syntheticNames.length];
    const tm = syntheticTreatments[i % syntheticTreatments.length];
    const age = 22 + ((i * 7) % 55);
    const gender = i % 2 === 0 ? "Male" : "Female";
    const phone = `98${String(10000000 + i * 111111).slice(0, 8)}`;
    const today = new Date().toISOString().split("T")[0];

    const colIndex = readingOrder === "column_first" ? Math.floor(i / rowsPerCol) : i % columnsCount;
    const rowIndex = readingOrder === "column_first" ? i % rowsPerCol : Math.floor(i / columnsCount);

    const isUncertainPhone = i === 4; // introduce one entry with uncertain phone for review test
    const isUnreadableBox = i === 7; // introduce one unreadable box for rejection test

    results.push({
      name: isUnreadableBox ? "Unreadable Handwriting" : `${name}`,
      age: isUnreadableBox ? null : age,
      gender: isUnreadableBox ? null : (gender as "Male" | "Female"),
      phone: isUnreadableBox ? null : isUncertainPhone ? "98123" : phone,
      patientCode: null,
      visitDate: today,
      chiefComplaint: isUnreadableBox ? null : tm.complaint,
      treatment: isUnreadableBox ? null : tm.treatment,
      dentalNotes: isUnreadableBox ? "Illegible ink smudge" : "Routine clinical assessment completed",
      prescribedMedication: isUnreadableBox ? null : "Amoxicillin 500mg, Paracetamol",
      nextVisitDate: isUnreadableBox ? null : "Follow up after 7 days",
      amount: isUnreadableBox ? null : tm.amount,
      paymentStatus: isUnreadableBox ? null : (tm.paid as "paid" | "partial" | "unpaid"),
      remarks: isUnreadableBox ? "Requires re-examination or manual query" : "Verified outpatient visit",
      unreadableFields: isUnreadableBox
        ? ["name", "age", "phone", "treatment"]
        : isUncertainPhone
        ? ["phone"]
        : [],
      confidence: {
        name: isUnreadableBox ? 0.2 : 0.96,
        age: isUnreadableBox ? 0.0 : 0.94,
        phone: isUnreadableBox ? 0.0 : isUncertainPhone ? 0.45 : 0.95,
        treatment: isUnreadableBox ? 0.1 : 0.97,
        amount: isUnreadableBox ? 0.0 : 0.92,
      },
      boxIndex: i,
      boxCoordinates: {
        x: Math.round(((colIndex * (100 / columnsCount)) + 2) * 10) / 10,
        y: Math.round(((rowIndex * (100 / rowsPerCol)) + 4) * 10) / 10,
        width: Math.round(((100 / columnsCount) - 4) * 10) / 10,
        height: Math.round(((100 / rowsPerCol) - 6) * 10) / 10,
      },
    });
  }

  return results;
}

/**
 * Calls APInex Gemini endpoint (OpenAI-compatible) with strict Zod validation
 */
export async function callAPInexRegisterExtraction(
  options: APInexRequestOptions
): Promise<APInexResult> {
  const apiKey = process.env.APINEX_API_KEY;
  const baseUrl = (process.env.APINEX_BASE_URL || "https://api.apinex.bond/v1").replace(/\/+$/, "");
  const model = process.env.APINEX_MODEL || "free/gemini-3.8-flash";

  // Check testMode or lack of API key
  if (options.testMode || !apiKey || apiKey.trim() === "" || apiKey === "your_actual_api_key") {
    console.log(
      `[APInex Client] Using Synthetic Data Test Mode (testMode=${!!options.testMode}, apiKeyConfigured=${!!apiKey && apiKey !== "your_actual_api_key"})`
    );
    const syntheticPatients = generateSyntheticRegisterEntries(
      options.totalBoxesExpected || 8,
      options.columnsCount || 2,
      options.readingOrder || "column_first"
    );
    return {
      success: true,
      patients: syntheticPatients,
      modelUsed: options.testMode ? "synthetic_test_mode" : `${model}_synthetic_fallback`,
      isSynthetic: true,
    };
  }

  if (!fs.existsSync(options.imagePath)) {
    return {
      success: false,
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

    const promptText = `You are a medical records digitization assistant for Anil Sharma Dental Hospital.
Analyze this handwritten patient outpatient register photograph.
The register contains patient records arranged in distinct rectangular boxes across ${options.columnsCount || 2} vertical columns.
READING ORDER: ${options.readingOrder || "column_first"}.

CRITICAL RULES:
1. Treat every detected rectangular box as an independent patient entry.
2. DO NOT combine, blend, or bleed information between neighbouring boxes.
3. If a value (phone number, age, treatment) is absent or unreadable, set it to null. DO NOT invent missing data.
4. For uncertain handwriting, add the field name to "unreadableFields" and assign a low confidence score (e.g. 0.3-0.5).
5. Extract standard dental procedures (e.g. Root Canal Treatment, Cleaning, Composite Filling, Extraction, Crown).
6. Return strictly a JSON object with a "patients" array adhering to this schema:
{
  "patients": [
    {
      "name": "string",
      "age": number | null,
      "gender": "Male" | "Female" | "Other" | null,
      "phone": "string (10 digits)" | null,
      "patientCode": "string" | null,
      "visitDate": "YYYY-MM-DD" | null,
      "chiefComplaint": "string" | null,
      "treatment": "string" | null,
      "dentalNotes": "string" | null,
      "prescribedMedication": "string" | null,
      "nextVisitDate": "string" | null,
      "amount": number | null,
      "paymentStatus": "paid" | "partial" | "unpaid" | null,
      "remarks": "string" | null,
      "unreadableFields": ["string"],
      "confidence": {
        "name": 0.0 - 1.0,
        "age": 0.0 - 1.0,
        "phone": 0.0 - 1.0,
        "treatment": 0.0 - 1.0
      }
    }
  ]
}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

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
            content: "You are a specialized clinical OCR assistant. Output strictly valid JSON without conversational text.",
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
      let userMsg = `APInex API Error (HTTP ${status})`;
      if (status === 401 || status === 403) {
        userMsg = "APInex authentication failed. Please verify APINEX_API_KEY in your environment.";
      } else if (status === 429) {
        userMsg = "APInex rate limit exceeded. Please wait a moment before reprocessing.";
      } else if (status >= 500) {
        userMsg = "APInex provider gateway is currently unavailable. Please retry shortly.";
      }
      console.error(`[APInex Error] HTTP ${status}:`, errorText);
      return {
        success: false,
        patients: [],
        modelUsed: model,
        isSynthetic: false,
        error: `${userMsg}: ${errorText.slice(0, 150)}`,
      };
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      return {
        success: false,
        patients: [],
        modelUsed: model,
        isSynthetic: false,
        error: "APInex returned an empty completion content.",
      };
    }

    // Strip markdown fences if present
    const cleanedJsonStr = content.replace(/```json\s*/gi, "").replace(/```\s*$/gi, "").trim();

    let parsedRaw: any;
    try {
      parsedRaw = JSON.parse(cleanedJsonStr);
    } catch (jsonErr: any) {
      return {
        success: false,
        patients: [],
        modelUsed: model,
        isSynthetic: false,
        rawResponse: content,
        error: `Failed to parse AI JSON response: ${jsonErr.message}`,
      };
    }

    // Wrap in object if array was returned directly
    const rawToValidate = Array.isArray(parsedRaw) ? { patients: parsedRaw } : parsedRaw;

    // Strict Zod Validation
    const validationResult = APInexExtractionResponseSchema.safeParse(rawToValidate);

    if (!validationResult.success) {
      console.warn("[APInex Client] Zod Validation Warnings:", validationResult.error.issues);
      // Attempt to salvage valid items
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
          patients: validItems,
          modelUsed: model,
          isSynthetic: false,
          rawResponse: content,
        };
      }

      return {
        success: false,
        patients: [],
        modelUsed: model,
        isSynthetic: false,
        rawResponse: content,
        error: `AI response failed strict schema validation: ${validationResult.error.issues.map((i) => i.message).join(", ")}`,
      };
    }

    return {
      success: true,
      patients: validationResult.data.patients,
      modelUsed: model,
      isSynthetic: false,
      rawResponse: content,
    };
  } catch (error: any) {
    if (error.name === "AbortError") {
      return {
        success: false,
        patients: [],
        modelUsed: model,
        isSynthetic: false,
        error: "APInex request timed out after 60 seconds. The image may be too large or the network is slow.",
      };
    }
    return {
      success: false,
      patients: [],
      modelUsed: model,
      isSynthetic: false,
      error: `APInex request failed: ${error.message || error}`,
    };
  }
}

