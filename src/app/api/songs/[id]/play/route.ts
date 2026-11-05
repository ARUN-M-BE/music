import { NextRequest, NextResponse } from "next/server";
import { withDb, SongModel } from "@/lib/mongodb";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// PUT /api/songs/[id]/play
export async function PUT(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const updated = await withDb(() =>
      SongModel.findByIdAndUpdate(
        id,
        { $inc: { playsCount: 1 } },
        { new: true }
      ).lean()
    );

    return NextResponse.json({ success: true, song: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Failed to increment play count", error: error.message },
      { status: 500 }
    );
  }
}

