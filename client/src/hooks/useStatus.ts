import { useEffect, useState } from "react";
import type { ConnectionState, StatusResponse } from "../lib/types";

const STORAGE_KEY = "pulse-last-status-v1";
/** How long a fresh open waits for the stream before it shows the saved status. */
const GRACE_MS = 2500;
/**
 * A stream the server closed (a deploy, a proxy error page) isn't retried by
 * the browser. The first retry is quick, since a deploy takes seconds; after
 * that it backs off, so a tab left open through a long outage stays quiet.
 */
const RETRY_MS = [5000, 10000, 20000, 30000];

export interface StatusView {
  status: StatusResponse | null;
  connection: ConnectionState;
  /** When the shown status arrived, or null if it's the saved copy from an earlier visit. */
  receivedAt: number | null;
  /** The status shown is not live: the saved copy, or the last frame before the stream dropped. */
  stale: boolean;
}

function readSaved(): StatusResponse | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StatusResponse;
    return Array.isArray(parsed?.services) && typeof parsed.generatedAt === "number" ? parsed : null;
  } catch {
    return null;
  }
}

function save(raw: string) {
  try {
    localStorage.setItem(STORAGE_KEY, raw);
  } catch {
    // Storage full or blocked: the next offline open just has nothing to show.
  }
}

export function useStatus(): StatusView {
  const [live, setLive] = useState<{ status: StatusResponse; receivedAt: number } | null>(null);
  const [saved] = useState(readSaved);
  const [connection, setConnection] = useState<ConnectionState>("connecting");
  const [graceOver, setGraceOver] = useState(false);

  useEffect(() => {
    let source: EventSource | null = null;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let failures = 0;
    const grace = setTimeout(() => setGraceOver(true), GRACE_MS);

    const connect = () => {
      clearTimeout(retry);
      source?.close();
      const es = new EventSource("/api/stream");
      source = es;

      es.addEventListener("open", () => {
        failures = 0;
        setConnection("live");
      });

      es.addEventListener("status", (event) => {
        const raw = (event as MessageEvent<string>).data;
        try {
          setLive({ status: JSON.parse(raw), receivedAt: Date.now() });
          setConnection("live");
          save(raw);
        } catch {
          // ignore malformed frame, next tick corrects it
        }
      });

      es.addEventListener("error", () => {
        setGraceOver(true);
        if (es.readyState === EventSource.CONNECTING) {
          setConnection("reconnecting");
          return;
        }
        setConnection("offline");
        retry = setTimeout(connect, RETRY_MS[Math.min(failures, RETRY_MS.length - 1)]);
        failures += 1;
      });
    };

    // Back online, or back in front: don't wait out the retry timer.
    const reconnectIfClosed = () => {
      if (document.visibilityState === "visible" && source?.readyState === EventSource.CLOSED) connect();
    };

    connect();
    window.addEventListener("online", reconnectIfClosed);
    document.addEventListener("visibilitychange", reconnectIfClosed);
    return () => {
      clearTimeout(grace);
      clearTimeout(retry);
      source?.close();
      window.removeEventListener("online", reconnectIfClosed);
      document.removeEventListener("visibilitychange", reconnectIfClosed);
    };
  }, []);

  if (live) {
    return { status: live.status, connection, receivedAt: live.receivedAt, stale: connection !== "live" };
  }
  if (saved && graceOver) {
    return { status: saved, connection, receivedAt: null, stale: true };
  }
  return { status: null, connection, receivedAt: null, stale: false };
}
