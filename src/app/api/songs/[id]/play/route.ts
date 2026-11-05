import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase, SongModel } from "@/lib/mongodb";

export const runtime = "nodejs";

// PUT /api/songs/[id]/play
export async function PUT(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const updated = await SongModel.findByIdAndUpdate(
      id,
      { $inc: { playsCount: 1 } },
      { new: true }
    ).lean();

    return NextResponse.json({ success: true, song: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Failed to increment play count", error: error.message },
      { status: 500 }
    );
  }
}

