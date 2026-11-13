import { after } from "next/server";

/**
 * Runs work after the response has been sent (favicon-like best effort).
 * Falls back to a detached promise when `after` is unavailable.
 */
export function runAfter(task: () => Promise<unknown>): void {
  try {
    after(async () => {
      try {
        await task();
      } catch (error) {
        console.warn("[background] task failed:", (error as Error)?.message);
      }
    });
  } catch {
    void task().catch(() => undefined);
  }
}
