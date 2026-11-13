import { NextRequest } from "next/server";
import { withDb, PlaylistModel } from "@/lib/mongodb";
import { isPrivileged, requireApprovedUser } from "@/lib/auth";
import { route, jsonOk, badRequest, forbidden, notFound } from "@/lib/http";
import { enforceRateLimit } from "@/lib/rate-limit";
import { assertObjectId, createPlaylistSchema, updatePlaylistSchema } from "@/lib/validation";
import { logSecurityEvent } from "@/lib/audit";
import { runAfter } from "@/lib/background";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Legacy playlists may have been stored under the provider uid or the email. */
function ownerKeys(session: { user: { id: string; uid: string; email: string } }): string[] {
  return Array.from(
    new Set([session.user.id, session.user.uid, session.user.email.toLowerCase()].filter(Boolean))
  );
}

// GET /api/music/playlists - always scoped to the authenticated user
export const GET = route("playlists.get", async (req: NextRequest) => {
  const session = await requireApprovedUser(req);
  await enforceRateLimit(req, {
    scope: "playlists:get",
    identifier: session.user.id,
    limit: 120,
    windowSeconds: 60,
  });

  const { searchParams } = new URL(req.url);
  const requestedUserId = searchParams.get("userId");

  let keys = ownerKeys(session);
  if (requestedUserId && !keys.includes(requestedUserId)) {
    // Only administrators may read somebody else's playlists.
    if (!isPrivileged(session.user.role)) throw forbidden();
    keys = [requestedUserId];
  }

  const playlists = await withDb(() =>
    PlaylistModel.find({ userId: { $in: keys } })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean()
  );

  return jsonOk({ playlists }, { headers: { "Cache-Control": "no-store" } });
});

// POST /api/music/playlists
export const POST = route("playlists.post", async (req: NextRequest) => {
  const session = await requireApprovedUser(req);
  await enforceRateLimit(req, {
    scope: "playlists:create",
    identifier: session.user.id,
    limit: 30,
    windowSeconds: 60,
  });

  const body = await req.json().catch(() => null);
  const parsed = createPlaylistSchema.safeParse(body);
  if (!parsed.success) throw badRequest("Invalid playlist payload");

  const playlist = await withDb(() =>
    PlaylistModel.create({
      name: parsed.data.name,
      description: parsed.data.description ?? "",
      coverImage: parsed.data.coverImage ?? "",
      userId: session.user.id,
      songs: parsed.data.songs ?? [],
    })
  );

  return jsonOk({ playlist }, { status: 201 });
});

// PUT /api/music/playlists - owner (or admin) only
export const PUT = route("playlists.update", async (req: NextRequest) => {
  const session = await requireApprovedUser(req);
  await enforceRateLimit(req, {
    scope: "playlists:update",
    identifier: session.user.id,
    limit: 60,
    windowSeconds: 60,
  });

  const body = await req.json().catch(() => null);
  const parsed = updatePlaylistSchema.safeParse(body);
  if (!parsed.success) throw badRequest("Invalid playlist payload");

  const { id, ...updates } = parsed.data;

  const playlist = await withDb(() => PlaylistModel.findById(id).lean());
  if (!playlist) throw notFound("Playlist not found");

  if (!ownerKeys(session).includes(String(playlist.userId)) && !isPrivileged(session.user.role)) {
    throw forbidden("You can only modify your own playlists");
  }

  const updateData: Record<string, unknown> = {};
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.coverImage !== undefined) updateData.coverImage = updates.coverImage;
  if (updates.songs !== undefined) updateData.songs = updates.songs;

  if (Object.keys(updateData).length === 0) throw badRequest("Nothing to update");

  const updated = await withDb(() =>
    PlaylistModel.findByIdAndUpdate(id, { $set: updateData }, { new: true }).lean()
  );

  return jsonOk({ playlist: updated });
});

// DELETE /api/music/playlists?id=... - owner (or admin) only
export const DELETE = route("playlists.delete", async (req: NextRequest) => {
  const session = await requireApprovedUser(req);
  await enforceRateLimit(req, {
    scope: "playlists:delete",
    identifier: session.user.id,
    limit: 60,
    windowSeconds: 60,
  });

  const { searchParams } = new URL(req.url);
  const id = assertObjectId(searchParams.get("id") ?? "", "playlist id");

  const playlist = await withDb(() => PlaylistModel.findById(id).lean());
  if (!playlist) throw notFound("Playlist not found");

  if (!ownerKeys(session).includes(String(playlist.userId)) && !isPrivileged(session.user.role)) {
    throw forbidden("You can only delete your own playlists");
  }

  await withDb(() => PlaylistModel.findByIdAndDelete(id));

  runAfter(() =>
    logSecurityEvent({
      type: "playlists.delete",
      actorEmail: session.user.email,
      request: req,
      meta: { playlistId: id },
    })
  );

  return jsonOk({ message: "Playlist deleted" });
});
