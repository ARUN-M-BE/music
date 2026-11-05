import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase, AlbumModel } from "@/lib/mongodb";
import { getUserFromRequest } from "@/lib/auth";
import { DEFAULT_COVER_URL } from "@/lib/mediaOptimization";

export const runtime = "nodejs";

// POST /api/albums/bulk - Batch import albums
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
    const albums = body.albums;

    if (!Array.isArray(albums) || albums.length === 0) {
      return NextResponse.json(
        { success: false, message: "No albums provided for bulk import" },
        { status: 400 }
      );
    }

    const validAlbums = [];
    const errors = [];

    for (let i = 0; i < albums.length; i++) {
      const a = albums[i];
      if (!a.name || typeof a.name !== "string" || !a.name.trim()) {
        errors.push({ row: i + 1, message: "Missing album title" });
        continue;
      }

      validAlbums.push({
        name: a.name.trim(),
        imageURL: a.imageURL?.trim() || DEFAULT_COVER_URL,
        fileId: a.fileId?.trim() || `alb_bulk_${Date.now()}_${i}`,
      });
    }

    if (validAlbums.length === 0) {
      return NextResponse.json(
        { success: false, message: "All records failed validation", errors },
        { status: 400 }
      );
    }

    const inserted = await AlbumModel.insertMany(validAlbums, { ordered: false });

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${inserted.length} albums`,
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

