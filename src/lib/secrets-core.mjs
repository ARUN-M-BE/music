/**
 * Secrets-at-rest core: AES-256-GCM envelope encryption for environment values.
 *
 * This file is plain ESM (no TypeScript, no project imports) on purpose: the
 * Next.js server runtime and the operator CLI (`scripts/secrets.mjs`) import the
 * exact same implementation, so a value sealed by the CLI is guaranteed to open
 * in the application. There is no second implementation to drift out of sync.
 *
 * Token format:
 *
 *   enc:v1:<keyId>:<base64url(iv || ciphertext || authTag)>
 *
 *   keyId    8 chars, hmac(master, "key-id"), so a rotation can carry two keys
 *            (current + previous) and still find the right one for old values.
 *   iv       12 random bytes per value.
 *   authTag  16 bytes - AES-GCM authenticates the ciphertext, so a tampered or
 *            truncated token fails closed instead of decrypting to garbage.
 *
 * The master key never leaves the environment. It is read from
 * `SECRETS_MASTER_KEY` (and `SECRETS_MASTER_KEY_PREVIOUS` during a rotation).
 * Only primitives that exist in both Node.js and the Cloudflare Workers
 * `node:crypto` shim are used: createCipheriv / createDecipheriv / createHmac /
 * randomBytes.
 */
import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
} from "node:crypto";

export const SECRET_PREFIX = "enc:v1:";
export const MASTER_KEY_ENV = "SECRETS_MASTER_KEY";
export const PREVIOUS_MASTER_KEY_ENV = "SECRETS_MASTER_KEY_PREVIOUS";
export const STRICT_ENV = "SECRETS_STRICT";

const ALGORITHM = "aes-256-gcm";
const KEY_BYTES = 32;
const IV_BYTES = 12;
const TAG_BYTES = 16;
const KEY_ID_CONTEXT = "good-music/secrets/v1";

/**
 * Variables that MUST be sealed before they are written to disk.
 *
 * `NEXT_PUBLIC_*` values are deliberately absent: they are inlined into the
 * browser bundle at build time, so they can never be ciphertext. The Firebase
 * *web* API key is public by design; it is protected by HTTP-referrer and API
 * restrictions in Google Cloud, not by secrecy.
 *
 * The master keys are also absent - sealing them with themselves is impossible.
 * They belong in the platform secret store (`wrangler secret put`, Vercel env).
 */
export const SEALABLE_ENV_NAMES = [
  "AUTH_SECRET",
  "NEXTAUTH_SECRET",
  "MONGODB_URI",
  "DATABASE_STRING",
  "IMAGEKIT_PRIVATE_KEY",
  "FIREBASE_WEB_API_KEY",
  "UPSTASH_REDIS_REST_TOKEN",
  "RESEND_API_KEY",
  "TINYBIRD_TOKEN",
  "EVOLUTION_API_KEY",
  "EVOLUTION_WEBHOOK_SECRET",
];

/**
 * @param {unknown} value
 * @returns {boolean}
 */
export function isEncryptedSecret(value) {
  return typeof value === "string" && value.startsWith(SECRET_PREFIX);
}

/**
 * Accepts base64url (canonical), base64 or 64-character hex.
 * Anything that is not exactly 32 bytes is rejected rather than padded.
 *
 * @param {string | undefined | null} raw
 * @returns {Buffer | null}
 */
export function parseMasterKey(raw) {
  if (typeof raw !== "string") return null;
  const value = raw.trim();
  if (!value) return null;
  if (/^[0-9a-fA-F]{64}$/.test(value)) return Buffer.from(value, "hex");

  for (const encoding of /** @type {const} */ (["base64url", "base64"])) {
    const decoded = Buffer.from(value, encoding);
    if (decoded.length === KEY_BYTES) return decoded;
  }
  return null;
}

/**
 * @param {Buffer} master
 * @returns {string}
 */
export function keyIdOf(master) {
  return createHmac("sha256", master)
    .update(KEY_ID_CONTEXT)
    .digest("base64url")
    .slice(0, 8);
}

/**
 * @param {string | undefined | null} raw
 * @returns {string | null}
 */
export function keyIdFor(raw) {
  const master = parseMasterKey(raw);
  return master ? keyIdOf(master) : null;
}

/**
 * @typedef {{ currentId: string, keys: Map<string, Buffer> }} KeyRing
 */

/**
 * Builds the key ring from the current and (optional) previous master key.
 * The previous key only decrypts; it is never used to seal new values.
 *
 * @param {string | undefined | null} currentRaw
 * @param {string | undefined | null} [previousRaw]
 * @returns {KeyRing | null}
 */
export function buildKeyRing(currentRaw, previousRaw) {
  const current = parseMasterKey(currentRaw);
  const previous = parseMasterKey(previousRaw);
  if (!current && !previous) return null;

  /** @type {Map<string, Buffer>} */
  const keys = new Map();
  if (previous) keys.set(keyIdOf(previous), previous);
  if (current) keys.set(keyIdOf(current), current);

  return {
    currentId: current ? keyIdOf(current) : keyIdOf(previous),
    keys,
  };
}

/** A new 32-byte master key, base64url encoded (43 characters). */
export function generateMasterKey() {
  return randomBytes(KEY_BYTES).toString("base64url");
}

/**
 * @param {string} plaintext
 * @param {KeyRing} ring
 * @returns {string}
 */
export function sealValue(plaintext, ring) {
  const key = ring.keys.get(ring.currentId);
  if (!key) throw new Error("Secrets key ring has no current key.");

  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(String(plaintext), "utf8"),
    cipher.final(),
  ]);
  const payload = Buffer.concat([iv, ciphertext, cipher.getAuthTag()]);
  return `${SECRET_PREFIX}${ring.currentId}:${payload.toString("base64url")}`;
}

/**
 * @param {string} token
 * @param {KeyRing | null} ring
 * @param {string} [label] variable name, used in errors instead of the value
 * @returns {string}
 */
export function openValue(token, ring, label = "secret") {
  if (!isEncryptedSecret(token)) {
    throw new Error(`${label} is not an ${SECRET_PREFIX} token.`);
  }
  if (!ring) {
    throw new Error(
      `${label} is encrypted but ${MASTER_KEY_ENV} is not set (create one with "npm run secrets:keygen").`
    );
  }

  // enc : v1 : keyId : payload
  const parts = token.split(":");
  if (parts.length !== 4 || parts[1] !== "v1") {
    throw new Error(`${label} has a malformed secrets token.`);
  }
  const keyId = parts[2];
  const key = ring.keys.get(keyId);
  if (!key) {
    throw new Error(
      `${label} was sealed with key "${keyId}" which is not configured (set ${PREVIOUS_MASTER_KEY_ENV} during a rotation).`
    );
  }

  const payload = Buffer.from(parts[3], "base64url");
  if (payload.length <= IV_BYTES + TAG_BYTES) {
    throw new Error(`${label} has a truncated secrets token.`);
  }

  const iv = payload.subarray(0, IV_BYTES);
  const tag = payload.subarray(payload.length - TAG_BYTES);
  const ciphertext = payload.subarray(IV_BYTES, payload.length - TAG_BYTES);

  try {
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
  } catch {
    // Never echo the token or the key material.
    throw new Error(`${label} failed authentication: wrong master key or corrupted token.`);
  }
}

/**
 * Safe preview for logs and CLI output. Never returns plaintext.
 *
 * @param {string | undefined | null} value
 * @returns {string}
 */
export function describeSecretValue(value) {
  if (typeof value !== "string" || value.length === 0) return "<unset>";
  if (!isEncryptedSecret(value)) return `plaintext (${value.length} chars)`;
  const keyId = value.split(":")[2] ?? "?";
  return `sealed (key ${keyId})`;
}
