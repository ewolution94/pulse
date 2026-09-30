import { test } from "node:test";
import assert from "node:assert/strict";
import { deriveOverall, deriveState } from "./state.js";
import type { RecentCheck } from "./types.js";

const LIMIT = 3000;

function up(responseTimeMs = 120): RecentCheck {
  return { timestamp: 0, ok: true, httpStatus: 200, responseTimeMs, error: null };
}
function down(): RecentCheck {
  return { timestamp: 0, ok: false, httpStatus: null, responseTimeMs: null, error: "ECONNREFUSED" };
}

test("no checks yet is unknown", () => {
  assert.equal(deriveState([], LIMIT), "unknown");
});

test("a failed latest check is down, whatever came before", () => {
  assert.equal(deriveState([up(), up(), up(), down()], LIMIT), "down");
});

test("clean and fast is operational", () => {
  assert.equal(deriveState([up(), up(), up(), up(), up()], LIMIT), "operational");
});

test("a failure among the last five keeps it degraded", () => {
  assert.equal(deriveState([down(), up(), up(), up(), up()], LIMIT), "degraded");
});

test("a failure older than the last five no longer counts", () => {
  assert.equal(deriveState([down(), up(), up(), up(), up(), up()], LIMIT), "operational");
});

test("slower than the threshold is degraded", () => {
  assert.equal(deriveState([up(), up(LIMIT + 1)], LIMIT), "degraded");
});

test("exactly the threshold is still operational", () => {
  assert.equal(deriveState([up(LIMIT)], LIMIT), "operational");
});

test("overall is the worst state of any service", () => {
  assert.equal(deriveOverall([]), "unknown");
  assert.equal(deriveOverall(["operational", "operational"]), "operational");
  assert.equal(deriveOverall(["operational", "degraded"]), "degraded");
  assert.equal(deriveOverall(["degraded", "down", "unknown"]), "down");
  assert.equal(deriveOverall(["operational", "unknown"]), "unknown");
});
