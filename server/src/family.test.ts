// Dashboard's family defaults, the page's side included, since this is the suite CI runs: what
// Pulse hands Dashboard (client/public/ewo.config.json), checked with Folio's own rules, and the
// order a setting is decided in: this device's own choice, then Dashboard's default, then the
// built-in one (client/src/lib/defaults.ts, and client/public/theme.js before first paint).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { checkManifest, resolve } from "../../client/vendor/ewo/elements/config-core.js";
import { languageFor, themeFor } from "../../client/src/lib/defaults.js";

const manifest = JSON.parse(readFileSync(new URL("../../client/public/ewo.config.json", import.meta.url), "utf8"));

test("the manifest is one Dashboard takes: the family's language and theme", () => {
  const { ok, problems, manifest: checked } = checkManifest(manifest);
  assert.deepEqual(problems, []);
  assert.ok(ok);
  assert.equal(checked.app, "pulse");
  assert.deepEqual(Object.keys(checked.settings), ["lang", "theme"]);
});

test("with nothing set in Dashboard, both follow the device: the page as it ships", () => {
  const { values, sources } = resolve(manifest, {});
  assert.deepEqual(values, { lang: "system", theme: "system" });
  assert.deepEqual(sources, { lang: "built-in", theme: "built-in" });
  assert.equal(themeFor("system", values.theme), "system");
  assert.equal(languageFor("system", values.lang, "de"), "de");
  assert.equal(languageFor("system", values.lang, "en"), "en");
});

test("Dashboard's family default and Pulse's own value reach the page", () => {
  assert.deepEqual(resolve(manifest, { family: { theme: "dark", lang: "en" } }).values, { lang: "en", theme: "dark" });
  assert.deepEqual(resolve(manifest, { family: { theme: "dark" }, app: { theme: "light" } }).values, { lang: "system", theme: "light" });
});

test("the device's own choice beats Dashboard's default, which beats the built-in one", () => {
  assert.equal(themeFor("light", "dark"), "light");
  assert.equal(themeFor("system", "dark"), "dark");
  assert.equal(themeFor("system", "system"), "system");
  assert.equal(themeFor("system", "purple"), "system");
  assert.equal(languageFor("en", "de", "de"), "en");
  assert.equal(languageFor("system", "en", "de"), "en");
  assert.equal(languageFor("system", "system", "de"), "de");
  assert.equal(languageFor("system", undefined, "de"), "de");
});

/** client/public/theme.js against a stub page: the theme and language it applies before first paint. */
function boot({ saved = {}, config, browser = "en-GB" }: { saved?: Record<string, string>; config?: unknown; browser?: string }) {
  const root = { dataset: {} as Record<string, string>, lang: "", classList: { add() {}, remove() {} }, style: { setProperty() {} } };
  const metas = [
    { content: "#f4f6fa", media: "(prefers-color-scheme: light)" },
    { content: "#05070c", media: "(prefers-color-scheme: dark)" },
  ];
  const document = {
    documentElement: root,
    getElementById: (id: string) => (id === "ewo-config" && config !== undefined ? { textContent: JSON.stringify(config) } : null),
    querySelectorAll: () => metas,
    addEventListener() {},
  };
  vm.runInNewContext(readFileSync(new URL("../../client/public/theme.js", import.meta.url), "utf8"), {
    document,
    localStorage: { getItem: (key: string) => saved[key] ?? null },
    navigator: { languages: [browser], language: browser },
    matchMedia: () => ({ matches: false }),
    location: { search: "" },
    screen: {},
    addEventListener() {},
    setTimeout() {},
  });
  return { theme: root.dataset.theme, lang: root.lang, colors: metas.map((m) => m.content) };
}

test("before first paint: the saved theme and language, else Dashboard's, else the system's and the browser's", () => {
  const system = ["#f4f6fa", "#05070c"];
  assert.deepEqual(boot({}), { theme: undefined, lang: "en", colors: system });
  assert.deepEqual(boot({ browser: "de-DE" }), { theme: undefined, lang: "de", colors: system });
  assert.deepEqual(boot({ config: { lang: "system", theme: "system" }, browser: "de-DE" }), { theme: undefined, lang: "de", colors: system });
  assert.deepEqual(boot({ config: { lang: "de", theme: "dark" } }), { theme: "dark", lang: "de", colors: ["#05070c", "#05070c"] });
  assert.deepEqual(boot({ saved: { "pulse:theme": "light", "pulse:lang": "en" }, config: { lang: "de", theme: "dark" }, browser: "de-DE" }), {
    theme: "light",
    lang: "en",
    colors: ["#f4f6fa", "#f4f6fa"],
  });
  assert.deepEqual(boot({ config: "not an object" }), { theme: undefined, lang: "en", colors: system });
});
