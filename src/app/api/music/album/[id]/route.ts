import { NextRequest, NextResponse } from "next/server";
import { getAlbumData } from "@/lib/musicProviders";
import { route, badRequest, notFound } from "@/lib/http";
import { enforceRateLimit, sanitizeText } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ALBUM_CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
};

// GET /api/music/album/[id] - public, rate limited
export const GET = route(
  "music.album",
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    await enforceRateLimit(req, { scope: "music:album", limit: 90, windowSeconds: 60 });

    const { id } = await params;
    let decoded = "";
    try {
      decoded = decodeURIComponent(id ?? "");
    } catch {
      throw badRequest("Malformed album identifier");
    }

    const cleanTitle = sanitizeText(decoded, 120);
    if (!cleanTitle) throw badRequest("Album ID is required");

    const data = await getAlbumData(cleanTitle);
    if (!data.album) throw notFound("Album not found");

    return NextResponse.json({ success: true, ...data }, { headers: ALBUM_CACHE_HEADERS });
  }
);
