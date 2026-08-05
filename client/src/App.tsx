import { useMemo } from "react";
import { PulseMark } from "./components/PulseMark";
import { OverallBanner } from "./components/OverallBanner";
import { ServiceRow } from "./components/ServiceRow";
import { EmptyState } from "./components/EmptyState";
import { ConnectionBadge } from "./components/ConnectionBadge";
import { useStatus } from "./hooks/useStatus";
import { useClock } from "./hooks/useClock";
import { formatClock } from "./lib/format";
import type { ServiceStatus } from "./lib/types";

function groupServices(services: ServiceStatus[]): [string | null, ServiceStatus[]][] {
  const map = new Map<string | null, ServiceStatus[]>();
  for (const s of services) {
    const key = s.group ?? null;
    const arr = map.get(key) ?? [];
    arr.push(s);
    map.set(key, arr);
  }
  const entries = Array.from(map.entries());
  entries.sort(([a], [b]) => {
    if (a === null) return -1;
    if (b === null) return 1;
    return a.localeCompare(b);
  });
  return entries;
}

export default function App() {
  const { status, connection } = useStatus();
  const now = useClock();

  const grouped = useMemo(() => groupServices(status?.services ?? []), [status]);

  return (
    <div className="min-h-screen bg-abyss">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <header className="mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <PulseMark size={38} />
            <div className="flex flex-col leading-none">
              <span className="font-display text-lg font-semibold tracking-tight text-paper">PULSE</span>
              <span className="font-mono text-[10px] tracking-[0.2em] text-mist">STATUS, AT A GLANCE</span>
            </div>
          </div>
          <ConnectionBadge state={connection} />
        </header>

        <div className="mb-8">
          <OverallBanner overall={status?.overall ?? "unknown"} />
        </div>

        {!status || status.services.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-10">
            {grouped.map(([group, services]) => (
              <div key={group ?? "_ungrouped"} className="space-y-3">
                {group && <h2 className="font-mono text-xs uppercase tracking-wide text-mist">{group}</h2>}
                <div className="space-y-3">
                  {services.map((s) => (
                    <ServiceRow key={s.id} service={s} now={now} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <footer className="mt-12 border-t border-line-soft pt-6 text-center">
          <p className="font-mono text-[11px] text-mist">
            {status
              ? `Checks every ${Math.round(status.pollIntervalMs / 1000)}s · updated ${formatClock(new Date(status.generatedAt))}`
              : "Connecting…"}
          </p>
        </footer>
      </div>
    </div>
  );
}
