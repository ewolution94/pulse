export type ServiceState = "operational" | "degraded" | "down" | "unknown";
export type OverallState = ServiceState;
export type ConnectionState = "connecting" | "live" | "reconnecting" | "offline";

export interface RecentCheck {
  timestamp: number;
  ok: boolean;
  httpStatus: number | null;
  responseTimeMs: number | null;
  error: string | null;
}

export interface PublicDayAggregate {
  date: string;
  checks: number;
  upChecks: number;
  avgResponseMs: number | null;
}

export interface ServiceStatus {
  id: string;
  name: string;
  link: string | null;
  description: string | null;
  group: string | null;
  state: ServiceState;
  current: RecentCheck | null;
  uptimePct90d: number | null;
  days: PublicDayAggregate[];
}

export interface StatusResponse {
  overall: OverallState;
  services: ServiceStatus[];
  generatedAt: number;
  pollIntervalMs: number;
}
