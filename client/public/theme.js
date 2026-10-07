/* Runs before first paint, so a stored theme or a German reader's language
   never flashes the other one. A blocking classic script, because the CSP
   forbids inline script. Mirrors applyTheme()/resolveLang() in
   src/lib/prefs.ts: a missing pulse:lang is the "System" language, so the
   browser decides. */
(function () {
  var root = document.documentElement;
  var theme = null;
  var lang = null;
  try {
    theme = localStorage.getItem("pulse:theme");
    lang = localStorage.getItem("pulse:lang");
  } catch (e) {
    /* storage blocked: follow the system and the browser */
  }
  if (theme === "light" || theme === "dark") {
    root.dataset.theme = theme;
    var metas = document.querySelectorAll('meta[name="theme-color"]');
    for (var i = 0; i < metas.length; i++) metas[i].content = theme === "light" ? "#f4f6fa" : "#05070c";
  }
  if (lang !== "en" && lang !== "de") {
    var first = (navigator.languages && navigator.languages[0]) || navigator.language || "";
    lang = /^de\b/i.test(first) ? "de" : "en";
  }
  root.lang = lang;
})();
