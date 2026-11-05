import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase, ArtistModel } from "@/lib/mongodb";
import { deleteFromImageKit } from "@/lib/imagekit";

export const runtime = "nodejs";

// DELETE /api/artists/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const artist = await ArtistModel.findById(id);
    if (!artist) {
      return NextResponse.json({ success: false, message: "Artist not found" }, { status: 404 });
    }

    if (artist.fileId) {
      await deleteFromImageKit(artist.fileId).catch(console.warn);
    }

    await ArtistModel.findByIdAndDelete(id);

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

