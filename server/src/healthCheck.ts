import { CHECK_TIMEOUT_MS } from "./config.js";
import { DeadlineError, withDeadline } from "./deadline.js";
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
  if (err instanceof DeadlineError || (err instanceof Error && err.name === "AbortError")) return "Timed out";
  const cause = err instanceof Error ? (err.cause as { code?: unknown } | undefined) : undefined;
  if (typeof cause?.code === "string" && /^[A-Z0-9_]+$/.test(cause.code)) return cause.code;
  return "Request failed";
}

export async function checkService(service: ServiceConfig): Promise<RecentCheck> {
  const target = resolveTarget(service);
  const start = Date.now();

  try {
    // On our own clock (deadline.ts): a round publishes only once every check is back, so one
    // check that never settled would hold back the whole page. A late answer goes nowhere.
    const status = await withDeadline(CHECK_TIMEOUT_MS, async (signal) => {
      const res = await fetch(target, {
        method: "GET",
        signal,
        redirect: "follow",
        headers: { "User-Agent": "Pulse-StatusPage/1.0" },
      });
      // Only the status matters; dropping the body frees the connection sooner.
      void res.body?.cancel().catch(() => {});
      return res.status;
    });
    const responseTimeMs = Date.now() - start;
    const ok = service.expectedStatus
      ? status === service.expectedStatus
      : status >= 200 && status < 400;

    return { timestamp: Date.now(), ok, httpStatus: status, responseTimeMs, error: null };
  } catch (err) {
    return {
      timestamp: Date.now(),
      ok: false,
      httpStatus: null,
      responseTimeMs: null,
      error: describeFailure(err),
    };
  }
}
