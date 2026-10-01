import { useMemo } from "react";
import "../../vendor/ewo/elements/ticks.js";
import type { Tick, TickState } from "../../vendor/ewo/elements/ticks.js";
import { buildDayWindow, dayState } from "../lib/dayWindow";
import { formatDayLabel, uptimePct } from "../lib/format";
import { useT } from "../lib/i18n";
import type { PublicDayAggregate, ServiceState } from "../lib/types";

interface UptimeBarProps {
  days: PublicDayAggregate[];
  windowSize?: number;
}

const TICK: Record<ServiceState, TickState> = { operational: "ok", degraded: "warn", down: "bad", unknown: "unknown" };

/**
 * The 90-day ticks, and one line under them that names whichever day is
 * pointed at: hover with a mouse, touch or drag on a phone (where a native
 * tooltip never shows), arrow keys once focused. At rest the line is the
 * window's two ends. It's the shared <ewo-ticks> (Folio's elements, vendored
 * into vendor/ewo); a day with no record at all is its `none`.
 */
export function UptimeBar({ days, windowSize = 90 }: UptimeBarProps) {
  const t = useT();
  const total = uptimePct(days);
  const ticks = useMemo<Tick[]>(
    () =>
      buildDayWindow(days, windowSize).map(({ date, day }) => {
        const pct = day ? uptimePct([day]) : null;
        const detail =
          day && pct !== null
            ? [t.pct(pct), day.avgResponseMs !== null ? t.dayAvg(t.ms(day.avgResponseMs)) : null].filter(Boolean).join(" · ")
            : t.noData;
        return { label: formatDayLabel(date, t.locale), state: day ? TICK[dayState(day)] : "none", detail };
      }),
    [days, windowSize, t],
  );

  return (
    <ewo-ticks
      label={t.barLabel(total !== null ? t.pct(total) : t.noData)}
      start={t.daysAgo(windowSize)}
      end={t.today}
      ticks={ticks}
    />
  );
}
