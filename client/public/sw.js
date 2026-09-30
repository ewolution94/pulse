/**
 * The offline shell.
 *
 * A status page gets opened when something seems wrong, and sometimes that
 * something is the connection itself. Installed to a home screen, Pulse should
 * then open to the last status it saw, clearly dated, rather than to a browser
 * error page.
 *
 * Two rules:
 *
 *  - **Navigations go to the network first.** The shell is only served from
 *    cache when the network actually fails, so a deploy always reaches an
 *    installed copy on its next open.
 *  - **Fingerprinted files go to the cache first.** Everything under /assets/
 *    carries a content hash; the fonts and icons are content-stable.
 *
 * What is deliberately never touched: anything under /api/. The event stream
 * is a connection that never finishes and must not be buffered, and a cached
 * status would look live when it isn't. The page keeps its own copy of the
 * last status it received (see useStatus) and labels it with its time; that
 * copy is only ever shown as "last known".
 *
 * To retire this worker, ship one whose `install` calls
 * `self.registration.unregister()`. Deleting the file only leaves the last
 * installed copy running.
 */

/** Bump to evict everything a previous version cached. */
const VERSION = "v1";
const SHELL = `pulse-shell-${VERSION}`;
const ASSETS = `pulse-assets-${VERSION}`;
const MINE = [SHELL, ASSETS];

/** The document every route is served from; also the offline fallback. */
const SHELL_URL = "/";

const ASSET_PATHS = ["/assets/", "/fonts/", "/icons/"];
const ASSET_FILES = ["/favicon.svg", "/manifest.webmanifest"];

/**
 * The shell, plus the files it names. This worker is a plain file the bundler
 * never sees, so it reads this build's fingerprinted filenames back out of the
 * HTML it just fetched. Without that, a first visit that goes offline would
 * reopen to an unstyled page.
 */
async function precacheShell() {
  const cache = await caches.open(SHELL);
  const response = await fetch(SHELL_URL, { cache: "reload" });
  if (!storable(response)) return;
  await cache.put(SHELL_URL, response.clone());

  const html = await response.text();
  const referenced = [...html.matchAll(/["'(](\/(?:assets|fonts|icons)\/[A-Za-z0-9._-]+)["')]/g)].map((m) => m[1]);
  const assets = await caches.open(ASSETS);
  await Promise.all(
    [...new Set([...referenced, ...ASSET_FILES])].map((href) =>
      assets.add(new Request(href, { cache: "reload" })).catch(() => undefined),
    ),
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(precacheShell().catch(() => undefined).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("pulse-") && !MINE.includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

/** Only a real, own-origin 200 is worth keeping. */
function storable(response) {
  return response && response.status === 200 && response.type === "basic";
}

function isAsset(url) {
  return ASSET_PATHS.some((prefix) => url.pathname.startsWith(prefix)) || ASSET_FILES.includes(url.pathname);
}

async function matchIn(cacheName, request) {
  const cache = await caches.open(cacheName);
  return cache.match(request);
}

/** Cache first: these never change under a given URL. */
async function fromCacheFirst(request) {
  const hit = await matchIn(ASSETS, request);
  if (hit) return hit;

  const response = await fetch(request);
  if (storable(response)) {
    const copy = response.clone();
    void caches.open(ASSETS).then((cache) => cache.put(request, copy));
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    // Every route is the same document, so one cached entry answers all of
    // them. Fetched by URL because a navigation request can't be re-created
    // with other options, and `no-store` keeps "network first" from quietly
    // meaning "HTTP cache first".
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(SHELL_URL, { cache: "no-store", credentials: "same-origin" });
          if (storable(response)) {
            const copy = response.clone();
            void caches.open(SHELL).then((cache) => cache.put(SHELL_URL, copy));
          }
          return response;
        } catch {
          return (await matchIn(SHELL, SHELL_URL)) ?? Response.error();
        }
      })(),
    );
    return;
  }

  if (isAsset(url)) {
    event.respondWith(fromCacheFirst(request));
  }
});
