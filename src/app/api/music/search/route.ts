import { NextRequest, NextResponse } from "next/server";
import { aggregateMusicSearch } from "@/lib/musicProviders";
import { route } from "@/lib/http";
import { enforceRateLimit, sanitizeText } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SEARCH_CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
};

function parseLimit(raw: string | null): number {
  const parsed = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(parsed)) return 30;
  return Math.min(Math.max(parsed, 1), 50);
}

// GET /api/music/search?q=&language=&limit= - public, rate limited
export const GET = route("music.search", async (req: NextRequest) => {
  await enforceRateLimit(req, { scope: "music:search", limit: 60, windowSeconds: 60 });

  const { searchParams } = new URL(req.url);
  // Sanitised + length-bounded to keep upstream providers and the local
  // regex query cheap and free of control characters.
  const query = sanitizeText(searchParams.get("q") || searchParams.get("query") || "", 120);
  const language = sanitizeText(searchParams.get("language") || "", 40) || undefined;
  const limit = parseLimit(searchParams.get("limit"));

  if (!query) {
    return NextResponse.json({ success: true, songs: [], total: 0 }, { headers: SEARCH_CACHE_HEADERS });
  }

  const songs = await aggregateMusicSearch(query, language, limit).catch((error) => {
    console.error("[api:music.search] provider aggregation failed", error);
    return [];
  });

  return NextResponse.json(
    { success: true, songs, total: songs.length },
    { headers: SEARCH_CACHE_HEADERS }
  );
});
