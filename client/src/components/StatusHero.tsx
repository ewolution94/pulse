import { CloudOff } from "lucide-react";
import { clsx } from "clsx";
import { stateMeta } from "../lib/state";
import { formatAsOf, median, secondsSince } from "../lib/format";
import { useT } from "../lib/i18n";
import type { StatusResponse } from "../lib/types";

// The brand mark's heartbeat, stretched: flat, a small beat, the spike, flat.
const TRACE = "M0 40 H132 L140 30 L148 50 L158 8 L168 70 L176 40 H240";

interface StatusHeroProps {
  status: StatusResponse | null;
  /** The status shown isn't live (saved copy, or the stream dropped). */
  stale: boolean;
  now: number;
}

/**
 * The headline: the worst state of any service, in words, with the three
 * facts that back it up. Its colour is the state's; a stale status is shown
 * in neutral grey with the time it's from, never as current.
 */
export function StatusHero({ status, stale, now }: StatusHeroProps) {
  const t = useT();
  const overall = status?.overall ?? "unknown";
  const tone = stale ? "unknown" : overall;
  const meta = stateMeta(tone);
  const live = !stale && status !== null && overall !== "unknown";

  const services = status?.services ?? [];
  const up = services.filter((s) => s.current?.ok).length;
  const med = median(services.flatMap((s) => (s.current?.responseTimeMs != null ? [s.current.responseTimeMs] : [])));
  const lastCheck = services.reduce((latest, s) => Math.max(latest, s.current?.timestamp ?? 0), 0);

  const facts =
    stale && status
      ? [t.asOf(formatAsOf(status.generatedAt, now, t.locale))]
      : services.length > 0
        ? [
            t.upOf(up, services.length),
            med !== null ? t.median(t.ms(med)) : null,
            lastCheck ? t.checked(secondsSince(lastCheck, now)) : null,
          ].filter(Boolean)
        : [];

  return (
    <section className="relative animate-rise overflow-hidden rounded-2xl border border-line bg-ink/55 px-6 py-6 backdrop-blur-sm sm:px-8 sm:py-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 transition-[background] duration-700"
        style={{
          background: `radial-gradient(ellipse 75% 150% at 0% 0%, color-mix(in srgb, ${meta.color} 13%, transparent), transparent 70%)`,
        }}
      />

      <svg
        aria-hidden="true"
        viewBox="0 0 240 80"
        preserveAspectRatio="xMaxYMin meet"
        className="hero-trace pointer-events-none absolute top-3 right-0 h-9 w-[44%] sm:top-5 sm:h-24 sm:w-[46%]"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={TRACE} stroke={meta.color} strokeWidth="1.6" opacity="0.28" />
        {live && <path className="hero-trace__run" d={TRACE} pathLength="1" stroke={meta.color} strokeWidth="2.6" />}
        <circle cx="158" cy="8" r="2.6" fill={meta.color} opacity={live ? 0.9 : 0.35} className={clsx(live && "hero-trace__beat")} />
      </svg>

      <div className="relative">
        {/* No label before the first status: "unknown" over "gathering status" says it twice. */}
        <p
          className={clsx(
            "flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.2em]",
            !status && "invisible"
          )}
          style={{ color: meta.color }}
        >
          {stale ? (
            <CloudOff className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
          )}
          {stale ? t.lastKnown : t.state[overall]}
        </p>
        <h1
          className={clsx(
            "mt-2.5 max-w-[16ch] font-display text-[clamp(28px,6.4vw,44px)] font-bold leading-[1.02] tracking-[-0.035em]",
            stale ? "text-fog" : "text-paper"
          )}
        >
          {t.overall[overall]}
        </h1>
        {facts.length > 0 && (
          <p className="mono-tabular mt-3.5 text-[12px] text-mist">
            {facts.map((fact, i) => (
              <span key={i}>
                {i > 0 && " · "}
                <span className="whitespace-nowrap">{fact}</span>
              </span>
            ))}
          </p>
        )}
      </div>
    </section>
  );
}
