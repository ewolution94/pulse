import type { ServiceState } from "./types";

export interface StateMeta {
  label: string;
  color: string;
  textClass: string;
  bgClass: string;
  borderClass: string;
}

export const STATE_META: Record<ServiceState, StateMeta> = {
  operational: {
    label: "Operational",
    color: "#35d488",
    textClass: "text-good",
    bgClass: "bg-good/10",
    borderClass: "border-good/25",
  },
  degraded: {
    label: "Degraded",
    color: "#ffb545",
    textClass: "text-warn",
    bgClass: "bg-warn/10",
    borderClass: "border-warn/25",
  },
  down: {
    label: "Down",
    color: "#ff5c72",
    textClass: "text-bad",
    bgClass: "bg-bad/10",
    borderClass: "border-bad/25",
  },
  unknown: {
    label: "Unknown",
    color: "#7d8aa3",
    textClass: "text-mist",
    bgClass: "bg-mist/10",
    borderClass: "border-mist/20",
  },
};

export function stateMeta(state: ServiceState): StateMeta {
  return STATE_META[state];
}
