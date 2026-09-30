import { clsx } from "clsx";

interface SegmentedProps<T extends string> {
  label: string;
  value: T;
  options: [T, string][];
  onChange: (value: T) => void;
}

/** A small radio group drawn as one pill, like the language switch on ewolution.cloud. */
export function Segmented<T extends string>({ label, value, options, onChange }: SegmentedProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className="flex rounded-full border border-line bg-ink/60 p-0.5">
      {options.map(([key, text]) => (
        <button
          key={key}
          type="button"
          role="radio"
          aria-checked={key === value}
          onClick={() => onChange(key)}
          className={clsx(
            "rounded-full px-2.5 py-1 font-mono text-[11px] transition-colors focus-visible:outline-2 focus-visible:outline-brand",
            key === value ? "bg-line text-paper" : "text-mist hover:text-fog"
          )}
        >
          {text}
        </button>
      ))}
    </div>
  );
}
