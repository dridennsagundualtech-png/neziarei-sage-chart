/** Staleness helpers for the market-data analysis mode. */

const TF_MINUTES: Record<string, number> = {
  "1M": 1,
  M1: 1,
  "5M": 5,
  M5: 5,
  "15M": 15,
  M15: 15,
  "30M": 30,
  M30: 30,
  "1H": 60,
  H1: 60,
  "4H": 240,
  H4: 240,
  "1D": 1440,
  D1: 1440,
  "1W": 10080,
  W1: 10080,
};

export type FreshnessLevel = "fresh" | "stale" | "very-stale" | "unknown";

export interface FreshnessRow {
  timeframe: string;
  lastTime: string | null;
}

export function timeframeMinutes(timeframe: string): number {
  return TF_MINUTES[timeframe.toUpperCase()] ?? 60;
}

export function ageMinutes(lastTime: string | null, now = Date.now()): number | null {
  if (!lastTime) return null;
  const ts = new Date(lastTime).getTime();
  if (!Number.isFinite(ts)) return null;
  return Math.max(0, (now - ts) / 60000);
}

export function classifyFreshness(timeframe: string, lastTime: string | null): FreshnessLevel {
  const age = ageMinutes(lastTime);
  if (age === null) return "unknown";
  const bar = timeframeMinutes(timeframe);
  if (age < bar * 2) return "fresh";
  if (age <= bar * 6) return "stale";
  return "very-stale";
}

export function formatAge(minutes: number | null): string {
  if (minutes === null) return "unknown";
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${Math.round(minutes)} minute${Math.round(minutes) === 1 ? "" : "s"} ago`;
  const hours = minutes / 60;
  if (hours < 24) return `${Math.round(hours)} hour${Math.round(hours) === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export const VERY_STALE_HINT = "Data looks stale — run your MT5 data script before analyzing";
