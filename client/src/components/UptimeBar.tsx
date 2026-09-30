import { useState, type KeyboardEvent, type PointerEvent } from "react";
import { clsx } from "clsx";
import { buildDayWindow, dayState } from "../lib/dayWindow";
import { stateMeta } from "../lib/state";
import { formatDayLabel, uptimePct } from "../lib/format";
import { useT } from "../lib/i18n";
import type { PublicDayAggregate } from "../lib/types";

interface UptimeBarProps {
  days: PublicDayAggregate[];
  windowSize?: number;
}

/**
 * The 90-day ticks, and one line under them that names whichever day is
 * pointed at: hover with a mouse, touch or drag on a phone (where a native
 * tooltip never shows), arrow keys once focused. At rest the line is the
 * window's two ends.
 */
export function UptimeBar({ days, windowSize = 90 }: UptimeBarProps) {
  const t = useT();
  const slots = buildDayWindow(days, windowSize);
  const [active, setActive] = useState<number | null>(null);
  const total = uptimePct(days);

  const indexAt = (e: PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.min(Math.max(e.clientX - rect.left, 0), rect.width - 1);
    return Math.floor((x / rect.width) * slots.length);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const last = slots.length - 1;
    const from = active ?? last;
    const next =
      e.key === "ArrowLeft" ? Math.max(0, from - 1)
      : e.key === "ArrowRight" ? Math.min(last, from + 1)
      : e.key === "Home" ? 0
      : e.key === "End" ? last
      : undefined;
    if (e.key === "Escape") setActive(null);
    if (next === undefined) return;
    e.preventDefault();
    setActive(next);
  };

  const slot = active !== null ? slots[active] : null;
  const slotPct = slot?.day ? uptimePct([slot.day]) : null;
  const detail = slot
    ? slot.day && slotPct !== null
      ? [t.pct(slotPct), slot.day.avgResponseMs !== null ? t.dayAvg(t.ms(slot.day.avgResponseMs)) : null]
          .filter(Boolean)
          .join(" · ")
      : t.noData
    : null;

  return (
    <div className="flex flex-col gap-1.5">
      {/* 90 ticks need 358px at a 2px minimum and a 2px gap, more than a phone
          card has. Ticks shrink freely instead, with a 1px gap below `sm`. */}
      <div
        role="slider"
        tabIndex={0}
        aria-label={t.barLabel(total !== null ? t.pct(total) : t.noData)}
        aria-valuemin={1}
        aria-valuemax={slots.length}
        aria-valuenow={(active ?? slots.length - 1) + 1}
        aria-valuetext={slot ? `${formatDayLabel(slot.date, t.locale)}: ${detail}` : t.today}
        className="flex touch-pan-y items-end gap-px rounded-[3px] outline-offset-4 focus-visible:outline-2 focus-visible:outline-brand sm:gap-[2px]"
        onPointerDown={(e) => setActive(indexAt(e))}
        onPointerMove={(e) => {
          if (e.pointerType === "mouse" || e.buttons) setActive(indexAt(e));
        }}
        onPointerLeave={(e) => {
          if (e.pointerType === "mouse") setActive(null);
        }}
        onFocus={(e) => {
          if (e.currentTarget.matches(":focus-visible")) setActive(slots.length - 1);
        }}
        onBlur={() => setActive(null)}
        onKeyDown={onKeyDown}
      >
        {slots.map(({ date, day }, i) => {
          const state = dayState(day);
          const base = day ? (state === "unknown" ? 0.25 : 0.9) : 0.15;
          return (
            <div
              key={date}
              className={clsx(
                "h-8 min-w-0 max-w-[7px] flex-1 rounded-[1.5px] transition-[transform,opacity] duration-150",
                i === active && "scale-y-[1.14]"
              )}
              style={{
                backgroundColor: stateMeta(state).color,
                opacity: active === null || i === active ? (i === active ? 1 : base) : base * 0.55,
              }}
            />
          );
        })}
      </div>
      <div className="flex items-center justify-between gap-3 font-mono text-[10px] text-mist" aria-hidden="true">
        {slot ? (
          <>
            <span className="text-fog">{formatDayLabel(slot.date, t.locale)}</span>
            <span className="truncate">{detail}</span>
          </>
        ) : (
          <>
            <span>{t.daysAgo(windowSize)}</span>
            <span>{t.today}</span>
          </>
        )}
      </div>
    </div>
  );
}
