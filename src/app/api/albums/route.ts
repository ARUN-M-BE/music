import { NextRequest, NextResponse } from "next/server";
import { withDb, AlbumModel } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/auth";
import { route, jsonOk } from "@/lib/http";
import { enforceRateLimit } from "@/lib/rate-limit";
import { createAlbumSchema } from "@/lib/validation";
import { logSecurityEvent } from "@/lib/audit";
import { runAfter } from "@/lib/background";
import { cacheGetJson, cacheSetJson } from "@/lib/integrations/upstash";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// GET /api/albums - public catalogue
export const GET = route("albums.get", async (req: NextRequest) => {
  await enforceRateLimit(req, { scope: "albums:list", limit: 120, windowSeconds: 60 });

  const cacheKey = "catalogue:albums:list";
  let albums: any = null;
  try {
    albums = await cacheGetJson(cacheKey);
  } catch {}

  if (!albums) {
    try {
      albums = await withDb(() => AlbumModel.find({}).sort({ createdAt: -1 }).limit(500).lean());
      if (Array.isArray(albums)) {
        void cacheSetJson(cacheKey, albums, 300).catch(() => {});
      }
    } catch (err) {
      console.warn("[albums.get] DB query failed, using fallback:", (err as Error)?.message);
      return NextResponse.json(
        { success: true, data: [], albums: [], warning: "Service busy, retrying..." },
        { status: 200, headers: { "Cache-Control": "no-store" } }
      );
    }
  }

  return NextResponse.json(
    { success: true, data: albums, albums },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
  );
});

// POST /api/albums - admin only
export const POST = route("albums.post", async (req: NextRequest) => {
  const session = await requireAdmin(req);
  await enforceRateLimit(req, {
    scope: "albums:create",
    identifier: session.user.id,
    limit: 60,
    windowSeconds: 60,
  });

  const body = await req.json().catch(() => null);
  const validated = createAlbumSchema.parse(body);

  const newAlbum = await withDb(() => AlbumModel.create(validated));

  runAfter(() =>
    logSecurityEvent({
      type: "albums.create",
      actorEmail: session.user.email,
      request: req,
      meta: { albumId: String(newAlbum._id), name: validated.name },
    })
  );

  return jsonOk({ album: newAlbum }, { status: 201 });
});
