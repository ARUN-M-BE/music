import { NextRequest, NextResponse } from "next/server";
import { getTrendingAggregate } from "@/lib/musicProviders";
import { route } from "@/lib/http";
import { enforceRateLimit, sanitizeText } from "@/lib/rate-limit";
import { cacheGetJson, cacheSetJson } from "@/lib/integrations/upstash";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const TRENDING_CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
};

const ALLOWED_LANGUAGES = new Set(["tamil", "hindi", "english", "all"]);

// GET /api/music/trending?language= - public, rate limited
export const GET = route("music.trending", async (req: NextRequest) => {
  await enforceRateLimit(req, { scope: "music:trending", limit: 60, windowSeconds: 60 });

  const { searchParams } = new URL(req.url);
  const requested = sanitizeText(searchParams.get("language") || "all", 20).toLowerCase();
  const language = ALLOWED_LANGUAGES.has(requested) ? requested : "all";

  const cacheKey = `music:trending:${language}`;
  let cached: any = null;
  try {
    cached = await cacheGetJson(cacheKey);
  } catch {}

  if (cached && Array.isArray(cached) && cached.length > 0) {
    return NextResponse.json(
      { success: true, songs: cached, total: cached.length, fromCache: true },
      { headers: TRENDING_CACHE_HEADERS }
    );
  }

  const songs = await getTrendingAggregate(language).catch((error) => {
    console.error("[api:music.trending] provider aggregation failed", error);
    return [];
  });

  if (songs.length > 0) {
    void cacheSetJson(cacheKey, songs, 600).catch(() => {});
  }

  return NextResponse.json(
    { success: true, songs, total: songs.length },
    { headers: TRENDING_CACHE_HEADERS }
  );
});
