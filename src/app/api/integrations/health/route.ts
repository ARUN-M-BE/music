import { NextRequest } from "next/server";
import { getIntegrationHealth, serverEnv } from "@/lib/env";
import { getUserFromRequest } from "@/lib/auth";
import { route, jsonOk } from "@/lib/http";
import { enforceRateLimit } from "@/lib/rate-limit";
import { redisCommand } from "@/lib/integrations/upstash";
import { getEvolutionConnectionState } from "@/lib/integrations/evolution";
import { getTypingBenchmark } from "@/lib/integrations/monkeytype";
import { checkResendKey, getResendDiagnostics } from "@/lib/integrations/resend";
import { logHealthCheck } from "@/lib/health-logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface Probe {
  name: string;
  configured: boolean;
  reachable: boolean | null;
  freeTier: string;
  requiredEnv: string[];
  note?: string;
  durationMs?: number;
}

/**
 * GET /api/integrations/health - integration inventory & reachability.
 *
 * Safe for public summary: unauthenticated visitors receive configured booleans
 * and free-tier terms. Authenticated administrators can pass `?probe=1` for a
 * live, read-only reachability round-trip with bounded 3-second timeouts.
 */
export const GET = route("integrations.health", async (req: NextRequest) => {
  const session = await getUserFromRequest(req);
  const isAdmin = session?.user?.role === "admin" || session?.user?.role === "superadmin";

  await enforceRateLimit(req, {
    scope: "integrations:health",
    identifier: session?.user?.id || "guest",
    limit: 120,
    windowSeconds: 60,
  });

  const deepProbe = isAdmin && new URL(req.url).searchParams.get("probe") === "1";

  // Use Promise.allSettled so one slow or unreachable third-party integration
  // never blocks the other checks or crashes the worker isolate.
  const probePromises = getIntegrationHealth().map(async (item): Promise<Probe> => {
    const start = Date.now();
    const base: Probe = {
      name: item.name,
      configured: item.configured,
      reachable: null,
      freeTier: item.freeTier,
      requiredEnv: item.requiredEnv,
    };

    if (!item.configured) {
      return { ...base, note: "Disabled: environment variables are not set.", durationMs: 0 };
    }

    if (item.name === "upstash-redis") {
      try {
        const timeoutPong = Promise.race([
          redisCommand<string>(["PING"]),
          new Promise<null>((_, reject) =>
            setTimeout(() => reject(new Error("Timeout")), 3000)
          ),
        ]);
        const pong = await timeoutPong;
        const dur = Date.now() - start;
        const ok = pong === "PONG";
        logHealthCheck({
          endpoint: "/api/integrations/health",
          check: "upstash-redis",
          durationMs: dur,
          status: ok ? (dur > 1000 ? "slow" : "ok") : "failed",
        });
        return { ...base, reachable: ok, durationMs: dur };
      } catch (err: any) {
        const dur = Date.now() - start;
        logHealthCheck({
          endpoint: "/api/integrations/health",
          check: "upstash-redis",
          durationMs: dur,
          status: "failed",
          error: err.message,
        });
        return { ...base, reachable: false, note: "Upstash Redis ping timed out or failed", durationMs: dur };
      }
    }

    if (item.name === "evolution-api") {
      try {
        const timeoutState = Promise.race([
          getEvolutionConnectionState(),
          new Promise<null>((_, reject) =>
            setTimeout(() => reject(new Error("Timeout")), 3000)
          ),
        ]);
        const state = await timeoutState;
        const dur = Date.now() - start;
        return {
          ...base,
          reachable: state !== null,
          note: state ? `instance state: ${state}` : "instance unreachable",
          durationMs: dur,
        };
      } catch {
        const dur = Date.now() - start;
        return { ...base, reachable: false, note: "Evolution API probe timed out", durationMs: dur };
      }
    }

    if (item.name === "geolocation") {
      return { ...base, reachable: serverEnv.geoLookupEnabled, durationMs: Date.now() - start };
    }

    if (!deepProbe) {
      return {
        ...base,
        note: isAdmin
          ? "Probed on manual full test to conserve quota."
          : "Configured (admin login required for live reachability probe).",
        durationMs: 0,
      };
    }

    if (item.name === "resend-audiences") {
      try {
        const probe = await Promise.race([
          checkResendKey(true),
          new Promise<{ reachable: boolean; note?: string }>((_, reject) =>
            setTimeout(() => reject(new Error("Timeout")), 3000)
          ),
        ]);
        const dur = Date.now() - start;
        return { ...base, reachable: probe.reachable, note: probe.note, durationMs: dur };
      } catch (err: any) {
        return { ...base, reachable: false, note: "Resend probe timed out", durationMs: Date.now() - start };
      }
    }

    if (item.name === "tinybird") {
      try {
        const response = await fetch(
          `${serverEnv.tinybirdHost.replace(/\/$/, "")}/v0/datasources`,
          {
            headers: { Authorization: `Bearer ${serverEnv.tinybirdToken}` },
            cache: "no-store",
            signal: AbortSignal.timeout(3000),
          }
        );
        const dur = Date.now() - start;
        if (!response.ok) {
          return { ...base, reachable: false, note: `Token rejected (HTTP ${response.status}).`, durationMs: dur };
        }
        const payload = (await response.json().catch(() => null)) as {
          datasources?: Array<{ name?: string }>;
        } | null;
        const names = (payload?.datasources ?? []).map((d) => d.name ?? "");
        const ready = names.includes(serverEnv.tinybirdPlaysDatasource);
        return {
          ...base,
          reachable: true,
          note: ready
            ? `Datasource ${serverEnv.tinybirdPlaysDatasource} is deployed.`
            : `Token valid but ${serverEnv.tinybirdPlaysDatasource} is missing.`,
          durationMs: dur,
        };
      } catch {
        return { ...base, reachable: false, note: "Provider unreachable from this host.", durationMs: Date.now() - start };
      }
    }

    if (item.name === "monkeytype") {
      try {
        const benchmark = await Promise.race([
          getTypingBenchmark({}),
          new Promise<null>((_, reject) =>
            setTimeout(() => reject(new Error("Timeout")), 3000)
          ),
        ]);
        const dur = Date.now() - start;
        return {
          ...base,
          reachable: benchmark !== null,
          note: benchmark ? `returned ${benchmark.entries.length} entries` : "public API unreachable",
          durationMs: dur,
        };
      } catch {
        return { ...base, reachable: false, note: "Monkeytype benchmark probe timed out", durationMs: Date.now() - start };
      }
    }

    return { ...base, note: "No probe implemented; degrades gracefully.", durationMs: 0 };
  });

  const settled = await Promise.allSettled(probePromises);
  const probes: Probe[] = settled.map((res, i) => {
    if (res.status === "fulfilled") return res.value;
    const item = getIntegrationHealth()[i];
    return {
      name: item?.name || "unknown",
      configured: Boolean(item?.configured),
      reachable: false,
      freeTier: item?.freeTier || "",
      requiredEnv: item?.requiredEnv || [],
      note: "Probe execution failed",
      durationMs: 3000,
    };
  });

  return jsonOk(
    {
      integrations: probes,
      isAdmin,
      deepProbe,
      resend: getResendDiagnostics(),
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    }
  );
});
