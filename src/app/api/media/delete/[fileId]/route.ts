import { NextRequest } from "next/server";
import { deleteFromImageKit } from "@/lib/imagekit";
import { requireAdmin } from "@/lib/auth";
import { route, jsonOk, badRequest } from "@/lib/http";
import { enforceRateLimit } from "@/lib/rate-limit";
import { logSecurityEvent } from "@/lib/audit";
import { runAfter } from "@/lib/background";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ fileId: string }> };

// DELETE /api/media/delete/[fileId] - admin only
export const DELETE = route("media.delete", async (req: NextRequest, { params }: Params) => {
  const session = await requireAdmin(req);
  await enforceRateLimit(req, {
    scope: "media:delete",
    identifier: session.user.id,
    limit: 60,
    windowSeconds: 300,
  });

  const { fileId } = await params;
  // ImageKit file ids are opaque tokens; reject path traversal / injection.
  if (!/^[A-Za-z0-9_-]{1,160}$/.test(fileId)) {
    throw badRequest("Invalid file id");
  }

  const success = await deleteFromImageKit(fileId);

  runAfter(() =>
    logSecurityEvent({
      type: "media.delete",
      severity: "warning",
      actorEmail: session.user.email,
      request: req,
      meta: { fileId, success },
    })
  );

  return jsonOk({
    success,
    message: success ? "File deleted successfully" : "Failed to delete file",
  });
});
