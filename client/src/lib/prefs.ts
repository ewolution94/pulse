// Reader preferences, kept in this browser only. public/theme.js applies the
// same two keys before first paint (the CSP forbids an inline script); keep
// the two in step. "system" is the settings rows' Default: Dashboard's value
// (#ewo-config, which the server puts first in <head>) when it has one, else
// the system's theme and the browser's language (lib/defaults.ts).

import { readConfig } from "../../vendor/ewo/elements/config-client.js";
import { languageFor, themeFor } from "./defaults";

export type ThemePref = "system" | "dark" | "light";
export type Lang = "en" | "de";
/** "system" stores nothing: Dashboard's language, else the browser's. */
export type LangPref = "system" | Lang;

const THEME_KEY = "pulse:theme";
const LANG_KEY = "pulse:lang";

/** The status-bar colour of an installed app, per theme. */
const THEME_COLOR = { dark: "#05070c", light: "#f4f6fa" } as const;

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // Storage blocked: the choice holds for this visit only.
  }
}

export function readTheme(): ThemePref {
  const stored = read(THEME_KEY);
  return stored === "dark" || stored === "light" ? stored : "system";
}

export function readLang(): LangPref {
  const stored = read(LANG_KEY);
  return stored === "en" || stored === "de" ? stored : "system";
}

/** The language a pick shows: "system" is Dashboard's, else the browser's first language, if it's German. */
export function resolveLang(pref: LangPref): Lang {
  const first = navigator.languages?.[0] ?? navigator.language ?? "";
  return languageFor(pref, readConfig().lang, /^de\b/i.test(first) ? "de" : "en");
}

/** What a pick looks like on screen right now: "system" is Dashboard's theme, else the OS's side. */
export function resolveTheme(pref: ThemePref): "dark" | "light" {
  const shown = themeFor(pref, readConfig().theme);
  if (shown !== "system") return shown;
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** "system" is Dashboard's theme, else it leaves the choice to `color-scheme: light dark` in index.css. */
export function applyTheme(pref: ThemePref) {
  const root = document.documentElement;
  const shown = themeFor(pref, readConfig().theme);
  if (shown === "system") delete root.dataset.theme;
  else root.dataset.theme = shown;
  write(THEME_KEY, pref === "system" ? null : pref);

  for (const meta of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) {
    if (shown === "system") meta.content = meta.media.includes("light") ? THEME_COLOR.light : THEME_COLOR.dark;
    else meta.content = THEME_COLOR[shown];
  }
}

export function applyLang(lang: Lang) {
  document.documentElement.lang = lang;
}

/** "system" removes the stored choice, so the next visit follows the browser again. */
export function storeLang(pref: LangPref) {
  write(LANG_KEY, pref === "system" ? null : pref);
}
