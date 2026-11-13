import { serverEnv } from "../env";

/**
 * Resend (transactional email + Audiences).
 *
 * Free tier: 3,000 emails/month, 100/day, audiences and contacts included.
 * No paid feature is used: no broadcast campaigns, no dedicated IPs.
 *
 * All calls are best-effort: an email outage must never fail a sign-in or an
 * admin action.
 */

export function resendConfigured(): boolean {
  return Boolean(serverEnv.resendApiKey);
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

export async function sendEmail(input: SendEmailInput): Promise<{ ok: boolean }> {
  if (!resendConfigured()) return { ok: false };

  const recipients = (Array.isArray(input.to) ? input.to : [input.to])
    .map((address) => address.trim().toLowerCase())
    .filter((address) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address))
    .slice(0, 5);

  if (recipients.length === 0) return { ok: false };

  try {
    const response = await fetch("https://api.resend.com/emails", {
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

    if (!response.ok) {
      console.warn(`[resend] email rejected with HTTP ${response.status}`);
      return { ok: false };
    }
    return { ok: true };
  } catch (error) {
    console.warn("[resend] email send failed:", (error as Error)?.message);
    return { ok: false };
  }
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
