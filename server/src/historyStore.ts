import fs from "node:fs";
import { HISTORY_FILE, RETENTION_DAYS } from "./config.js";
import type { DayAggregate, RecentCheck, ServiceHistory } from "./types.js";

type HistoryMap = Record<string, ServiceHistory>;

const RECENT_LIMIT = 200;

function readAll(): HistoryMap {
  try {
    const raw = fs.readFileSync(HISTORY_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeAll(data: HistoryMap): void {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(data), "utf8");
}

function todayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function recordCheck(serviceId: string, check: RecentCheck): ServiceHistory {
  const all = readAll();
  const existing: ServiceHistory = all[serviceId] ?? { recent: [], days: [] };

  const recent = [...existing.recent, check].slice(-RECENT_LIMIT);

  const date = todayKey(new Date(check.timestamp));
  const days = [...existing.days];
  const todayIdx = days.findIndex((d) => d.date === date);

  const responseSample = check.responseTimeMs ?? 0;
  const responseSampleCount = check.responseTimeMs !== null ? 1 : 0;

  if (todayIdx === -1) {
    days.push({
      date,
      checks: 1,
      upChecks: check.ok ? 1 : 0,
      responseTimeSum: responseSample,
      responseTimeSamples: responseSampleCount,
    });
  } else {
    const day = days[todayIdx];
    days[todayIdx] = {
      date,
      checks: day.checks + 1,
      upChecks: day.upChecks + (check.ok ? 1 : 0),
      responseTimeSum: day.responseTimeSum + responseSample,
      responseTimeSamples: day.responseTimeSamples + responseSampleCount,
    };
  }

  days.sort((a, b) => a.date.localeCompare(b.date));
  const trimmedDays = days.slice(-RETENTION_DAYS);

  const updated: ServiceHistory = { recent, days: trimmedDays };
  all[serviceId] = updated;
  writeAll(all);
  return updated;
}

export function getHistory(serviceId: string): ServiceHistory {
  const all = readAll();
  return all[serviceId] ?? { recent: [], days: [] };
}

// Keeps history.json from growing forever with entries for services that
// have since been removed from services.json.
export function pruneRemovedServices(activeIds: Set<string>): void {
  const all = readAll();
  let changed = false;
  for (const id of Object.keys(all)) {
    if (!activeIds.has(id)) {
      delete all[id];
      changed = true;
    }
  }
  if (changed) writeAll(all);
}

export function toAvgResponseMs(day: DayAggregate): number | null {
  return day.responseTimeSamples > 0 ? Math.round(day.responseTimeSum / day.responseTimeSamples) : null;
}
