import { NextRequest } from "next/server";
import { z } from "zod";
import { withDb, SongModel } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/auth";
import { DEFAULT_COVER_URL } from "@/lib/mediaOptimization";
import { route, jsonOk, badRequest } from "@/lib/http";
import { enforceRateLimit } from "@/lib/rate-limit";
import { httpsUrlSchema } from "@/lib/validation";
import { logSecurityEvent } from "@/lib/audit";
import { runAfter } from "@/lib/background";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_ROWS = 500;

const bulkSongSchema = z.object({
  name: z.string().trim().min(1).max(200),
  artist: z.string().trim().min(1).max(200),
  songURL: httpsUrlSchema,
  imageURL: httpsUrlSchema.optional(),
  album: z.string().trim().max(200).optional(),
  category: z.string().trim().max(60).optional(),
  language: z.string().trim().max(60).optional(),
  fileId: z.string().trim().max(200).optional(),
  songId: z.string().trim().max(200).optional(),
  playsCount: z.number().int().min(0).optional(),
});

// POST /api/songs/bulk - admin only batch import
export const POST = route("songs.bulk", async (req: NextRequest) => {
  const session = await requireAdmin(req);
  await enforceRateLimit(req, {
    scope: "songs:bulk",
    identifier: session.user.id,
    limit: 10,
    windowSeconds: 60,
  });

  const body = await req.json().catch(() => null);
  const songs = (body as { songs?: unknown } | null)?.songs;

  if (!Array.isArray(songs) || songs.length === 0) {
    throw badRequest("No songs provided for bulk import");
  }
  if (songs.length > MAX_ROWS) {
    throw badRequest(`A maximum of ${MAX_ROWS} rows can be imported at once`);
  }

  const validSongs: Record<string, unknown>[] = [];
  const errors: Array<{ row: number; message: string }> = [];

  songs.forEach((raw, index) => {
    const parsed = bulkSongSchema.safeParse(raw);
    if (!parsed.success) {
      errors.push({
        row: index + 1,
        message: parsed.error.issues[0]?.message ?? "Invalid row",
      });
      return;
    }

    const song = parsed.data;
    validSongs.push({
      name: song.name,
      artist: song.artist,
      album: song.album || "Single",
      category: song.category || "Pop",
      language: song.language || "English",
      songURL: song.songURL,
      imageURL: song.imageURL || DEFAULT_COVER_URL,
      fileId: song.fileId || `img_bulk_${Date.now()}_${index}`,
      songId: song.songId || `aud_bulk_${Date.now()}_${index}`,
      playsCount: song.playsCount ?? 0,
    });
  });

  if (validSongs.length === 0) {
    return jsonOk({ message: "All records failed validation", count: 0, errorsCount: errors.length, errors }, {
      status: 400,
    });
  }

  const inserted = await withDb(() =>
    SongModel.insertMany(validSongs, { ordered: false })
  );

  runAfter(() =>
    logSecurityEvent({
      type: "songs.bulk_import",
      actorEmail: session.user.email,
      request: req,
      meta: { imported: inserted.length, rejected: errors.length },
    })
  );

  return jsonOk({
    message: `Successfully imported ${inserted.length} songs`,
    count: inserted.length,
    errorsCount: errors.length,
    errors,
  });
});
