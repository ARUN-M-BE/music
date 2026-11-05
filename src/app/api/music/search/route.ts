import { NextRequest, NextResponse } from "next/server";
import { aggregateMusicSearch } from "@/lib/musicProviders";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || searchParams.get("query") || "";
    const language = searchParams.get("language") || undefined;
    const limit = parseInt(searchParams.get("limit") || "30", 10);

    if (!query.trim()) {
      return NextResponse.json({ success: true, songs: [], total: 0 });
    }

    const songs = await aggregateMusicSearch(query.trim(), language, limit);

    return NextResponse.json(
      { success: true, songs, total: songs.length },
      {
        headers: {
          "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
        },
      }
    );
  } catch (error: any) {
    console.error("Music search API error:", error);
    return NextResponse.json(
      { success: false, songs: [], total: 0, error: error.message || "Failed to search music" },
      { status: 200 }
    );
  }
}

