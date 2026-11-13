import { NextRequest } from "next/server";
import { getIntegrationHealth, serverEnv } from "@/lib/env";
import { requireAdmin } from "@/lib/auth";
import { route, jsonOk } from "@/lib/http";
import { enforceRateLimit } from "@/lib/rate-limit";
import { redisCommand } from "@/lib/integrations/upstash";
import { getEvolutionConnectionState } from "@/lib/integrations/evolution";
import { getTypingBenchmark } from "@/lib/integrations/monkeytype";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface Probe {
  name: string;
  configured: boolean;
  reachable: boolean | null;
  freeTier: string;
  requiredEnv: string[];
  note?: string;
}

/**
 * GET /api/integrations/health - administrator-only integration inventory.
 *
 * Reports configuration presence plus a lightweight reachability probe. No
 * credential value is ever returned, only booleans and the free-tier terms
 * that were chosen during the audit.
 *
 * Add `?probe=1` for a real provider round-trip. The default path skips
 * Resend/Tinybird/Monkeytype so rendering the page never burns quota; the deep
 * probe only performs read-only calls (no email is sent, no row is written).
 */
export const GET = route("integrations.health", async (req: NextRequest) => {
  const session = await requireAdmin(req);
  await enforceRateLimit(req, {
    scope: "integrations:health",
    identifier: session.user.id,
    limit: 20,
    windowSeconds: 60,
  });

  const deepProbe = new URL(req.url).searchParams.get("probe") === "1";

  const probes = await Promise.all(
    getIntegrationHealth().map(async (item): Promise<Probe> => {
      const base: Probe = {
        name: item.name,
        configured: item.configured,
        reachable: null,
        freeTier: item.freeTier,
        requiredEnv: item.requiredEnv,
      };

      if (!item.configured) {
        return { ...base, note: "Disabled: environment variables are not set." };
      }

      if (item.name === "upstash-redis") {
        const pong = await redisCommand<string>(["PING"]);
        return { ...base, reachable: pong === "PONG" };
      }

      if (item.name === "evolution-api") {
        const state = await getEvolutionConnectionState();
        return {
          ...base,
          reachable: state !== null,
          note: state ? `instance state: ${state}` : "instance unreachable (is the container running?)",
        };
      }

      if (item.name === "geolocation") {
        return { ...base, reachable: serverEnv.geoLookupEnabled };
      }

      if (!deepProbe) {
        return { ...base, note: "Probed on first use to conserve free-tier quota." };
      }

      if (item.name === "resend-audiences") {
        // GET /domains is read-only: no email is sent and no quota is used.
        try {
          const response = await fetch("https://api.resend.com/domains", {
            headers: { Authorization: `Bearer ${serverEnv.resendApiKey}` },
            cache: "no-store",
            signal: AbortSignal.timeout(8000),
          });
          if (response.ok) return { ...base, reachable: true, note: "API key accepted." };
          return {
            ...base,
            reachable: false,
            note:
              response.status === 401 || response.status === 403
                ? `API key rejected (HTTP ${response.status}): rotate RESEND_API_KEY.`
                : `Provider returned HTTP ${response.status}.`,
          };
        } catch {
          return { ...base, reachable: false, note: "Provider unreachable from this host." };
        }
      }

      if (item.name === "tinybird") {
        try {
          const response = await fetch(
            `${serverEnv.tinybirdHost.replace(/\/$/, "")}/v0/datasources`,
            {
              headers: { Authorization: `Bearer ${serverEnv.tinybirdToken}` },
              cache: "no-store",
              signal: AbortSignal.timeout(8000),
            }
          );
          if (!response.ok) {
            return { ...base, reachable: false, note: `Token rejected (HTTP ${response.status}).` };
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
              : `Token valid but ${serverEnv.tinybirdPlaysDatasource} is missing: deploy tinybird/ with \`tb push\`. Events fall back to MongoDB meanwhile.`,
          };
        } catch {
          return { ...base, reachable: false, note: "Provider unreachable from this host." };
        }
      }

      if (item.name === "monkeytype") {
        const benchmark = await getTypingBenchmark({});
        return {
          ...base,
          reachable: benchmark !== null,
          note: benchmark
            ? `leaderboard returned ${benchmark.entries.length} entries`
            : "public API unreachable",
        };
      }

      return { ...base, note: "No probe implemented; the client degrades gracefully." };
    })
  );

  return jsonOk(
    { integrations: probes },
    { headers: { "Cache-Control": "no-store" } }
  );
});
