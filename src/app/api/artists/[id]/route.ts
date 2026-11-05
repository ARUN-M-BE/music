import { NextRequest, NextResponse } from "next/server";
import { withDb, ArtistModel } from "@/lib/mongodb";
import { deleteFromImageKit } from "@/lib/imagekit";
import { getUserFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// GET /api/artists/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const artist = await withDb(() => ArtistModel.findById(id).lean());

    if (!artist) {
      return NextResponse.json({ success: false, message: "Artist not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, artist, data: artist });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Error fetching artist", error: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/artists/[id] - Update Artist
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const existingArtist = await withDb(() => ArtistModel.findById(id));
    if (!existingArtist) {
      return NextResponse.json({ success: false, message: "Artist not found" }, { status: 404 });
    }

    // If photo fileId is replaced, clean up old file from ImageKit
    if (body.fileId && existingArtist.fileId && body.fileId !== existingArtist.fileId) {
      await deleteFromImageKit(existingArtist.fileId).catch(console.warn);
    }

    const updated = await withDb(() =>
      ArtistModel.findByIdAndUpdate(
        id,
        {
          name: body.name ?? existingArtist.name,
          imageURL: body.imageURL ?? existingArtist.imageURL,
          instagram: body.instagram ?? existingArtist.instagram,
          twetter: body.twetter !== undefined ? body.twetter : existingArtist.twetter,
          fileId: body.fileId ?? existingArtist.fileId,
        },
        { new: true }
      ).lean()
    );

    return NextResponse.json({
      success: true,
      message: "Artist updated successfully",
      artist: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Error updating artist", error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/artists/[id] - Delete Artist
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getUserFromRequest(req);
    if (session && session.user.role !== "superadmin") {
      return NextResponse.json(
        { success: false, message: "Superadmin privileges required to delete artists" },
        { status: 403 }
      );
    }

    const { id } = await params;

    const artist = await withDb(() => ArtistModel.findById(id));
    if (!artist) {
      return NextResponse.json({ success: false, message: "Artist not found" }, { status: 404 });
    }

    if (artist.fileId) {
      await deleteFromImageKit(artist.fileId).catch(console.warn);
    }

    await withDb(() => ArtistModel.findByIdAndDelete(id));

    return NextResponse.json({
      success: true,
      message: "Artist deleted successfully",
      dataOne: artist,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Error deleting artist", error: error.message },
      { status: 500 }
    );
  }
}
