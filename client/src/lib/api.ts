import type { StatusResponse } from "./types";

export async function fetchStatus(): Promise<StatusResponse> {
  const res = await fetch("/api/status");
  if (!res.ok) throw new Error("Couldn't load status.");
  return res.json();
}
