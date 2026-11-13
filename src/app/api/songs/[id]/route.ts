import { NextRequest } from "next/server";
import { withDb, SongModel } from "@/lib/mongodb";
import { deleteFromImageKit } from "@/lib/imagekit";
import { requireSuperAdmin } from "@/lib/auth";
import { route, jsonOk, notFound } from "@/lib/http";
import { enforceRateLimit } from "@/lib/rate-limit";
import { assertObjectId, updateSongSchema } from "@/lib/validation";
import { logSecurityEvent } from "@/lib/audit";
import { runAfter } from "@/lib/background";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

// GET /api/songs/[id]
export const GET = route("songs.getOne", async (req: NextRequest, { params }: Params) => {
  await enforceRateLimit(req, { scope: "songs:read", limit: 180, windowSeconds: 60 });

  const { id } = await params;
  assertObjectId(id, "song id");

  const song = await withDb(() => SongModel.findById(id).lean());
  if (!song) throw notFound("Song not found");

  return jsonOk({ song, data: song });
});

// PUT /api/songs/[id] - superadmin only, whitelisted fields
export const PUT = route("songs.update", async (req: NextRequest, { params }: Params) => {
  const session = await requireSuperAdmin(req);
  await enforceRateLimit(req, {
    scope: "songs:update",
    identifier: session.user.id,
    limit: 60,
    windowSeconds: 60,
  });

  const { id } = await params;
  assertObjectId(id, "song id");

  const body = await req.json().catch(() => null);
  const validated = updateSongSchema.parse(body);

  const updated = await withDb(() =>
    SongModel.findByIdAndUpdate(id, { $set: validated }, { new: true, runValidators: true }).lean()
  );
  if (!updated) throw notFound("Song not found");

  runAfter(() =>
    logSecurityEvent({
      type: "songs.update",
      actorEmail: session.user.email,
      request: req,
      meta: { songId: id, fields: Object.keys(validated) },
    })
  );

  return jsonOk({ message: "Song updated", song: updated });
});

// DELETE /api/songs/[id] - superadmin only
export const DELETE = route("songs.delete", async (req: NextRequest, { params }: Params) => {
  const session = await requireSuperAdmin(req);
  await enforceRateLimit(req, {
    scope: "songs:delete",
    identifier: session.user.id,
    limit: 30,
    windowSeconds: 60,
  });

  const { id } = await params;
  assertObjectId(id, "song id");

  const existingSong = await withDb(() => SongModel.findById(id));
  if (!existingSong) throw notFound("Song not found");

  if (existingSong.fileId) {
    await deleteFromImageKit(existingSong.fileId).catch(console.warn);
  }
  if (existingSong.songId) {
    await deleteFromImageKit(existingSong.songId).catch(console.warn);
  }

  await withDb(() => SongModel.findByIdAndDelete(id));

  runAfter(() =>
    logSecurityEvent({
      type: "songs.delete",
      severity: "warning",
      actorEmail: session.user.email,
      request: req,
      meta: { songId: id, name: existingSong.name },
    })
  );

  return jsonOk({ message: "Song deleted successfully", dataOne: existingSong });
});
