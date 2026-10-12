import type { OverallState, RecentCheck, ServiceState } from "./types.js";

/** How many of the most recent checks a single failure keeps a service "degraded". */
export const RECENT_WINDOW = 5;

// Pure on purpose: this is the one part of a status page that must never be
// wrong, so it takes everything it depends on as arguments and is covered by
// state.test.ts rather than by eyeballing the page.
export function deriveState(recent: RecentCheck[], degradedLatencyMs: number): ServiceState {
  if (recent.length === 0) return "unknown";
  const current = recent[recent.length - 1];
  if (!current.ok) return "down";

  const hadRecentFailure = recent.slice(-RECENT_WINDOW).some((c) => !c.ok);
  const isSlow = current.responseTimeMs !== null && current.responseTimeMs > degradedLatencyMs;
  if (hadRecentFailure || isSlow) return "degraded";

  return "operational";
}

/**
 * Whether the poll loop still publishes: the status was generated within three intervals. The
 * client stops presenting a status as current after the same three (App.tsx's `overdue`); keep
 * the two in step. `/healthz` answers 503 when this is false.
 */
export function publishing(generatedAt: number, pollIntervalMs: number, now: number): boolean {
  return now - generatedAt <= 3 * pollIntervalMs;
}

/** The page's headline: the worst state of any service. */
export function deriveOverall(states: ServiceState[]): OverallState {
  if (states.length === 0) return "unknown";
  if (states.includes("down")) return "down";
  if (states.includes("degraded")) return "degraded";
  if (states.every((s) => s === "operational")) return "operational";
  return "unknown";
}
