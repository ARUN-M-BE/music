import { serverEnv } from "../env";
import { withDb, AnalyticsEvent } from "../mongodb";

/**
 * Tinybird event ingestion.
 *
 * Free plan: one workspace, 1,000 API requests/day, 0.5 GB storage - enough for
 * product analytics on a hobby deployment. When `TINYBIRD_TOKEN` is absent the
 * events are stored in MongoDB (30-day TTL) instead, so no paid tier is needed.
 */

export function tinybirdConfigured(): boolean {
  return Boolean(serverEnv.tinybirdToken);
}

export interface TrackEventInput {
  name: string;
  actorId?: string;
  songId?: string;
  language?: string;
  provider?: string;
  meta?: Record<string, string | number | boolean>;
}

function buildEvent(input: TrackEventInput) {
  return {
    event: input.name,
    // `ts`, not `timestamp`: matches tinybird/datasources/music_plays.datasource.
    ts: new Date().toISOString(),
    actor_id: input.actorId ?? "",
    song_id: input.songId ?? "",
    language: input.language ?? "",
    provider: input.provider ?? "",
    meta: JSON.stringify(input.meta ?? {}),
  };
}

/** Sends one event to Tinybird; returns false when the provider is unavailable. */
export async function ingestToTinybird(input: TrackEventInput): Promise<boolean> {
  if (!tinybirdConfigured()) return false;

  try {
    const url = `${serverEnv.tinybirdHost.replace(/\/$/, "")}/v0/events?name=${encodeURIComponent(
      serverEnv.tinybirdPlaysDatasource
    )}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serverEnv.tinybirdToken}`,
        "Content-Type": "application/x-ndjson",
      },
      body: `${JSON.stringify(buildEvent(input))}\n`,
      signal: AbortSignal.timeout(4000),
    });

    return response.ok;
  } catch {
    return false;
  }
}

/** Persists an event locally as the free fallback. */
export async function storeEventLocally(input: TrackEventInput): Promise<void> {
  try {
    await withDb(() =>
      AnalyticsEvent.create({
        name: input.name,
        actorId: input.actorId ?? "",
        songId: input.songId ?? "",
        language: input.language ?? "",
        provider: input.provider ?? "",
        meta: input.meta ?? {},
      })
    );
  } catch (error) {
    console.warn("[analytics] local event store failed:", (error as Error)?.message);
  }
}

/**
 * Fire-and-forget tracking. Tinybird is preferred; the MongoDB fallback keeps
 * analytics available for free when the provider is not configured.
 */
export async function trackEvent(input: TrackEventInput): Promise<void> {
  if (tinybirdConfigured()) {
    const ok = await ingestToTinybird(input);
    if (ok) return;
  }
  await storeEventLocally(input);
}

/** Schedules tracking work without blocking the response. */
export function scheduleTrackEvent(input: TrackEventInput): void {
  void trackEvent(input).catch(() => undefined);
}
