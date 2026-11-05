import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase, AlbumModel } from "@/lib/mongodb";
import { deleteFromImageKit } from "@/lib/imagekit";

export const runtime = "nodejs";

// DELETE /api/albums/[id]
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

