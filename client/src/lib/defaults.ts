// The order a family setting is decided in (Dashboard, plans/dashboard.md in the workspace): this
// device's own choice, then Dashboard's default (the family's, or one set for Pulse alone), then the
// built-in one, which is today's: the system's theme and the browser's language. Dashboard's
// `system` means no default, so it lands on the built-in one too. public/theme.js does the same
// before first paint; keep the two in step. No React and no DOM here, so the tests load it as it is.

import type { Lang, LangPref, ThemePref } from "./prefs";

/** The theme to show: light or dark, or `system` to follow the device's own setting. */
export const themeFor = (own: ThemePref, dashboard: unknown): ThemePref =>
  own !== "system" ? own : dashboard === "light" || dashboard === "dark" ? dashboard : "system";

/** The language to show: this device's choice, else Dashboard's, else the browser's (`detected`). */
export const languageFor = (own: LangPref, dashboard: unknown, detected: Lang): Lang =>
  own !== "system" ? own : dashboard === "de" || dashboard === "en" ? dashboard : detected;
