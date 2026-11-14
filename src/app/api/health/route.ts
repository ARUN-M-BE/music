import { NextRequest, NextResponse } from "next/server";
import { validateServerEnv, getIntegrationHealth, serverEnv } from "@/lib/env";
import { getSecretsReport } from "@/lib/secrets";
import { getResendDiagnostics } from "@/lib/integrations/resend";
import { withDb } from "@/lib/mongodb";
import { route } from "@/lib/http";
import { enforceRateLimit } from "@/lib/rate-limit";
import { logHealthCheck } from "@/lib/health-logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const startedAt = Date.now();

/**
 * GET /api/health - liveness/readiness probe.
 *
 * Returns only booleans, status indicators, and latencies: never a connection string,
 * key or stack trace. Safe to expose publicly while highly actionable for operations.
 */
export const GET = route("health.get", async (req: NextRequest) => {
  await enforceRateLimit(req, { scope: "health:get", limit: 120, windowSeconds: 60 });

  const { errors, warnings } = validateServerEnv();
  const secrets = getSecretsReport();

  let database: "up" | "down" | "unconfigured" = "down";
  let databaseLatencyMs = 0;
  const dbStart = Date.now();

  try {
    // 3-second bounded ping so slow or offline MongoDB never blocks this probe
    const pingPromise = withDb(async () => {
      const { connection } = await import("mongoose");
      await connection.db?.admin().ping();
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Database ping timeout after 3000ms")), 3000)
    );

    await Promise.race([pingPromise, timeoutPromise]);
    database = "up";
    databaseLatencyMs = Date.now() - dbStart;
    logHealthCheck({
      endpoint: "/api/health",
      check: "database-ping",
      durationMs: databaseLatencyMs,
      status: databaseLatencyMs > 1000 ? "slow" : "ok",
    });
  } catch (error) {
    databaseLatencyMs = Date.now() - dbStart;
    const message = (error as Error)?.message ?? "";
    database = /not configured/i.test(message) ? "unconfigured" : "down";
    logHealthCheck({
      endpoint: "/api/health",
      check: "database-ping",
      durationMs: databaseLatencyMs,
      status: "failed",
      error: message,
    });
  }

  const status = database === "up" && errors.length === 0 ? "ok" : "degraded";

  const present = (read: () => unknown): boolean => {
    try {
      return Boolean(read());
    } catch {
      return false;
    }
  };

  return NextResponse.json(
    {
      status,
      environment: process.env.NODE_ENV ?? "unknown",
      uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
      checks: {
        database,
        databaseLatencyMs,
        authSecret: present(() => serverEnv.authSecret),
        adminAccounts: serverEnv.adminEmails.length,
        googleSignIn:
          present(() => serverEnv.firebaseApiKey) && Boolean(serverEnv.firebaseProjectId),
        imagekit: Boolean(serverEnv.imagekitUrlEndpoint),
      },
      secrets: {
        atRestEncryption: secrets.masterKeyConfigured,
        keyId: secrets.keyId,
        strict: secrets.strict,
        selfTest: secrets.selfTest,
        decrypted: secrets.decryptedReads,
        plaintext: secrets.plaintextSecretNames,
        failed: secrets.failedSecretNames,
      },
      email: getResendDiagnostics(),
      integrations: getIntegrationHealth().map((item) => ({
        name: item.name,
        configured: item.configured,
      })),
      errors,
      warnings,
    },
    {
      status: database === "down" || errors.length > 0 ? 503 : 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    }
  );
});
