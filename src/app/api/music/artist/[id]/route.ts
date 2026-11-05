import { NextRequest, NextResponse } from "next/server";
import { getArtistData } from "@/lib/musicProviders";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: "Artist ID is required" }, { status: 400 });
    }

    const data = await getArtistData(id);

    return NextResponse.json(
      { success: true, ...data },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (error: any) {
    console.error("Artist API error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch artist" },
      { status: 500 }
    );
  }
}

