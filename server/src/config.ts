import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { ServiceConfig } from "./types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..", "..");

export const DATA_DIR = process.env.PULSE_DATA_DIR || path.join(PROJECT_ROOT, "data");
export const SERVICES_FILE = path.join(DATA_DIR, "services.json");
export const HISTORY_FILE = path.join(DATA_DIR, "history.json");

export const POLL_INTERVAL_MS = Number(process.env.PULSE_POLL_INTERVAL_MS) || 60_000;
export const CHECK_TIMEOUT_MS = Number(process.env.PULSE_CHECK_TIMEOUT_MS) || 10_000;
export const RETENTION_DAYS = Number(process.env.PULSE_RETENTION_DAYS) || 90;

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(SERVICES_FILE)) fs.writeFileSync(SERVICES_FILE, "[]\n", "utf8");
}

// Re-read on every poll cycle rather than watching the file — config edits
// (adding/removing a service on the NAS) take effect on the next check with
// no restart needed, and this stays correct even if the file is edited via
// something that doesn't preserve inode identity (many editors do on save).
export function loadServices(): ServiceConfig[] {
  ensureDataDir();
  try {
    const raw = fs.readFileSync(SERVICES_FILE, "utf8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const seen = new Set<string>();
    const services: ServiceConfig[] = [];
    for (const entry of parsed) {
      if (!entry || typeof entry !== "object") continue;
      const { id, name, url } = entry as Record<string, unknown>;
      if (typeof id !== "string" || !id.trim()) continue;
      if (typeof name !== "string" || !name.trim()) continue;
      if (typeof url !== "string" || !url.trim()) continue;
      if (seen.has(id)) continue;
      seen.add(id);

      services.push({
        id,
        name,
        url,
        healthPath: typeof entry.healthPath === "string" ? entry.healthPath : undefined,
        expectedStatus: typeof entry.expectedStatus === "number" ? entry.expectedStatus : undefined,
        link: typeof entry.link === "string" ? entry.link : undefined,
        description: typeof entry.description === "string" ? entry.description : undefined,
        group: typeof entry.group === "string" ? entry.group : undefined,
      });
    }
    return services;
  } catch (err) {
    console.error("[pulse] failed to read services.json:", err);
    return [];
  }
}
