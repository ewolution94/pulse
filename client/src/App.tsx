import { useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { clsx } from "clsx";
import { PulseMark } from "./components/PulseMark";
import { StatusHero } from "./components/StatusHero";
import { ServiceRow } from "./components/ServiceRow";
import { EmptyState } from "./components/EmptyState";
import { ConnectionBadge } from "./components/ConnectionBadge";
import { Backdrop } from "./components/Backdrop";
import { SkeletonRows } from "./components/SkeletonRows";
import { SettingsSheet } from "./components/SettingsSheet";
import { useStatus } from "./hooks/useStatus";
import { useClock } from "./hooks/useClock";
import { formatClock } from "./lib/format";
import { I18nContext, STRINGS } from "./lib/i18n";
import {
  applyLang,
  applyTheme,
  readLang,
  readTheme,
  resolveLang,
  resolveTheme,
  storeLang,
  type LangPref,
  type ThemePref,
} from "./lib/prefs";
import { themeShift } from "../vendor/ewo/elements/theme-shift.js";
import "../vendor/ewo/elements/settings-button.js";
// <ewo-settings-button>'s JSX typing, here as well as in src/ewo.d.ts.
import type {} from "../vendor/ewo/elements/react";
import type { ServiceStatus } from "./lib/types";

function groupServices(services: ServiceStatus[]): [string | null, ServiceStatus[]][] {
  const map = new Map<string | null, ServiceStatus[]>();
  for (const s of services) {
    const key = s.group ?? null;
    const arr = map.get(key) ?? [];
    arr.push(s);
    map.set(key, arr);
  }
  const entries = Array.from(map.entries());
  entries.sort(([a], [b]) => {
    if (a === null) return -1;
    if (b === null) return 1;
    return a.localeCompare(b);
  });
  return entries;
}

/** A hairline under the sticky header once the page has moved; it never hides. */
function useScrolled(threshold = 8) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > threshold);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [threshold]);
  return scrolled;
}

export default function App() {
  const { status, connection, receivedAt, stale: disconnected } = useStatus();
  const now = useClock();
  const scrolled = useScrolled();
  const [theme, setTheme] = useState<ThemePref>(readTheme);
  const [langPref, setLangPref] = useState<LangPref>(readLang);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const lang = resolveLang(langPref);
  const t = STRINGS[lang];

  // The splash screen (public/theme.js) lifts once the first status is on screen, or once the
  // stream has failed, so a first open without a signal isn't held up by it.
  const splashLifted = useRef(false);
  useEffect(() => {
    if (splashLifted.current) return;
    if (status || connection === "reconnecting" || connection === "offline") {
      splashLifted.current = true;
      requestAnimationFrame(() => window.dispatchEvent(new Event("splash:ready")));
    }
  }, [status, connection]);

  const shownTheme = useRef<ThemePref | null>(null);
  useEffect(() => {
    const was = shownTheme.current;
    shownTheme.current = theme;
    // A pick that changes the colours blurs the page for a moment (Folio's themeShift); the
    // first run and a pick that changes nothing on screen apply at once.
    if (was !== null && resolveTheme(was) !== resolveTheme(theme)) themeShift(() => applyTheme(theme));
    else applyTheme(theme);
  }, [theme]);
  useEffect(() => applyLang(lang), [lang]);

  // A language pick that changes the words on screen goes under the same short blur as a
  // theme change. flushSync makes React re-render inside themeShift's apply, and <html lang>
  // follows there too (Folio's elements take their words from it), so all of it is in place
  // before the veil clears. System on a browser in that language applies at once.
  const pickLanguage = (next: LangPref) => {
    storeLang(next);
    const shown = resolveLang(next);
    if (shown === lang) {
      setLangPref(next);
      return;
    }
    themeShift(() => {
      flushSync(() => setLangPref(next));
      applyLang(shown);
    });
  };

  // A stream can stay open while the server behind it stops polling. Three
  // missed cycles and the page stops presenting what it has as current.
  const overdue = status !== null && receivedAt !== null && now - receivedAt > 3 * status.pollIntervalMs;
  const stale = disconnected || overdue;

  const grouped = useMemo(() => groupServices(status?.services ?? []), [status]);

  // The tab says what's wrong, so a pinned tab is a status light of its own.
  const down = status?.services.filter((s) => s.state === "down").length ?? 0;
  const degraded = status?.services.filter((s) => s.state === "degraded").length ?? 0;
  useEffect(() => {
    const problem = stale ? null : down ? t.title.down(down) : degraded ? t.title.degraded(degraded) : null;
    document.title = problem ? `${problem} · Pulse` : "Pulse";
  }, [stale, down, degraded, t]);

  return (
    <I18nContext.Provider value={t}>
      <Backdrop tone={stale ? "unknown" : (status?.overall ?? "unknown")} />

      <header
        className={clsx(
          "sticky top-0 z-20 border-b pt-[env(safe-area-inset-top)] backdrop-blur-md transition-colors duration-300",
          scrolled ? "border-line bg-abyss/75" : "border-transparent bg-transparent"
        )}
      >
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-5 py-4 sm:gap-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <PulseMark size={36} />
            <div className="flex flex-col leading-none">
              <span className="font-display text-lg font-semibold tracking-tight text-paper">PULSE</span>
              {/* Wraps at the comma and nowhere else, like Clinch's; tighter on a phone,
                  where the German line, the badge and the settings button share 320px. */}
              <span className="mt-0.5 font-mono text-[10px] tracking-[0.14em] text-mist sm:tracking-[0.2em]">
                <span className="whitespace-nowrap">{t.tagline[0]}</span>{" "}
                <span className="whitespace-nowrap">{t.tagline[1]}</span>
              </span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <ConnectionBadge state={connection} />
            <ewo-settings-button onClick={() => setSettingsOpen(true)} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 pt-4 pb-[max(2.5rem,env(safe-area-inset-bottom))] sm:px-6">
        <StatusHero status={status} stale={stale} now={now} />

        <div className="mt-10">
          {!status ? (
            <SkeletonRows />
          ) : status.services.length === 0 ? (
            <EmptyState />
          ) : (
            <div className={clsx("space-y-10 transition-opacity", stale && "opacity-60 saturate-50")}>
              {grouped.map(([group, services]) => (
                <section key={group ?? "_ungrouped"} className="space-y-3">
                  {group && (
                    <h2 className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em] text-mist">
                      <span>{group}</span>
                      <span className="h-px flex-1 bg-line" aria-hidden="true" />
                      <span className="mono-tabular">{services.length}</span>
                    </h2>
                  )}
                  <div className="space-y-3">
                    {services.map((s, i) => (
                      <div key={s.id} className="animate-rise" style={{ animationDelay: `${Math.min(i, 8) * 45}ms` }}>
                        <ServiceRow service={s} now={now} live={!stale} />
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>

        <footer className="mt-14 flex flex-col items-center border-t border-line-soft pt-6">
          <p className="mono-tabular text-center text-[11px] text-mist">
            {status
              ? t.footer(Math.round(status.pollIntervalMs / 1000), formatClock(new Date(status.generatedAt), t.locale))
              : t.connecting}
          </p>
        </footer>
      </main>

      <SettingsSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        language={langPref}
        theme={theme}
        onLanguage={pickLanguage}
        onTheme={setTheme}
      />
    </I18nContext.Provider>
  );
}
