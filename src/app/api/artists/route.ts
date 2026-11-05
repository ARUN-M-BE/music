import { NextRequest, NextResponse } from "next/server";
import { withDb, ArtistModel } from "@/lib/mongodb";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CreateArtistSchema = z.object({
  name: z.string().min(1, "Artist name is required"),
  imageURL: z.string().url("Valid image URL is required"),
  twetter: z.string().optional().default(""),
  instagram: z.string().min(1, "Instagram profile handle is required"),
  fileId: z.string().min(1, "fileId is required"),
});

// GET /api/artists
export async function GET(req: NextRequest) {
  try {
    const artists = await withDb(() =>
      ArtistModel.find({}).sort({ createdAt: -1 }).lean()
    );
    return NextResponse.json(
      { success: true, data: artists, artists },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error: any) {
    console.error("GET /api/artists error:", error);
    return NextResponse.json(
      { success: false, data: [], artists: [], message: "Failed to fetch artists" },
      { status: 200 }
    );
  }
}

// POST /api/artists
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = CreateArtistSchema.parse(body);

    const newArtist = await withDb(() => ArtistModel.create(validated));
    return NextResponse.json({ success: true, artist: newArtist }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create artist" },
      { status: 400 }
    );
  }
}
