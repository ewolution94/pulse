import { ArrowUpRight } from "lucide-react";
import { clsx } from "clsx";
import { UptimeBar } from "./UptimeBar";
import { stateMeta } from "../lib/state";
import { secondsSince, uptimePct } from "../lib/format";
import { useT } from "../lib/i18n";
import type { ServiceStatus } from "../lib/types";

interface ServiceRowProps {
  service: ServiceStatus;
  now: number;
  /** False while the page shows a last-known status: nothing pulses then. */
  live: boolean;
}

export function ServiceRow({ service, now, live }: ServiceRowProps) {
  const t = useT();
  const meta = stateMeta(service.state);
  const responseMs = service.current?.responseTimeMs ?? null;
  const uptime = uptimePct(service.days);
  // Why the latest check failed: a code like ECONNREFUSED, or the status it got.
  const failure =
    service.state === "down" && service.current
      ? service.current.error ?? (service.current.httpStatus !== null ? `HTTP ${service.current.httpStatus}` : null)
      : null;

  return (
    <div className="rounded-2xl border border-line bg-ink/60 p-5 backdrop-blur-sm transition-colors hover:border-mist/40">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span
              className={clsx(
                "absolute inline-flex h-full w-full rounded-full",
                live && service.state !== "unknown" && "animate-pulse-dot"
              )}
              style={{ backgroundColor: meta.color, color: meta.color }}
            />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full" style={{ backgroundColor: meta.color }} />
          </span>
          {service.link ? (
            <a
              href={service.link}
              target="_blank"
              rel="noreferrer"
              className="group flex min-w-0 items-center gap-1 font-display text-[15px] font-medium text-paper hover:text-brand"
            >
              <span className="truncate">{service.name}</span>
              <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-mist transition-transform group-hover:translate-x-px group-hover:-translate-y-px group-hover:text-brand" />
            </a>
          ) : (
            <span className="truncate font-display text-[15px] font-medium text-paper">{service.name}</span>
          )}
        </div>

        <div className="mono-tabular flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-[11px] text-mist">
          {responseMs !== null && <span className="whitespace-nowrap">{t.ms(responseMs)}</span>}
          {uptime !== null && <span className="whitespace-nowrap">{t.uptime(t.pct(uptime))}</span>}
          <span className={clsx("rounded-full border px-2 py-0.5", meta.borderClass, meta.bgClass, meta.textClass)}>
            {t.state[service.state]}
          </span>
        </div>
      </div>

      {service.description && <p className="mt-1.5 font-mono text-[11px] text-mist">{service.description}</p>}

      <div className="mt-4">
        <UptimeBar days={service.days} />
      </div>

      {service.current && (
        <p className="mono-tabular mt-2.5 text-right text-[10px] text-mist">
          {t.checked(secondsSince(service.current.timestamp, now))}
          {failure && <span className={meta.textClass}> · {failure}</span>}
        </p>
      )}
    </div>
  );
}
