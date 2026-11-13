import { NextRequest } from "next/server";
import { requireApprovedUser } from "@/lib/auth";
import { route, jsonOk } from "@/lib/http";
import { enforceRateLimit, sanitizeText } from "@/lib/rate-limit";
import { getTypingBenchmark } from "@/lib/integrations/monkeytype";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/integrations/typing - Monkeytype "focus warm-up" leaderboard.
 *
 * Monkeytype's public API is keyless and free. The call is proxied so the
 * browser never contacts a third party, and it is cached for five minutes
 * (Upstash, or per-instance memory) to stay far below the provider limits.
 */
export const GET = route("integrations.typing", async (req: NextRequest) => {
  const session = await requireApprovedUser(req);
  await enforceRateLimit(req, {
    scope: "integrations:typing",
    identifier: session.user.id,
    limit: 20,
    windowSeconds: 60,
  });

  const { searchParams } = new URL(req.url);
  const benchmark = await getTypingBenchmark({
    language: sanitizeText(searchParams.get("language") ?? "english", 32),
    mode: sanitizeText(searchParams.get("mode") ?? "time", 16),
    mode2: sanitizeText(searchParams.get("mode2") ?? "60", 24),
  });

  if (!benchmark) {
    // Provider unavailable: degrade to an empty, well-formed payload so the UI
    // can hide the panel instead of surfacing an error.
    return jsonOk(
      { benchmark: null, available: false },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  return jsonOk(
    { benchmark, available: true },
    { headers: { "Cache-Control": "private, max-age=60" } }
  );
});
