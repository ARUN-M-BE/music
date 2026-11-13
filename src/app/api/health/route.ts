import { NextRequest, NextResponse } from "next/server";
import { validateServerEnv, getIntegrationHealth, serverEnv } from "@/lib/env";
import { getSecretsReport } from "@/lib/secrets";
import { getResendDiagnostics } from "@/lib/integrations/resend";
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
  // Read after validation, which scans every sealable variable.
  const secrets = getSecretsReport();

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

  // A sealed secret with the wrong master key throws by design. The probe must
  // stay reachable in exactly that situation, so each getter is guarded and a
  // failure surfaces as `false` plus the `secrets.failed` list instead of a 500.
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
        authSecret: present(() => serverEnv.authSecret),
        adminAccounts: serverEnv.adminEmails.length,
        // Server-side Google sign-in needs the web API key and project id. Both
        // are `NEXT_PUBLIC_*`, so they are baked in at build time and a missing
        // one here means the deployment was built without them.
        googleSignIn:
          present(() => serverEnv.firebaseApiKey) && Boolean(serverEnv.firebaseProjectId),
        imagekit: Boolean(serverEnv.imagekitUrlEndpoint),
      },
      // At-rest encryption status. Names only - never a value or a master key.
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
      headers: { "Cache-Control": "no-store" },
    }
  );
});
