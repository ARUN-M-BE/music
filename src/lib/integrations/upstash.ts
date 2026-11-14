import { serverEnv } from "../env";

/**
 * Minimal Upstash Redis REST client implemented with `fetch`.
 *
 * Free tier: 10,000 commands/day, 256 MB, no credit card required.
 * Using the REST API keeps the bundle free of extra dependencies and works in
 * both the Node.js and Edge runtimes.
 */

type RedisResult<T> = { result: T } | { error: string };

/**
 * The token is a sealed secret, so opening it can fail (no SECRETS_MASTER_KEY,
 * wrong key). Rate limiting is not critical infrastructure: an unreadable token
 * means "no Redis" and the caller falls back to its in-memory bucket, instead of
 * failing every request that happens to be rate limited.
 */
function readToken(): string | null {
  try {
    return serverEnv.upstashRestToken || null;
  } catch {
    return null;
  }
}

export function upstashConfigured(): boolean {
  return Boolean(serverEnv.upstashRestUrl && readToken());
}

async function request<T>(path: string, body: unknown): Promise<T | null> {
  const token = readToken();
  if (!token || !serverEnv.upstashRestUrl) return null;

  try {
    const response = await fetch(`${serverEnv.upstashRestUrl.replace(/\/$/, "")}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(2000),
    });

    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    // Never let a cache/provider outage break a request path.
    return null;
  }
}

/** Executes a single Redis command, e.g. `redisCommand(["INCR", "key"])`. */
export async function redisCommand<T = unknown>(
  command: Array<string | number>
): Promise<T | null> {
  const payload = await request<RedisResult<T>>("", command);
  if (!payload || "error" in payload) return null;
  return payload.result;
}

/** Executes several commands in one round trip. */
export async function redisPipeline(
  commands: Array<Array<string | number>>
): Promise<Array<unknown> | null> {
  const payload = await request<Array<RedisResult<unknown>>>("/pipeline", commands);
  if (!payload) return null;
  return payload.map((entry) => ("result" in entry ? entry.result : null));
}

export async function cacheGetJson<T>(key: string): Promise<T | null> {
  const raw = await redisCommand<string>(["GET", key]);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function cacheSetJson(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  await redisCommand(["SET", key, JSON.stringify(value), "EX", Math.max(1, Math.floor(ttlSeconds))]);
}
