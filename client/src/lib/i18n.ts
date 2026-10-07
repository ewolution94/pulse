import { createContext, useContext } from "react";
import type { Lang } from "./prefs";
import type { ConnectionState, ServiceState } from "./types";

// Every string the page shows, in English and German. Service names, groups
// and descriptions come from services.json and are shown as written.

function agoEn(sec: number): string {
  if (sec < 5) return "just now";
  if (sec < 60) return `${sec}s ago`;
  if (sec < 3600) return `${Math.round(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.round(sec / 3600)}h ago`;
  return `${Math.round(sec / 86400)}d ago`;
}

function agoDe(sec: number): string {
  if (sec < 5) return "gerade eben";
  if (sec < 60) return `vor ${sec} s`;
  if (sec < 3600) return `vor ${Math.round(sec / 60)} min`;
  if (sec < 86400) return `vor ${Math.round(sec / 3600)} h`;
  const days = Math.round(sec / 86400);
  return `vor ${days} ${days === 1 ? "Tag" : "Tagen"}`;
}

export interface Strings {
  locale: string;
  tagline: [string, string];
  overall: Record<ServiceState, string>;
  state: Record<ServiceState, string>;
  connection: Record<ConnectionState, string>;
  lastKnown: string;
  asOf: (time: string) => string;
  upOf: (up: number, total: number) => string;
  median: (ms: string) => string;
  checked: (sec: number) => string;
  ms: (ms: number) => string;
  pct: (pct: number) => string;
  uptime: (pct: string) => string;
  daysAgo: (n: number) => string;
  today: string;
  noData: string;
  dayAvg: (ms: string) => string;
  barLabel: (pct: string) => string;
  footer: (seconds: number, time: string) => string;
  connecting: string;
  emptyTitle: string;
  emptyBody: [string, string];
  settings: { title: string; general: string };
  title: { down: (n: number) => string; degraded: (n: number) => string };
}

function number(locale: string, value: number, digits: number) {
  return value.toLocaleString(locale, { maximumFractionDigits: digits, minimumFractionDigits: 0 });
}

const EN: Strings = {
  locale: "en-GB",
  tagline: ["STATUS,", "AT A GLANCE"],
  overall: {
    operational: "All systems operational",
    degraded: "Degraded performance",
    down: "Service disruption",
    unknown: "Gathering status…",
  },
  state: { operational: "Operational", degraded: "Degraded", down: "Down", unknown: "Unknown" },
  connection: { connecting: "Connecting", live: "Live", reconnecting: "Reconnecting", offline: "Offline" },
  lastKnown: "Last known",
  asOf: (time) => `as of ${time}`,
  upOf: (up, total) => `${up} of ${total} up`,
  median: (ms) => `${ms} median`,
  checked: (sec) => `checked ${agoEn(sec)}`,
  ms: (ms) => `${number("en-GB", ms, 0)} ms`,
  pct: (pct) => `${number("en-GB", pct, 2)}%`,
  uptime: (pct) => `${pct} uptime`,
  daysAgo: (n) => `${n} days ago`,
  today: "Today",
  noData: "No data",
  dayAvg: (ms) => `${ms} avg`,
  barLabel: (pct) => `Uptime over 90 days: ${pct}`,
  footer: (seconds, time) => `Checks every ${seconds} s · updated ${time}`,
  connecting: "Connecting…",
  emptyTitle: "No services configured yet",
  emptyBody: [
    "Add entries to",
    "— name, URL, and an optional health-check path. Pulse picks them up on the next check, no restart needed.",
  ],
  settings: { title: "Settings", general: "General" },
  title: { down: (n) => `${n} down`, degraded: (n) => `${n} degraded` },
};

const DE: Strings = {
  locale: "de-DE",
  tagline: ["STATUS,", "AUF EINEN BLICK"],
  overall: {
    operational: "Alle Systeme in Betrieb",
    degraded: "Eingeschränkte Leistung",
    down: "Störung",
    unknown: "Status wird ermittelt…",
  },
  state: { operational: "In Betrieb", degraded: "Eingeschränkt", down: "Ausgefallen", unknown: "Unbekannt" },
  connection: { connecting: "Verbinde", live: "Live", reconnecting: "Verbinde neu", offline: "Offline" },
  lastKnown: "Zuletzt bekannt",
  asOf: (time) => `Stand ${time}`,
  upOf: (up, total) => `${up} von ${total} erreichbar`,
  median: (ms) => `Median ${ms}`,
  checked: (sec) => (sec < 5 ? "gerade geprüft" : `geprüft ${agoDe(sec)}`),
  ms: (ms) => `${number("de-DE", ms, 0)} ms`,
  pct: (pct) => `${number("de-DE", pct, 2)} %`,
  uptime: (pct) => `${pct} verfügbar`,
  daysAgo: (n) => `vor ${n} Tagen`,
  today: "Heute",
  noData: "Keine Daten",
  dayAvg: (ms) => `Ø ${ms}`,
  barLabel: (pct) => `Verfügbarkeit über 90 Tage: ${pct}`,
  footer: (seconds, time) => `Prüfung alle ${seconds} s · aktualisiert ${time}`,
  connecting: "Verbinde…",
  emptyTitle: "Noch keine Dienste eingetragen",
  emptyBody: [
    "Einträge in",
    "ergänzen: Name, URL und optional ein Health-Check-Pfad. Pulse übernimmt sie bei der nächsten Prüfung, ohne Neustart.",
  ],
  settings: { title: "Einstellungen", general: "Allgemein" },
  title: { down: (n) => `${n} ausgefallen`, degraded: (n) => `${n} eingeschränkt` },
};

export const STRINGS: Record<Lang, Strings> = { en: EN, de: DE };

export const I18nContext = createContext<Strings>(EN);

export function useT(): Strings {
  return useContext(I18nContext);
}
