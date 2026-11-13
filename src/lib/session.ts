import { SESSION_COOKIE_NAME, serverEnv } from "./env";
import {
  fromBase64Url,
  hmacSha256,
  randomToken,
  timingSafeEqual,
  toBase64Url,
} from "./crypto";

export type SessionRole = "admin" | "member" | "superadmin";
export type SessionStatus = "approved" | "pending";

export interface SessionPayload {
  /** Session format version. */
  v: string;
  /** Database identifier (`_id`) when available. */
  sub: string;
  /** Stable provider identifier (Firebase uid). */
  uid: string;
  email: string;
  name: string;
  role: SessionRole;
  status: SessionStatus;
  imageURL?: string;
  iat: number;
  exp: number;
  jti: string;
}

export interface SessionInput {
  sub: string;
  uid: string;
  email: string;
  name: string;
  role: SessionRole;
  status: SessionStatus;
  imageURL?: string;
}

const TOKEN_PREFIX = "gm1";

/**
 * Creates an HMAC-SHA256 signed, stateless session token.
 * Format: `gm1.<base64url(payload)>.<base64url(signature)>`
 */
export async function createSessionToken(input: SessionInput): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    v: serverEnv.sessionVersion,
    sub: input.sub,
    uid: input.uid,
    email: input.email.toLowerCase(),
    name: input.name,
    role: input.role,
    status: input.status,
    imageURL: input.imageURL,
    iat: now,
    exp: now + serverEnv.sessionTtlSeconds,
    jti: randomToken(12),
  };

  const encodedPayload = toBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const signingInput = `${TOKEN_PREFIX}.${encodedPayload}`;
  const signature = await hmacSha256(serverEnv.authSecret, signingInput);

  return `${signingInput}.${toBase64Url(signature)}`;
}

/** Verifies signature and expiry. Returns a human readable reason when invalid. */
export async function verifySessionToken(
  token: string | undefined | null
): Promise<{ valid: true; payload: SessionPayload } | { valid: false; reason: string }> {
  if (!token) return { valid: false, reason: "missing_token" };

  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== TOKEN_PREFIX) {
    return { valid: false, reason: "malformed_token" };
  }

  const [, encodedPayload, encodedSignature] = parts;
  const expected = await hmacSha256(serverEnv.authSecret, `${TOKEN_PREFIX}.${encodedPayload}`);

  let provided: Uint8Array;
  try {
    provided = fromBase64Url(encodedSignature);
  } catch {
    return { valid: false, reason: "malformed_signature" };
  }

  if (
    provided.length !== expected.length ||
    !timingSafeEqual(toBase64Url(provided), toBase64Url(expected))
  ) {
    return { valid: false, reason: "bad_signature" };
  }

  let payload: SessionPayload;
  try {
    payload = JSON.parse(new TextDecoder().decode(fromBase64Url(encodedPayload)));
  } catch {
    return { valid: false, reason: "malformed_payload" };
  }

  if (!payload || typeof payload.exp !== "number" || typeof payload.email !== "string") {
    return { valid: false, reason: "malformed_payload" };
  }
  if (payload.exp <= Math.floor(Date.now() / 1000)) {
    return { valid: false, reason: "expired_token" };
  }
  if (payload.v !== serverEnv.sessionVersion) {
    return { valid: false, reason: "stale_session_version" };
  }

  return { valid: true, payload };
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: serverEnv.isProduction,
  sameSite: "lax" as const,
  path: "/",
  maxAge: serverEnv.sessionTtlSeconds,
};

export const clearedSessionCookieOptions = {
  httpOnly: true,
  secure: serverEnv.isProduction,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 0,
};

export { SESSION_COOKIE_NAME };
