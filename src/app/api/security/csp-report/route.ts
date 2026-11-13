import { NextRequest, NextResponse } from "next/server";
import { route } from "@/lib/http";
import { enforceRateLimit, sanitizeText } from "@/lib/rate-limit";
import { logSecurityEventAsync } from "@/lib/audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_REPORT_BYTES = 8 * 1024;

/**
 * POST /api/security/csp-report - CSP violation collector.
 *
 * Browsers POST here when the Content-Security-Policy blocks a resource. The
 * body is untrusted, so it is size-limited, sanitised and only a few fields are
 * retained. Violations are written to the audit trail (`csp.violation`) which
 * makes attempted script/style injection observable. Always answers 204 so a
 * report can never be used for content probing.
 */
export const POST = route("security.cspReport", async (req: NextRequest) => {
  await enforceRateLimit(req, { scope: "security:csp-report", limit: 30, windowSeconds: 60 });

  const raw = await req.text();
  if (raw.length > MAX_REPORT_BYTES) {
    return new NextResponse(null, { status: 204 });
  }

  let report: Record<string, unknown> = {};
  try {
    const parsed = JSON.parse(raw || "{}");
    const candidate = (parsed as Record<string, unknown>)?.["csp-report"] ?? parsed;
    if (candidate && typeof candidate === "object") report = candidate as Record<string, unknown>;
  } catch {
    return new NextResponse(null, { status: 204 });
  }

  logSecurityEventAsync({
    type: "csp.violation",
    severity: "warning",
    request: req,
    meta: {
      documentUri: sanitizeText(report["document-uri"], 300),
      violatedDirective: sanitizeText(report["violated-directive"], 120),
      effectiveDirective: sanitizeText(report["effective-directive"], 120),
      blockedUri: sanitizeText(report["blocked-uri"], 300),
      sourceFile: sanitizeText(report["source-file"], 300),
    },
  });

  return new NextResponse(null, { status: 204 });
});
