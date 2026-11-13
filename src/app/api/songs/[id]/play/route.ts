import { NextRequest } from "next/server";
import { withDb, SongModel } from "@/lib/mongodb";
import { route, jsonOk, notFound } from "@/lib/http";
import { enforceRateLimit } from "@/lib/rate-limit";
import { assertObjectId } from "@/lib/validation";
import { scheduleTrackEvent } from "@/lib/integrations/tinybird";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

// PUT /api/songs/[id]/play - public play counter (rate limited + validated)
export const PUT = route("songs.play", async (req: NextRequest, { params }: Params) => {
  const { id } = await params;
  assertObjectId(id, "song id");

  await enforceRateLimit(req, {
    scope: "songs:play",
    identifier: id,
    limit: 120,
    windowSeconds: 60,
  });

  const updated = await withDb(() =>
    SongModel.findByIdAndUpdate(id, { $inc: { playsCount: 1 } }, { new: true }).lean()
  );
  if (!updated) throw notFound("Song not found");

  scheduleTrackEvent({
    name: "song_play",
    songId: id,
    language: updated.language,
    meta: { provider: "catalog" },
  });

  return jsonOk({ song: updated });
});
