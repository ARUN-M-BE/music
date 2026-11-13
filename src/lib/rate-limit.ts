import type { NextRequest } from "next/server";
import { redisCommand, upstashConfigured } from "./integrations/upstash";
import { normalizeIp } from "./integrations/geo";
import { tooManyRequests } from "./http";

/**
 * Best-effort client IP extraction behind proxies/CDNs.
 *
 * Trust order matters: `cf-connecting-ip` and `x-real-ip` are written by the
 * edge/platform and cannot be forged by the caller. `x-forwarded-for` is
 * append-only, so the LAST entry is the hop added by the closest proxy while
 * anything a client injects stays on the left - taking the leftmost value (as
 * a naive `split(",")[0]` does) lets a caller rotate the header on every
 * request and defeat IP-based rate limiting.
 */
export function getClientIp(req: NextRequest | Request): string {
  const headers = req.headers;
  const trusted = headers.get("cf-connecting-ip") ?? headers.get("x-real-ip");
  if (trusted) {
    const ip = normalizeIp(trusted);
    if (ip) return ip;
  }

  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const lastHop = forwarded.split(",").map((part) => part.trim()).filter(Boolean).pop();
    const ip = normalizeIp(lastHop);
    if (ip) return ip;
  }

  return "unknown";
}

export interface RateLimitOptions {
  /** Logical bucket name, e.g. "auth:session". */
  scope: string;
  /** Caller identity (IP, user id, email). */
  identifier: string;
  limit: number;
  windowSeconds: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetSeconds: number;
  backend: "upstash" | "memory";
}

type MemoryBucket = { count: number; resetAt: number };
const memoryBuckets = new Map<string, MemoryBucket>();

function pruneMemoryBuckets(now: number) {
  if (memoryBuckets.size < 2000) return;
  for (const [key, bucket] of memoryBuckets) {
    if (bucket.resetAt <= now) memoryBuckets.delete(key);
  }
}

function memoryRateLimit(key: string, limit: number, windowSeconds: number): RateLimitResult {
  const now = Date.now();
  pruneMemoryBuckets(now);

  const existing = memoryBuckets.get(key);
  if (!existing || existing.resetAt <= now) {
    memoryBuckets.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return {
      allowed: true,
      remaining: limit - 1,
      resetSeconds: windowSeconds,
      backend: "memory",
    };
  }

  existing.count += 1;
  return {
    allowed: existing.count <= limit,
    remaining: Math.max(0, limit - existing.count),
    resetSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    backend: "memory",
  };
}

/**
 * Fixed-window rate limiter.
 * Uses Upstash Redis when configured (shared across serverless instances) and
 * degrades to a per-instance in-memory window otherwise, so the app never fails
 * open just because Redis is unavailable.
 */
export async function rateLimit(options: RateLimitOptions): Promise<RateLimitResult> {
  const { scope, identifier, limit, windowSeconds } = options;
  const key = `rl:${scope}:${identifier}`;

  if (upstashConfigured()) {
    const count = await redisCommand<number>(["INCR", key]);
    if (typeof count === "number") {
      if (count === 1) {
        await redisCommand(["EXPIRE", key, windowSeconds]);
      }
      const ttl = await redisCommand<number>(["TTL", key]);
      return {
        allowed: count <= limit,
        remaining: Math.max(0, limit - count),
        resetSeconds: typeof ttl === "number" && ttl > 0 ? ttl : windowSeconds,
        backend: "upstash",
      };
    }
  }

  return memoryRateLimit(key, limit, windowSeconds);
}

/** Applies a rate limit and throws a 429 HttpError when exceeded. */
export async function enforceRateLimit(
  req: NextRequest | Request,
  options: Omit<RateLimitOptions, "identifier"> & { identifier?: string }
): Promise<RateLimitResult> {
  const identifier = options.identifier ?? getClientIp(req);
  const result = await rateLimit({ ...options, identifier });
  if (!result.allowed) {
    throw tooManyRequests();
  }
  return result;
}

/** Escapes user input before it is used inside a regular expression. */
export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Strips control characters and bounds length of user supplied text. */
export function sanitizeText(value: unknown, maxLength = 500): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim()
    .slice(0, maxLength);
}

export { upstashConfigured };
