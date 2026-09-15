Session handover — disposable, delete once absorbed. Written 2026-08 by Claude.

**PULSE** — self-hosted status page. Tagline "status, at a glance." Tech:
Express+TS backend (`server/`) + Vite/React/TS/Tailwind v4 frontend
(`client/`), SSE for live updates, zero database (JSON files under `data/`).
Sibling project: **HARBOR** (`../harbor`, its own repo) — deliberately
separate rather than extending Harbor, since Pulse only does read-only HTTP
health checks against services added by hand, never process control.

Run locally: `npm run install:all && npm run dev` — client `:5174`
(proxies `/api` to the server), server `:4400`. Production is a **single
process**: Express serves the built frontend + API from one port — that's
what `npm run build && npm start` and the Dockerfile both do.

## What's built

- **Services config**: `data/services.json`, edited by hand, re-read every
  poll cycle (no restart needed). `data/services.example.json` has the
  format reference. The real file is gitignored — don't remove that from
  `.gitignore`, it'll contain real internal URLs once populated.
- **Health checks**: `server/src/healthCheck.ts`, plain HTTP GET with a
  timeout, optional path + expected-status override per service.
- **State derivation** (`server/src/index.ts`): down = latest check failed;
  degraded = latest check passed but a recent one failed, or it was slower
  than `PULSE_DEGRADED_LATENCY_MS` (default 3s); operational = clean and
  fast; unknown = no checks yet. Overall page status = worst of all
  services. All thresholds are env vars, documented in the README.
- **History**: `server/src/historyStore.ts` stores per-day aggregates
  (`checks`/`upChecks`/response-time sum+count, not a pre-averaged value —
  keeps failed checks from skewing the average toward zero), capped at
  `PULSE_RETENTION_DAYS` (default 90). Frontend pads sparse days into a
  fixed-length window (`lib/dayWindow.ts`) so every service's uptime bar
  aligns to the same calendar dates regardless of when it was added.
- **UI**: GitHub-Status-style — overall banner, service rows with a status
  dot, response time, uptime %, and the 90-day tick bar. Grouped by the
  optional `group` field. Dark mode only, no theme toggle.

## Decisions already made — don't re-litigate

- No auto-discovery, anywhere. Config file only, on purpose.
- No live iframe embeds of the monitored apps — a status page needs to be
  useful from off-network (phone on cellular), which backend-side health
  checks give you and client-side iframes can't.
- No incident-management workflow (manual notes, subscriber notifications)
  — out of scope unless it turns out to actually matter later.
- Single Docker container, not split services — matches how this actually
  gets deployed (one NAS container + a bind-mounted `data/` volume).

## Where to start

README covers config format, env vars, and deployment in full. No
`todo.md`/`docs/LEARNINGS.md` yet — this file is the only handover.

## Process notes

- **Not pushed to GitHub yet.** Local repo initialized, one commit
  (`Initial commit`). Plan was: create `ewolution94/pulse` on GitHub, add
  remote, push `main`, then separately push a `release` branch to trigger
  the first CI build (see below) — none of that happened yet.
- **CI workflow exists** at `.github/workflows/docker-publish.yml`, copied
  from Planum's (`ewolution.io/room-play-space`) working pattern: push to
  **`release`** (not `main`) → multi-arch build (amd64+arm64, for NAS) →
  push to GHCR via the automatic `GITHUB_TOKEN`. Before the first release
  push, the repo needs **Settings → Actions → General → Workflow
  permissions → "Read and write permissions"** enabled, or the GHCR push
  step fails — this isn't the default on newly created repos.
- **`data/services.json` is currently empty (`[]`)** — real NAS apps still
  need to be added before this is actually useful. That's the next real
  task, not a code task.
- Tested end-to-end with disposable dummy services (a couple of local
  `python3 -m http.server` instances simulating up/down/degraded) — all
  three states, live SSE updates, and the actual production build (not just
  dev mode) were verified working. No automated test suite exists.
- No Pulse processes are currently running — confirmed stopped, including
  precise-PID cleanup after a build verification pass.
