import { NextRequest } from "next/server";
import { serverEnv } from "@/lib/env";
import { requireAdmin } from "@/lib/auth";
import { uploadToImageKit } from "@/lib/imagekit";
import { route, jsonOk, badRequest, HttpError } from "@/lib/http";
import { enforceRateLimit } from "@/lib/rate-limit";
import { validateUpload } from "@/lib/upload";
import { logSecurityEvent } from "@/lib/audit";
import { runAfter } from "@/lib/background";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/media/upload - admin only, allow-listed types, size capped
export const POST = route("media.upload", async (req: NextRequest) => {
  const session = await requireAdmin(req);
  await enforceRateLimit(req, {
    scope: "media:upload",
    identifier: session.user.id,
    limit: 40,
    windowSeconds: 300,
  });

  const formData = await req.formData().catch(() => null);
  if (!formData) throw badRequest("Expected multipart/form-data");

  const file = formData.get("file");
  if (!file || typeof file === "string" || typeof file.arrayBuffer !== "function") {
    throw badRequest("No file provided");
  }

  // Reject oversized payloads before buffering them.
  const hardLimit = Math.max(serverEnv.maxAudioUploadBytes, serverEnv.maxImageUploadBytes);
  if (typeof file.size === "number" && file.size > hardLimit) {
    throw badRequest("File exceeds the maximum allowed size");
  }

  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  const validated = validateUpload({
    name: file.name || "upload",
    type: file.type || "",
    size: file.size ?? bytes.byteLength,
    bytes,
  });

  const folder = validated.kind === "audio" ? "/music/audio" : "/music/images";
  const uploadResult = await uploadToImageKit(Buffer.from(bytes), file.name, folder);

  runAfter(() =>
    logSecurityEvent({
      type: "media.upload",
      actorEmail: session.user.email,
      request: req,
      meta: {
        kind: validated.kind,
        bytes: validated.size,
        contentType: validated.contentType,
      },
    })
  );

  return jsonOk({
    message: "File uploaded successfully",
    ...(validated.kind === "audio"
      ? { songURL: uploadResult.url, fileId: uploadResult.fileId }
      : { imageURL: uploadResult.url, fileId: uploadResult.fileId }),
  });
});

export const GET = route("media.upload.get", async () => {
  throw new HttpError(405, "Use POST to upload media", "method_not_allowed");
});
