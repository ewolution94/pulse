import "../../vendor/ewo/elements/sheet.js";
import "../../vendor/ewo/elements/settings-basics.js";
// The ewo-* elements' JSX typing, here as well as in src/ewo.d.ts: Folio's
// catalog compiles this file with its own tsconfig, which never sees ewo.d.ts.
import type {} from "../../vendor/ewo/elements/react";
import { useT } from "../lib/i18n";
import type { LangPref, ThemePref } from "../lib/prefs";

interface SettingsSheetProps {
  open: boolean;
  onClose: () => void;
  language: LangPref;
  theme: ThemePref;
  onLanguage: (value: LangPref) => void;
  onTheme: (value: ThemePref) => void;
}

/**
 * Settings, reached the same way as in every ewolution app
 * (plans/settings-alignment.md): Folio's sheet, with Language and Theme first,
 * under General. The rows bring their own words, after <html lang>, so every
 * app says the same; they store and apply nothing: App does, through themeShift.
 */
export function SettingsSheet({ open, onClose, language, theme, onLanguage, onTheme }: SettingsSheetProps) {
  const t = useT();
  return (
    <ewo-sheet label={t.settings.title} open={open} onclose={onClose}>
      <span slot="heading">{t.settings.title}</span>
      <section className="flex flex-col gap-4" aria-labelledby="settings-general">
        <h3 id="settings-general" className="font-mono text-[11px] uppercase tracking-[0.2em] text-mist">
          {t.settings.general}
        </h3>
        <ewo-settings-basics
          language={language}
          theme={theme}
          onlanguage-change={(e) => onLanguage(e.detail.value)}
          ontheme-change={(e) => onTheme(e.detail.value)}
        />
      </section>
    </ewo-sheet>
  );
}
