"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/features/auth";
import {
  Activity,
  RefreshCw,
  Server,
  Database,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Play,
  Terminal,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ExternalLink,
  Layers,
  Cpu,
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/shared/ui/card";
import { cn } from "@/lib/utils";

interface HealthData {
  status: "ok" | "degraded" | "down";
  uptimeSeconds: number;
  environment: string;
  checks: {
    database: "up" | "down" | "unconfigured";
    databaseLatencyMs?: number;
    authSecret: boolean;
    adminAccounts: number;
    googleSignIn: boolean;
    imagekit: boolean;
  };
  secrets: {
    atRestEncryption: boolean;
    keyId?: string;
    strict: boolean;
    selfTest: boolean;
    decrypted: number;
    plaintext: string[];
    failed: string[];
  };
  errors?: string[];
  warnings?: string[];
}

interface IntegrationProbe {
  name: string;
  configured: boolean;
  reachable: boolean | null;
  freeTier: string;
  note?: string;
  durationMs?: number;
}

interface CrudResult {
  status: "ok" | "failed" | "locked";
  type: string;
  durationMs?: number;
  probeCount?: number;
  probeId?: string;
  timings?: {
    createMs: number;
    readMs: number;
    updateMs: number;
    deleteMs: number;
    totalMs: number;
  };
  error?: string;
}

interface CheckItem {
  id: string;
  category: "Core API" | "Database" | "Integrations";
  title: string;
  description: string;
  status: "ok" | "slow" | "failed" | "unknown";
  latencyMs?: number;
  note?: string;
}

export default function ApiMonitorPage() {
  const { user, isAdmin, isLoading: authLoading } = useAuth();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [isCrudTesting, setIsCrudTesting] = useState<boolean>(false);

  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [integrations, setIntegrations] = useState<IntegrationProbe[]>([]);
  const [crudData, setCrudData] = useState<CrudResult | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Safe fetch with AbortSignal and strict 4000ms timeout
   */
  const fetchWithTimeout = async (url: string, signal: AbortSignal, timeoutMs = 4000) => {
    const timeoutSignal = AbortSignal.timeout(timeoutMs);
    // Combine component unmount abort with individual request timeout
    const combinedController = new AbortController();

    const onParentAbort = () => combinedController.abort();
    const onTimeoutAbort = () => combinedController.abort();

    signal.addEventListener("abort", onParentAbort);
    timeoutSignal.addEventListener("abort", onTimeoutAbort);

    try {
      const res = await fetch(url, {
        signal: combinedController.signal,
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      return res;
    } finally {
      signal.removeEventListener("abort", onParentAbort);
      timeoutSignal.removeEventListener("abort", onTimeoutAbort);
    }
  };

  /**
   * Run all monitor checks concurrently via Promise.allSettled
   */
  const runHealthChecks = useCallback(
    async (isManual = false) => {
      // Abort previous in-flight requests if user clicks refresh rapidly
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsLoading(true);
      setGlobalError(null);

      const t0 = Date.now();

      try {
        const [healthRes, intRes, crudRes] = await Promise.allSettled([
          fetchWithTimeout("/api/health", controller.signal, 4000).then(async (r) => {
            const data = await r.json().catch(() => null);
            return { ok: r.ok, status: r.status, data };
          }),
          fetchWithTimeout(
            `/api/integrations/health${isAdmin ? "?probe=1" : ""}`,
            controller.signal,
            4000
          ).then(async (r) => {
            const data = await r.json().catch(() => null);
            return { ok: r.ok, status: r.status, data };
          }),
          fetchWithTimeout("/api/health/crud", controller.signal, 4000).then(async (r) => {
            const data = await r.json().catch(() => null);
            return { ok: r.ok, status: r.status, data };
          }),
        ]);

        if (controller.signal.aborted) return;

        // Process /api/health
        if (healthRes.status === "fulfilled" && healthRes.value?.data) {
          setHealthData(healthRes.value.data);
        } else {
          setHealthData(null);
        }

        // Process /api/integrations/health
        if (intRes.status === "fulfilled" && intRes.value?.data?.integrations) {
          setIntegrations(intRes.value.data.integrations);
        } else {
          setIntegrations([]);
        }

        // Process /api/health/crud
        if (crudRes.status === "fulfilled" && crudRes.value?.data) {
          setCrudData(crudRes.value.data);
        }

        setLastRefreshed(new Date());

        // Auto-retry once on cold start failure
        const anyFailed =
          healthRes.status === "rejected" ||
          !healthRes.value?.ok ||
          intRes.status === "rejected";

        if (anyFailed && !isManual && retryCount === 0) {
          console.warn("[api-monitor] First attempt encountered error, retrying in 1.5s...");
          setRetryCount(1);
          setTimeout(() => {
            if (!controller.signal.aborted) {
              runHealthChecks(false);
            }
          }, 1500);
        }
      } catch (err: any) {
        if (!controller.signal.aborted) {
          setGlobalError(err.message || "Failed to query system status");
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    },
    [isAdmin, retryCount]
  );

  /**
   * Run full write CRUD test on demand
   */
  const runFullCrudTest = async () => {
    if (isCrudTesting) return;
    setIsCrudTesting(true);

    try {
      const res = await fetch("/api/health/crud", {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json().catch(() => null);
      if (data) {
        setCrudData(data);
      }
    } catch (err: any) {
      console.error("[api-monitor] Full CRUD test error:", err);
    } finally {
      setIsCrudTesting(false);
    }
  };

  // Wait until auth state is known before initial fetch
  useEffect(() => {
    if (authLoading) return;
    runHealthChecks(false);

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [authLoading, runHealthChecks]);

  // Aggregate checks list
  const checks: CheckItem[] = [
    {
      id: "db-ping",
      category: "Database",
      title: "MongoDB Atlas Connectivity",
      description: "Direct replica set ping test with round-trip latency.",
      status:
        healthData?.checks?.database === "up"
          ? (healthData.checks.databaseLatencyMs ?? 0) > 1000
            ? "slow"
            : "ok"
          : healthData?.checks?.database === "down"
          ? "failed"
          : "unknown",
      latencyMs: healthData?.checks?.databaseLatencyMs,
      note:
        healthData?.checks?.database === "up"
          ? "Connected & active"
          : healthData?.checks?.database === "unconfigured"
          ? "MONGODB_URI not set"
          : "Down or unreachable",
    },
    {
      id: "db-crud",
      category: "Database",
      title: "Database Read/Write Probes",
      description: "Dedicated isolated test collection verification.",
      status:
        crudData?.status === "ok"
          ? (crudData.timings?.totalMs ?? crudData.durationMs ?? 0) > 1500
            ? "slow"
            : "ok"
          : crudData?.status === "failed"
          ? "failed"
          : "unknown",
      latencyMs: crudData ? (crudData.timings?.totalMs ?? crudData.durationMs) : undefined,
      note:
        crudData?.type === "full-crud"
          ? `Full CRUD: C:${crudData.timings?.createMs}ms R:${crudData.timings?.readMs}ms U:${crudData.timings?.updateMs}ms D:${crudData.timings?.deleteMs}ms`
          : crudData?.status === "ok"
          ? `Read check OK (${crudData?.probeCount ?? 0} probes in queue)`
          : crudData?.error ?? "Click 'Run full test' to benchmark write speed",
    },
    {
      id: "auth-secrets",
      category: "Core API",
      title: "Session Authentication & Secrets",
      description: "AUTH_SECRET integrity & encryption at rest.",
      status: healthData?.checks?.authSecret ? "ok" : "failed",
      note: healthData?.checks?.authSecret
        ? `Strict mode: ${healthData.secrets?.strict ? "ON" : "OFF"} · Key ID: ${healthData.secrets?.keyId ?? "env"}`
        : "Missing or invalid AUTH_SECRET",
    },
    {
      id: "google-auth",
      category: "Core API",
      title: "Google OAuth & Firebase",
      description: "Web API key & project configuration parity.",
      status: healthData?.checks?.googleSignIn ? "ok" : "failed",
      note: healthData?.checks?.googleSignIn
        ? "Client & Edge build tokens aligned"
        : "Missing Firebase credentials",
    },
    {
      id: "imagekit-media",
      category: "Core API",
      title: "ImageKit CDN & Media Storage",
      description: "Audio streaming & cover image transformation endpoints.",
      status: healthData?.checks?.imagekit ? "ok" : "failed",
      note: healthData?.checks?.imagekit
        ? "Media endpoints active"
        : "IMAGEKIT_URL_ENDPOINT not set",
    },
    ...integrations.map((item): CheckItem => ({
      id: `int-${item.name}`,
      category: "Integrations",
      title: item.name.toUpperCase().replace("-", " "),
      description: `Free tier policy: ${item.freeTier}`,
      status:
        item.reachable === true
          ? (item.durationMs ?? 0) > 1000
            ? "slow"
            : "ok"
          : item.reachable === false
          ? "failed"
          : item.configured
          ? "ok"
          : "unknown",
      latencyMs: item.durationMs,
      note: item.note || (item.configured ? "Configured" : "Not configured"),
    })),
  ];

  const overallStatus =
    healthData?.status === "ok"
      ? "healthy"
      : healthData?.status === "degraded"
      ? "degraded"
      : globalError || healthData?.status === "down"
      ? "down"
      : "checking";

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header with status pill and refresh */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Activity className="size-6" />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">System Status</h1>
              <p className="text-xs text-muted-foreground">
                Cloudflare Worker Edge &middot; OpenNext Runtime &middot; Live Diagnostics
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => runHealthChecks(true)}
            disabled={isLoading}
            className="border-sidebar-border bg-sidebar hover:bg-sidebar-accent"
          >
            <RefreshCw className={cn("mr-2 size-4", isLoading && "animate-spin")} />
            {isLoading ? "Checking..." : "Refresh"}
          </Button>

          <Button
            size="sm"
            onClick={runFullCrudTest}
            disabled={isCrudTesting}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Play className={cn("mr-2 size-4", isCrudTesting && "animate-spin")} />
            {isCrudTesting ? "Benchmarking..." : "Run Full Test"}
          </Button>
        </div>
      </div>

      {/* Global Status Banner */}
      <div
        className={cn(
          "flex items-center justify-between rounded-xl border p-4 shadow-sm",
          overallStatus === "healthy"
            ? "border-emerald-500/30 bg-emerald-950/20 text-emerald-400"
            : overallStatus === "degraded"
            ? "border-amber-500/30 bg-amber-950/20 text-amber-400"
            : overallStatus === "down"
            ? "border-rose-500/30 bg-rose-950/20 text-rose-400"
            : "border-sidebar-border bg-sidebar text-muted-foreground"
        )}
      >
        <div className="flex items-center gap-3">
          {overallStatus === "healthy" ? (
            <CheckCircle2 className="size-6 shrink-0 text-emerald-400" />
          ) : overallStatus === "degraded" ? (
            <AlertTriangle className="size-6 shrink-0 text-amber-400" />
          ) : overallStatus === "down" ? (
            <XCircle className="size-6 shrink-0 text-rose-400" />
          ) : (
            <RefreshCw className="size-6 shrink-0 animate-spin text-muted-foreground" />
          )}

          <div>
            <h2 className="text-base font-semibold capitalize">
              {overallStatus === "healthy"
                ? "All Systems Operational"
                : overallStatus === "degraded"
                ? "System Experiencing Degraded Performance"
                : overallStatus === "down"
                ? "Outage Detected"
                : "Checking System Health..."}
            </h2>
            <p className="text-xs opacity-80">
              {lastRefreshed
                ? `Last checked ${lastRefreshed.toLocaleTimeString()} · Edge uptime: ${
                    healthData?.uptimeSeconds ?? 0
                  }s`
                : "Querying Cloudflare edge isolates and Atlas replica sets..."}
            </p>
          </div>
        </div>

        <Badge
          variant="outline"
          className={cn(
            "capitalize",
            overallStatus === "healthy" && "border-emerald-500/40 text-emerald-400",
            overallStatus === "degraded" && "border-amber-500/40 text-amber-400",
            overallStatus === "down" && "border-rose-500/40 text-rose-400"
          )}
        >
          {overallStatus}
        </Badge>
      </div>

      {/* Quick Specs Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <Card className="border-sidebar-border bg-sidebar/50 py-4">
          <CardContent className="px-4 py-0">
            <span className="text-[11px] font-medium text-muted-foreground uppercase">Runtime</span>
            <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-white">
              <Cpu className="size-4 text-primary" />
              Cloudflare Worker
            </p>
          </CardContent>
        </Card>

        <Card className="border-sidebar-border bg-sidebar/50 py-4">
          <CardContent className="px-4 py-0">
            <span className="text-[11px] font-medium text-muted-foreground uppercase">DB Ping</span>
            <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-white">
              <Database className="size-4 text-emerald-400" />
              {healthData?.checks?.databaseLatencyMs !== undefined
                ? `${healthData.checks.databaseLatencyMs} ms`
                : "—"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-sidebar-border bg-sidebar/50 py-4">
          <CardContent className="px-4 py-0">
            <span className="text-[11px] font-medium text-muted-foreground uppercase">Rate Limiting</span>
            <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-white">
              <Clock className="size-4 text-amber-400" />
              120 req / min
            </p>
          </CardContent>
        </Card>

        <Card className="border-sidebar-border bg-sidebar/50 py-4">
          <CardContent className="px-4 py-0">
            <span className="text-[11px] font-medium text-muted-foreground uppercase">Auth State</span>
            <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-white">
              <ShieldCheck className="size-4 text-primary" />
              {user ? (isAdmin ? "Admin (Full)" : "Member") : "Public (Guest)"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Granular Checks Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-white">Subsystem Health Probes</h3>
          <span className="text-xs text-muted-foreground">
            {checks.filter((c) => c.status === "ok").length} of {checks.length} passing
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {checks.map((check) => (
            <Card
              key={check.id}
              className="border-sidebar-border bg-sidebar/40 transition-colors hover:border-sidebar-border/80 hover:bg-sidebar/60 py-4"
            >
              <CardContent className="space-y-2 px-5 py-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-semibold tracking-wider uppercase text-muted-foreground/70">
                      {check.category}
                    </span>
                    <h4 className="text-sm font-semibold text-white">{check.title}</h4>
                    <p className="mt-0.5 text-xs text-muted-foreground">{check.description}</p>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] uppercase font-semibold",
                        check.status === "ok" && "border-emerald-500/40 text-emerald-400 bg-emerald-950/20",
                        check.status === "slow" && "border-amber-500/40 text-amber-400 bg-amber-950/20",
                        check.status === "failed" && "border-rose-500/40 text-rose-400 bg-rose-950/20",
                        check.status === "unknown" && "border-sidebar-border text-muted-foreground"
                      )}
                    >
                      {check.status === "ok" ? "OK" : check.status === "slow" ? "SLOW" : check.status === "failed" ? "FAIL" : "IDLE"}
                    </Badge>

                    {check.latencyMs !== undefined && check.latencyMs > 0 && (
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {check.latencyMs}ms
                      </span>
                    )}
                  </div>
                </div>

                {check.note && (
                  <div className="rounded bg-black/30 px-2 py-1 text-[11px] font-mono text-muted-foreground">
                    {check.note}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Wrangler Tail Guide for Operators */}
      <Card className="border-sidebar-border bg-sidebar/30 py-5">
        <CardHeader className="px-5 py-0">
          <div className="flex items-center gap-2">
            <Terminal className="size-4 text-primary" />
            <CardTitle className="text-sm font-semibold text-white">Live Edge Logs Streaming</CardTitle>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            Structured JSON logs are emitted without secrets for every probe. Stream them live from Cloudflare:
          </CardDescription>
        </CardHeader>
        <CardContent className="mt-3 px-5 py-0">
          <pre className="overflow-x-auto rounded-lg bg-black/60 p-3 font-mono text-xs text-emerald-400 select-all border border-sidebar-border/50">
            npx wrangler tail --format=pretty --search &quot;system-status&quot;
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
