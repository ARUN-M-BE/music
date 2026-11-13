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

const isProduction = process.env.NODE_ENV === "production";

function readEnv(name: string): string | undefined {
  const value = process.env[name];
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function readList(name: string): string[] {
  const raw = readEnv(name);
  if (!raw) return [];
  return raw
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
    const secret = readEnv("AUTH_SECRET") ?? readEnv("NEXTAUTH_SECRET");
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
    const uri = readEnv("MONGODB_URI") ?? readEnv("DATABASE_STRING");
    if (!uri) {
      throw new Error("MONGODB_URI (or DATABASE_STRING) is not configured.");
    }
    return uri;
  },
  mongodbDbName: readEnv("MONGODB_DB"),

  // ---------------------------------------------------------------- firebase
  firebaseApiKey:
    readEnv("FIREBASE_WEB_API_KEY") ?? readEnv("NEXT_PUBLIC_FIREBASE_API_KEY") ?? "",
  firebaseProjectId:
    readEnv("FIREBASE_PROJECT_ID") ?? readEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID") ?? "",

  // ---------------------------------------------------------------- imagekit
  imagekitPrivateKey: readEnv("IMAGEKIT_PRIVATE_KEY") ?? "",
  imagekitPublicKey:
    readEnv("IMAGEKIT_PUBLIC_KEY") ?? readEnv("NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY") ?? "",
  imagekitUrlEndpoint:
    readEnv("IMAGEKIT_URL_ENDPOINT") ?? readEnv("NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT") ?? "",

  // ---------------------------------------------------------------- upstash
  upstashRestUrl: readEnv("UPSTASH_REDIS_REST_URL") ?? "",
  upstashRestToken: readEnv("UPSTASH_REDIS_REST_TOKEN") ?? "",

  // ---------------------------------------------------------------- resend
  resendApiKey: readEnv("RESEND_API_KEY") ?? "",
  // `RESEND_FROM_EMAIL` is accepted for backwards compatibility with existing
  // .env files; without it the configured sender name was silently ignored.
  resendFrom:
    readEnv("RESEND_FROM") ??
    readEnv("RESEND_FROM_EMAIL") ??
    "Good Music <onboarding@resend.dev>",
  resendAudienceId: readEnv("RESEND_AUDIENCE_ID") ?? "",
  resendAdminNotifyEmail: readEnv("RESEND_ADMIN_NOTIFY_EMAIL") ?? "",

  // ---------------------------------------------------------------- tinybird
  tinybirdToken: readEnv("TINYBIRD_TOKEN") ?? "",
  // `TINYBIRD_URL` is accepted for backwards compatibility with existing .env files.
  tinybirdHost: readEnv("TINYBIRD_HOST") ?? readEnv("TINYBIRD_URL") ?? "https://api.tinybird.co",
  tinybirdPlaysDatasource: readEnv("TINYBIRD_PLAYS_DATASOURCE") ?? "music_plays",

  // ---------------------------------------------------------------- evolution (self-hosted WhatsApp)
  evolutionApiUrl: readEnv("EVOLUTION_API_URL") ?? "",
  evolutionApiKey: readEnv("EVOLUTION_API_KEY") ?? "",
  evolutionInstance: readEnv("EVOLUTION_INSTANCE") ?? "",
  evolutionAdminNumber: readEnv("EVOLUTION_ADMIN_NUMBER") ?? "",
  evolutionWebhookSecret: readEnv("EVOLUTION_WEBHOOK_SECRET") ?? "",

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
      configured: Boolean(serverEnv.upstashRestUrl && serverEnv.upstashRestToken),
      freeTier: "10,000 commands/day, 256 MB, no card required",
      requiredEnv: ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"],
    },
    {
      name: "resend-audiences",
      configured: Boolean(serverEnv.resendApiKey),
      freeTier: "3,000 emails/month, 100/day; audiences included",
      requiredEnv: ["RESEND_API_KEY", "RESEND_FROM"],
    },
    {
      name: "tinybird",
      configured: Boolean(serverEnv.tinybirdToken),
      freeTier: "Free developer workspace (1,000 API requests/day)",
      requiredEnv: ["TINYBIRD_TOKEN", "TINYBIRD_HOST"],
    },
    {
      name: "evolution-api",
      configured: Boolean(
        serverEnv.evolutionApiUrl && serverEnv.evolutionApiKey && serverEnv.evolutionInstance
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

  const secret = readEnv("AUTH_SECRET") ?? readEnv("NEXTAUTH_SECRET");
  if (!secret) {
    errors.push("AUTH_SECRET is not set.");
  } else if (secret.length < 32) {
    errors.push("AUTH_SECRET must be at least 32 characters long.");
  } else if (/music-secret-jwt|changeme|secret/i.test(secret) && isProduction) {
    warnings.push("AUTH_SECRET looks like a placeholder value. Rotate it.");
  }

  if (!readEnv("MONGODB_URI") && !readEnv("DATABASE_STRING")) {
    errors.push("MONGODB_URI is not set.");
  }
  if (!serverEnv.imagekitPrivateKey) {
    warnings.push("IMAGEKIT_PRIVATE_KEY is not set: uploads are disabled.");
  }
  if (!serverEnv.firebaseApiKey) {
    warnings.push("FIREBASE_WEB_API_KEY is not set: Google sign-in verification is disabled.");
  }
  if (!serverEnv.upstashRestUrl || !serverEnv.upstashRestToken) {
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

  return { errors, warnings };
}
