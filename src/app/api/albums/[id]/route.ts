import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase, AlbumModel } from "@/lib/mongodb";
import { deleteFromImageKit } from "@/lib/imagekit";

export const runtime = "nodejs";

// GET /api/albums/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const album = await AlbumModel.findById(id).lean();

    if (!album) {
      return NextResponse.json({ success: false, message: "Album not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, album, data: album });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Error fetching album", error: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/albums/[id] - Update Album
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();

    const existingAlbum = await AlbumModel.findById(id);
    if (!existingAlbum) {
      return NextResponse.json({ success: false, message: "Album not found" }, { status: 404 });
    }

    // If artwork fileId is being replaced, clean up old file from ImageKit
    if (body.fileId && existingAlbum.fileId && body.fileId !== existingAlbum.fileId) {
      await deleteFromImageKit(existingAlbum.fileId).catch(console.warn);
    }

    const updated = await AlbumModel.findByIdAndUpdate(
      id,
      {
        name: body.name ?? existingAlbum.name,
        imageURL: body.imageURL ?? existingAlbum.imageURL,
        fileId: body.fileId ?? existingAlbum.fileId,
      },
      { new: true }
    ).lean();

    return NextResponse.json({
      success: true,
      message: "Album updated successfully",
      album: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Error updating album", error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/albums/[id] - Delete Album
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const album = await AlbumModel.findById(id);
    if (!album) {
      return NextResponse.json({ success: false, message: "Album not found" }, { status: 404 });
    }

    if (album.fileId) {
      await deleteFromImageKit(album.fileId).catch(console.warn);
    }

    await AlbumModel.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "Album deleted successfully",
      dataOne: album,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Error deleting album", error: error.message },
      { status: 500 }
    );
  }
}
