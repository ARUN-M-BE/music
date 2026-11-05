import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase, SongModel } from "@/lib/mongodb";
import { deleteFromImageKit } from "@/lib/imagekit";

export const runtime = "nodejs";

// GET /api/songs/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const song = await SongModel.findById(id).lean();

    if (!song) {
      return NextResponse.json({ success: false, message: "Song not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, song, data: song });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Error fetching song", error: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/songs/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();

    const updated = await SongModel.findByIdAndUpdate(id, body, { new: true }).lean();
    if (!updated) {
      return NextResponse.json({ success: false, message: "Song not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Song updated", song: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Error updating song", error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/songs/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const existingSong = await SongModel.findById(id);
    if (!existingSong) {
      return NextResponse.json({ success: false, message: "Song not found" }, { status: 404 });
    }

    // Safely delete associated media from ImageKit
    if (existingSong.fileId) {
      await deleteFromImageKit(existingSong.fileId).catch(console.warn);
    }
    if (existingSong.songId) {
      await deleteFromImageKit(existingSong.songId).catch(console.warn);
    }

    await SongModel.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "Song deleted successfully",
      dataOne: existingSong,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Error deleting song", error: error.message },
      { status: 500 }
    );
  }
}

