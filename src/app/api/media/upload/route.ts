import { NextRequest, NextResponse } from "next/server";
import { uploadToImageKit } from "@/lib/imagekit";

export const runtime = "nodejs";

// POST /api/media/upload
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ success: false, message: "No file provided" }, { status: 400 });
    }

    // Convert file to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const isAudio = file.type.startsWith("audio/");
    const folder = isAudio ? "/music/audio" : "/music/images";

    const uploadResult = await uploadToImageKit(buffer, file.name, folder);

    const responsePayload = isAudio
      ? { songURL: uploadResult.url, fileId: uploadResult.fileId }
      : { imageURL: uploadResult.url, fileId: uploadResult.fileId };

    return NextResponse.json({
      success: true,
      message: "File uploaded successfully",
      ...responsePayload,
    });
  } catch (error: any) {
    console.error("Media upload error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Upload failed" },
      { status: 500 }
    );
  }
}

