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
 *
 * Execution realism:
 * - A pullback entry must actually trade before the trade exists. If price runs
 *   to the target or the stop first, or the order expires, the setup is
 *   NOT_FILLED and never counts as a win or a loss.
 * - The fill bar can only stop out (we cannot know the order inside a bar);
 *   targets count from the next bar. Same bar stop + target: stop wins.
 * - The whole position exits at TP1, the target the R:R was measured to.
 * - Optional spread/commission (price units) is charged on every filled trade.
 */
import type { Candle } from "./market.server";

export type BacktestOutcome = "TP1" | "TP2" | "STOP" | "UNRESOLVED" | "NOT_FILLED";

/** Outcomes that are real, finished trades (a fill, then a stop or a target). */
export function isResolvedOutcome(outcome: string): boolean {
  return outcome === "TP1" || outcome === "TP2" || outcome === "STOP";
}

/** Bars a pending entry order stays live before it is cancelled. */
export const DEFAULT_FILL_WITHIN_BARS = 30;

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
  /** Middle realized R — unaffected by one huge outlier win. */
  medianR?: number | null;
  /** Average R with the single best resolved trade removed. */
  avgRExcludingBest?: number | null;
  /** Longest run of consecutive stop-outs, chronologically. */
  maxConsecutiveLosses?: number;
  /** Equity-curve style max drawdown in R (from peak cumulative R). */
  maxDrawdownR?: number;
  /** Gross wins / gross losses (null if no losses). */
  profitFactor?: number;
  /** Signals whose entry price was never reached (missed or cancelled). */
  notFilled?: number;
  /** Spread + commission charged per filled trade, in price units. */
  costPerTrade?: number;
  /** Bars a pending entry order stayed live. */
  fillWithinBars?: number;
  /** Most recent candles the engine saw per timeframe at each step. */
  analysisCandles?: number;
  /** Calendar-month buckets of resolved trades. */
  byMonth?: BacktestBucket[];
  byDirection: BacktestBucket[];
  byScore: BacktestBucket[];
  byComponent: (BacktestBucket & { key: string })[];
  setups: BacktestSetup[];
  /** 0 = holdout disabled; otherwise percent of the timeline reserved as unseen test. */
  holdoutPct?: number;
  /** Setups whose signal time falls in the early (train) segment. */
  trainResolved?: number;
  trainWinRate?: number | null;
  trainAvgR?: number | null;
  trainTotalR?: number;
  trainMedianR?: number | null;
  trainAvgRExcludingBest?: number | null;
  trainMaxConsecutiveLosses?: number;
  /** Setups whose signal time falls in the final holdout segment (unseen). */
  holdoutResolved?: number;
  holdoutWinRate?: number | null;
  holdoutAvgR?: number | null;
  holdoutTotalR?: number;
  holdoutMedianR?: number | null;
  holdoutAvgRExcludingBest?: number | null;
  holdoutMaxConsecutiveLosses?: number;
  holdoutFrom?: string | null;
  holdoutTo?: string | null;
  /** AI engine only: how many of the sampled steps actually reached the model. */
  modelCallsMade?: number;
  /** AI engine only: model failures that were skipped rather than aborting the run. */
  modelErrors?: number;
}

export function priceOf(value: string | null): number | null {
  if (!value) return null;
  // Prefer the first decimal number in the string (entry zones often include text).
  const match = String(value)
    .replace(/,/g, "")
    .match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const n = Number(match[0]);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Losses can exceed -1R once costs are charged; -3R bounds a cost-dominated trade. */
function clampR(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(-3, Math.min(MAX_REALIZED_R, value));
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
  const resolved = list.filter((s) => isResolvedOutcome(s.outcome));
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

export function monthBucketLabel(iso: string): string {
  // YYYY-MM from signal or resolve time
  const s = String(iso ?? "").slice(0, 7);
  return s.length === 7 ? s : "Unknown";
}

export function scoreBucketLabel(score: number): string {
  if (score >= 12) return "12+";
  if (score >= 9) return "9–11";
  if (score >= 6) return "6–8";
  if (score >= 3) return "3–5";
  return "0–2";
}

/**
 * Walk forward on future candles: first wait for the entry to fill (when it sits
 * away from the signal price), then decide whether the stop or TP1 came first.
 */
export function resolveOutcome(
  future: Candle[],
  setup: { direction: string; entry: number; stop: number; tp1: number; tp2: number | null },
  maxLookout: number,
  options: {
    /** Close of the signal bar. Without it the entry is assumed filled at once. */
    signalPrice?: number | null;
    /** Bars a pending entry order stays live. */
    fillWithin?: number;
    /** Spread + commission in price units, charged once per filled trade. */
    cost?: number;
  } = {},
): {
  outcome: BacktestOutcome;
  realizedR: number | null;
  resolvedAt: string | null;
  bars: number | null;
} {
  const none = { outcome: "UNRESOLVED" as const, realizedR: null, resolvedAt: null, bars: null };
  if (!isValidSetupGeometry(setup)) return none;

  const long = setup.direction === "POTENTIAL LONG";
  const { entry, stop, tp1 } = setup;
  const risk = Math.abs(entry - stop);
  if (risk <= 0) return none;
  const costR = Math.max(0, options.cost ?? 0) / risk;
  const horizon = Math.min(future.length, maxLookout);

  // ---- 1. Fill. An entry within 5% of the risk from the signal close is a
  // market entry; anything further is a resting order that has to be reached.
  let start = 0;
  const sp = options.signalPrice;
  if (sp != null && Number.isFinite(sp) && Math.abs(entry - sp) > risk * 0.05) {
    const below = entry < sp;
    const requested = Math.max(1, Math.round(options.fillWithin ?? DEFAULT_FILL_WITHIN_BARS));
    const expiry = Math.min(horizon, requested);
    let filledAt = -1;
    for (let i = 0; i < expiry; i += 1) {
      const c = future[i]!;
      const reached = below ? c.low <= entry : c.high >= entry;
      if (reached) {
        filledAt = i;
        break;
      }
      const ranToTarget = long ? c.high >= tp1 : c.low <= tp1;
      const ranToStop = long ? c.low <= stop : c.high >= stop;
      if (ranToTarget || ranToStop) {
        return { outcome: "NOT_FILLED", realizedR: null, resolvedAt: c.time, bars: i + 1 };
      }
    }
    if (filledAt < 0) {
      // History ended while the order was still live: we cannot say it missed.
      if (expiry < requested) return none;
      const last = future[expiry - 1];
      return {
        outcome: "NOT_FILLED",
        realizedR: null,
        resolvedAt: last?.time ?? null,
        bars: expiry,
      };
    }
    // The fill bar can still stop the trade out; its target touch cannot count,
    // because we cannot know whether it came before or after the fill.
    const fillBar = future[filledAt]!;
    if (long ? fillBar.low <= stop : fillBar.high >= stop) {
      return {
        outcome: "STOP",
        realizedR: clampR(-1 - costR),
        resolvedAt: fillBar.time,
        bars: filledAt + 1,
      };
    }
    start = filledAt + 1;
  }

  // ---- 2. Exit: stop or TP1, whichever comes first (same bar: stop).
  for (let i = start; i < horizon; i += 1) {
    const c = future[i]!;
    if (long ? c.low <= stop : c.high >= stop) {
      return { outcome: "STOP", realizedR: clampR(-1 - costR), resolvedAt: c.time, bars: i + 1 };
    }
    if (long ? c.high >= tp1 : c.low <= tp1) {
      return {
        outcome: "TP1",
        realizedR: clampR(Math.abs(tp1 - entry) / risk - costR),
        resolvedAt: c.time,
        bars: i + 1,
      };
    }
  }

  return none;
}

export function segmentStats(setups: BacktestSetup[]): {
  resolved: number;
  winRate: number | null;
  avgR: number | null;
  totalR: number;
  /** Middle realized R when sorted — unaffected by one huge outlier win. */
  medianR: number | null;
  /** Average R with the single best resolved trade removed. A big gap vs.
   *  avgR means one lucky trade is carrying the whole result. */
  avgRExcludingBest: number | null;
  /** Longest run of consecutive STOP outcomes, in chronological order.
   *  `setups` must already be time-ordered (ascending) for this to mean anything. */
  maxConsecutiveLosses: number;
  maxDrawdownR: number;
  profitFactor: number | null;
} {
  const resolved = setups.filter((s) => isResolvedOutcome(s.outcome));
  const wins = resolved.filter((s) => s.outcome !== "STOP");
  const rs = resolved.map((s) => clampR(s.realizedR ?? 0));

  const sortedRs = [...rs].sort((a, b) => a - b);
  const medianR = sortedRs.length
    ? sortedRs.length % 2 === 1
      ? sortedRs[(sortedRs.length - 1) / 2]!
      : (sortedRs[sortedRs.length / 2 - 1]! + sortedRs[sortedRs.length / 2]!) / 2
    : null;

  let avgRExcludingBest: number | null = null;
  if (rs.length >= 2) {
    const bestIndex = rs.reduce((best, value, idx) => (value > rs[best]! ? idx : best), 0);
    const withoutBest = rs.filter((_, idx) => idx !== bestIndex);
    avgRExcludingBest = withoutBest.length
      ? Number((withoutBest.reduce((a, b) => a + b, 0) / withoutBest.length).toFixed(4))
      : null;
  }

  let maxConsecutiveLosses = 0;
  let currentStreak = 0;
  for (const s of resolved) {
    if (s.outcome === "STOP") {
      currentStreak += 1;
      maxConsecutiveLosses = Math.max(maxConsecutiveLosses, currentStreak);
    } else {
      currentStreak = 0;
    }
  }

  // Equity curve in R order of resolution time (or signal time)
  const ordered = resolved
    .slice()
    .sort((a, b) => String(a.resolvedAt ?? a.time).localeCompare(String(b.resolvedAt ?? b.time)));
  let equity = 0;
  let peak = 0;
  let maxDrawdownR = 0;
  let grossWin = 0;
  let grossLoss = 0;
  for (const s of ordered) {
    const r = clampR(s.realizedR ?? 0);
    equity += r;
    peak = Math.max(peak, equity);
    maxDrawdownR = Math.max(maxDrawdownR, peak - equity);
    if (r > 0) grossWin += r;
    else if (r < 0) grossLoss += -r;
  }
  const profitFactor =
    grossLoss > 0 ? Number((grossWin / grossLoss).toFixed(3)) : grossWin > 0 ? null : null;

  return {
    resolved: resolved.length,
    winRate: resolved.length ? (wins.length / resolved.length) * 100 : null,
    avgR: rs.length ? Number((rs.reduce((a, b) => a + b, 0) / rs.length).toFixed(4)) : null,
    totalR: Number(rs.reduce((a, b) => a + b, 0).toFixed(2)),
    medianR: medianR !== null ? Number(medianR.toFixed(4)) : null,
    avgRExcludingBest,
    maxConsecutiveLosses,
    maxDrawdownR: Number(maxDrawdownR.toFixed(2)),
    profitFactor,
  };
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
  // Computed BEFORE `setups.sort(...)` below (that sort mutates the array
  // in place) so maxConsecutiveLosses sees the original chronological order.
  const stats = segmentStats(setups);
  const resolved = setups.filter((s) => isResolvedOutcome(s.outcome));
  const wins = resolved.filter((s) => s.outcome !== "STOP");
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
    resolved: stats.resolved,
    unresolved: setups.filter((s) => s.outcome === "UNRESOLVED").length,
    notFilled: setups.filter((s) => s.outcome === "NOT_FILLED").length,
    wins: wins.length,
    losses: resolved.length - wins.length,
    winRate: stats.winRate,
    avgR: stats.avgR,
    totalR: stats.totalR,
    medianR: stats.medianR,
    avgRExcludingBest: stats.avgRExcludingBest,
    maxConsecutiveLosses: stats.maxConsecutiveLosses,
    maxDrawdownR: stats.maxDrawdownR,
    profitFactor: stats.profitFactor ?? undefined,
    byMonth: (() => {
      const months = [
        ...new Set(
          setups
            .filter((s) => isResolvedOutcome(s.outcome))
            .map((s) => monthBucketLabel(s.resolvedAt ?? s.time)),
        ),
      ].sort();
      return months
        .map((label) =>
          bucket(
            label,
            setups.filter(
              (s) =>
                isResolvedOutcome(s.outcome) && monthBucketLabel(s.resolvedAt ?? s.time) === label,
            ),
          ),
        )
        .filter((row) => row.setups > 0);
    })(),
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
