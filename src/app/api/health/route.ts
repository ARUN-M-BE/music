import { NextRequest, NextResponse } from "next/server";
import { validateServerEnv, getIntegrationHealth, serverEnv } from "@/lib/env";
import { withDb } from "@/lib/mongodb";
import { route } from "@/lib/http";
import { enforceRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const startedAt = Date.now();

/**
 * GET /api/health - liveness/readiness probe.
 *
 * Returns only booleans and counts: never a connection string, key or stack
 * trace. This makes it safe to expose publicly (uptime monitors, load
 * balancers) while still being useful for operations.
 */
export const GET = route("health.get", async (req: NextRequest) => {
  await enforceRateLimit(req, { scope: "health:get", limit: 120, windowSeconds: 60 });

  const { errors, warnings } = validateServerEnv();

  let database: "up" | "down" | "unconfigured" = "down";
  try {
    await withDb(async () => {
      // A cheap round trip proves the connection and credentials work.
      const { connection } = await import("mongoose");
      await connection.db?.admin().ping();
    });
    database = "up";
  } catch (error) {
    const message = (error as Error)?.message ?? "";
    database = /not configured/i.test(message) ? "unconfigured" : "down";
  }

  const status = database === "up" && errors.length === 0 ? "ok" : "degraded";

  return NextResponse.json(
    {
      status,
      environment: process.env.NODE_ENV ?? "unknown",
      uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
      checks: {
        database,
        authSecret: Boolean(serverEnv.authSecret),
        adminAccounts: serverEnv.adminEmails.length,
      },
      integrations: getIntegrationHealth().map((item) => ({
        name: item.name,
        configured: item.configured,
      })),
      errors,
      warnings,
    },
    {
      status: database === "down" || errors.length > 0 ? 503 : 200,
      headers: { "Cache-Control": "no-store" },
    }
  );
});
