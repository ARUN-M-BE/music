/**
 * Lightweight structured logging for health and monitor checks.
 * Logs JSON lines containing no secrets, readable via `npx wrangler tail`.
 */

export interface HealthLogEntry {
  endpoint: string;
  check: string;
  durationMs: number;
  status: "ok" | "slow" | "failed";
  error?: string;
  meta?: Record<string, unknown>;
}

export function logHealthCheck(entry: HealthLogEntry): void {
  const payload = {
    tag: "system-status",
    timestamp: new Date().toISOString(),
    endpoint: entry.endpoint,
    check: entry.check,
    status: entry.status,
    latency_ms: entry.durationMs,
    ...(entry.error ? { error: sanitizeError(entry.error) } : {}),
    ...(entry.meta ? { meta: entry.meta } : {}),
  };

  // Structured single-line JSON log for Cloudflare Workers / Wrangler Tail
  console.log(JSON.stringify(payload));
}

/** Strip any credentials, URIs, or tokens from error messages */
function sanitizeError(message: string): string {
  if (!message) return "Unknown error";
  return message
    .replace(/mongodb(\+srv)?:\/\/[^\s@]+@[^\s/]+/gi, "mongodb://[redacted-host]")
    .replace(/Bearer\s+[A-Za-z0-9._~+/-]+=*/gi, "Bearer [redacted]")
    .replace(/key=[A-Za-z0-9._~+/-]+/gi, "key=[redacted]")
    .slice(0, 300);
}
