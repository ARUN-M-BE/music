import { NextRequest } from "next/server";
import { withDb, SecurityEvent } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/auth";
import { route, jsonOk, badRequest } from "@/lib/http";
import { enforceRateLimit, sanitizeText } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SEVERITIES = new Set(["info", "warning", "critical"]);

/**
 * GET /api/security/logs - administrator-only audit trail.
 *
 * IP addresses are stored only as salted hashes, so the response never leaks
 * personal data. Events self-expire after 90 days via a TTL index.
 */
export const GET = route("security.logs", async (req: NextRequest) => {
  const session = await requireAdmin(req);
  await enforceRateLimit(req, {
    scope: "security:logs",
    identifier: session.user.id,
    limit: 30,
    windowSeconds: 60,
  });

  const { searchParams } = new URL(req.url);
  const limitRaw = Number.parseInt(searchParams.get("limit") ?? "50", 10);
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 200) : 50;

  const severity = sanitizeText(searchParams.get("severity") ?? "", 20).toLowerCase();
  if (severity && !SEVERITIES.has(severity)) throw badRequest("Invalid severity filter");

  const type = sanitizeText(searchParams.get("type") ?? "", 80).toLowerCase();

  const filter: Record<string, unknown> = {};
  if (severity) filter.severity = severity;
  if (type) filter.type = type;

  const events = await withDb(() =>
    SecurityEvent.find(filter).sort({ createdAt: -1 }).limit(limit).lean()
  );

  return jsonOk({ events, count: events.length }, { headers: { "Cache-Control": "no-store" } });
});
