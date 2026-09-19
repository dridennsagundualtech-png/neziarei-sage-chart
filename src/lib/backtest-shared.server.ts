/**
 * Shared between the Den Analyzer backtest (den-backtest.server.ts) and the
 * AI backtest (ai-backtest.server.ts): the outcome-resolution walk-forward
 * (same no-lookahead rule for both engines) plus the result shapes both
 * return, so BacktestSection.tsx renders either one identically.
 */
import type { Candle } from "./market.server";

export type BacktestOutcome = "TP1" | "TP2" | "STOP" | "UNRESOLVED";

export interface BacktestSetup {
  time: string;
  direction: "POTENTIAL LONG" | "POTENTIAL SHORT";
  entry: number;
  stop: number;
  tp1: number;
  tp2: number | null;
  score: number;
  grade: string;
  riskReward: number | null;
  components: { key: string; score: number }[];
  outcome: BacktestOutcome;
  realizedR: number | null;
  resolvedAt: string | null;
  barsToResolve: number | null;
}

export interface BacktestBucket {
  label: string;
  setups: number;
  resolved: number;
  wins: number;
  winRate: number | null;
  avgR: number | null;
}

export interface BacktestResult {
  engine: "den" | "ai";
  symbol: string;
  stepTimeframe: string;
  timeframes: string[];
  steps: number;
  from: string | null;
  to: string | null;
  totalSetups: number;
  resolved: number;
  unresolved: number;
  wins: number;
  losses: number;
  winRate: number | null;
  avgR: number | null;
  totalR: number;
  byDirection: BacktestBucket[];
  byScore: BacktestBucket[];
  byComponent: (BacktestBucket & { key: string })[];
  setups: BacktestSetup[];
  /** AI engine only: how many of the sampled steps actually reached the model. */
  modelCallsMade?: number;
  /** AI engine only: model failures that were skipped rather than aborting the run. */
  modelErrors?: number;
}

export function priceOf(value: string | null): number | null {
  if (!value) return null;
  const n = Number(String(value).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function bucket(label: string, list: BacktestSetup[]): BacktestBucket {
  const resolved = list.filter((s) => s.outcome !== "UNRESOLVED");
  const wins = resolved.filter((s) => s.outcome !== "STOP").length;
  const rs = resolved.map((s) => s.realizedR ?? 0);
  return {
    label,
    setups: list.length,
    resolved: resolved.length,
    wins,
    winRate: resolved.length ? (wins / resolved.length) * 100 : null,
    avgR: rs.length ? rs.reduce((a, b) => a + b, 0) / rs.length : null,
  };
}

export function scoreBucketLabel(score: number): string {
  if (score >= 12) return "12+";
  if (score >= 9) return "9–11";
  if (score >= 6) return "6–8";
  if (score >= 3) return "3–5";
  return "0–2";
}

/**
 * Walk forward on future candles and decide what happened first: stop, TP2,
 * or TP1. Same-candle stop+target ambiguity resolves conservatively (stop
 * wins). Shared by both engines so a setup's outcome never depends on which
 * one proposed it.
 */
export function resolveOutcome(
  future: Candle[],
  setup: { direction: string; entry: number; stop: number; tp1: number; tp2: number | null },
  maxLookout: number,
): {
  outcome: BacktestOutcome;
  realizedR: number | null;
  resolvedAt: string | null;
  bars: number | null;
} {
  const long = setup.direction === "POTENTIAL LONG";
  const risk = Math.abs(setup.entry - setup.stop);
  if (risk <= 0) return { outcome: "UNRESOLVED", realizedR: null, resolvedAt: null, bars: null };

  let best: BacktestOutcome | null = null;
  let bestTime: string | null = null;
  let bars: number | null = null;

  for (let i = 0; i < Math.min(future.length, maxLookout); i += 1) {
    const c = future[i]!;
    const hitStop = long ? c.low <= setup.stop : c.high >= setup.stop;
    const hitTp1 = long ? c.high >= setup.tp1 : c.low <= setup.tp1;
    const hitTp2 = setup.tp2 === null ? false : long ? c.high >= setup.tp2 : c.low <= setup.tp2;

    if (hitStop && !best) {
      return { outcome: "STOP", realizedR: -1, resolvedAt: c.time, bars: i + 1 };
    }
    if (hitTp2) {
      const reward = Math.abs(setup.tp2! - setup.entry);
      return { outcome: "TP2", realizedR: reward / risk, resolvedAt: c.time, bars: i + 1 };
    }
    if (hitTp1 && !best) {
      best = "TP1";
      bestTime = c.time;
      bars = i + 1;
    }
  }

  if (best === "TP1") {
    const reward = Math.abs(setup.tp1 - setup.entry);
    return { outcome: "TP1", realizedR: reward / risk, resolvedAt: bestTime, bars };
  }
  return { outcome: "UNRESOLVED", realizedR: null, resolvedAt: null, bars: null };
}

export function summarize(
  engine: "den" | "ai",
  symbol: string,
  stepTimeframe: string,
  timeframes: string[],
  steps: number,
  from: string | null,
  to: string | null,
  setups: BacktestSetup[],
  extra?: { modelCallsMade?: number; modelErrors?: number },
): BacktestResult {
  const resolved = setups.filter((s) => s.outcome !== "UNRESOLVED");
  const wins = resolved.filter((s) => s.outcome !== "STOP");
  const rs = resolved.map((s) => s.realizedR ?? 0);
  const scoreLabels = ["12+", "9–11", "6–8", "3–5", "0–2"];

  return {
    engine,
    symbol,
    stepTimeframe,
    timeframes,
    steps,
    from,
    to,
    totalSetups: setups.length,
    resolved: resolved.length,
    unresolved: setups.length - resolved.length,
    wins: wins.length,
    losses: resolved.length - wins.length,
    winRate: resolved.length ? (wins.length / resolved.length) * 100 : null,
    avgR: rs.length ? rs.reduce((a, b) => a + b, 0) / rs.length : null,
    totalR: Number(rs.reduce((a, b) => a + b, 0).toFixed(2)),
    byDirection: [
      bucket(
        "Long",
        setups.filter((s) => s.direction === "POTENTIAL LONG"),
      ),
      bucket(
        "Short",
        setups.filter((s) => s.direction === "POTENTIAL SHORT"),
      ),
    ],
    byScore: scoreLabels
      .map((label) =>
        bucket(
          label,
          setups.filter((s) => scoreBucketLabel(s.score) === label),
        ),
      )
      .filter((row) => row.setups > 0),
    byComponent: [...new Set(setups.flatMap((s) => s.components.map((c) => c.key)))]
      .sort()
      .map((key) => ({
        key,
        ...bucket(
          key,
          setups.filter((s) => s.components.some((c) => c.key === key)),
        ),
      })),
    setups: setups.sort((a, b) => (a.time < b.time ? 1 : -1)),
    ...extra,
  };
}
