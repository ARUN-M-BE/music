import { NextRequest, NextResponse } from "next/server";
import { withDb } from "@/lib/mongodb";
import { route } from "@/lib/http";
import { enforceRateLimit } from "@/lib/rate-limit";
import { logHealthCheck } from "@/lib/health-logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const COLLECTION_NAME = "_health_probes";
let isCrudRunning = false;
let ttlIndexCreated = false;

/**
 * GET /api/health/crud - Fast read-only check for initial page load.
 * Does not write or mutate documents, avoiding write quotas and locks.
 */
export const GET = route("health.crud.get", async (req: NextRequest) => {
  await enforceRateLimit(req, { scope: "health:crud:get", limit: 120, windowSeconds: 60 });

  const start = Date.now();
  try {
    const res = await withDb(async () => {
      const { connection } = await import("mongoose");
      const db = connection.db;
      if (!db) throw new Error("Database reference unavailable");

      // Verify probe collection read access
      const count = await db.collection(COLLECTION_NAME).countDocuments({}, { maxTimeMS: 3000 });
      return { count };
    });

    const durationMs = Date.now() - start;
    logHealthCheck({
      endpoint: "/api/health/crud",
      check: "crud-read-only",
      durationMs,
      status: durationMs > 1000 ? "slow" : "ok",
      meta: { probeCount: res.count },
    });

    return NextResponse.json(
      {
        status: "ok",
        type: "read-only",
        durationMs,
        probeCount: res.count,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        },
      }
    );
  } catch (error: any) {
    const durationMs = Date.now() - start;
    logHealthCheck({
      endpoint: "/api/health/crud",
      check: "crud-read-only",
      durationMs,
      status: "failed",
      error: error.message,
    });

    return NextResponse.json(
      {
        status: "failed",
        type: "read-only",
        durationMs,
        error: error.message || "Failed read probe",
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        },
      }
    );
  }
});

/**
 * POST /api/health/crud - Full CRUD write test (triggered via "Run full test" button).
 * Uses a unique ID per run, a dedicated test collection, auto-cleanup in finally,
 * and an isolate-level lock so concurrent clicks never collide.
 */
export const POST = route("health.crud.post", async (req: NextRequest) => {
  await enforceRateLimit(req, { scope: "health:crud:post", limit: 30, windowSeconds: 60 });

  // Rate-limit & lock concurrent test execution
  if (isCrudRunning) {
    return NextResponse.json(
      {
        status: "locked",
        message: "Another CRUD health test is currently running. Please wait a moment.",
      },
      {
        status: 429,
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" },
      }
    );
  }

  isCrudRunning = true;
  const probeId = `probe_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const totalStart = Date.now();
  const timings = { createMs: 0, readMs: 0, updateMs: 0, deleteMs: 0, totalMs: 0 };

  try {
    await withDb(async () => {
      const { connection } = await import("mongoose");
      const db = connection.db;
      if (!db) throw new Error("Database reference unavailable");

      const col = db.collection(COLLECTION_NAME);

      // Ensure self-deleting TTL index once per worker isolate (auto-deletes after 5 minutes as failsafe)
      if (!ttlIndexCreated) {
        try {
          await col.createIndex({ createdAt: 1 }, { expireAfterSeconds: 300 });
          ttlIndexCreated = true;
        } catch {
          // Ignore index creation errors if already existing
        }
      }

      // 1. CREATE
      const cStart = Date.now();
      await col.insertOne({
        _id: probeId as any,
        probeId,
        test: true,
        createdAt: new Date(),
      });
      timings.createMs = Date.now() - cStart;

      // 2. READ
      const rStart = Date.now();
      const found = await col.findOne({ _id: probeId as any });
      timings.readMs = Date.now() - rStart;
      if (!found) throw new Error("CRUD read check failed: inserted probe not found");

      // 3. UPDATE
      const uStart = Date.now();
      const updateResult = await col.updateOne(
        { _id: probeId as any },
        { $set: { verified: true, verifiedAt: new Date() } }
      );
      timings.updateMs = Date.now() - uStart;
      if (updateResult.matchedCount === 0) throw new Error("CRUD update check failed: matchedCount was 0");

      // 4. DELETE
      const dStart = Date.now();
      const deleteResult = await col.deleteOne({ _id: probeId as any });
      timings.deleteMs = Date.now() - dStart;
      if (deleteResult.deletedCount === 0) throw new Error("CRUD delete check failed: deletedCount was 0");
    });

    timings.totalMs = Date.now() - totalStart;

    logHealthCheck({
      endpoint: "/api/health/crud",
      check: "crud-full-test",
      durationMs: timings.totalMs,
      status: timings.totalMs > 2000 ? "slow" : "ok",
      meta: { probeId, timings },
    });

    return NextResponse.json(
      {
        status: "ok",
        type: "full-crud",
        probeId,
        timings,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        },
      }
    );
  } catch (error: any) {
    timings.totalMs = Date.now() - totalStart;

    logHealthCheck({
      endpoint: "/api/health/crud",
      check: "crud-full-test",
      durationMs: timings.totalMs,
      status: "failed",
      error: error.message,
      meta: { probeId, timings },
    });

    return NextResponse.json(
      {
        status: "failed",
        type: "full-crud",
        probeId,
        timings,
        error: error.message || "CRUD probe failed",
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        },
      }
    );
  } finally {
    // Guaranteed cleanup of probe document and release of concurrency lock
    isCrudRunning = false;
    try {
      await withDb(async () => {
        const { connection } = await import("mongoose");
        await connection.db?.collection(COLLECTION_NAME).deleteOne({ _id: probeId as any });
      });
    } catch {
      // TTL index will catch it after 5 minutes
    }
  }
});
