import { AlertTriangle, CheckCircle2, HelpCircle, XCircle, type LucideIcon } from "lucide-react";
import { stateMeta } from "../lib/state";
import type { OverallState } from "../lib/types";

const OVERALL_COPY: Record<OverallState, { title: string; icon: LucideIcon }> = {
  operational: { title: "All Systems Operational", icon: CheckCircle2 },
  degraded: { title: "Degraded Performance", icon: AlertTriangle },
  down: { title: "Service Disruption", icon: XCircle },
  unknown: { title: "Gathering status…", icon: HelpCircle },
};

export function OverallBanner({ overall }: { overall: OverallState }) {
  const meta = stateMeta(overall);
  const copy = OVERALL_COPY[overall];
  const Icon = copy.icon;

  return (
    <div className={`flex items-center gap-3 rounded-2xl border ${meta.borderClass} ${meta.bgClass} px-5 py-4`}>
      <Icon className="h-5 w-5 shrink-0" style={{ color: meta.color }} />
      <span className="font-display text-base font-medium text-paper">{copy.title}</span>
    </div>
  );
}
