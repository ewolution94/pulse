<p align="center">
  <img src="brand/banner.svg" alt="Pulse — status, at a glance." width="100%" />
</p>

# Pulse

**Status, at a glance.**

A self-hosted status page for the apps you run — dark mode, GitHub-Status-style
uptime bars, no auto-discovery. You add the services yourself; Pulse checks
them on a schedule and shows what's up, what's slow, and what's down.

## Features

- **Manually curated services** — edit `data/services.json`, no scanning or
  discovery of any kind. Only what you list ever shows up.
- **Real health checks** — a periodic HTTP request per service (default every
  60s), with an optional specific path and expected status code if the root
  URL isn't a meaningful check.
- **Three states, not just up/down** — *operational*, *degraded* (recent
  failures or slow responses), *down*, derived automatically from check
  history — no manual thresholds to babysit.
- **90-day uptime bars** — GitHub-Status-style daily ticks per service, hover
  for the exact date and uptime percentage.
- **Live-streamed** — updates over Server-Sent Events; the page never needs a
  manual refresh.
- **One container** — the built frontend is served by the same Express
  process as the API, so deployment is a single Docker image + one bind-mounted
  data folder.

## Configuring services

Edit `data/services.json` — an array of:

```json
[
  {
    "id": "nextcloud",
    "name": "Nextcloud",
    "url": "https://nextcloud.example.com",
    "healthPath": "/status.php",
    "expectedStatus": 200,
    "link": "https://nextcloud.example.com",
    "description": "Optional subtitle shown under the name",
    "group": "Optional category heading"
  }
]
```

Only `id`, `name`, and `url` are required. `id` must be stable and unique —
it's the key uptime history is stored under, so renaming a service's `id`
starts its history over. See `data/services.example.json` for more examples.

Changes are picked up on the **next poll cycle** — no restart needed.

| Field            | Required | Notes                                                             |
| ---------------- | -------- | ------------------------------------------------------------------ |
| `id`             | yes      | Stable slug; history is keyed by this, not by name.                |
| `name`           | yes      | Display name.                                                      |
| `url`            | yes      | Base URL used for the check (and as the link, if `link` is unset). |
| `healthPath`     | no       | Path appended to `url` for the actual check request.                |
| `expectedStatus` | no       | Exact status code required to count as "up" (default: any 2xx–3xx).|
| `link`           | no       | Public link if different from `url`.                               |
| `description`    | no       | Small subtitle under the name.                                     |
| `group`          | no       | Services sharing a `group` are clustered under that heading.       |

## Local development

```bash
npm run install:all
npm run dev
```

Client: **http://localhost:5174**. API: `http://localhost:4400` (proxied
through `/api` in dev, same-origin in production — no CORS config needed
either way).

## Deploying (Docker)

```bash
docker compose up -d --build
```

This builds the single-container image and mounts `./data` into the
container so `services.json` and check history persist across restarts. Then
point your reverse proxy (whatever you're already using on the NAS — Caddy,
nginx, Traefik, Synology's own reverse proxy UI, etc.) at container port
`4400` for your `status.*` subdomain. Pulse doesn't care about the domain
itself; it has no hardcoded origin assumptions.

### Environment variables

| Variable                     | Default | Purpose                                      |
| ----------------------------- | ------- | --------------------------------------------- |
| `PORT`                        | `4400`  | Port the server listens on.                    |
| `PULSE_DATA_DIR`               | `./data`| Where `services.json`/`history.json` live.     |
| `PULSE_POLL_INTERVAL_MS`       | `60000` | How often each service is checked.             |
| `PULSE_CHECK_TIMEOUT_MS`       | `10000` | Per-check timeout before it counts as down.    |
| `PULSE_RETENTION_DAYS`         | `90`    | How many days of history to keep per service.  |
| `PULSE_DEGRADED_LATENCY_MS`    | `3000`  | Response time above which an "up" check still counts toward *degraded*. |

## How state is derived

- **down** — the most recent check failed.
- **degraded** — the most recent check succeeded, but either one of the last
  5 checks failed, or the response was slower than `PULSE_DEGRADED_LATENCY_MS`.
- **operational** — recent checks are clean and fast.
- **unknown** — no checks yet (freshly added service, or Pulse itself was
  offline).

Overall page status is the worst of any individual service's state.

## Tech stack

- **Server**: Node.js, Express, TypeScript, Server-Sent Events, zero
  database — JSON files under `data/`.
- **Client**: React 19, TypeScript, Vite, Tailwind CSS v4, Framer Motion,
  lucide-react.

## Project structure

```
pulse/
├── brand/                 standalone brand assets (logo, favicon, banner)
├── data/
│   ├── services.json      your real config (gitignored)
│   ├── services.example.json
│   └── history.json       check history (gitignored, auto-managed)
├── server/src/
│   ├── config.ts          env vars, services.json loading/validation
│   ├── healthCheck.ts     a single HTTP check with timeout
│   ├── historyStore.ts    daily-aggregate history persistence
│   ├── index.ts           poll loop, state derivation, API + SSE, static serving
│   └── types.ts
├── client/src/
│   ├── components/        OverallBanner, ServiceRow, UptimeBar, PulseMark…
│   ├── hooks/              useStatus (SSE), useClock
│   └── lib/                types, format, dayWindow, state colors
├── Dockerfile              multi-stage build → single runtime image
└── docker-compose.yml
```

## What this deliberately doesn't do

- No auto-discovery of any kind — you add every service by hand.
- No process control — Pulse can't start/stop/restart anything, only check
  if it responds. It has no business managing processes on a machine it
  doesn't own.
- No incident-management workflow (manual "investigating" notes, subscriber
  notifications) — just live status and history. Worth adding later if it
  turns out to matter.
