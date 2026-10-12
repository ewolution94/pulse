// A check settles on our clock, whatever its target does.
//
// On 2026-10-09 one of Clinch's requests never settled: no answer, no error, no timeout, although
// it had been aborted. A round publishes only once every check is back, so one such check would
// hold back the whole page. The stubs below never answer, or answer late, and ignore their abort
// signal: that afternoon in its simplest form.
import { afterEach, test } from "node:test";
import assert from "node:assert/strict";
import type { ServiceConfig } from "./types.js";

// A short check timeout, set before config.ts reads it.
process.env.PULSE_CHECK_TIMEOUT_MS = "50";
const { checkService } = await import("./healthCheck.js");

const service: ServiceConfig = { id: "x", name: "X", url: "http://192.168.0.9:1234", group: "Apps" };
const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});

/** Waits for `promise`, failing the test past `ms`. */
async function within<T>(ms: number, promise: Promise<T>): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  return Promise.race([
    promise,
    new Promise<never>((_resolve, reject) => {
      timer = setTimeout(() => reject(new Error(`still pending after ${ms}ms`)), ms);
    }),
  ]).finally(() => clearTimeout(timer));
}

test("a check that never answers is a timeout, on time, even when fetch ignores the abort", async () => {
  let signal: AbortSignal | undefined;
  globalThis.fetch = ((_url: unknown, init?: RequestInit) => {
    signal = init?.signal ?? undefined;
    return new Promise<Response>(() => {});
  }) as typeof fetch;
  const check = await within(1_000, checkService(service));
  assert.deepEqual({ ...check, timestamp: 0 }, { timestamp: 0, ok: false, httpStatus: null, responseTimeMs: null, error: "Timed out" });
  // The request is asked to stop too, so its socket can go.
  assert.equal(signal?.aborted, true);
});

test("an answer after the deadline changes nothing", async () => {
  globalThis.fetch = (() => new Promise<Response>((resolve) => setTimeout(() => resolve(new Response("ok")), 100))) as typeof fetch;
  const check = await within(1_000, checkService(service));
  assert.equal(check.error, "Timed out");
  assert.equal(check.httpStatus, null);
});

test("an answer in time is up, and the error never names the target", async () => {
  globalThis.fetch = (async () => new Response(null, { status: 204 })) as typeof fetch;
  const check = await within(1_000, checkService(service));
  assert.equal(check.ok, true);
  assert.equal(check.httpStatus, 204);

  globalThis.fetch = (async () => {
    throw new TypeError("fetch failed", { cause: Object.assign(new Error("connect ECONNREFUSED 192.168.0.9:1234"), { code: "ECONNREFUSED" }) });
  }) as typeof fetch;
  assert.equal((await checkService(service)).error, "ECONNREFUSED");
});
