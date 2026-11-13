import { NextRequest } from "next/server";
import { withDb, ArtistModel } from "@/lib/mongodb";
import { deleteFromImageKit } from "@/lib/imagekit";
import { requireSuperAdmin } from "@/lib/auth";
import { route, jsonOk, notFound } from "@/lib/http";
import { enforceRateLimit } from "@/lib/rate-limit";
import { assertObjectId, updateArtistSchema } from "@/lib/validation";
import { logSecurityEvent } from "@/lib/audit";
import { runAfter } from "@/lib/background";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

// GET /api/artists/[id]
export const GET = route("artists.getOne", async (req: NextRequest, { params }: Params) => {
  await enforceRateLimit(req, { scope: "artists:read", limit: 120, windowSeconds: 60 });

  const { id } = await params;
  assertObjectId(id, "artist id");

  const artist = await withDb(() => ArtistModel.findById(id).lean());
  if (!artist) throw notFound("Artist not found");

  return jsonOk({ artist, data: artist });
});

// PUT /api/artists/[id] - superadmin only
export const PUT = route("artists.update", async (req: NextRequest, { params }: Params) => {
  const session = await requireSuperAdmin(req);
  await enforceRateLimit(req, {
    scope: "artists:update",
    identifier: session.user.id,
    limit: 60,
    windowSeconds: 60,
  });

  const { id } = await params;
  assertObjectId(id, "artist id");

  const body = await req.json().catch(() => null);
  const validated = updateArtistSchema.parse(body);

  const existing = await withDb(() => ArtistModel.findById(id));
  if (!existing) throw notFound("Artist not found");

  // When the artwork is replaced, remove the previous file from ImageKit.
  if (validated.fileId && existing.fileId && validated.fileId !== existing.fileId) {
    await deleteFromImageKit(existing.fileId).catch(console.warn);
  }

  const updated = await withDb(() =>
    ArtistModel.findByIdAndUpdate(id, { $set: validated }, { new: true, runValidators: true }).lean()
  );
  if (!updated) throw notFound("Artist not found");

  runAfter(() =>
    logSecurityEvent({
      type: "artists.update",
      actorEmail: session.user.email,
      request: req,
      meta: { artistId: id },
    })
  );

  return jsonOk({ artist: updated });
});

// DELETE /api/artists/[id] - superadmin only
export const DELETE = route("artists.delete", async (req: NextRequest, { params }: Params) => {
  const session = await requireSuperAdmin(req);
  await enforceRateLimit(req, {
    scope: "artists:delete",
    identifier: session.user.id,
    limit: 30,
    windowSeconds: 60,
  });

  const { id } = await params;
  assertObjectId(id, "artist id");

  const existing = await withDb(() => ArtistModel.findById(id));
  if (!existing) throw notFound("Artist not found");

  if (existing.fileId) {
    await deleteFromImageKit(existing.fileId).catch(console.warn);
  }
  await withDb(() => ArtistModel.findByIdAndDelete(id));

  runAfter(() =>
    logSecurityEvent({
      type: "artists.delete",
      severity: "warning",
      actorEmail: session.user.email,
      request: req,
      meta: { artistId: id, name: existing.name },
    })
  );

  return jsonOk({ message: "Artist deleted successfully", dataOne: existing });
});
