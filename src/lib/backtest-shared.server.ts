/**
 * Shared between the Den Analyzer backtest (den-backtest.server.ts) and the
 * AI backtest (ai-backtest.server.ts): the outcome-resolution walk-forward
 * (same no-lookahead rule for both engines) plus the result shapes both
 * return, so BacktestSection.tsx renders either one identically.
 *
 * R-calc safety:
 * - Reject invalid geometry (stop on wrong side, zero risk, target on wrong side)
 * - Require a minimum risk distance vs entry (avoids microscopic stops → 50R+ wins)
 * - Cap realized R so one bad level cannot dominate Average R
 */
import type { Candle } from "./market.server";

export type BacktestOutcome = "TP1" | "TP2" | "STOP" | "UNRESOLVED";

/** Hard ceiling for a single trade's realized R (wins and the display of RR). */
export const MAX_REALIZED_R = 10;

/**
 * Minimum stop distance as a fraction of entry price.
 * ~0.05% of price — filters "stop equals entry" noise on FX.
 */
export const MIN_RISK_FRAC = 0.0005;

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
  // Prefer the first decimal number in the string (entry zones often include text).
  const match = String(value).replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const n = Number(match[0]);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function clampR(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(-1, Math.min(MAX_REALIZED_R, value));
}

/**
 * True when entry/stop/tp form a tradeable plan with non-tiny risk.
 * Prevents Average R blow-ups from 0.00001 stops.
 */
export function isValidSetupGeometry(setup: {
  direction: string;
  entry: number;
  stop: number;
  tp1: number;
  tp2?: number | null;
}): boolean {
  const { entry, stop, tp1, tp2 } = setup;
  if (![entry, stop, tp1].every((n) => Number.isFinite(n) && n > 0)) return false;

  const long = setup.direction === "POTENTIAL LONG";
  const risk = Math.abs(entry - stop);
  if (risk <= 0) return false;
  if (risk / entry < MIN_RISK_FRAC) return false;

  if (long) {
    if (!(stop < entry)) return false;
    if (!(tp1 > entry)) return false;
    if (tp2 != null && Number.isFinite(tp2) && tp2 <= entry) return false;
  } else {
    if (!(stop > entry)) return false;
    if (!(tp1 < entry)) return false;
    if (tp2 != null && Number.isFinite(tp2) && tp2 >= entry) return false;
  }
  return true;
}

export function bucket(label: string, list: BacktestSetup[]): BacktestBucket {
  const resolved = list.filter((s) => s.outcome !== "UNRESOLVED");
  const wins = resolved.filter((s) => s.outcome !== "STOP").length;
  const rs = resolved.map((s) => clampR(s.realizedR ?? 0));
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
 * Walk forward on future candles and decide what happened first: stop, TP1, or TP2.
 * Same-candle stop+target → stop wins (conservative).
 * Realized R is capped at MAX_REALIZED_R.
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
  if (!isValidSetupGeometry(setup)) {
    return { outcome: "UNRESOLVED", realizedR: null, resolvedAt: null, bars: null };
  }

  const long = setup.direction === "POTENTIAL LONG";
  const risk = Math.abs(setup.entry - setup.stop);
  if (risk <= 0) return { outcome: "UNRESOLVED", realizedR: null, resolvedAt: null, bars: null };

  for (let i = 0; i < Math.min(future.length, maxLookout); i += 1) {
    const c = future[i]!;
    const hitStop = long ? c.low <= setup.stop : c.high >= setup.stop;
    const hitTp1 = long ? c.high >= setup.tp1 : c.low <= setup.tp1;
    const hitTp2 =
      setup.tp2 != null && Number.isFinite(setup.tp2)
        ? long
          ? c.high >= setup.tp2
          : c.low <= setup.tp2
        : false;

    // Same bar: stop takes priority (conservative).
    if (hitStop) {
      return { outcome: "STOP", realizedR: -1, resolvedAt: c.time, bars: i + 1 };
    }
    if (hitTp2) {
      const reward = Math.abs(setup.tp2! - setup.entry);
      return {
        outcome: "TP2",
        realizedR: clampR(reward / risk),
        resolvedAt: c.time,
        bars: i + 1,
      };
    }
    if (hitTp1) {
      const reward = Math.abs(setup.tp1 - setup.entry);
      return {
        outcome: "TP1",
        realizedR: clampR(reward / risk),
        resolvedAt: c.time,
        bars: i + 1,
      };
    }
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
  const rs = resolved.map((s) => clampR(s.realizedR ?? 0));
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
    avgR: rs.length ? Number((rs.reduce((a, b) => a + b, 0) / rs.length).toFixed(4)) : null,
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
