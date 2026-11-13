import { NextRequest, NextResponse } from "next/server";
import { getArtistData } from "@/lib/musicProviders";
import { route, badRequest, notFound } from "@/lib/http";
import { enforceRateLimit, sanitizeText } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ARTIST_CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
};

// GET /api/music/artist/[id] - public, rate limited
export const GET = route(
  "music.artist",
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    await enforceRateLimit(req, { scope: "music:artist", limit: 90, windowSeconds: 60 });

    const { id } = await params;
    let decoded = "";
    try {
      decoded = decodeURIComponent(id ?? "");
    } catch {
      throw badRequest("Malformed artist identifier");
    }

    const cleanName = sanitizeText(decoded, 120);
    if (!cleanName) throw badRequest("Artist ID is required");

    const data = await getArtistData(cleanName);
    if (!data.artist) throw notFound("Artist not found");

    return NextResponse.json({ success: true, ...data }, { headers: ARTIST_CACHE_HEADERS });
  }
);
