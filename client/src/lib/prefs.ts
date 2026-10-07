// Reader preferences, kept in this browser only. public/theme.js applies the
// same two keys before first paint (the CSP forbids an inline script); keep
// the two in step.

export type ThemePref = "system" | "dark" | "light";
export type Lang = "en" | "de";
/** "system" stores nothing and follows the browser's languages. */
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

/** The language a pick shows: "system" is the browser's first language, if it's German. */
export function resolveLang(pref: LangPref): Lang {
  if (pref !== "system") return pref;
  const first = navigator.languages?.[0] ?? navigator.language ?? "";
  return /^de\b/i.test(first) ? "de" : "en";
}

/** What a pick looks like on screen right now: "system" is the OS's side. */
export function resolveTheme(pref: ThemePref): "dark" | "light" {
  if (pref !== "system") return pref;
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** "system" leaves the choice to `color-scheme: light dark` in index.css. */
export function applyTheme(pref: ThemePref) {
  const root = document.documentElement;
  if (pref === "system") delete root.dataset.theme;
  else root.dataset.theme = pref;
  write(THEME_KEY, pref === "system" ? null : pref);

  for (const meta of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) {
    if (pref === "system") meta.content = meta.media.includes("light") ? THEME_COLOR.light : THEME_COLOR.dark;
    else meta.content = THEME_COLOR[pref];
  }
}

export function applyLang(lang: Lang) {
  document.documentElement.lang = lang;
}

/** "system" removes the stored choice, so the next visit follows the browser again. */
export function storeLang(pref: LangPref) {
  write(LANG_KEY, pref === "system" ? null : pref);
}
