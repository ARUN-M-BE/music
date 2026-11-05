import { NextRequest, NextResponse } from "next/server";
import { getAlbumData } from "@/lib/musicProviders";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: "Album ID is required" }, { status: 400 });
    }

    const data = await getAlbumData(id);

    return NextResponse.json(
      { success: true, ...data },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (error: any) {
    console.error("Album API error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch album" },
      { status: 500 }
    );
  }
}
