import { PulseMark } from "./PulseMark";
import { useT } from "../lib/i18n";

export function EmptyState() {
  const t = useT();
  return (
    <div className="flex flex-col items-center justify-center gap-5 rounded-2xl border border-dashed border-line bg-ink/40 py-24 text-center">
      <PulseMark size={56} animated={false} />
      <div className="space-y-1.5">
        <p className="font-display text-base text-fog">{t.emptyTitle}</p>
        <p className="mx-auto max-w-md px-6 font-mono text-xs leading-relaxed text-mist">
          {t.emptyBody[0]} <span className="text-fog">data/services.json</span> {t.emptyBody[1]}
        </p>
      </div>
    </div>
  );
}
