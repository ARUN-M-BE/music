import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase, SongModel } from "@/lib/mongodb";
import { getUserFromRequest } from "@/lib/auth";
import { DEFAULT_COVER_URL } from "@/lib/mediaOptimization";

export const runtime = "nodejs";

// POST /api/songs/bulk - Batch import songs
export async function POST(req: NextRequest) {
  try {
    const session = await getUserFromRequest(req);
    if (!session || (session.user.role !== "admin" && session.user.role !== "superadmin")) {
      return NextResponse.json(
        { success: false, message: "Admin privileges required for bulk import" },
        { status: 403 }
      );
    }

    await connectToDatabase();
    const body = await req.json();
    const songs = body.songs;

    if (!Array.isArray(songs) || songs.length === 0) {
      return NextResponse.json(
        { success: false, message: "No songs provided for bulk import" },
        { status: 400 }
      );
    }

    const validSongs = [];
    const errors = [];

    for (let i = 0; i < songs.length; i++) {
      const s = songs[i];
      if (!s.name || typeof s.name !== "string" || !s.name.trim()) {
        errors.push({ row: i + 1, message: "Missing song title" });
        continue;
      }
      if (!s.artist || typeof s.artist !== "string" || !s.artist.trim()) {
        errors.push({ row: i + 1, message: "Missing artist name" });
        continue;
      }
      if (!s.songURL || typeof s.songURL !== "string" || !s.songURL.trim()) {
        errors.push({ row: i + 1, message: "Missing audio stream URL" });
        continue;
      }

      validSongs.push({
        name: s.name.trim(),
        artist: s.artist.trim(),
        album: s.album?.trim() || "Single",
        category: s.category?.trim() || "Pop",
        language: s.language?.trim() || "English",
        songURL: s.songURL.trim(),
        imageURL: s.imageURL?.trim() || DEFAULT_COVER_URL,
        fileId: s.fileId?.trim() || `img_bulk_${Date.now()}_${i}`,
        songId: s.songId?.trim() || `aud_bulk_${Date.now()}_${i}`,
        playsCount: typeof s.playsCount === "number" ? s.playsCount : 0,
      });
    }

    if (validSongs.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "All records failed validation",
          errors,
        },
        { status: 400 }
      );
    }

    const inserted = await SongModel.insertMany(validSongs, { ordered: false });

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${inserted.length} songs`,
      count: inserted.length,
      errorsCount: errors.length,
      errors,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Bulk import failed", error: error.message },
      { status: 500 }
    );
  }
}

