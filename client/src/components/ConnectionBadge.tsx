import { clsx } from "clsx";
import { useT } from "../lib/i18n";
import type { ConnectionState } from "../lib/types";

const TONE: Record<ConnectionState, string> = {
  connecting: "text-mist",
  live: "text-brand",
  reconnecting: "text-warn",
  offline: "text-bad",
};

export function ConnectionBadge({ state }: { state: ConnectionState }) {
  const t = useT();
  return (
    <div className="flex shrink-0 items-center gap-2 rounded-full border border-line bg-ink/60 px-3 py-1.5" role="status">
      <span className={clsx("h-1.5 w-1.5 animate-pulse-dot rounded-full bg-current", TONE[state])} />
      <span className={clsx("whitespace-nowrap font-mono text-xs", TONE[state])}>{t.connection[state]}</span>
    </div>
  );
}
