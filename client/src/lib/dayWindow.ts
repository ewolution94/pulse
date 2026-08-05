import type { PublicDayAggregate, ServiceState } from "./types";

// Services don't have a day-entry until their first check, so a freshly
// added service and a long-running one would otherwise produce bars with
// different tick counts. Padding to a fixed window keeps every service's
// bar aligned to the same calendar dates.
export function buildDayWindow(days: PublicDayAggregate[], windowSize: number): (PublicDayAggregate | null)[] {
  const byDate = new Map(days.map((d) => [d.date, d]));
  const result: (PublicDayAggregate | null)[] = [];
  const today = new Date();
  for (let i = windowSize - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    result.push(byDate.get(key) ?? null);
  }
  return result;
}

export function dayState(day: PublicDayAggregate | null): ServiceState {
  if (!day || day.checks === 0) return "unknown";
  if (day.upChecks === day.checks) return "operational";
  if (day.upChecks === 0) return "down";
  return "degraded";
}

export function dayUptimePct(day: PublicDayAggregate | null): number | null {
  if (!day || day.checks === 0) return null;
  return Math.round((day.upChecks / day.checks) * 1000) / 10;
}
