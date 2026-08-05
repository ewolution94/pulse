import { ExternalLink } from "lucide-react";
import { clsx } from "clsx";
import { UptimeBar } from "./UptimeBar";
import { stateMeta } from "../lib/state";
import { formatRelativeTime } from "../lib/format";
import type { ServiceStatus } from "../lib/types";

interface ServiceRowProps {
  service: ServiceStatus;
  now: number;
}

export function ServiceRow({ service, now }: ServiceRowProps) {
  const meta = stateMeta(service.state);
  const responseMs = service.current?.responseTimeMs ?? null;

  return (
    <div className="rounded-2xl border border-line bg-ink/50 p-5 transition-colors hover:border-line-soft">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span
              className={clsx(
                "absolute inline-flex h-full w-full rounded-full",
                service.state !== "unknown" && "animate-pulse-dot"
              )}
              style={{ backgroundColor: meta.color }}
            />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full" style={{ backgroundColor: meta.color }} />
          </span>
          {service.link ? (
            <a
              href={service.link}
              target="_blank"
              rel="noreferrer"
              className="flex min-w-0 items-center gap-1.5 truncate font-display text-sm font-medium text-paper hover:text-brand"
            >
              <span className="truncate">{service.name}</span>
              <ExternalLink className="h-3 w-3 shrink-0 text-mist" />
            </a>
          ) : (
            <span className="truncate font-display text-sm font-medium text-paper">{service.name}</span>
          )}
        </div>

        <div className="flex items-center gap-4 font-mono text-[11px] text-mist">
          {responseMs !== null && <span>{responseMs}ms</span>}
          {service.uptimePct90d !== null && <span>{service.uptimePct90d}% uptime</span>}
          <span className={clsx("rounded-full border px-2 py-0.5", meta.borderClass, meta.bgClass, meta.textClass)}>
            {meta.label}
          </span>
        </div>
      </div>

      {service.description && <p className="mt-1.5 font-mono text-[11px] text-mist">{service.description}</p>}

      <div className="mt-4">
        <UptimeBar days={service.days} />
      </div>

      {service.current && (
        <p className="mt-2 text-right font-mono text-[10px] text-line">
          checked {formatRelativeTime(service.current.timestamp, now)}
          {service.current.error ? ` — ${service.current.error}` : ""}
        </p>
      )}
    </div>
  );
}
