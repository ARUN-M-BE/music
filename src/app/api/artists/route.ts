import { NextRequest, NextResponse } from "next/server";
import { withDb, ArtistModel } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/auth";
import { route, jsonOk } from "@/lib/http";
import { enforceRateLimit } from "@/lib/rate-limit";
import { createArtistSchema } from "@/lib/validation";
import { logSecurityEvent } from "@/lib/audit";
import { runAfter } from "@/lib/background";
import { cacheGetJson, cacheSetJson } from "@/lib/integrations/upstash";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// GET /api/artists - public catalogue
export const GET = route("artists.get", async (req: NextRequest) => {
  await enforceRateLimit(req, { scope: "artists:list", limit: 120, windowSeconds: 60 });

  const cacheKey = "catalogue:artists:list";
  let artists: any = null;
  try {
    artists = await cacheGetJson(cacheKey);
  } catch {}

  if (!artists) {
    try {
      artists = await withDb(() => ArtistModel.find({}).sort({ createdAt: -1 }).limit(500).lean());
      if (Array.isArray(artists)) {
        void cacheSetJson(cacheKey, artists, 300).catch(() => {});
      }
    } catch (err) {
      console.warn("[artists.get] DB query failed, using fallback:", (err as Error)?.message);
      return NextResponse.json(
        { success: true, data: [], artists: [], warning: "Service busy, retrying..." },
        { status: 200, headers: { "Cache-Control": "no-store" } }
      );
    }
  }

  return NextResponse.json(
    { success: true, data: artists, artists },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
  );
});

// POST /api/artists - admin only
export const POST = route("artists.post", async (req: NextRequest) => {
  const session = await requireAdmin(req);
  await enforceRateLimit(req, {
    scope: "artists:create",
    identifier: session.user.id,
    limit: 60,
    windowSeconds: 60,
  });

  const body = await req.json().catch(() => null);
  const validated = createArtistSchema.parse(body);

  const newArtist = await withDb(() => ArtistModel.create(validated));

  runAfter(() =>
    logSecurityEvent({
      type: "artists.create",
      actorEmail: session.user.email,
      request: req,
      meta: { artistId: String(newArtist._id), name: validated.name },
    })
  );

  return jsonOk({ artist: newArtist }, { status: 201 });
});
