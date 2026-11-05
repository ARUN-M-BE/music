import { NextRequest, NextResponse } from "next/server";
import { withDb, ArtistModel } from "@/lib/mongodb";
import { getUserFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DEFAULT_ARTIST_IMG =
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80";

// POST /api/artists/bulk - Batch import artists
export async function POST(req: NextRequest) {
  try {
    const session = await getUserFromRequest(req);
    if (!session || (session.user.role !== "admin" && session.user.role !== "superadmin")) {
      return NextResponse.json(
        { success: false, message: "Admin privileges required for bulk import" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const artists = body.artists;

    if (!Array.isArray(artists) || artists.length === 0) {
      return NextResponse.json(
        { success: false, message: "No artists provided for bulk import" },
        { status: 400 }
      );
    }

    const validArtists: any[] = [];
    const errors: any[] = [];

    for (let i = 0; i < artists.length; i++) {
      const a = artists[i];
      if (!a.name || typeof a.name !== "string" || !a.name.trim()) {
        errors.push({ row: i + 1, message: "Missing artist name" });
        continue;
      }

      validArtists.push({
        name: a.name.trim(),
        imageURL: a.imageURL?.trim() || DEFAULT_ARTIST_IMG,
        instagram: a.instagram?.trim() || a.name.toLowerCase().replace(/\s+/g, ""),
        twetter: a.twetter?.trim() || a.name.toLowerCase().replace(/\s+/g, ""),
        fileId: a.fileId?.trim() || `art_bulk_${Date.now()}_${i}`,
      });
    }

    if (validArtists.length === 0) {
      return NextResponse.json(
        { success: false, message: "All records failed validation", errors },
        { status: 400 }
      );
    }

    const inserted = await withDb(() =>
      ArtistModel.insertMany(validArtists, { ordered: false })
    );

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${inserted.length} artists`,
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

