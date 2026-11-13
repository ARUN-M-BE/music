import { NextRequest } from "next/server";
import { z } from "zod";
import { withDb, AlbumModel } from "@/lib/mongodb";
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

const bulkAlbumSchema = z.object({
  name: z.string().trim().min(1).max(200),
  imageURL: httpsUrlSchema.optional(),
  fileId: z.string().trim().max(200).optional(),
});

// POST /api/albums/bulk - admin only batch import
export const POST = route("albums.bulk", async (req: NextRequest) => {
  const session = await requireAdmin(req);
  await enforceRateLimit(req, {
    scope: "albums:bulk",
    identifier: session.user.id,
    limit: 10,
    windowSeconds: 60,
  });

  const body = await req.json().catch(() => null);
  const albums = (body as { albums?: unknown } | null)?.albums;

  if (!Array.isArray(albums) || albums.length === 0) {
    throw badRequest("No albums provided for bulk import");
  }
  if (albums.length > MAX_ROWS) {
    throw badRequest(`A maximum of ${MAX_ROWS} rows can be imported at once`);
  }

  const validAlbums: Record<string, unknown>[] = [];
  const errors: Array<{ row: number; message: string }> = [];

  albums.forEach((raw, index) => {
    const parsed = bulkAlbumSchema.safeParse(raw);
    if (!parsed.success) {
      errors.push({ row: index + 1, message: parsed.error.issues[0]?.message ?? "Invalid row" });
      return;
    }
    validAlbums.push({
      name: parsed.data.name,
      imageURL: parsed.data.imageURL || DEFAULT_COVER_URL,
      fileId: parsed.data.fileId || `img_bulk_${Date.now()}_${index}`,
    });
  });

  if (validAlbums.length === 0) {
    return jsonOk(
      { message: "All records failed validation", count: 0, errorsCount: errors.length, errors },
      { status: 400 }
    );
  }

  const inserted = await withDb(() => AlbumModel.insertMany(validAlbums, { ordered: false }));

  runAfter(() =>
    logSecurityEvent({
      type: "albums.bulk_import",
      actorEmail: session.user.email,
      request: req,
      meta: { imported: inserted.length, rejected: errors.length },
    })
  );

  return jsonOk({
    message: `Successfully imported ${inserted.length} albums`,
    count: inserted.length,
    errorsCount: errors.length,
    errors,
  });
});
