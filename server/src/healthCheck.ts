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

// The error ends up on the public page, so it's reduced to a code. Node's own
// messages can carry the target ("Failed to parse URL from http://10.0.0.5…",
// "getaddrinfo ENOTFOUND nas.lan"), and that address is exactly what the page
// is careful not to publish.
function describeFailure(err: unknown): string {
  if (err instanceof Error && err.name === "AbortError") return "Timed out";
  const cause = err instanceof Error ? (err.cause as { code?: unknown } | undefined) : undefined;
  if (typeof cause?.code === "string" && /^[A-Z0-9_]+$/.test(cause.code)) return cause.code;
  return "Request failed";
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
    return {
      timestamp: Date.now(),
      ok: false,
      httpStatus: null,
      responseTimeMs: null,
      error: describeFailure(err),
    };
  } finally {
    clearTimeout(timeout);
  }
}
