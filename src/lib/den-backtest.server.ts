/**
 * Den Analyzer walk-forward backtest (server only).
 *
 * Correctness rule: at every simulated step the engine is handed a snapshot
 * that contains ONLY candles whose time is <= the current step candle's time,
 * on EVERY timeframe. No future candle is ever visible to the analysis. The
 * future is only used afterwards, to resolve the outcome of a recorded setup.
 *
 * This file does not modify the live analyser: it reuses runDenAnalysis.
 */
import { runDenAnalysis, type DenSeries } from "./den-analyzer.server";
import type { Candle } from "./market.server";
import {
  isValidSetupGeometry,
  priceOf,
  resolveOutcome,
  summarize,
  type BacktestResult,
  type BacktestSetup,
} from "./backtest-shared.server";

export type {
  BacktestResult,
  BacktestSetup,
  BacktestBucket,
  BacktestOutcome,
} from "./backtest-shared.server";

export interface BacktestInput {
  symbol: string;
  /** Same shape as DenInput.series: highest timeframe first. */
  series: DenSeries[];
  /** The timeframe whose candle closes advance the simulation clock. */
  stepTimeframe: string;
  minRR: number;
  requireVolume: boolean;
  strictMode: boolean;
  rules?: unknown;
  /** Bars skipped before the first simulated analysis. */
  warmup?: number;
  /** How many future step candles a setup may take to resolve. */
  maxLookout?: number;
}

export function runDenBacktest(input: BacktestInput): BacktestResult {
  const series = input.series.filter((set) => set.candles.length >= 12);
  if (!series.length) throw new Error("Not enough candles to backtest.");

  const step =
    series.find((set) => set.timeframe === input.stepTimeframe) ?? series[series.length - 1]!;
  const stepCandles = step.candles;
  const warmup = Math.max(20, Math.min(500, Math.round(input.warmup ?? 60)));
  const maxLookout = Math.max(10, Math.min(1000, Math.round(input.maxLookout ?? 200)));

  if (stepCandles.length <= warmup + 10) {
    throw new Error(
      `Need more than ${warmup + 10} candles on ${step.timeframe} to run a walk-forward backtest.`,
    );
  }

  /** Pointer per timeframe so the snapshot slice is O(1) amortised. */
  const cursors = series.map(() => 0);
  const setups: BacktestSetup[] = [];
  let steps = 0;
  let openUntil: { long: number; short: number } = { long: -1, short: -1 };

  for (let i = warmup; i < stepCandles.length - 1; i += 1) {
    const now = stepCandles[i]!.time;
    steps += 1;

    const snapshot: DenSeries[] = series.map((set, idx) => {
      let cursor = cursors[idx]!;
      while (cursor < set.candles.length && set.candles[cursor]!.time <= now) cursor += 1;
      cursors[idx] = cursor;
      return { timeframe: set.timeframe, candles: set.candles.slice(0, cursor) };
    });

    if (snapshot.some((set) => set.candles.length < 12)) {
      // Not every timeframe has history at this point in time yet.
      if (!snapshot.some((set) => set.candles.length >= 12)) continue;
    }

    let result;
    try {
      result = runDenAnalysis({
        symbol: input.symbol,
        series: snapshot.filter((set) => set.candles.length >= 12),
        minRR: input.minRR,
        requireVolume: input.requireVolume,
        strictMode: input.strictMode,
        rules: input.rules,
      });
    } catch {
      continue;
    }

    if (result.direction !== "POTENTIAL LONG" && result.direction !== "POTENTIAL SHORT") continue;
    const entry = priceOf(result.entry_zone);
    const stop = priceOf(result.stop_loss);
    const tp1 = priceOf(result.tp1);
    const tp2 = priceOf(result.tp2);
    if (entry === null || stop === null || tp1 === null) continue;
    // Skip microscopic / inverted plans so Average R cannot explode (e.g. +77R).
    if (
      !isValidSetupGeometry({
        direction: result.direction,
        entry,
        stop,
        tp1,
        tp2,
      })
    ) {
      continue;
    }

    const side = result.direction === "POTENTIAL LONG" ? "long" : "short";
    if (i <= openUntil[side]) continue; // don't stack identical overlapping signals

    const future: Candle[] = stepCandles.slice(i + 1);
    const outcome = resolveOutcome(
      future,
      { direction: result.direction, entry, stop, tp1, tp2 },
      maxLookout,
    );
    openUntil = { ...openUntil, [side]: i + (outcome.bars ?? Math.min(maxLookout, future.length)) };

    setups.push({
      time: now,
      direction: result.direction,
      entry,
      stop,
      tp1,
      tp2,
      score: result.score,
      grade: result.grade,
      riskReward: result.risk_reward,
      components: result.checklist
        .filter((item) => item.score > 0)
        .map((item) => ({ key: item.key, score: item.score })),
      outcome: outcome.outcome,
      realizedR: outcome.realizedR,
      resolvedAt: outcome.resolvedAt,
      barsToResolve: outcome.bars,
    });
  }

  return summarize(
    "den",
    input.symbol,
    step.timeframe,
    series.map((set) => set.timeframe),
    steps,
    stepCandles[warmup]?.time ?? null,
    stepCandles[stepCandles.length - 1]?.time ?? null,
    setups,
  );
}
