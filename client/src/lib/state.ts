import type { ServiceState } from "./types";

// Colours only; the labels are in i18n.ts. `color` is a CSS variable, so
// inline styles follow the theme like the utility classes do.
export interface StateMeta {
  color: string;
  textClass: string;
  bgClass: string;
  borderClass: string;
}

export const STATE_META: Record<ServiceState, StateMeta> = {
  operational: {
    color: "var(--color-good)",
    textClass: "text-good",
    bgClass: "bg-good/10",
    borderClass: "border-good/25",
  },
  degraded: {
    color: "var(--color-warn)",
    textClass: "text-warn",
    bgClass: "bg-warn/10",
    borderClass: "border-warn/25",
  },
  down: {
    color: "var(--color-bad)",
    textClass: "text-bad",
    bgClass: "bg-bad/10",
    borderClass: "border-bad/25",
  },
  unknown: {
    color: "var(--color-unknown)",
    textClass: "text-mist",
    bgClass: "bg-mist/10",
    borderClass: "border-mist/20",
  },
};

export function stateMeta(state: ServiceState): StateMeta {
  return STATE_META[state];
}
