import { buildDayWindow, dayState, dayUptimePct } from "../lib/dayWindow";
import { stateMeta } from "../lib/state";
import { formatDayLabel } from "../lib/format";
import type { PublicDayAggregate } from "../lib/types";

interface UptimeBarProps {
  days: PublicDayAggregate[];
  windowSize?: number;
}

export function UptimeBar({ days, windowSize = 90 }: UptimeBarProps) {
  const window = buildDayWindow(days, windowSize);

  return (
    <div className="flex flex-col gap-1.5">
      {/* 90 ticks need 358px at a 2px minimum and a 2px gap, more than a phone
          card has. Ticks shrink freely instead, with a 1px gap below `sm`. */}
      <div className="flex items-end gap-px sm:gap-[2px]">
        {window.map((day, i) => {
          const state = dayState(day);
          const meta = stateMeta(state);
          const pct = dayUptimePct(day);
          const title = day
            ? `${formatDayLabel(day.date)} — ${pct}% uptime (${day.checks} check${day.checks === 1 ? "" : "s"})`
            : "No data";
          return (
            <div
              key={i}
              title={title}
              className="h-8 min-w-0 max-w-[7px] flex-1 rounded-[1.5px] transition-transform hover:scale-y-110"
              style={{ backgroundColor: meta.color, opacity: day ? (state === "unknown" ? 0.25 : 0.9) : 0.15 }}
            />
          );
        })}
      </div>
      <div className="flex items-center justify-between font-mono text-[10px] text-mist">
        <span>{windowSize} days ago</span>
        <span>Today</span>
      </div>
    </div>
  );
}
