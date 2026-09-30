import type { PublicDayAggregate } from "./types";

export function secondsSince(timestamp: number, now: number): number {
  return Math.max(0, Math.round((now - timestamp) / 1000));
}

/** "12 Sep" / "12. Sept.": a day key is a UTC date, so it's formatted as one. */
export function formatDayLabel(dateStr: string, locale: string): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  return d.toLocaleDateString(locale, { month: "short", day: "numeric", timeZone: "UTC" });
}

export function formatClock(date: Date, locale: string): string {
  return date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
}

/** "14:02" today, "29 Sep, 14:02" on any other day. */
export function formatAsOf(timestamp: number, now: number, locale: string): string {
  const date = new Date(timestamp);
  const time = date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", hour12: false });
  if (date.toDateString() === new Date(now).toDateString()) return time;
  return `${date.toLocaleDateString(locale, { day: "numeric", month: "short" })}, ${time}`;
}

/**
 * Uptime over the given days, to two decimals and rounded down: 99.999% is
 * not 100%, and a status page shouldn't round a failure away.
 */
export function uptimePct(days: PublicDayAggregate[]): number | null {
  let checks = 0;
  let up = 0;
  for (const d of days) {
    checks += d.checks;
    up += d.upChecks;
  }
  if (checks === 0) return null;
  return Math.floor((up / checks) * 10000) / 100;
}

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}
