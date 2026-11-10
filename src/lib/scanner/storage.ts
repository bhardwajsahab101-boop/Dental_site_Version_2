import path from "path";
import fs from "fs";
import os from "os";

/**
 * Safely saves an image buffer to disk (local storage or serverless /tmp),
 * but never throws if the filesystem is read-only.
 */
export function saveScanFile(storedFileName: string, buffer: Buffer): { savedOnDisk: boolean; localPath?: string } {
  // 1. Try project storage (works in local dev, VPS, Docker)
  try {
    const primaryDir = path.join(process.cwd(), "private_storage", "scans");
    if (!fs.existsSync(primaryDir)) {
      fs.mkdirSync(primaryDir, { recursive: true });
    }
    const targetPath = path.join(primaryDir, storedFileName);
    fs.writeFileSync(targetPath, buffer);
    return { savedOnDisk: true, localPath: targetPath };
  } catch (err) {
    // Expected on Vercel/AWS Lambda where /var/task is read-only
  }

  // 2. Fallback to OS tmp directory (writable on Vercel & AWS Lambda)
  try {
    const tmpDir = path.join(os.tmpdir(), "scans");
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    const targetPath = path.join(tmpDir, storedFileName);
    fs.writeFileSync(targetPath, buffer);
    return { savedOnDisk: true, localPath: targetPath };
  } catch (tmpErr) {
    console.warn("[storage] Could not write to /tmp storage:", tmpErr);
  }

  return { savedOnDisk: false };
}

/**
 * Ensures an image file exists on disk (useful for tools like OpenCV/Tesseract that expect a file path).
 * If the file is not on disk but we have imageBase64, it writes it to os.tmpdir().
 */
export function ensureLocalScanFile(storedFileName: string, imageBase64?: string): string | null {
  // Check primary storage
  const primaryPath = path.join(process.cwd(), "private_storage", "scans", storedFileName);
  if (fs.existsSync(primaryPath)) {
    return primaryPath;
  }

  // Check tmp storage
  const tmpPath = path.join(os.tmpdir(), "scans", storedFileName);
  if (fs.existsSync(tmpPath)) {
    return tmpPath;
  }

  // Write base64 to tmp storage
  if (imageBase64) {
    try {
      const tmpDir = path.join(os.tmpdir(), "scans");
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }
      fs.writeFileSync(tmpPath, Buffer.from(imageBase64, "base64"));
      return tmpPath;
    } catch (err) {
      console.warn("[storage] Failed to write imageBase64 to tmp:", err);
    }
  }

  return null;
}

/**
 * Retrieves the raw Buffer of a scan document, from base64 or disk.
 */
export function getScanFileBuffer(storedFileName: string, imageBase64?: string): Buffer | null {
  if (imageBase64) {
    return Buffer.from(imageBase64, "base64");
  }

  const primaryPath = path.join(process.cwd(), "private_storage", "scans", storedFileName);
  if (fs.existsSync(primaryPath)) {
    try {
      return fs.readFileSync(primaryPath);
    } catch (e) {}
  }

  const tmpPath = path.join(os.tmpdir(), "scans", storedFileName);
  if (fs.existsSync(tmpPath)) {
    try {
      return fs.readFileSync(tmpPath);
    } catch (e) {}
  }

  return null;
}

/**
 * Safely removes a scan file from both primary storage and tmp directory.
 */
export function deleteScanFile(storedFileName: string): void {
  const paths = [
    path.join(process.cwd(), "private_storage", "scans", storedFileName),
    path.join(os.tmpdir(), "scans", storedFileName),
  ];

  for (const p of paths) {
    if (fs.existsSync(p)) {
      try {
        fs.unlinkSync(p);
      } catch (err) {}
    }
  }
}

