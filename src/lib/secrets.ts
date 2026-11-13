/**
 * Server-only secrets access with encryption at rest.
 *
 * Every server secret is read through `readSecret()` instead of `process.env`:
 *
 *   - a value starting with `enc:v1:` is decrypted with the master key
 *     (`SECRETS_MASTER_KEY`, plus `SECRETS_MASTER_KEY_PREVIOUS` during a
 *     rotation) and cached for the life of the isolate;
 *   - a plaintext value is still accepted so an existing deployment keeps
 *     working, but it is recorded and surfaced by `/api/health`;
 *   - `SECRETS_STRICT=true` turns a plaintext value into a hard failure, which
 *     is the recommended setting once every secret has been sealed.
 *
 * Errors name the *variable* only. A ciphertext, a master key or a decrypted
 * value never reaches a log line, an HTTP response or an exception message.
 *
 * The cryptography lives in `./secrets-core.mjs` so the CLI (`scripts/secrets.mjs`)
 * and the runtime share one implementation. This file must never be imported
 * from a "use client" component.
 */
import {
  MASTER_KEY_ENV,
  PREVIOUS_MASTER_KEY_ENV,
  SECRET_PREFIX,
  SEALABLE_ENV_NAMES,
  STRICT_ENV,
  buildKeyRing,
  describeSecretValue,
  generateMasterKey,
  isEncryptedSecret,
  keyIdFor,
  openValue,
  sealValue,
} from "./secrets-core.mjs";

export { MASTER_KEY_ENV, PREVIOUS_MASTER_KEY_ENV, SECRET_PREFIX, SEALABLE_ENV_NAMES, STRICT_ENV };

type KeyRing = { currentId: string; keys: Map<string, Buffer> };

export class SecretsError extends Error {
  readonly variable: string;

  constructor(variable: string, message: string) {
    super(message);
    this.name = "SecretsError";
    this.variable = variable;
  }
}

/** Decrypted values, keyed by token: the same ciphertext always opens to the same value. */
const plaintextCache = new Map<string, string>();
const PLAINTEXT_CACHE_MAX = 256;

const plaintextNames = new Set<string>();
const failedNames = new Set<string>();
let decryptedReads = 0;

let ringCache: { signature: string; ring: KeyRing | null } | null = null;

function readRaw(name: string): string | undefined {
  const value = process.env[name];
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function loadKeyRing(): KeyRing | null {
  const current = process.env[MASTER_KEY_ENV];
  const previous = process.env[PREVIOUS_MASTER_KEY_ENV];
  const signature = `${current ?? ""}\u0000${previous ?? ""}`;

  if (ringCache?.signature === signature) return ringCache.ring;

  // `buildKeyRing` returns null when neither key is set or neither is valid.
  const ring = buildKeyRing(current, previous) as KeyRing | null;
  ringCache = { signature, ring };
  return ring;
}

export function isStrictSecretsMode(): boolean {
  const raw = process.env[STRICT_ENV];
  if (typeof raw !== "string") return false;
  return ["1", "true", "yes", "on"].includes(raw.trim().toLowerCase());
}

/**
 * Reads a server secret, decrypting it when it is sealed.
 *
 * @throws {SecretsError} when the value is sealed but cannot be opened, or when
 * `SECRETS_STRICT=true` and the value is plaintext.
 */
export function readSecret(name: string): string | undefined {
  const raw = readRaw(name);
  if (!raw) return undefined;

  if (!isEncryptedSecret(raw)) {
    if (isStrictSecretsMode()) {
      throw new SecretsError(
        name,
        `${name} is stored in plaintext but ${STRICT_ENV}=true (expected an ${SECRET_PREFIX} token).`
      );
    }
    plaintextNames.add(name);
    return raw;
  }

  const cached = plaintextCache.get(raw);
  if (cached !== undefined) return cached;

  try {
    const plaintext = openValue(raw, loadKeyRing(), name) as string;
    decryptedReads += 1;
    if (plaintextCache.size >= PLAINTEXT_CACHE_MAX) plaintextCache.clear();
    plaintextCache.set(raw, plaintext);
    failedNames.delete(name);
    return plaintext;
  } catch (error) {
    failedNames.add(name);
    // The core already produced a value-free, variable-named message.
    throw new SecretsError(name, `${(error as Error).message} [${name}]`);
  }
}

/**
 * Same as `readSecret` but returns `undefined` instead of throwing. Used by
 * validation and diagnostics so one broken secret cannot take down `/api/health`.
 */
export function readSecretSafe(name: string): string | undefined {
  try {
    return readSecret(name);
  } catch {
    failedNames.add(name);
    return undefined;
  }
}

/**
 * Presence check that never decrypts, so a report can say "configured but
 * broken" instead of "missing" for a sealed value that cannot be opened.
 */
export function hasSecret(name: string): boolean {
  const value = process.env[name];
  return typeof value === "string" && value.trim().length > 0;
}

export interface SecretsReport {
  /** A master key is configured, so sealing is available. */
  masterKeyConfigured: boolean;
  /** A previous master key is configured (rotation window). */
  previousKeyConfigured: boolean;
  /** Key id currently used to seal new values. */
  keyId: string | null;
  /** `SECRETS_STRICT=true`: plaintext secrets are refused. */
  strict: boolean;
  /** How many sealed values have been opened in this process. */
  decryptedReads: number;
  /** Names (never values) of secrets that are still plaintext. */
  plaintextSecretNames: string[];
  /** Names of secrets that could not be decrypted. */
  failedSecretNames: string[];
  /** seal -> open round-trip succeeded with the configured key. */
  selfTest: boolean;
}

let selfTestResult: boolean | null = null;

/** Cheap, cached seal/open round-trip that proves the runtime crypto works. */
export function secretsSelfTest(): boolean {
  if (selfTestResult !== null) return selfTestResult;

  const ring = loadKeyRing();
  if (!ring) {
    selfTestResult = false;
    return false;
  }

  try {
    const sample = `selftest:${Date.now().toString(36)}`;
    selfTestResult = openValue(sealValue(sample, ring), ring, "SECRETS_SELF_TEST") === sample;
  } catch {
    selfTestResult = false;
  }
  return selfTestResult;
}

export function getSecretsReport(): SecretsReport {
  const current = process.env[MASTER_KEY_ENV];
  const previous = process.env[PREVIOUS_MASTER_KEY_ENV];

  return {
    masterKeyConfigured: Boolean(keyIdFor(current)),
    previousKeyConfigured: Boolean(keyIdFor(previous)),
    keyId: keyIdFor(current),
    strict: isStrictSecretsMode(),
    decryptedReads,
    plaintextSecretNames: [...plaintextNames].sort(),
    failedSecretNames: [...failedNames].sort(),
    selfTest: secretsSelfTest(),
  };
}

/**
 * Touches every sealable variable so the report lists all of them, not only the
 * ones a request happened to read.
 */
export function scanSealableSecrets(): void {
  for (const name of SEALABLE_ENV_NAMES) readSecretSafe(name);
}

/** `enc:v1:<keyId>` or `plaintext (n chars)`; never the value itself. */
export function describeSecret(name: string): string {
  return describeSecretValue(process.env[name]);
}

export { generateMasterKey };
