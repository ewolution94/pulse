import { clsx } from "clsx";
import type { ConnectionState } from "../lib/types";

const CONFIG: Record<ConnectionState, { label: string; className: string }> = {
  connecting: { label: "Connecting", className: "text-mist" },
  live: { label: "Live", className: "text-brand" },
  reconnecting: { label: "Reconnecting", className: "text-warn" },
  offline: { label: "Offline", className: "text-bad" },
};

export function ConnectionBadge({ state }: { state: ConnectionState }) {
  const cfg = CONFIG[state];
  return (
    <div className="flex items-center gap-2 rounded-full border border-line bg-ink/60 px-3 py-1.5">
      <span className={clsx("h-1.5 w-1.5 animate-pulse-dot rounded-full bg-current", cfg.className)} />
      <span className={clsx("font-mono text-xs", cfg.className)}>{cfg.label}</span>
    </div>
  );
}
