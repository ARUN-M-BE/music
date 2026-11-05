import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase, PlaylistModel } from "@/lib/mongodb";
import { getUserFromRequest } from "@/lib/auth";

export const runtime = "nodejs";

// GET /api/music/playlists?userId=...
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    let userId = searchParams.get("userId");

    if (!userId) {
      const user = await getUserFromRequest(req);
      if (user) {
        userId = user.user_id || user.email;
      }
    }

    if (!userId) {
      return NextResponse.json({ success: true, playlists: [] });
    }

    const playlists = await PlaylistModel.find({ userId }).sort({ createdAt: -1 }).lean();

    return NextResponse.json({ success: true, playlists });
  } catch (error: any) {
    console.error("Playlists GET error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch playlists" },
      { status: 500 }
    );
  }
}

// POST /api/music/playlists
export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const user = await getUserFromRequest(req);
    const body = await req.json();

    const userId = body.userId || (user ? (user.user_id || user.email) : undefined);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Authentication or userId required to create playlist" },
        { status: 401 }
      );
    }

    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { success: false, error: "Playlist name is required" },
        { status: 400 }
      );
    }

    const playlist = await PlaylistModel.create({
      name: body.name.trim(),
      description: body.description?.trim() || "",
      coverImage: body.coverImage || "",
      userId,
      songs: Array.isArray(body.songs) ? body.songs : [],
    });

    return NextResponse.json({ success: true, playlist }, { status: 201 });
  } catch (error: any) {
    console.error("Playlists POST error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create playlist" },
      { status: 500 }
    );
  }
}

// PUT /api/music/playlists (update name, songs, etc.)
export async function PUT(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { id, name, description, coverImage, songs } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Playlist ID is required" },
        { status: 400 }
      );
    }

    const updateData: Record<string, any> = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (coverImage !== undefined) updateData.coverImage = coverImage;
    if (songs !== undefined) updateData.songs = songs;

    const playlist = await PlaylistModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );

    if (!playlist) {
      return NextResponse.json(
        { success: false, error: "Playlist not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, playlist });
  } catch (error: any) {
    console.error("Playlists PUT error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update playlist" },
      { status: 500 }
    );
  }
}

// DELETE /api/music/playlists?id=...
export async function DELETE(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Playlist ID is required" },
        { status: 400 }
      );
    }

    const deleted = await PlaylistModel.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Playlist not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "Playlist deleted" });
  } catch (error: any) {
    console.error("Playlists DELETE error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete playlist" },
      { status: 500 }
    );
  }
}
