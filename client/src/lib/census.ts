/**
 * Census, the self-hosted visit counter: no cookies, nothing stored on the device. The beacon
 * comes from our own origin (server/src/census.ts forwards /_e.js and /_e), so the CSP stays
 * 'self'. Production only, like the service worker.
 */
let loaded = false;

export function loadCensus(): void {
  if (loaded || !import.meta.env.PROD) return;
  loaded = true;
  const script = document.createElement("script");
  script.src = "/_e.js";
  document.head.append(script);
}
