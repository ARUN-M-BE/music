import { serverEnv } from "../env";
import { hmacSha256 } from "../crypto";
import { timingSafeEqual } from "../crypto";

/**
 * Evolution API - open-source (Apache-2.0) WhatsApp gateway.
 *
 * There is no SaaS subscription and no licence fee: the integration only talks
 * to a self-hosted Evolution API instance. When the env vars are absent the
 * channel is disabled and the platform keeps working with e-mail only.
 *
 * Free-tier note: hosting costs are purely infrastructure (the operator's own
 * server); no paid Evolution plan exists or is required.
 */

export function evolutionConfigured(): boolean {
  return Boolean(
    serverEnv.evolutionApiUrl && serverEnv.evolutionApiKey && serverEnv.evolutionInstance
  );
}

function normalizeRecipient(value: string): string {
  return value.replace(/[^\d]/g, "").slice(0, 15);
}

/** Sends a plain text WhatsApp message. Never throws. */
export async function sendWhatsAppText(
  text: string,
  recipient?: string
): Promise<{ ok: boolean }> {
  if (!evolutionConfigured()) return { ok: false };

  const number = normalizeRecipient(recipient || serverEnv.evolutionAdminNumber);
  if (!number) return { ok: false };

  try {
    const response = await fetch(
      `${serverEnv.evolutionApiUrl.replace(/\/$/, "")}/message/sendText/${encodeURIComponent(
        serverEnv.evolutionInstance
      )}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: serverEnv.evolutionApiKey,
        },
        body: JSON.stringify({
          number,
          text: text.slice(0, 2000),
        }),
        signal: AbortSignal.timeout(8000),
      }
    );
    return { ok: response.ok };
  } catch (error) {
    console.warn("[evolution] send failed:", (error as Error)?.message);
    return { ok: false };
  }
}

export async function notifyAdminOnWhatsApp(message: string): Promise<boolean> {
  const result = await sendWhatsAppText(message);
  return result.ok;
}

/**
 * Verifies an inbound webhook.
 * Accepts either the shared secret header or an HMAC-SHA256 signature over the
 * raw body, compared in constant time.
 */
export async function verifyEvolutionWebhook(
  headers: Headers,
  rawBody: string
): Promise<boolean> {
  const secret = serverEnv.evolutionWebhookSecret;
  if (!secret) return false;

  const providedSecret = headers.get("x-evolution-secret") ?? headers.get("apikey") ?? "";
  if (providedSecret && timingSafeEqual(providedSecret, secret)) return true;

  const signature = headers.get("x-evolution-signature");
  if (signature) {
    const expected = Array.from(await hmacSha256(secret, rawBody))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
    return timingSafeEqual(signature.trim().toLowerCase(), expected);
  }

  return false;
}

export async function getEvolutionConnectionState(): Promise<string | null> {
  if (!evolutionConfigured()) return null;
  try {
    const response = await fetch(
      `${serverEnv.evolutionApiUrl.replace(/\/$/, "")}/instance/connectionState/${encodeURIComponent(
        serverEnv.evolutionInstance
      )}`,
      {
        headers: { apikey: serverEnv.evolutionApiKey },
        cache: "no-store",
        signal: AbortSignal.timeout(4000),
      }
    );
    if (!response.ok) return null;
    const data = (await response.json().catch(() => null)) as
      | { instance?: { state?: string } }
      | null;
    return data?.instance?.state ?? null;
  } catch {
    return null;
  }
}
