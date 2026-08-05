import { useEffect, useState } from "react";
import type { ConnectionState, StatusResponse } from "../lib/types";

export function useStatus() {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [connection, setConnection] = useState<ConnectionState>("connecting");

  useEffect(() => {
    const source = new EventSource("/api/stream");

    source.addEventListener("open", () => setConnection("live"));

    source.addEventListener("status", (event) => {
      try {
        setStatus(JSON.parse((event as MessageEvent).data));
        setConnection("live");
      } catch {
        // ignore malformed frame, next tick corrects it
      }
    });

    source.addEventListener("error", () => {
      setConnection(source.readyState === EventSource.CONNECTING ? "reconnecting" : "offline");
    });

    return () => source.close();
  }, []);

  return { status, connection };
}
