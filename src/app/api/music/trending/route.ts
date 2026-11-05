import { NextRequest, NextResponse } from "next/server";
import { getTrendingAggregate } from "@/lib/musicProviders";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const language = searchParams.get("language") || undefined;

    const songs = await getTrendingAggregate(language);

    return NextResponse.json(
      { success: true, songs, total: songs.length },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (error: any) {
    console.error("Music trending API error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch trending music" },
      { status: 500 }
    );
  }
}

