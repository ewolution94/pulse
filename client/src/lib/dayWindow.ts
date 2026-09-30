import type { PublicDayAggregate, ServiceState } from "./types";

export interface DaySlot {
  /** YYYY-MM-DD, UTC, like the server's day keys. */
  date: string;
  day: PublicDayAggregate | null;
}

// Services don't have a day-entry until their first check, so a freshly
// added service and a long-running one would otherwise produce bars with
// different tick counts. Padding to a fixed window keeps every service's
// bar aligned to the same calendar dates.
export function buildDayWindow(days: PublicDayAggregate[], windowSize: number): DaySlot[] {
  const byDate = new Map(days.map((d) => [d.date, d]));
  const result: DaySlot[] = [];
  const today = new Date();
  for (let i = windowSize - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    const date = d.toISOString().slice(0, 10);
    result.push({ date, day: byDate.get(date) ?? null });
  }
  return result;
}

export function dayState(day: PublicDayAggregate | null): ServiceState {
  if (!day || day.checks === 0) return "unknown";
  if (day.upChecks === day.checks) return "operational";
  if (day.upChecks === 0) return "down";
  return "degraded";
}
