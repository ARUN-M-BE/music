import { serverEnv } from "../env";

/**
 * Resend (transactional email + Audiences).
 *
 * Free tier: 3,000 emails/month, 100/day, audiences and contacts included.
 * No paid feature is used: no broadcast campaigns, no dedicated IPs.
 *
 * Delivery stays best-effort (an email outage must never fail a sign-in), but it
 * is no longer SILENT: a rejected key is logged as an error at most every five
 * minutes, the last failure is exposed for `/api/integrations/health`, and
 * `checkResendKey()` performs a read-only probe so a bad key is visible before a
 * user reports a missing welcome email.
 */

export function resendConfigured(): boolean {
  return Boolean(serverEnv.resendApiKey);
}

/**
 * Resend keys are `re_` followed by an opaque body that may itself contain `_`
 * or `-` (verified against the live key format: `re_e3ZPhtW4_F4kvz1...`).
 * A stricter pattern produced a false "malformed key" diagnosis.
 */
export function resendKeyFormatValid(): boolean {
  return /^re_[A-Za-z0-9_-]{8,}$/.test(serverEnv.resendApiKey);
}

/** `resend.dev` is Resend's shared sandbox sender: it only reaches the account owner. */
export function resendSenderIsSandbox(): boolean {
  return /@resend\.dev\b/i.test(serverEnv.resendFrom);
}

export type ResendErrorCode =
  | "not_configured"
  | "invalid_recipient"
  | "unauthorized"
  | "rate_limited"
  | "provider_error"
  | "network";

export interface ResendFailure {
  code: ResendErrorCode;
  status?: number;
  /** Operator-facing explanation. Never contains the key or the message body. */
  message: string;
}

export type ResendResult = { ok: true } | { ok: false; error: ResendFailure };

let lastFailure: (ResendFailure & { at: number }) | null = null;
let lastRejectionLogAt = 0;
const REJECTION_LOG_INTERVAL_MS = 5 * 60_000;

/** Last delivery failure (no credentials inside), for diagnostics. */
export function getResendFailure(): (ResendFailure & { at: number }) | null {
  return lastFailure;
}

function fail(failure: ResendFailure): ResendResult {
  lastFailure = { ...failure, at: Date.now() };

  if (failure.code === "unauthorized") {
    // A rejected key is a configuration outage, so it is logged as an error and
    // throttled: a sign-up storm must not flood the log with the same line.
    if (Date.now() - lastRejectionLogAt > REJECTION_LOG_INTERVAL_MS) {
      lastRejectionLogAt = Date.now();
      console.error(
        `[resend] ${failure.message} Transactional email is DOWN: rotate RESEND_API_KEY, then verify with GET /api/integrations/health?probe=1`
      );
    }
  } else if (failure.code !== "not_configured") {
    console.warn(`[resend] ${failure.message}`);
  }

  return { ok: false, error: failure };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

interface SendEmailInput {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export async function sendEmail(input: SendEmailInput): Promise<ResendResult> {
  if (!resendConfigured()) {
    return { ok: false, error: { code: "not_configured", message: "RESEND_API_KEY is not set." } };
  }
  if (!resendKeyFormatValid()) {
    return fail({
      code: "unauthorized",
      message: "RESEND_API_KEY does not look like a Resend key (expected `re_...`).",
    });
  }

  const recipients = (Array.isArray(input.to) ? input.to : [input.to])
    .map((address) => address.trim().toLowerCase())
    .filter((address) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address))
    .slice(0, 5);

  if (recipients.length === 0) {
    return { ok: false, error: { code: "invalid_recipient", message: "No valid recipient address." } };
  }

  let response: Response;
  try {
    response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serverEnv.resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: serverEnv.resendFrom,
        to: recipients,
        subject: input.subject.slice(0, 200),
        html: input.html,
        text: input.text,
        reply_to: input.replyTo,
      }),
      signal: AbortSignal.timeout(8000),
    });
  } catch (error) {
    return fail({
      code: "network",
      message: `Resend is unreachable (${(error as Error)?.name ?? "error"}).`,
    });
  }

  if (response.ok) return { ok: true };

  if (response.status === 401 || response.status === 403) {
    return fail({
      code: "unauthorized",
      status: response.status,
      message: `Resend rejected the API key (HTTP ${response.status}). Rotate RESEND_API_KEY.`,
    });
  }
  if (response.status === 429) {
    return fail({
      code: "rate_limited",
      status: 429,
      message: "Resend free-tier limit reached (100 emails/day).",
    });
  }

  // Resend explains 4xx bodies, but they can echo the recipient address, so the
  // payload is only inspected for a hint and never logged or forwarded.
  const detail = await response.text().catch(() => "");
  const hint = /domain|from/i.test(detail)
    ? " The sender domain is not verified in Resend."
    : "";
  return fail({
    code: "provider_error",
    status: response.status,
    message: `Resend rejected the message (HTTP ${response.status}).${hint}`,
  });
}

let keyProbeCache: { at: number; result: { reachable: boolean; note: string } } | null = null;
const KEY_PROBE_TTL_MS = 60_000;

/**
 * Read-only credential probe (`GET /domains`: no email sent, no quota used).
 * Cached briefly so the admin health page cannot burn free-tier requests.
 */
export async function checkResendKey(
  force = false
): Promise<{ reachable: boolean; note: string }> {
  if (!resendConfigured()) return { reachable: false, note: "RESEND_API_KEY is not set." };
  if (!resendKeyFormatValid()) {
    return { reachable: false, note: "RESEND_API_KEY is malformed (expected `re_...`): rotate it." };
  }
  if (!force && keyProbeCache && Date.now() - keyProbeCache.at < KEY_PROBE_TTL_MS) {
    return keyProbeCache.result;
  }

  let result: { reachable: boolean; note: string };
  try {
    const response = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${serverEnv.resendApiKey}` },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (response.ok) {
      result = {
        reachable: true,
        note: resendSenderIsSandbox()
          ? "API key accepted, but the sender uses the resend.dev sandbox: only the account owner can receive mail."
          : "API key accepted.",
      };
    } else if (response.status === 401 || response.status === 403) {
      result = {
        reachable: false,
        note: `API key rejected (HTTP ${response.status}): rotate RESEND_API_KEY.`,
      };
      lastFailure = {
        code: "unauthorized",
        status: response.status,
        message: result.note,
        at: Date.now(),
      };
    } else {
      result = { reachable: false, note: `Provider returned HTTP ${response.status}.` };
    }
  } catch {
    result = { reachable: false, note: "Provider unreachable from this host." };
  }

  keyProbeCache = { at: Date.now(), result };
  if (!result.reachable) console.warn(`[resend] key probe: ${result.note}`);
  return result;
}

/** Configuration diagnosis for `/api/health`; contains no key material. */
export function getResendDiagnostics() {
  return {
    configured: resendConfigured(),
    keyFormatValid: resendKeyFormatValid(),
    sandboxSender: resendSenderIsSandbox(),
    lastFailure: lastFailure
      ? { code: lastFailure.code, status: lastFailure.status ?? null, at: lastFailure.at }
      : null,
  };
}

/** Adds a listener to the free-tier Resend audience (double opt-in friendly). */
export async function addAudienceContact(input: {
  email: string;
  firstName?: string;
}): Promise<boolean> {
  if (!resendConfigured() || !serverEnv.resendAudienceId) return false;

  try {
    const response = await fetch(
      `https://api.resend.com/audiences/${encodeURIComponent(
        serverEnv.resendAudienceId
      )}/contacts`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serverEnv.resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: input.email.toLowerCase(),
          first_name: (input.firstName ?? "").slice(0, 80),
          unsubscribed: false,
        }),
        signal: AbortSignal.timeout(8000),
      }
    );

    // 409 = contact already exists, which is success for our purposes.
    return response.ok || response.status === 409;
  } catch (error) {
    console.warn("[resend] audience contact failed:", (error as Error)?.message);
    return false;
  }
}

export async function sendWelcomeEmail(input: { to: string; name: string }): Promise<boolean> {
  const safeName = escapeHtml(input.name || "there");
  const result = await sendEmail({
    to: input.to,
    subject: "Welcome to Good Music",
    text: `Hi ${input.name || "there"}, your Good Music account has been created. An administrator may need to approve it before you can stream.`,
    html: `
      <div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;background:#121212;color:#fff;padding:32px;border-radius:16px">
        <h1 style="color:#1db954;font-size:22px;margin:0 0 12px">Welcome to Good Music</h1>
        <p style="color:#d1d1d1;font-size:14px;line-height:1.6">Hi ${safeName},</p>
        <p style="color:#d1d1d1;font-size:14px;line-height:1.6">
          Your account has been created. If your profile shows <strong>pending</strong>, an
          administrator still needs to approve it before streaming is unlocked.
        </p>
        <p style="color:#727272;font-size:12px;margin-top:24px">You can unsubscribe at any time.</p>
      </div>
    `,
  });
  return result.ok;
}

export async function notifyAdminOfPendingUser(input: {
  email: string;
  name: string;
}): Promise<boolean> {
  const adminRecipient = serverEnv.resendAdminNotifyEmail || serverEnv.adminEmails[0];
  if (!adminRecipient) return false;

  const result = await sendEmail({
    to: adminRecipient,
    subject: "New Good Music account pending approval",
    text: `${input.name || "A new user"} (${input.email}) is awaiting approval.`,
    html: `
      <div style="font-family:system-ui,sans-serif">
        <h2>New account pending approval</h2>
        <p><strong>${escapeHtml(input.name || "Unknown")}</strong> &lt;${escapeHtml(
          input.email
        )}&gt; has registered and is waiting for approval.</p>
      </div>
    `,
  });
  return result.ok;
}
