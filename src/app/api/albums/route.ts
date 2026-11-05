import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase, AlbumModel } from "@/lib/mongodb";
import { z } from "zod";

export const runtime = "nodejs";

const CreateAlbumSchema = z.object({
  name: z.string().min(1, "Album name is required"),
  imageURL: z.string().url("Valid image URL is required"),
  fileId: z.string().min(1, "fileId is required"),
});

// GET /api/albums
export async function GET() {
  try {
    await connectToDatabase();
    const albums = await AlbumModel.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, data: albums, albums });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Failed to fetch albums", error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/albums
export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const validated = CreateAlbumSchema.parse(body);

    const newAlbum = await AlbumModel.create(validated);
    return NextResponse.json({ success: true, album: newAlbum }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create album" },
      { status: 400 }
    );
  }
}

