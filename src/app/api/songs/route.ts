import { NextRequest, NextResponse } from "next/server";
import { withDb, SongModel } from "@/lib/mongodb";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CreateSongSchema = z.object({
  name: z.string().min(1, "Track name is required"),
  imageURL: z.string().url("Valid image URL is required"),
  songURL: z.string().url("Valid audio URL is required"),
  album: z.string().default("Single"),
  artist: z.string().min(1, "Artist is required"),
  language: z.string().default("English"),
  category: z.string().min(1, "Category is required"),
  fileId: z.string().min(1, "fileId is required"),
  songId: z.string().min(1, "songId is required"),
});

// GET /api/songs
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const category = searchParams.get("category");
    const language = searchParams.get("language");
    const sortBy = searchParams.get("sortBy") || "newest";

    const query: Record<string, any> = {};

    if (category && category !== "all") {
      query.category = { $regex: category.trim(), $options: "i" };
    }

    if (language && language !== "all") {
      query.language = { $regex: language.trim(), $options: "i" };
    }

    if (search && search.trim()) {
      const term = search.trim();
      query.$or = [
        { name: { $regex: term, $options: "i" } },
        { artist: { $regex: term, $options: "i" } },
        { album: { $regex: term, $options: "i" } },
        { category: { $regex: term, $options: "i" } },
      ];
    }

    let sortObj: Record<string, any> = { createdAt: -1 };
    if (sortBy === "popular") {
      sortObj = { playsCount: -1 };
    } else if (sortBy === "oldest") {
      sortObj = { createdAt: 1 };
    } else if (sortBy === "name") {
      sortObj = { name: 1 };
    }

    const songs = await withDb(() =>
      SongModel.find(query).sort(sortObj).lean()
    );

    return NextResponse.json(
      {
        success: true,
        data: songs,
        songs,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
        },
      }
    );
  } catch (error: any) {
    console.error("GET /api/songs error:", error);
    return NextResponse.json(
      { success: false, data: [], songs: [], message: "Failed to fetch songs" },
      { status: 200 }
    );
  }
}

// POST /api/songs
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = CreateSongSchema.parse(body);

    const newSong = await withDb(() =>
      SongModel.create({
        ...validated,
        playsCount: 0,
      })
    );

    return NextResponse.json(
      {
        success: true,
        message: "Song created successfully",
        song: newSong,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/songs error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: "Validation error", errors: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create song" },
      { status: 400 }
    );
  }
}

