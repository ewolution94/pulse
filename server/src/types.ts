export interface ServiceConfig {
  id: string;
  name: string;
  url: string;
  healthPath?: string;
  expectedStatus?: number;
  link?: string;
  description?: string;
  group?: string;
}

export type CheckStatus = "up" | "down";

export interface RecentCheck {
  timestamp: number;
  ok: boolean;
  httpStatus: number | null;
  responseTimeMs: number | null;
  error: string | null;
}

// Stored form — response time is kept as a running sum/count rather than a
// pre-averaged value, so failed checks (null responseTimeMs) never skew the
// average toward zero.
export interface DayAggregate {
  date: string; // YYYY-MM-DD, UTC
  checks: number;
  upChecks: number;
  responseTimeSum: number;
  responseTimeSamples: number;
}

export interface ServiceHistory {
  recent: RecentCheck[];
  days: DayAggregate[];
}

// API-facing form — the sum/count above collapsed into a single average.
export interface PublicDayAggregate {
  date: string;
  checks: number;
  upChecks: number;
  avgResponseMs: number | null;
}

export type ServiceState = "operational" | "degraded" | "down" | "unknown";

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

export type OverallState = "operational" | "degraded" | "down" | "unknown";

export interface StatusResponse {
  overall: OverallState;
  services: ServiceStatus[];
  generatedAt: number;
  pollIntervalMs: number;
}
