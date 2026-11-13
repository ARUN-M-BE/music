import { NextRequest } from "next/server";
import { route, jsonOk, HttpError } from "@/lib/http";
import { enforceRateLimit, sanitizeText } from "@/lib/rate-limit";
import { evolutionConfigured, verifyEvolutionWebhook } from "@/lib/integrations/evolution";
import { logSecurityEventAsync } from "@/lib/audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Inbound payloads are untrusted; only a tiny, bounded shape is retained.
const MAX_BODY_BYTES = 64 * 1024;

/**
 * POST /api/integrations/whatsapp/webhook - Evolution API callback.
 *
 * Evolution API is self-hosted open source, so there is no paid webhook
 * subscription. Requests are authenticated with a shared secret or an
 * HMAC-SHA256 signature and rejected (401) when the secret is not configured,
 * which means the endpoint is closed by default.
 */
export const POST = route("integrations.whatsapp", async (req: NextRequest) => {
  if (!evolutionConfigured() || !process.env.EVOLUTION_WEBHOOK_SECRET) {
    // Fail closed: an unconfigured receiver must not accept arbitrary input.
    throw new HttpError(503, "WhatsApp webhook is not configured", "not_configured");
  }

  await enforceRateLimit(req, { scope: "webhook:whatsapp", limit: 120, windowSeconds: 60 });

  const rawBody = await req.text();
  if (rawBody.length > MAX_BODY_BYTES) {
    throw new HttpError(413, "Payload too large", "payload_too_large");
  }

  const valid = await verifyEvolutionWebhook(req.headers, rawBody);
  if (!valid) {
    logSecurityEventAsync({
      type: "webhook.whatsapp.unauthorized",
      severity: "warning",
      request: req,
      meta: { bytes: rawBody.length },
    });
    throw new HttpError(401, "Invalid webhook signature", "invalid_signature");
  }

  let payload: Record<string, unknown> = {};
  try {
    const parsed = JSON.parse(rawBody || "{}");
    if (parsed && typeof parsed === "object") payload = parsed as Record<string, unknown>;
  } catch {
    throw new HttpError(400, "Malformed JSON body", "invalid_request");
  }

  logSecurityEventAsync({
    type: "webhook.whatsapp.received",
    request: req,
    meta: {
      event: sanitizeText(payload.event, 60),
      instance: sanitizeText(payload.instance, 80),
    },
  });

  // Evolution API expects a fast acknowledgement; all processing is deferred.
  return jsonOk({ received: true });
});

export function GET() {
  return jsonOk({ message: "WhatsApp webhook endpoint. POST only." });
}
