import { NextRequest, NextResponse } from "next/server";
import { withDb, SongModel } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/auth";
import { route, jsonOk } from "@/lib/http";
import { enforceRateLimit, escapeRegex, sanitizeText } from "@/lib/rate-limit";
import { createSongSchema } from "@/lib/validation";
import { logSecurityEvent } from "@/lib/audit";
import { runAfter } from "@/lib/background";
import { cacheGetJson, cacheSetJson } from "@/lib/integrations/upstash";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_TERM_LENGTH = 80;

// GET /api/songs - public catalogue listing (read-only)
export const GET = route("songs.get", async (req: NextRequest) => {
  await enforceRateLimit(req, { scope: "songs:list", limit: 120, windowSeconds: 60 });

  const { searchParams } = new URL(req.url);
  const search = sanitizeText(searchParams.get("search"), MAX_TERM_LENGTH);
  const category = sanitizeText(searchParams.get("category"), MAX_TERM_LENGTH);
  const language = sanitizeText(searchParams.get("language"), MAX_TERM_LENGTH);
  const sortBy = sanitizeText(searchParams.get("sortBy"), 20) || "newest";

  const query: Record<string, unknown> = {};

  // All user input is escaped before it reaches $regex (no ReDoS/injection).
  if (category && category !== "all") {
    query.category = { $regex: escapeRegex(category), $options: "i" };
  }
  if (language && language !== "all") {
    query.language = { $regex: escapeRegex(language), $options: "i" };
  }
  if (search) {
    const term = escapeRegex(search);
    query.$or = [
      { name: { $regex: term, $options: "i" } },
      { artist: { $regex: term, $options: "i" } },
      { album: { $regex: term, $options: "i" } },
      { category: { $regex: term, $options: "i" } },
    ];
  }

  const sortOptions: Record<string, Record<string, 1 | -1>> = {
    popular: { playsCount: -1 },
    oldest: { createdAt: 1 },
    name: { name: 1 },
    newest: { createdAt: -1 },
  };
  const sortObj = sortOptions[sortBy] ?? sortOptions.newest;

  const cacheKey = `catalogue:songs:${sortBy}:${category || "all"}:${language || "all"}:${search || ""}`;
  let cached: any = null;
  try {
    cached = await cacheGetJson(cacheKey);
  } catch {}

  let songs = cached;
  if (!songs) {
    try {
      songs = await withDb(() => SongModel.find(query).sort(sortObj).limit(500).lean());
      if (Array.isArray(songs)) {
        void cacheSetJson(cacheKey, songs, 180).catch(() => {});
      }
    } catch (err) {
      console.warn("[songs.get] DB query failed, falling back to cache:", (err as Error)?.message);
      if (cached) {
        songs = cached;
      } else {
        return NextResponse.json(
          { success: true, data: [], songs: [], warning: "Service busy, retrying..." },
          {
            status: 200,
            headers: { "Cache-Control": "no-store" },
          }
        );
      }
    }
  }

  return NextResponse.json(
    { success: true, data: songs, songs },
    {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
      },
    }
  );
});

// POST /api/songs - admin only
export const POST = route("songs.post", async (req: NextRequest) => {
  const session = await requireAdmin(req);
  await enforceRateLimit(req, {
    scope: "songs:create",
    identifier: session.user.id,
    limit: 60,
    windowSeconds: 60,
  });

  const body = await req.json().catch(() => null);
  const validated = createSongSchema.parse(body);

  const newSong = await withDb(() =>
    SongModel.create({
      ...validated,
      playsCount: 0,
    })
  );

  runAfter(() =>
    logSecurityEvent({
      type: "songs.create",
      actorEmail: session.user.email,
      request: req,
      meta: { songId: String(newSong._id), name: validated.name },
    })
  );

  return jsonOk({ message: "Song created successfully", song: newSong }, { status: 201 });
});
