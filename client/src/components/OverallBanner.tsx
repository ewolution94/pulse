import { AlertTriangle, CheckCircle2, CloudOff, HelpCircle, XCircle, type LucideIcon } from "lucide-react";
import { stateMeta } from "../lib/state";
import { formatAsOf } from "../lib/format";
import type { OverallState } from "../lib/types";

const OVERALL_COPY: Record<OverallState, { title: string; icon: LucideIcon }> = {
  operational: { title: "All Systems Operational", icon: CheckCircle2 },
  degraded: { title: "Degraded Performance", icon: AlertTriangle },
  down: { title: "Service Disruption", icon: XCircle },
  unknown: { title: "Gathering status…", icon: HelpCircle },
};

interface OverallBannerProps {
  overall: OverallState;
  /** Set when the status shown isn't live: the banner then says when it's from, in neutral colours. */
  asOf: number | null;
  now: number;
}

export function OverallBanner({ overall, asOf, now }: OverallBannerProps) {
  const stale = asOf !== null;
  const meta = stateMeta(stale ? "unknown" : overall);
  const copy = OVERALL_COPY[overall];
  const Icon = stale ? CloudOff : copy.icon;

  return (
    <div className={`flex items-center gap-3 rounded-2xl border ${meta.borderClass} ${meta.bgClass} px-5 py-4`}>
      <Icon className="h-5 w-5 shrink-0" style={{ color: meta.color }} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <span className="font-display text-base font-medium text-paper">
          {stale ? `Last known: ${copy.title}` : copy.title}
        </span>
        {stale && <span className="shrink-0 font-mono text-xs text-mist">as of {formatAsOf(asOf, now)}</span>}
      </div>
    </div>
  );
}
