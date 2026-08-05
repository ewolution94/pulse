import express from "express";
import cors from "cors";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import type { Response } from "express";
import { loadServices, POLL_INTERVAL_MS } from "./config.js";
import { checkService } from "./healthCheck.js";
import { getHistory, pruneRemovedServices, recordCheck, toAvgResponseMs } from "./historyStore.js";
import type {
  OverallState,
  ServiceConfig,
  ServiceHistory,
  ServiceState,
  ServiceStatus,
  StatusResponse,
} from "./types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 4400;
const DEGRADED_LATENCY_MS = Number(process.env.PULSE_DEGRADED_LATENCY_MS) || 3000;
const CLIENT_DIST = path.resolve(__dirname, "..", "..", "client", "dist");

const app = express();
app.use(cors());

let cachedStatus: StatusResponse = {
  overall: "unknown",
  services: [],
  generatedAt: Date.now(),
  pollIntervalMs: POLL_INTERVAL_MS,
};
const sseClients = new Set<Response>();

function deriveState(history: ServiceHistory): ServiceState {
  if (history.recent.length === 0) return "unknown";
  const current = history.recent[history.recent.length - 1];
  if (!current.ok) return "down";

  const recentWindow = history.recent.slice(-5);
  const hadRecentFailure = recentWindow.some((c) => !c.ok);
  const isSlow = current.responseTimeMs !== null && current.responseTimeMs > DEGRADED_LATENCY_MS;
  if (hadRecentFailure || isSlow) return "degraded";

  return "operational";
}

function buildServiceStatus(service: ServiceConfig, history: ServiceHistory): ServiceStatus {
  const state = deriveState(history);
  const current = history.recent.length > 0 ? history.recent[history.recent.length - 1] : null;
  const totalChecks = history.days.reduce((sum, d) => sum + d.checks, 0);
  const totalUp = history.days.reduce((sum, d) => sum + d.upChecks, 0);
  const uptimePct90d = totalChecks > 0 ? Math.round((totalUp / totalChecks) * 1000) / 10 : null;

  return {
    id: service.id,
    name: service.name,
    link: service.link ?? service.url,
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

function deriveOverall(services: ServiceStatus[]): OverallState {
  if (services.length === 0) return "unknown";
  if (services.some((s) => s.state === "down")) return "down";
  if (services.some((s) => s.state === "degraded")) return "degraded";
  if (services.every((s) => s.state === "operational")) return "operational";
  return "unknown";
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
    overall: deriveOverall(results),
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
    "Cache-Control": "no-cache",
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
  app.use(express.static(CLIENT_DIST));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(CLIENT_DIST, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`[pulse] listening on http://localhost:${PORT}`);
  pollOnce();
  setInterval(pollOnce, POLL_INTERVAL_MS);
});
