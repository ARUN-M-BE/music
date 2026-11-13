import { NextRequest } from "next/server";
import { withDb, AlbumModel } from "@/lib/mongodb";
import { deleteFromImageKit } from "@/lib/imagekit";
import { requireSuperAdmin } from "@/lib/auth";
import { route, jsonOk, notFound } from "@/lib/http";
import { enforceRateLimit } from "@/lib/rate-limit";
import { assertObjectId, updateAlbumSchema } from "@/lib/validation";
import { logSecurityEvent } from "@/lib/audit";
import { runAfter } from "@/lib/background";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

// GET /api/albums/[id]
export const GET = route("albums.getOne", async (req: NextRequest, { params }: Params) => {
  await enforceRateLimit(req, { scope: "albums:read", limit: 120, windowSeconds: 60 });

  const { id } = await params;
  assertObjectId(id, "album id");

  const album = await withDb(() => AlbumModel.findById(id).lean());
  if (!album) throw notFound("Album not found");

  return jsonOk({ album, data: album });
});

// PUT /api/albums/[id] - superadmin only
export const PUT = route("albums.update", async (req: NextRequest, { params }: Params) => {
  const session = await requireSuperAdmin(req);
  await enforceRateLimit(req, {
    scope: "albums:update",
    identifier: session.user.id,
    limit: 60,
    windowSeconds: 60,
  });

  const { id } = await params;
  assertObjectId(id, "album id");

  const body = await req.json().catch(() => null);
  const validated = updateAlbumSchema.parse(body);

  const updated = await withDb(() =>
    AlbumModel.findByIdAndUpdate(id, { $set: validated }, { new: true, runValidators: true }).lean()
  );
  if (!updated) throw notFound("Album not found");

  runAfter(() =>
    logSecurityEvent({
      type: "albums.update",
      actorEmail: session.user.email,
      request: req,
      meta: { albumId: id },
    })
  );

  return jsonOk({ album: updated });
});

// DELETE /api/albums/[id] - superadmin only
export const DELETE = route("albums.delete", async (req: NextRequest, { params }: Params) => {
  const session = await requireSuperAdmin(req);
  await enforceRateLimit(req, {
    scope: "albums:delete",
    identifier: session.user.id,
    limit: 30,
    windowSeconds: 60,
  });

  const { id } = await params;
  assertObjectId(id, "album id");

  const existing = await withDb(() => AlbumModel.findById(id));
  if (!existing) throw notFound("Album not found");

  if (existing.fileId) {
    await deleteFromImageKit(existing.fileId).catch(console.warn);
  }
  await withDb(() => AlbumModel.findByIdAndDelete(id));

  runAfter(() =>
    logSecurityEvent({
      type: "albums.delete",
      severity: "warning",
      actorEmail: session.user.email,
      request: req,
      meta: { albumId: id, name: existing.name },
    })
  );

  return jsonOk({ message: "Album deleted successfully", dataOne: existing });
});
