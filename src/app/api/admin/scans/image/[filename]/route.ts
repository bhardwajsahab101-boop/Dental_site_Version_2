import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { getCurrentUser } from "@/src/lib/auth";
import { connectDB } from "@/src/lib/mongodb";
import { ScanDocument } from "@/src/models/ScanDocument";

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

    const filePath = path.join(process.cwd(), "private_storage", "scans", sanitizedFilename);
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ success: false, message: "File missing on disk" }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);
    const mime = scan.mimeType || "image/jpeg";

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": mime,
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error: any) {
    console.error("Error serving secure scan image:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
