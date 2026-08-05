import { CHECK_TIMEOUT_MS } from "./config.js";
import type { RecentCheck, ServiceConfig } from "./types.js";

function resolveTarget(service: ServiceConfig): string {
  if (!service.healthPath) return service.url;
  try {
    return new URL(service.healthPath, service.url).toString();
  } catch {
    return service.url;
  }
}

export async function checkService(service: ServiceConfig): Promise<RecentCheck> {
  const target = resolveTarget(service);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS);
  const start = Date.now();

  try {
    const res = await fetch(target, {
      method: "GET",
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": "Pulse-StatusPage/1.0" },
    });
    const responseTimeMs = Date.now() - start;
    const ok = service.expectedStatus
      ? res.status === service.expectedStatus
      : res.status >= 200 && res.status < 400;

    return { timestamp: Date.now(), ok, httpStatus: res.status, responseTimeMs, error: null };
  } catch (err) {
    const timedOut = err instanceof Error && err.name === "AbortError";
    return {
      timestamp: Date.now(),
      ok: false,
      httpStatus: null,
      responseTimeMs: null,
      error: timedOut ? "Timed out" : err instanceof Error ? err.message : "Request failed",
    };
  } finally {
    clearTimeout(timeout);
  }
}
