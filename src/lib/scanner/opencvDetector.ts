import { execFile } from "child_process";
import path from "path";
import fs from "fs";
import { generateGridBoxes, BoxGridItem } from "./boxDetector";

export interface OpenCVGridResult {
  success: boolean;
  width?: number;
  height?: number;
  rotationAngle?: number;
  layoutType: "COLUMN_BASED" | "BOX_BASED" | "FREE_FORM" | "MIXED_LAYOUT";
  confidence: number;
  qualityAssessment?: {
    sharpness: number;
    brightness: number;
    contrast: number;
    isBlurry: boolean;
    isTooDark?: boolean;
    isTooBright?: boolean;
    qualityScore: number;
  };
  pageBoundary?: { x: number; y: number; width: number; height: number };
  detectionMethod: "opencv_lines" | "hybrid_template_fallback" | "pure_template";
  columnsDetected: number;
  rowsDetected: number;
  regionsDetected: number;
  requiresManualReview: boolean;
  totalBoxes: number;
  readingOrder: "column_first" | "row_first";
  boxes: Array<{
    index: number;
    colIndex?: number;
    rowIndex?: number;
    x: number;
    y: number;
    width: number;
    height: number;
    source: string;
  }>;
  error?: string;
}

export interface OpenCVDetectOptions {
  expectedCols?: number;
  readingOrder?: "column_first" | "row_first";
  outputCropsDir?: string;
  noDeskew?: boolean;
}

/**
 * Invokes the Python OpenCV Grid Detector script to analyze register pages
 */
export async function runOpenCVGridDetection(
  imagePath: string,
  options: OpenCVDetectOptions = {}
): Promise<OpenCVGridResult> {
  const scriptPath = path.join(process.cwd(), "scripts", "opencv_grid_detector.py");
  const readingOrder = options.readingOrder || "column_first";

  // Check if python script exists and image exists
  if (!fs.existsSync(scriptPath) || !fs.existsSync(imagePath)) {
    return fallbackToTemplateGrid(options.expectedCols || 2, readingOrder);
  }

  const args: string[] = [scriptPath, imagePath];

  return new Promise<OpenCVGridResult>((resolve) => {
    const pythonCmd = process.platform === "win32" ? "python" : "python3";

    execFile(
      pythonCmd,
      args,
      {
        timeout: 10000,
        maxBuffer: 10 * 1024 * 1024,
      },
      (error, stdout, stderr) => {
        if (error || !stdout) {
          console.warn("[OpenCV Bridge] Warning/fallback during python execution:", error?.message || stderr);
          return resolve(fallbackToTemplateGrid(options.expectedCols || 2, readingOrder));
        }

        try {
          const parsed = JSON.parse(stdout.trim());
          if (parsed.success) {
            return resolve({
              success: true,
              width: parsed.width,
              height: parsed.height,
              rotationAngle: parsed.rotationAngle || 0,
              layoutType: parsed.layoutType || (parsed.columnsDetected >= 5 ? "COLUMN_BASED" : "BOX_BASED"),
              confidence: parsed.confidence || 0.85,
              qualityAssessment: parsed.qualityAssessment,
              pageBoundary: parsed.pageBoundary,
              detectionMethod: "opencv_lines",
              columnsDetected: parsed.columnsDetected || 2,
              rowsDetected: parsed.rowsDetected || 4,
              regionsDetected: parsed.regionsDetected || (parsed.boxes?.length || 0),
              requiresManualReview: parsed.requiresManualReview || false,
              totalBoxes: parsed.boxes?.length || 0,
              readingOrder,
              boxes: parsed.boxes || [],
            });
          }
          return resolve(fallbackToTemplateGrid(options.expectedCols || 2, readingOrder));
        } catch (parseErr) {
          console.warn("[OpenCV Bridge] Failed to parse JSON stdout:", parseErr);
          return resolve(fallbackToTemplateGrid(options.expectedCols || 2, readingOrder));
        }
      }
    );
  });
}

function fallbackToTemplateGrid(
  columns: number,
  readingOrder: "column_first" | "row_first"
): OpenCVGridResult {
  const defaultRows = 4;
  const boxes = generateGridBoxes(columns, defaultRows, readingOrder).map((b) => ({
    index: b.boxIndex,
    colIndex: b.colIndex,
    rowIndex: b.rowIndex,
    x: b.coordinates.x,
    y: b.coordinates.y,
    width: b.coordinates.width,
    height: b.coordinates.height,
    source: "hybrid_template_fallback",
  }));

  return {
    success: true,
    detectionMethod: "hybrid_template_fallback",
    layoutType: columns >= 5 ? "COLUMN_BASED" : "BOX_BASED",
    confidence: 0.75,
    columnsDetected: columns,
    rowsDetected: defaultRows,
    regionsDetected: boxes.length,
    requiresManualReview: false,
    totalBoxes: boxes.length,
    readingOrder,
    boxes,
  };
}
