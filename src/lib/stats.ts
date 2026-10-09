/**
 * Statistics engine.
 *
 * Fully deterministic and completely separate from the AI layer: every number
 * here is computed from stored, completed journal entries. The language model
 * never supplies a win rate, expectancy or accuracy figure.
 */

import type { ChecklistItem, Outcome } from "./analysis-types";
import { sampleTier, type SampleTier } from "./analysis-types";

export interface JournalRow {
  id: string;
  created_at: string;
  asset: string;
  market_type: string;
  timeframes: string[];
  primary_timeframe: string | null;
  direction: string;
  setup_stage: string;
  score: number;
  max_score: number;
  grade: string;
  outcome: Outcome;
  r_result: number | null;
  risk_reward: number | null;
  checklist: ChecklistItem[];
}

/** Only these outcomes count as completed trades for performance stats. */
const COMPLETED: Outcome[] = ["WIN", "LOSS", "BREAKEVEN"];

export function isCompleted(row: JournalRow): boolean {
  return COMPLETED.includes(row.outcome) && typeof row.r_result === "number";
}

export interface Stats {
  total: number;
  wins: number;
  losses: number;
  breakevens: number;
  winRate: number | null;
  lossRate: number | null;
  avgR: number | null;
  avgWinner: number | null;
  avgLoser: number | null;
  expectancy: number | null;
  profitFactor: number | null;
  maxDrawdown: number;
  cumulativeR: number;
  sampleTier: SampleTier;
}

export const EMPTY_STATS: Stats = {
  total: 0,
  wins: 0,
  losses: 0,
  breakevens: 0,
  winRate: null,
  lossRate: null,
  avgR: null,
  avgWinner: null,
  avgLoser: null,
  expectancy: null,
  profitFactor: null,
  maxDrawdown: 0,
  cumulativeR: 0,
  sampleTier: "insufficient",
};

export function computeStats(rows: JournalRow[]): Stats {
  const completed = rows
    .filter(isCompleted)
    .slice()
    .sort((a, b) => a.created_at.localeCompare(b.created_at));

  if (completed.length === 0) return { ...EMPTY_STATS };

  const rs = completed.map((row) => row.r_result as number);
  const winners = completed.filter((r) => r.outcome === "WIN");
  const losers = completed.filter((r) => r.outcome === "LOSS");
  const breakevens = completed.filter((r) => r.outcome === "BREAKEVEN");

  const grossWin = winners.reduce((s, r) => s + Math.max(r.r_result ?? 0, 0), 0);
  const grossLoss = losers.reduce((s, r) => s + Math.abs(Math.min(r.r_result ?? 0, 0)), 0);

  let equity = 0;
  let peak = 0;
  let maxDrawdown = 0;
  for (const r of rs) {
    equity += r;
    peak = Math.max(peak, equity);
    maxDrawdown = Math.max(maxDrawdown, peak - equity);
  }

  const total = completed.length;
  const avgR = rs.reduce((s, r) => s + r, 0) / total;

  return {
    total,
    wins: winners.length,
    losses: losers.length,
    breakevens: breakevens.length,
    winRate: (winners.length / total) * 100,
    lossRate: (losers.length / total) * 100,
    avgR,
    avgWinner: winners.length ? grossWin / winners.length : null,
    avgLoser: losers.length ? -(grossLoss / losers.length) : null,
    // Expectancy in R per trade == average R of completed trades.
    expectancy: avgR,
    profitFactor: grossLoss > 0 ? grossWin / grossLoss : null,
    maxDrawdown,
    cumulativeR: equity,
    sampleTier: sampleTier(total),
  };
}

export interface ComparableQuery {
  asset?: string | null;
  direction?: string | null;
  timeframe?: string | null;
  gradeBand?: boolean;
  score?: number | null;
  components?: string[];
}

/**
 * Comparable setups: same asset, same direction, same timeframe family and a
 * similar setup score. Different strategies on different instruments are never
 * silently pooled together.
 */
export function findComparable(rows: JournalRow[], q: ComparableQuery): JournalRow[] {
  return rows.filter((row) => {
    if (!isCompleted(row)) return false;
    if (q.asset && row.asset.toUpperCase() !== q.asset.toUpperCase()) return false;
    if (q.direction && row.direction !== q.direction) return false;
    if (q.timeframe && (row.primary_timeframe ?? "") !== q.timeframe) return false;
    if (typeof q.score === "number" && Math.abs(row.score - q.score) > 2) return false;
    if (q.components?.length) {
      const present = new Set(
        (row.checklist ?? []).filter((item) => item.score > 0).map((item) => item.key),
      );
      if (!q.components.every((key) => present.has(key as ChecklistItem["key"]))) return false;
    }
    return true;
  });
}

export interface HistoricalEdge {
  comparableCount: number;
  winRate: number | null;
  avgR: number | null;
  /** True only when the sample reaches the user's configured minimum. */
  displayable: boolean;
  tier: SampleTier;
  minSampleSize: number;
}

export function historicalEdge(
  rows: JournalRow[],
  q: ComparableQuery,
  minSampleSize: number,
): HistoricalEdge {
  const comparable = findComparable(rows, q);
  const stats = computeStats(comparable);
  const displayable = comparable.length >= Math.max(1, minSampleSize);
  return {
    comparableCount: comparable.length,
    winRate: displayable ? stats.winRate : null,
    avgR: displayable ? stats.avgR : null,
    displayable,
    tier: sampleTier(comparable.length),
    minSampleSize,
  };
}

export interface GroupedStat {
  label: string;
  stats: Stats;
}

export function groupBy(rows: JournalRow[], keyOf: (row: JournalRow) => string): GroupedStat[] {
  const buckets = new Map<string, JournalRow[]>();
  for (const row of rows.filter(isCompleted)) {
    const key = keyOf(row) || "—";
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(row);
  }
  return [...buckets.entries()]
    .map(([label, group]) => ({ label, stats: computeStats(group) }))
    .sort((a, b) => b.stats.total - a.stats.total);
}

export function scoreBandOf(score: number): string {
  if (score >= 13) return "13-16 (A)";
  if (score >= 10) return "10-12 (B)";
  if (score >= 7) return "7-9 (C)";
  return "0-6 (D)";
}

export function cumulativeRSeries(rows: JournalRow[]): { i: number; date: string; r: number }[] {
  const completed = rows
    .filter(isCompleted)
    .slice()
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
  let equity = 0;
  return completed.map((row, i) => {
    equity += row.r_result as number;
    return { i: i + 1, date: row.created_at.slice(0, 10), r: Number(equity.toFixed(2)) };
  });
}

export function monthlySeries(rows: JournalRow[]): { month: string; r: number; trades: number }[] {
  const buckets = new Map<string, { r: number; trades: number }>();
  for (const row of rows.filter(isCompleted)) {
    const month = row.created_at.slice(0, 7);
    const bucket = buckets.get(month) ?? { r: 0, trades: 0 };
    bucket.r += row.r_result as number;
    bucket.trades += 1;
    buckets.set(month, bucket);
  }
  return [...buckets.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, value]) => ({ month, r: Number(value.r.toFixed(2)), trades: value.trades }));
}

export interface ComponentPerformance {
  key: string;
  label: string;
  withCount: number;
  withWinRate: number | null;
  withAvgR: number | null;
}

export function componentPerformance(
  rows: JournalRow[],
  specs: { key: string; label: string }[],
): ComponentPerformance[] {
  return specs.map((spec) => {
    const withComponent = rows.filter(
      (row) =>
        isCompleted(row) &&
        (row.checklist ?? []).some((item) => item.key === spec.key && item.score > 0),
    );
    const stats = computeStats(withComponent);
    return {
      key: spec.key,
      label: spec.label,
      withCount: withComponent.length,
      withWinRate: stats.winRate,
      withAvgR: stats.avgR,
    };
  });
}

/** Position sizing — only ever computed from real numbers the user supplied. */
/** Pulls a mid-price out of a textual zone like "4,218–4,224" without inventing one. */
export function midpointOf(zone?: string | null): number | null {
  if (!zone) return null;
  const num = (s: string) => Number(s.replace(/,/g, ""));
  // Only a real range ("4,218–4,224", "1.0850-1.0860", "100 to 110") is averaged; a hyphen
  // between two numbers is a range separator, not a minus sign, and stray numbers such as
  // the "1" in "(1H)" are never treated as the second end of a zone.
  const range = zone.match(/(\d[\d,]*\.?\d*)\s*(?:-|–|—|to)\s*(\d[\d,]*\.?\d*)/);
  if (range) {
    const a = num(range[1] as string);
    const b = num(range[2] as string);
    if (Number.isFinite(a) && Number.isFinite(b)) return (a + b) / 2;
  }
  const first = zone.match(/\d[\d,]*\.?\d*/);
  if (!first) return null;
  const value = num(first[0]);
  return Number.isFinite(value) ? value : null;
}

export interface PlanCheck {
  /** False when the levels contradict the direction. */
  ok: boolean;
  /** R:R measured from the levels themselves (to TP1), or null when unreadable. */
  rr: number | null;
  issue: string | null;
}

/**
 * Reads entry, stop and TP1 out of the plan text and checks they form a trade:
 * the stop beyond the entry, the target in front of it. Levels that can't be
 * read as numbers are not judged.
 */
export function checkPlan(
  direction: string,
  entryZone: string | null,
  stopLoss: string | null,
  tp1: string | null,
): PlanCheck {
  const long = direction.includes("LONG");
  if (!long && !direction.includes("SHORT")) return { ok: true, rr: null, issue: null };
  const entry = midpointOf(entryZone);
  const stop = midpointOf(stopLoss);
  const target = midpointOf(tp1);
  if (entry === null || stop === null || target === null)
    return { ok: true, rr: null, issue: null };
  const risk = long ? entry - stop : stop - entry;
  const reward = long ? target - entry : entry - target;
  if (risk <= 0) {
    return {
      ok: false,
      rr: null,
      issue: `the stop is ${long ? "above" : "below"} the entry, so the trade would be stopped out before it starts.`,
    };
  }
  if (reward <= 0) {
    return {
      ok: false,
      rr: null,
      issue: `the first target is ${long ? "below" : "above"} the entry.`,
    };
  }
  return { ok: true, rr: Number(Math.min(50, reward / risk).toFixed(2)), issue: null };
}

/**
 * Realised R from trades that finished today (local calendar day), for the
 * daily loss limit. Uses the close time when recorded, else the entry time.
 */
export function realizedRToday(
  rows: {
    outcome: string;
    r_result: number | null;
    created_at: string;
    closed_at?: string | null;
  }[],
  now: Date = new Date(),
): number {
  const today = now.toDateString();
  return rows.reduce((sum, row) => {
    if (!COMPLETED.includes(row.outcome as Outcome) || typeof row.r_result !== "number") return sum;
    const when = new Date(row.closed_at ?? row.created_at);
    return when.toDateString() === today ? sum + row.r_result : sum;
  }, 0);
}
