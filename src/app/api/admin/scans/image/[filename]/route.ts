import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { getCurrentUser } from "@/src/lib/auth";
import { connectDB } from "@/src/lib/mongodb";
import { ScanDocument } from "@/src/models/ScanDocument";
import { getScanFileBuffer } from "@/src/lib/scanner/storage";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { filename } = await params;
    const sanitizedFilename = path.basename(filename);

    await connectDB();
    const scan = await ScanDocument.findOne({
      storedFileName: sanitizedFilename,
      clinicId: user.clinicId,
    }).lean();

    if (!scan) {
      return NextResponse.json({ success: false, message: "Image not found or forbidden" }, { status: 404 });
    }

    const fileBuffer = getScanFileBuffer(sanitizedFilename, scan.imageBase64);
    if (!fileBuffer) {
      return NextResponse.json({ success: false, message: "File missing on server" }, { status: 404 });
    }

    const mime = scan.mimeType || "image/jpeg";

    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        "Content-Type": mime,
        "Cache-Control": "private, max-age=86400, stale-while-revalidate=604800",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error: any) {
    console.error("Error serving secure scan image:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
