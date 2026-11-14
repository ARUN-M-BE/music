/**
 * Secrets-at-rest core for the browser: WebCrypto AES-256-GCM, byte-identical
 * to the format produced by `./secrets-core.mjs`.
 *
 *   enc:v1:<keyId>:<base64url(iv || ciphertext || authTag)>
 *
 * Both implementations exist on purpose and neither may invent its own format:
 * `npm run secrets:test` seals a value with each side and opens it with the
 * other, so a change that breaks compatibility fails the test instead of
 * silently producing tokens the server cannot read.
 *
 * Why this file is plain ESM with no imports: it is bundled into a "use client"
 * component, so it cannot touch `node:crypto`, `process.env` or any SDK. The
 * only primitives used are the ones every modern browser and Node.js 18+
 * provide: `crypto.subtle`, `crypto.getRandomValues`, `TextEncoder`,
 * `atob`/`btoa`.
 *
 * Passphrase mode derives the same master key every time (PBKDF2-SHA256 over a
 * salt that is itself derived from the passphrase), so nothing has to be
 * stored next to the ciphertext: the passphrase alone recreates the key. The
 * derived key is what belongs in `SECRETS_MASTER_KEY` on the platform.
 */

export const SECRET_PREFIX = "enc:v1:";

/**
 * OWASP's 2023 floor for PBKDF2-HMAC-SHA256. Raising it invalidates previously
 * derived keys, so a token made with another count must be opened by pasting
 * the master key directly instead of re-deriving it.
 */
export const PBKDF2_ITERATIONS = 310_000;

const KEY_BYTES = 32;
const KEY_ID_CHARS = 8;
const KEY_ID_CONTEXT = "good-music/secrets/v1";
const SALT_CONTEXT = "good-music/pbkdf2-salt/v1:";
const IV_BYTES = 12;
const TAG_BITS = 128;
const ALGORITHM = "AES-GCM";

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function subtle() {
  const impl = globalThis.crypto?.subtle;
  if (!impl) {
    throw new Error(
      "WebCrypto is unavailable. Use HTTPS or localhost (browsers disable it on plain HTTP), or Node.js 18+."
    );
  }
  return impl;
}

// --------------------------------------------------------------- base64url

/**
 * @param {Uint8Array | ArrayBuffer} bytes
 * @returns {string} base64url without padding
 */
export function bytesToBase64Url(bytes) {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  // 32 KiB slices keep String.fromCharCode away from the argument limit.
  for (let offset = 0; offset < view.length; offset += 0x8000) {
    binary += String.fromCharCode(...view.subarray(offset, offset + 0x8000));
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * @param {string} text base64url, base64 or base64url-safe
 * @returns {Uint8Array}
 */
export function base64UrlToBytes(text) {
  const normalized = String(text).trim().replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function hexToBytes(text) {
  const bytes = new Uint8Array(text.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(text.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}

// -------------------------------------------------------------- master key

/**
 * Accepts base64url (canonical), base64 or 64-character hex, exactly like the
 * Node.js core. Anything that is not 32 bytes is rejected rather than padded.
 *
 * @param {string | undefined | null} raw
 * @returns {Uint8Array | null}
 */
export function parseMasterKey(raw) {
  if (typeof raw !== "string") return null;
  // Tolerate a pasted `.env` line or a `KEY=VALUE` export.
  const value = raw.trim().replace(/^SECRETS_MASTER_KEY\s*=\s*/, "").replace(/^["']|["']$/g, "");
  if (!value) return null;

  if (/^[0-9a-fA-F]{64}$/.test(value)) return hexToBytes(value);

  try {
    const decoded = base64UrlToBytes(value);
    if (decoded.length === KEY_BYTES) return decoded;
  } catch {
    // Not base64 at all: fall through to the null return.
  }
  return null;
}

/**
 * @param {string} masterKey
 * @returns {Uint8Array}
 */
function requireMasterKey(masterKey) {
  const key = parseMasterKey(masterKey);
  if (!key) {
    throw new Error(
      "Master key must be 32 bytes: the base64url value from `npm run secrets:keygen`, or a 64-character hex key."
    );
  }
  return key;
}

/** A new 32-byte master key, base64url encoded (43 characters). */
export function generateMasterKey() {
  return bytesToBase64Url(globalThis.crypto.getRandomValues(new Uint8Array(KEY_BYTES)));
}

/**
 * @param {Uint8Array} bytes
 * @returns {Promise<CryptoKey>}
 */
function importAesKey(bytes) {
  return subtle().importKey("raw", bytes, { name: ALGORITHM, length: KEY_BYTES * 8 }, false, [
    "encrypt",
    "decrypt",
  ]);
}

/**
 * `keyId` is a truncated HMAC of the master key, never the key itself, and it
 * lets a rotation decide which key opens a token.
 *
 * @param {string} masterKey
 * @returns {Promise<string>}
 */
export async function keyIdOf(masterKey) {
  const key = requireMasterKey(masterKey);
  const hmac = await subtle().importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);
  const digest = await subtle().sign("HMAC", hmac, textEncoder.encode(KEY_ID_CONTEXT));
  return bytesToBase64Url(new Uint8Array(digest)).slice(0, KEY_ID_CHARS);
}

/**
 * Deterministic salt: the same passphrase always derives the same master key,
 * so the operator only has to remember the passphrase. The salt is not secret;
 * its job is to stop a precomputed table from covering every passphrase.
 *
 * @param {string} passphrase
 * @returns {Promise<Uint8Array>}
 */
async function deriveSalt(passphrase) {
  const digest = await subtle().digest("SHA-256", textEncoder.encode(`${SALT_CONTEXT}${passphrase}`));
  return new Uint8Array(digest).subarray(0, KEY_BYTES);
}

/**
 * Turns a human passphrase into a `SECRETS_MASTER_KEY` value.
 *
 * @param {string} passphrase
 * @param {{ iterations?: number }} [options]
 * @returns {Promise<string>} base64url 32-byte key
 */
export async function deriveMasterKey(passphrase, options = {}) {
  if (typeof passphrase !== "string" || passphrase.length < 8) {
    throw new Error("Passphrase must be at least 8 characters.");
  }
  const iterations = Number.isInteger(options.iterations) && options.iterations > 0
    ? options.iterations
    : PBKDF2_ITERATIONS;

  const salt = await deriveSalt(passphrase);
  const baseKey = await subtle().importKey("raw", textEncoder.encode(passphrase), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await subtle().deriveBits(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    baseKey,
    KEY_BYTES * 8
  );
  return bytesToBase64Url(new Uint8Array(bits));
}

// -------------------------------------------------------------- seal / open

/** @param {unknown} value */
export function isSealedText(value) {
  return typeof value === "string" && value.startsWith(SECRET_PREFIX);
}

/**
 * @param {string} plaintext
 * @param {string} masterKey
 * @returns {Promise<string>} an `enc:v1:` token the server can open
 */
export async function sealText(plaintext, masterKey) {
  if (typeof plaintext !== "string" || plaintext.length === 0) {
    throw new Error("There is nothing to encrypt.");
  }
  const key = await importAesKey(requireMasterKey(masterKey));
  const keyId = await keyIdOf(masterKey);

  // A fresh IV per value: reusing one with GCM would be catastrophic.
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(IV_BYTES));
  // WebCrypto appends the 16-byte tag to the ciphertext, which is exactly the
  // `iv || ciphertext || tag` layout the Node.js core produces.
  const sealed = new Uint8Array(
    await subtle().encrypt({ name: ALGORITHM, iv, tagLength: TAG_BITS }, key, textEncoder.encode(plaintext))
  );

  const payload = new Uint8Array(iv.length + sealed.length);
  payload.set(iv, 0);
  payload.set(sealed, iv.length);

  return `${SECRET_PREFIX}${keyId}:${bytesToBase64Url(payload)}`;
}

/**
 * @param {string} token
 * @param {string} masterKey
 * @returns {Promise<string>}
 */
export async function openText(token, masterKey) {
  if (!isSealedText(token)) {
    throw new Error(`This is not an ${SECRET_PREFIX} token, so there is nothing to decrypt.`);
  }

  // enc : v1 : keyId : payload
  const parts = token.trim().split(":");
  if (parts.length !== 4 || parts[1] !== "v1") {
    throw new Error("The token is malformed: expected enc:v1:<keyId>:<payload>.");
  }

  const expected = await keyIdOf(masterKey);
  if (parts[2] !== expected) {
    throw new Error(
      `This token was sealed with key "${parts[2]}", but the supplied key is "${expected}". Use the matching passphrase or master key.`
    );
  }

  const payload = base64UrlToBytes(parts[3]);
  if (payload.length <= IV_BYTES + TAG_BITS / 8) {
    throw new Error("The token is truncated.");
  }

  const iv = payload.subarray(0, IV_BYTES);
  const sealed = payload.subarray(IV_BYTES);

  try {
    const plaintext = await subtle().decrypt(
      { name: ALGORITHM, iv, tagLength: TAG_BITS },
      await importAesKey(requireMasterKey(masterKey)),
      sealed
    );
    return textDecoder.decode(plaintext);
  } catch {
    // Never echo the token or the key material.
    throw new Error("Decryption failed: wrong master key or the token was modified.");
  }
}

/**
 * Cheap round trip used by the tool page to prove WebCrypto works in this tab
 * before the operator trusts it with a real value.
 *
 * @param {string} masterKey
 * @returns {Promise<boolean>}
 */
export async function selfTest(masterKey) {
  try {
    const sample = `selftest:${Date.now().toString(36)}:ünïcødé`;
    return (await openText(await sealText(sample, masterKey), masterKey)) === sample;
  } catch {
    return false;
  }
}
