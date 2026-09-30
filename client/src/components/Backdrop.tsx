import { stateMeta } from "../lib/state";
import type { ServiceState } from "../lib/types";

/**
 * The page's ground: a dot grid, and one soft glow that takes the overall
 * state's colour, so the page reads green, amber or red before a word of it
 * does. Fixed and static: it never reacts to scrolling.
 */
export function Backdrop({ tone }: { tone: ServiceState }) {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-abyss">
      <div className="dot-grid absolute inset-0" />
      <div
        className="absolute -top-64 left-1/2 h-[560px] w-[min(900px,140vw)] -translate-x-1/2 rounded-full blur-[140px] transition-[background-color,opacity] duration-1000"
        style={{
          backgroundColor: stateMeta(tone).color,
          opacity: `calc(var(--bloom) * ${tone === "unknown" ? 0.05 : 0.1})`,
        }}
      />
    </div>
  );
}
