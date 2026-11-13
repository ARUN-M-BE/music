import type { NextRequest } from "next/server";
import { hashIdentifier } from "./crypto";
import { getClientIp } from "./rate-limit";
import { lookupIp } from "./integrations/geo";
import { withDb, SecurityEvent } from "./mongodb";

export type SecuritySeverity = "info" | "warning" | "critical";

export interface SecurityEventInput {
  type: string;
  severity?: SecuritySeverity;
  actorEmail?: string;
  path?: string;
  request?: NextRequest | Request;
  meta?: Record<string, unknown>;
}

/**
 * Structured, privacy-preserving audit trail.
 * IP addresses are hashed with the server secret before they are stored.
 */
export async function logSecurityEvent(input: SecurityEventInput): Promise<void> {
  const severity = input.severity ?? "info";
  const ip = input.request ? getClientIp(input.request) : "";
  const ipHash = ip && ip !== "unknown" ? await hashIdentifier(ip) : "";

  const entry = {
    type: input.type,
    severity,
    actorEmail: (input.actorEmail ?? "").slice(0, 200),
    ipHash,
    path: (input.path ?? (input.request ? new URL(input.request.url).pathname : "")).slice(0, 300),
    userAgent: (input.request?.headers.get("user-agent") ?? "").slice(0, 300),
    meta: input.meta ?? {},
  };

  console.log(
    `[security] ${severity} ${entry.type} actor=${entry.actorEmail || "anonymous"} path=${entry.path}`
  );

  try {
    const geo = ip && ip !== "unknown" ? await lookupIp(ip) : null;
    await withDb(() =>
      SecurityEvent.create({
        ...entry,
        country: geo?.country ?? "",
      })
    );
  } catch (error) {
    // Auditing must never break the request it is auditing.
    console.warn("[security] failed to persist audit event:", (error as Error)?.message);
  }
}

/** Fire-and-forget variant for low criticality events. */
export function logSecurityEventAsync(input: SecurityEventInput): void {
  void logSecurityEvent(input).catch(() => undefined);
}
