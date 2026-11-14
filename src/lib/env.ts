/**
 * Centralised, server-only environment configuration.
 *
 * Rules enforced here:
 *  - No secret is ever hardcoded as a fallback (a missing secret must fail closed).
 *  - Only `NEXT_PUBLIC_*` values may be consumed by client components.
 *  - Every integration is optional; when its env vars are absent the feature is
 *    disabled instead of throwing at runtime.
 *
 * This module must never be imported from a "use client" component.
 */

import {
  MASTER_KEY_ENV,
  PREVIOUS_MASTER_KEY_ENV,
  STRICT_ENV,
  getSecretsReport,
  hasSecret,
  isEncryptedSecret,
  readSecret,
  readSecretSafe,
  scanSealableSecrets,
} from "./secrets";

const isProduction = process.env.NODE_ENV === "production";

function normalize(value: string | undefined): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Runtime lookup for server-only values (secrets, connection strings, flags).
 * Every platform injects those into `process.env` at runtime, so a dynamic key
 * is correct here.
 */
function readEnv(name: string): string | undefined {
  return normalize(process.env[name]);
}

/**
 * `NEXT_PUBLIC_*` values must be read through a LITERAL `process.env.X`
 * expression. The bundler only rewrites those literals to the build-time value;
 * a dynamic `process.env[name]` lookup is left untouched and is `undefined` at
 * runtime on worker/edge targets, where build-time public variables are not
 * bound to the runtime environment.
 *
 * This caused a real outage: the browser could complete the Google popup (the
 * key was inlined in the client bundle) while the server answered
 * "Google sign-in is not configured on this deployment".
 */
const PUBLIC_FIREBASE_API_KEY = normalize(process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
const PUBLIC_FIREBASE_PROJECT_ID = normalize(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
const PUBLIC_IMAGEKIT_KEY = normalize(process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY);
const PUBLIC_IMAGEKIT_ENDPOINT = normalize(process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT);

function readList(name: string): string[] {
  const raw = readEnv(name);
  if (!raw) return [];

  // A list is a single value, so it can be sealed (`enc:v1:...`) like any other
  // secret: `ADMIN_EMAILS` holds personal data and is often the only value left
  // in a committed `wrangler.jsonc`. A broken token yields an empty list rather
  // than the ciphertext, and `scanSealableSecrets()` reports the failure by name.
  const opened = isEncryptedSecret(raw) ? readSecretSafe(name) : raw;
  if (!opened) return [];

  return opened
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter((item) => item.length > 0);
}

function readBool(name: string, fallback = false): boolean {
  const raw = readEnv(name);
  if (!raw) return fallback;
  return ["1", "true", "yes", "on"].includes(raw.toLowerCase());
}

function readInt(name: string, fallback: number): number {
  const raw = readEnv(name);
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const SESSION_COOKIE_NAME = "gm_session";

/** Development-only fallback so `npm run dev` works without a .env file. */
const DEV_AUTH_SECRET = "dev-only-insecure-auth-secret-change-me-0000000000";

export const serverEnv = {
  isProduction,

  // ---------------------------------------------------------------- core auth
  get authSecret(): string {
    // Secrets may be sealed (`enc:v1:...`); `readSecret` opens them or throws
    // with the variable name. Plaintext is still accepted unless
    // SECRETS_STRICT=true.
    const secret = readSecret("AUTH_SECRET") ?? readSecret("NEXTAUTH_SECRET");
    if (secret && secret.length >= 32) return secret;
    if (!isProduction) return secret ?? DEV_AUTH_SECRET;
    // In production a missing/short secret is a fatal misconfiguration.
    throw new Error(
      "AUTH_SECRET is missing or shorter than 32 characters. Refusing to issue sessions."
    );
  },
  sessionTtlSeconds: readInt("SESSION_TTL_SECONDS", 60 * 60 * 24 * 7),
  sessionVersion: readEnv("SESSION_VERSION") ?? "1",

  /** Server-side source of truth for privileged accounts. Never sent to clients. */
  adminEmails: (() => {
    const list = readList("ADMIN_EMAILS");
    return list.length > 0 ? list : readList("ADMIN_EMAIL");
  })(),

  allowGuestSessions: readBool("ALLOW_GUEST_SESSIONS", true),

  // ---------------------------------------------------------------- database
  get mongodbUri(): string {
    const uri = readSecret("MONGODB_URI") ?? readSecret("DATABASE_STRING");
    if (!uri) {
      throw new Error("MONGODB_URI (or DATABASE_STRING) is not configured.");
    }
    return uri;
  },
  mongodbDbName: readEnv("MONGODB_DB"),

  // ---------------------------------------------------------------- firebase
  // The web API key is public by design, but the server copy is still treated
  // as a secret: it is the value that gets rotated when the leaked one is fixed.
  firebaseApiKey: readSecret("FIREBASE_WEB_API_KEY") ?? PUBLIC_FIREBASE_API_KEY ?? "",
  firebaseProjectId: readEnv("FIREBASE_PROJECT_ID") ?? PUBLIC_FIREBASE_PROJECT_ID ?? "",

  // ---------------------------------------------------------------- imagekit
  imagekitPrivateKey: readSecret("IMAGEKIT_PRIVATE_KEY") ?? "",
  imagekitPublicKey: readEnv("IMAGEKIT_PUBLIC_KEY") ?? PUBLIC_IMAGEKIT_KEY ?? "",
  imagekitUrlEndpoint: readEnv("IMAGEKIT_URL_ENDPOINT") ?? PUBLIC_IMAGEKIT_ENDPOINT ?? "",

  // ---------------------------------------------------------------- upstash
  upstashRestUrl: readEnv("UPSTASH_REDIS_REST_URL") ?? "",
  upstashRestToken: readSecret("UPSTASH_REDIS_REST_TOKEN") ?? "",

  // ---------------------------------------------------------------- resend
  resendApiKey: readSecret("RESEND_API_KEY") ?? "",
  // `RESEND_FROM_EMAIL` is accepted for backwards compatibility with existing
  // .env files; without it the configured sender name was silently ignored.
  resendFrom:
    readEnv("RESEND_FROM") ??
    readEnv("RESEND_FROM_EMAIL") ??
    "Good Music <onboarding@resend.dev>",
  resendAudienceId: readEnv("RESEND_AUDIENCE_ID") ?? "",
  resendAdminNotifyEmail: readEnv("RESEND_ADMIN_NOTIFY_EMAIL") ?? "",

  // ---------------------------------------------------------------- tinybird
  tinybirdToken: readSecret("TINYBIRD_TOKEN") ?? "",
  // `TINYBIRD_URL` is accepted for backwards compatibility with existing .env files.
  tinybirdHost: readEnv("TINYBIRD_HOST") ?? readEnv("TINYBIRD_URL") ?? "https://api.tinybird.co",
  tinybirdPlaysDatasource: readEnv("TINYBIRD_PLAYS_DATASOURCE") ?? "music_plays",

  // ---------------------------------------------------------------- evolution (self-hosted WhatsApp)
  evolutionApiUrl: readEnv("EVOLUTION_API_URL") ?? "",
  evolutionApiKey: readSecret("EVOLUTION_API_KEY") ?? "",
  evolutionInstance: readEnv("EVOLUTION_INSTANCE") ?? "",
  evolutionAdminNumber: readEnv("EVOLUTION_ADMIN_NUMBER") ?? "",
  evolutionWebhookSecret: readSecret("EVOLUTION_WEBHOOK_SECRET") ?? "",

  // ---------------------------------------------------------------- geo ip
  // IPstack's free tier is HTTP-only (HTTPS is a paid feature) so a free,
  // keyless, HTTPS provider chain is used instead (see integrations/geo.ts).
  geoProvider: (readEnv("GEO_PROVIDER") ?? "country.is").toLowerCase(),
  geoLookupEnabled: readBool("GEO_LOOKUP_ENABLED", true),

  // ---------------------------------------------------------------- hard limits
  maxAudioUploadBytes: readInt("MAX_AUDIO_UPLOAD_BYTES", 25 * 1024 * 1024),
  maxImageUploadBytes: readInt("MAX_IMAGE_UPLOAD_BYTES", 5 * 1024 * 1024),
  allowedCorsOrigins: readList("ALLOWED_ORIGINS"),
};

export type IntegrationHealth = {
  name: string;
  configured: boolean;
  freeTier: string;
  requiredEnv: string[];
};

/** Integration catalogue used by /api/integrations/health and the audit report. */
export function getIntegrationHealth(): IntegrationHealth[] {
  return [
    {
      name: "upstash-redis",
      configured: Boolean(serverEnv.upstashRestUrl) && hasSecret("UPSTASH_REDIS_REST_TOKEN"),
      freeTier: "10,000 commands/day, 256 MB, no card required",
      requiredEnv: ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"],
    },
    {
      name: "resend-audiences",
      configured: hasSecret("RESEND_API_KEY"),
      freeTier: "3,000 emails/month, 100/day; audiences included",
      requiredEnv: ["RESEND_API_KEY", "RESEND_FROM"],
    },
    {
      name: "tinybird",
      configured: hasSecret("TINYBIRD_TOKEN"),
      freeTier: "Free developer workspace (1,000 API requests/day)",
      requiredEnv: ["TINYBIRD_TOKEN", "TINYBIRD_HOST"],
    },
    {
      name: "evolution-api",
      configured: Boolean(
        serverEnv.evolutionApiUrl && hasSecret("EVOLUTION_API_KEY") && serverEnv.evolutionInstance
      ),
      freeTier: "Open source (Apache-2.0), self-hosted at zero licence cost",
      requiredEnv: ["EVOLUTION_API_URL", "EVOLUTION_API_KEY", "EVOLUTION_INSTANCE"],
    },
    {
      name: "geolocation",
      configured: serverEnv.geoLookupEnabled,
      freeTier: "Keyless HTTPS failover: api.country.is -> ipapi.co -> ipwho.is",
      requiredEnv: ["GEO_LOOKUP_ENABLED"],
    },
    {
      name: "monkeytype",
      configured: true,
      freeTier: "Public API, keyless, rate limited by the provider",
      requiredEnv: [],
    },
  ];
}

/** Returns configuration problems that must be fixed before deploying. */
export function validateServerEnv(): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  const secret = readSecretSafe("AUTH_SECRET") ?? readSecretSafe("NEXTAUTH_SECRET");
  if (!secret) {
    // Distinguish "missing" from "present but unreadable": the second one is a
    // wrong master key, which otherwise looks like a mystery outage.
    errors.push(
      hasSecret("AUTH_SECRET") || hasSecret("NEXTAUTH_SECRET")
        ? `AUTH_SECRET is set but could not be decrypted: check ${MASTER_KEY_ENV}.`
        : "AUTH_SECRET is not set."
    );
  } else if (secret.length < 32) {
    errors.push("AUTH_SECRET must be at least 32 characters long.");
  } else if (/music-secret-jwt|changeme|secret/i.test(secret) && isProduction) {
    warnings.push("AUTH_SECRET looks like a placeholder value. Rotate it.");
  }

  if (!hasSecret("MONGODB_URI") && !hasSecret("DATABASE_STRING")) {
    errors.push("MONGODB_URI is not set.");
  }
  if (!hasSecret("IMAGEKIT_PRIVATE_KEY")) {
    warnings.push("IMAGEKIT_PRIVATE_KEY is not set: uploads are disabled.");
  }
  // `hasSecret` instead of the getter: a sealed value with a wrong master key
  // must be reported by the `secrets.failed` check below, not thrown here.
  if (!hasSecret("FIREBASE_WEB_API_KEY") && !PUBLIC_FIREBASE_API_KEY) {
    warnings.push("FIREBASE_WEB_API_KEY is not set: Google sign-in verification is disabled.");
  }
  if (!hasSecret("UPSTASH_REDIS_REST_TOKEN") || !serverEnv.upstashRestUrl) {
    warnings.push(
      "Upstash REST credentials missing: falling back to per-instance in-memory rate limiting."
    );
  }
  if (serverEnv.adminEmails.length === 0) {
    errors.push("ADMIN_EMAILS is not set: nobody can administer the platform.");
  }
  if (serverEnv.mongodbDbName) {
    warnings.push("MONGODB_DB overrides the database name from the connection string.");
  }

  // ------------------------------------------------------------ secrets at rest
  // Reading every sealable variable makes the report complete even when a
  // request only touched one of them. Failures are collected, never thrown.
  scanSealableSecrets();
  const secrets = getSecretsReport();

  if (secrets.failedSecretNames.length > 0) {
    errors.push(
      `Encrypted secret(s) could not be opened: ${secrets.failedSecretNames.join(
        ", "
      )}. Check ${MASTER_KEY_ENV} (and ${PREVIOUS_MASTER_KEY_ENV} during a rotation).`
    );
  }

  if (!secrets.masterKeyConfigured) {
    warnings.push(
      `At-rest encryption is OFF (${MASTER_KEY_ENV} is not set): server secrets are stored in plaintext. Run \`npm run secrets:keygen\` then \`npm run secrets:seal\`.`
    );
  } else if (!secrets.selfTest) {
    errors.push(
      `${MASTER_KEY_ENV} is set but the encrypt/decrypt self-test failed on this runtime: secrets sealed here cannot be read back.`
    );
  }

  if (secrets.masterKeyConfigured && secrets.plaintextSecretNames.length > 0) {
    const message = `${secrets.plaintextSecretNames.length} server secret(s) are still plaintext: ${secrets.plaintextSecretNames.join(", ")}. Run \`npm run secrets:seal\`.`;
    if (secrets.strict) errors.push(`${message} ${STRICT_ENV}=true refuses plaintext.`);
    else warnings.push(message);
  }

  // ------------------------------------------------------------ resend delivery
  const resendKey = readSecretSafe("RESEND_API_KEY");
  if (resendKey) {
    if (!/^re_[A-Za-z0-9_-]{8,}$/.test(resendKey)) {
      warnings.push(
        "RESEND_API_KEY does not look like a Resend key (expected `re_...`): transactional email will fail."
      );
    } else if (/@resend\.dev\b/i.test(serverEnv.resendFrom)) {
      warnings.push(
        "RESEND_FROM uses the resend.dev sandbox sender: only the Resend account owner can receive mail. Verify a domain to email real users."
      );
    }
  }

  return { errors, warnings };
}
