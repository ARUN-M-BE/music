import { NextRequest } from "next/server";
import { z } from "zod";
import { withDb, ArtistModel } from "@/lib/mongodb";
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

const bulkArtistSchema = z.object({
  name: z.string().trim().min(1).max(200),
  imageURL: httpsUrlSchema.optional(),
  twetter: z.string().trim().max(300).optional(),
  instagram: z.string().trim().max(300).optional(),
  fileId: z.string().trim().max(200).optional(),
});

// POST /api/artists/bulk - admin only batch import
export const POST = route("artists.bulk", async (req: NextRequest) => {
  const session = await requireAdmin(req);
  await enforceRateLimit(req, {
    scope: "artists:bulk",
    identifier: session.user.id,
    limit: 10,
    windowSeconds: 60,
  });

  const body = await req.json().catch(() => null);
  const artists = (body as { artists?: unknown } | null)?.artists;

  if (!Array.isArray(artists) || artists.length === 0) {
    throw badRequest("No artists provided for bulk import");
  }
  if (artists.length > MAX_ROWS) {
    throw badRequest(`A maximum of ${MAX_ROWS} rows can be imported at once`);
  }

  const validArtists: Record<string, unknown>[] = [];
  const errors: Array<{ row: number; message: string }> = [];

  artists.forEach((raw, index) => {
    const parsed = bulkArtistSchema.safeParse(raw);
    if (!parsed.success) {
      errors.push({ row: index + 1, message: parsed.error.issues[0]?.message ?? "Invalid row" });
      return;
    }
    validArtists.push({
      name: parsed.data.name,
      imageURL: parsed.data.imageURL || DEFAULT_COVER_URL,
      twetter: parsed.data.twetter || "",
      instagram: parsed.data.instagram || "",
      fileId: parsed.data.fileId || `img_bulk_${Date.now()}_${index}`,
    });
  });

  if (validArtists.length === 0) {
    return jsonOk(
      { message: "All records failed validation", count: 0, errorsCount: errors.length, errors },
      { status: 400 }
    );
  }

  const inserted = await withDb(() => ArtistModel.insertMany(validArtists, { ordered: false }));

  runAfter(() =>
    logSecurityEvent({
      type: "artists.bulk_import",
      actorEmail: session.user.email,
      request: req,
      meta: { imported: inserted.length, rejected: errors.length },
    })
  );

  return jsonOk({
    message: `Successfully imported ${inserted.length} artists`,
    count: inserted.length,
    errorsCount: errors.length,
    errors,
  });
});
