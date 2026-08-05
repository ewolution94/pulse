import { PulseMark } from "./PulseMark";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-5 rounded-2xl border border-dashed border-line py-28 text-center">
      <PulseMark size={56} animated={false} />
      <div className="space-y-1.5">
        <p className="font-display text-base text-fog">No services configured yet</p>
        <p className="mx-auto max-w-md px-6 font-mono text-xs leading-relaxed text-mist">
          Add entries to <span className="text-fog">data/services.json</span> — name, URL, and an
          optional health-check path. Pulse picks them up on the next check, no restart needed.
        </p>
      </div>
    </div>
  );
}
