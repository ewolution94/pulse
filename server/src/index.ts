import express from "express";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import type { Response } from "express";
import { loadServices, POLL_INTERVAL_MS } from "./config.js";
import { createCensus } from "./census.js";
import { checkService } from "./healthCheck.js";
import { pruneRemovedServices, recordCheck, toAvgResponseMs } from "./historyStore.js";
import { deriveOverall, deriveState } from "./state.js";
import type { ServiceConfig, ServiceHistory, ServiceStatus, StatusResponse } from "./types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 4400;
const DEGRADED_LATENCY_MS = Number(process.env.PULSE_DEGRADED_LATENCY_MS) || 3000;
const CLIENT_DIST = path.resolve(__dirname, "..", "..", "client", "dist");

// Same-origin only: the page, its API and its event stream all come from this
// one process, so nothing here needs CORS, inline code or a third-party origin.
const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self'",
    // React applies the `style` props through the CSSOM, which CSP doesn't
    // govern, so no 'unsafe-inline' is needed here.
    "style-src 'self'",
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self'",
    "manifest-src 'self'",
    "worker-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'none'",
    "form-action 'none'",
  ].join("; "),
};

const app = express();
app.disable("x-powered-by");
app.use((_req, res, next) => {
  res.set(SECURITY_HEADERS);
  next();
});

// Visit counts: /_e.js and /_e go to Census (census.ts) before the static files
// and the catch-all, which would answer them with a 404 or the page.
const census = createCensus({ target: process.env.PULSE_CENSUS, site: "pulse" });
app.use((req, res, next) => {
  census(req, res).then((handled) => {
    if (!handled) next();
  }, next);
});

let cachedStatus: StatusResponse = {
  overall: "unknown",
  services: [],
  generatedAt: Date.now(),
  pollIntervalMs: POLL_INTERVAL_MS,
};
const sseClients = new Set<Response>();

function buildServiceStatus(service: ServiceConfig, history: ServiceHistory): ServiceStatus {
  const state = deriveState(history.recent, DEGRADED_LATENCY_MS);
  const current = history.recent.length > 0 ? history.recent[history.recent.length - 1] : null;
  const totalChecks = history.days.reduce((sum, d) => sum + d.checks, 0);
  const totalUp = history.days.reduce((sum, d) => sum + d.upChecks, 0);
  const uptimePct90d = totalChecks > 0 ? Math.round((totalUp / totalChecks) * 1000) / 10 : null;

  return {
    id: service.id,
    name: service.name,
    // Only an explicit `link` is ever published. `url` is what the server
    // checks, and it may well be an internal address (a LAN IP, a container
    // name) that has no business on a public page.
    link: service.link ?? null,
    description: service.description ?? null,
    group: service.group ?? null,
    state,
    current,
    uptimePct90d,
    days: history.days.map((d) => ({
      date: d.date,
      checks: d.checks,
      upChecks: d.upChecks,
      avgResponseMs: toAvgResponseMs(d),
    })),
  };
}

function broadcast() {
  const payload = JSON.stringify(cachedStatus);
  for (const client of sseClients) {
    client.write(`event: status\ndata: ${payload}\n\n`);
  }
}

async function pollOnce() {
  const services = loadServices();
  pruneRemovedServices(new Set(services.map((s) => s.id)));

  const results = await Promise.all(
    services.map(async (service) => {
      const check = await checkService(service);
      const history = recordCheck(service.id, check);
      return buildServiceStatus(service, history);
    })
  );

  cachedStatus = {
    overall: deriveOverall(results.map((s) => s.state)),
    services: results,
    generatedAt: Date.now(),
    pollIntervalMs: POLL_INTERVAL_MS,
  };
  broadcast();
}

app.get("/healthz", (_req, res) => {
  res.json({ ok: true, uptimeSeconds: process.uptime() });
});

app.get("/api/status", (_req, res) => {
  res.json(cachedStatus);
});

app.get("/api/stream", (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
  });
  res.write(`event: status\ndata: ${JSON.stringify(cachedStatus)}\n\n`);
  sseClients.add(res);

  const keepAlive = setInterval(() => res.write(": ping\n\n"), 15000);
  req.on("close", () => {
    clearInterval(keepAlive);
    sseClients.delete(res);
  });
});

// Serves the built frontend when present (the production Docker image); in
// local dev the Vite dev server handles the frontend instead, so this is a
// no-op unless client/dist actually exists.
if (fs.existsSync(CLIENT_DIST)) {
  app.use(
    express.static(CLIENT_DIST, {
      setHeaders(res, filePath) {
        // Vite fingerprints everything under /assets, so a URL there never
        // changes content. Everything else (the page, sw.js, the manifest)
        // must revalidate, or a deploy can't reach an installed copy.
        const fingerprinted = filePath.startsWith(path.join(CLIENT_DIST, "assets") + path.sep);
        res.setHeader("Cache-Control", fingerprinted ? "public, max-age=31536000, immutable" : "no-cache");
      },
    })
  );
  // The page for any route, but a real 404 for a missing file or API route.
  // Answering an old /assets/index-abc.js with the HTML page (status 200)
  // would let the service worker cache that page as the script, for good.
  app.get("*", (req, res) => {
    if (req.path.startsWith("/api/") || path.extname(req.path)) {
      res.status(404).end();
      return;
    }
    res.setHeader("Cache-Control", "no-cache");
    res.sendFile(path.join(CLIENT_DIST, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`[pulse] listening on http://localhost:${PORT}`);
  pollOnce();
  setInterval(pollOnce, POLL_INTERVAL_MS);
});
