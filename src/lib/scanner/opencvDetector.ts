import { execFile } from "child_process";
import path from "path";
import fs from "fs";
import { generateGridBoxes, BoxGridItem } from "./boxDetector";

export interface OpenCVGridResult {
  success: boolean;
  width?: number;
  height?: number;
  rotationAngle?: number;
  pageBoundary?: { x: number; y: number; width: number; height: number };
  detectionMethod: "opencv_lines" | "hybrid_template_fallback" | "pure_template";
  columnsDetected: number;
  rowsDetected: number;
  totalBoxes: number;
  readingOrder: "column_first" | "row_first";
  boxes: Array<{
    index: number;
    colIndex: number;
    rowIndex: number;
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

  if (options.expectedCols && options.expectedCols > 0) {
    args.push("--expected-cols", String(options.expectedCols));
  }
  if (options.readingOrder) {
    args.push("--reading-order", options.readingOrder);
  }
  if (options.outputCropsDir) {
    args.push("--output-crops-dir", options.outputCropsDir);
  }
  if (options.noDeskew) {
    args.push("--no-deskew");
  }

  return new Promise<OpenCVGridResult>((resolve) => {
    // Attempt python, py, or python3
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
          if (parsed.success && Array.isArray(parsed.boxes) && parsed.boxes.length > 0) {
            return resolve(parsed as OpenCVGridResult);
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
  const cols = columns > 0 ? columns : 2;
  const rows = cols >= 2 ? 4 : 10;
  const gridBoxes: BoxGridItem[] = generateGridBoxes(cols, rows, readingOrder);

  return {
    success: true,
    detectionMethod: "pure_template",
    columnsDetected: cols,
    rowsDetected: rows,
    totalBoxes: gridBoxes.length,
    readingOrder,
    boxes: gridBoxes.map((b) => ({
      index: b.boxIndex,
      colIndex: b.colIndex ?? b.col,
      rowIndex: b.rowIndex ?? b.row,
      x: b.coordinates.x,
      y: b.coordinates.y,
      width: b.coordinates.width,
      height: b.coordinates.height,
      source: "pure_template",
    })),
  };
}
