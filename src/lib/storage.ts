import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";

/**
 * Saves a file to the local disk under public/uploads/<clinicId>/<patientId>/
 * and returns the relative public URL.
 */
export async function saveFile(
  file: File,
  clinicId: string,
  patientId: string
): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const uploadsDir = path.join(
    process.cwd(),
    "public",
    "uploads",
    clinicId,
    patientId
  );

  // Ensure directories are recursively created
  await mkdir(uploadsDir, { recursive: true });

  // Sanitize the file name and append timestamp for uniqueness
  const fileExtension = path.extname(file.name);
  const fileNameWithoutExt = path.basename(file.name, fileExtension).replace(/[^a-zA-Z0-9_\-]/g, "_");
  const uniqueFileName = `${fileNameWithoutExt}_${Date.now()}${fileExtension}`;
  const filePath = path.join(uploadsDir, uniqueFileName);

  // Save the buffer to disk
  await writeFile(filePath, buffer);

  // Return the relative public path URL
  return `/uploads/${clinicId}/${patientId}/${uniqueFileName}`;
}

/**
 * Deletes a file from local disk based on its relative URL path.
 */
export async function deleteFile(fileUrl: string): Promise<void> {
  try {
    // Basic security guard against directory traversal
    if (!fileUrl.startsWith("/uploads/")) {
      throw new Error("Invalid deletion path context");
    }

    const filePath = path.join(process.cwd(), "public", fileUrl);
    await unlink(filePath);
  } catch (error) {
    console.error(`Failed to delete file from disk at '${fileUrl}':`, error);
  }
}
