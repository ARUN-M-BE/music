import { NextRequest } from "next/server";
import { getImageKitAuth, isImageKitConfigured } from "@/lib/imagekit";
import { requireAdmin } from "@/lib/auth";
import { route, jsonOk, HttpError } from "@/lib/http";
import { enforceRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/auth/imagekit
 * Upload signatures are only issued to authenticated administrators.
 * Previously this endpoint was public, which allowed anonymous uploads.
 */
export const GET = route("auth.imagekit", async (req: NextRequest) => {
  const session = await requireAdmin(req);
  await enforceRateLimit(req, {
    scope: "auth:imagekit",
    identifier: session.user.id,
    limit: 30,
    windowSeconds: 60,
  });

  if (!isImageKitConfigured()) {
    throw new HttpError(503, "Image storage is not configured", "integration_disabled");
  }

  return jsonOk(getImageKitAuth(), { headers: { "Cache-Control": "no-store" } });
});
