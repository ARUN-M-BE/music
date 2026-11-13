import { cacheGetJson, cacheSetJson, upstashConfigured } from "./upstash";

/**
 * Monkeytype public API integration.
 *
 * The public leaderboard endpoints are free and keyless. They are proxied
 * server-side so the browser never talks to a third party directly, and the
 * responses are cached (Upstash when available, in-memory otherwise) to stay
 * far below the provider's rate limits.
 *
 * Feature: "focus warm-up" benchmark data surfaced through
 * `GET /api/integrations/typing` for the listening-focus panel.
 */

const LANGUAGE_PATTERN = /^[a-z0-9_]{2,32}$/;
const MODE_PATTERN = /^[a-z]{2,16}$/;
const MODE2_PATTERN = /^[a-z0-9_]{1,24}$/;

export interface TypingLeaderboardEntry {
  rank: number;
  name: string;
  wpm: number;
  accuracy: number;
  language: string;
}

export interface TypingBenchmark {
  language: string;
  mode: string;
  mode2: string;
  entries: TypingLeaderboardEntry[];
  fetchedAt: string;
  cached: boolean;
  provider: "monkeytype";
}

const memoryCache = new Map<string, { value: TypingBenchmark; expiresAt: number }>();

function sanitize(value: string, pattern: RegExp, fallback: string): string {
  const normalized = (value || "").trim().toLowerCase();
  return pattern.test(normalized) ? normalized : fallback;
}

export async function getTypingBenchmark(params: {
  language?: string;
  mode?: string;
  mode2?: string;
}): Promise<TypingBenchmark | null> {
  const language = sanitize(params.language ?? "english", LANGUAGE_PATTERN, "english");
  const mode = sanitize(params.mode ?? "time", MODE_PATTERN, "time");
  const mode2 = sanitize(params.mode2 ?? "60", MODE2_PATTERN, "60");
  const cacheKey = `monkeytype:${language}:${mode}:${mode2}`;

  const mem = memoryCache.get(cacheKey);
  if (mem && mem.expiresAt > Date.now()) {
    return { ...mem.value, cached: true };
  }

  if (upstashConfigured()) {
    const shared = await cacheGetJson<TypingBenchmark>(cacheKey);
    if (shared) {
      memoryCache.set(cacheKey, { value: shared, expiresAt: Date.now() + 60_000 });
      return { ...shared, cached: true };
    }
  }

  try {
    // Verified live shape: query parameters, not path segments.
    //   GET /leaderboards?language=english&mode=time&mode2=60
    //   -> { message, data: { count, entries: [{ rank, name, wpm, acc }] } }
    const url = new URL("https://api.monkeytype.com/leaderboards");
    url.searchParams.set("language", language);
    url.searchParams.set("mode", mode);
    url.searchParams.set("mode2", mode2);

    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) return null;

    const payload = (await response.json().catch(() => null)) as
      | {
          data?: {
            entries?: Array<{
              rank?: number;
              name?: string;
              wpm?: number;
              acc?: number;
              language?: string;
            }>;
          };
        }
      | null;

    const entries: TypingLeaderboardEntry[] = (payload?.data?.entries ?? [])
      .slice(0, 10)
      .map((row, index) => ({
        rank: row.rank ?? index + 1,
        name: (row.name ?? "anonymous").slice(0, 40),
        wpm: Number(row.wpm ?? 0),
        accuracy: Number(row.acc ?? 0),
        language: row.language ?? language,
      }));

    const benchmark: TypingBenchmark = {
      language,
      mode,
      mode2,
      entries,
      fetchedAt: new Date().toISOString(),
      cached: false,
      provider: "monkeytype",
    };

    memoryCache.set(cacheKey, { value: benchmark, expiresAt: Date.now() + 5 * 60 * 1000 });
    if (upstashConfigured()) {
      await cacheSetJson(cacheKey, benchmark, 300);
    }
    return benchmark;
  } catch {
    return null;
  }
}
