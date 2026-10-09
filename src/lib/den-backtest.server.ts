/**
 * Den Analyzer walk-forward backtest (server only).
 *
 * Correctness rule: at every simulated step the engine is handed a snapshot
 * that contains ONLY candles that had CLOSED by the step candle's close, on
 * EVERY timeframe. Stored times are bar open times, so an H1 bar that opened
 * at 12:00 is not visible until 13:00. The engine sees the same recent window
 * per timeframe as a live run. The future is only used afterwards, to resolve
 * the outcome of a recorded setup (entry fill first, then stop or target).
 *
 * This file does not modify the live analyser: it reuses runDenAnalysis.
 */
import { runDenAnalysis, type DenSeries } from "./den-analyzer.server";
import { candleCloseMs } from "./freshness";
import type { Candle } from "./market.server";
import {
  DEFAULT_FILL_WITHIN_BARS,
  isValidSetupGeometry,
  priceOf,
  resolveOutcome,
  segmentStats,
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
  /**
   * Percent of the post-warmup timeline reserved as an unseen holdout test
   * (0 = off, typical 20–40). Train metrics use the earlier segment; holdout
   * metrics use only the final segment.
   */
  holdoutPct?: number;
  /** Spread + commission per filled trade, in price units (0 = none). */
  costPerTrade?: number;
  /** Bars a pending entry order stays live before it is cancelled. */
  fillWithinBars?: number;
  /** Most recent candles the engine sees per timeframe, like a live run. */
  analysisCandles?: number;
}

/** Live Den runs read 150 candles per timeframe by default. */
export const DEFAULT_ANALYSIS_CANDLES = 150;

export function runDenBacktest(input: BacktestInput): BacktestResult {
  const series = input.series.filter((set) => set.candles.length >= 12);
  if (!series.length) throw new Error("Not enough candles to backtest.");

  const step =
    series.find((set) => set.timeframe === input.stepTimeframe) ?? series[series.length - 1]!;
  const stepCandles = step.candles;
  const warmup = Math.max(20, Math.min(500, Math.round(input.warmup ?? 60)));
  const maxLookout = Math.max(10, Math.min(1000, Math.round(input.maxLookout ?? 200)));
  const holdoutPct = Math.max(0, Math.min(50, Math.round(Number(input.holdoutPct) || 0)));
  const costPerTrade = Math.max(0, Number(input.costPerTrade) || 0);
  const fillWithinBars = Math.max(
    1,
    Math.min(500, Math.round(Number(input.fillWithinBars) || DEFAULT_FILL_WITHIN_BARS)),
  );
  const analysisCandles = Math.max(
    30,
    Math.min(1000, Math.round(Number(input.analysisCandles) || DEFAULT_ANALYSIS_CANDLES)),
  );
  const tradeableBars = stepCandles.length - warmup - 1;
  const holdoutBars =
    holdoutPct > 0 ? Math.max(10, Math.floor((tradeableBars * holdoutPct) / 100)) : 0;
  const holdoutStartIndex =
    holdoutBars > 0 ? stepCandles.length - 1 - holdoutBars : stepCandles.length;

  // Group A: history gate — warmup + enough tradeable bars (more if holdout on)
  const minPostWarmup = holdoutPct > 0 ? 80 : 40;
  const minBars = warmup + minPostWarmup;
  if (stepCandles.length < minBars) {
    throw new Error(
      `Not enough history on ${step.timeframe}: have ${stepCandles.length} candles, need at least ${minBars} (warmup ${warmup} + ${minPostWarmup} tradeable bars${holdoutPct ? ` including holdout ${holdoutPct}%` : ""}). Upload more candles or lower warmup/holdout.`,
    );
  }

  /** Pointer per timeframe so the snapshot slice is O(1) amortised. */
  const cursors = series.map(() => 0);
  const closeTimes = series.map((set) =>
    set.candles.map((c) => candleCloseMs(c.time, set.timeframe)),
  );
  const stepIndex = series.indexOf(step);
  const setups: BacktestSetup[] = [];
  const trainSetups: BacktestSetup[] = [];
  const holdoutSetups: BacktestSetup[] = [];
  let steps = 0;
  let openUntil: { long: number; short: number } = { long: -1, short: -1 };

  for (let i = warmup; i < stepCandles.length - 1; i += 1) {
    const now = stepCandles[i]!.time;
    const stepClose = closeTimes[stepIndex]![i]!;
    steps += 1;

    const snapshot: DenSeries[] = series.map((set, idx) => {
      let cursor = cursors[idx]!;
      const closes = closeTimes[idx]!;
      while (cursor < set.candles.length && closes[cursor]! <= stepClose) cursor += 1;
      cursors[idx] = cursor;
      return {
        timeframe: set.timeframe,
        candles: set.candles.slice(Math.max(0, cursor - analysisCandles), cursor),
      };
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
        now: new Date(stepClose),
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
      { signalPrice: stepCandles[i]!.close, fillWithin: fillWithinBars, cost: costPerTrade },
    );
    openUntil = { ...openUntil, [side]: i + (outcome.bars ?? Math.min(maxLookout, future.length)) };

    const row: BacktestSetup = {
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
    };
    setups.push(row);
    if (holdoutPct > 0 && i >= holdoutStartIndex) holdoutSetups.push(row);
    else trainSetups.push(row);
  }

  const base = summarize(
    "den",
    input.symbol,
    step.timeframe,
    series.map((set) => set.timeframe),
    steps,
    stepCandles[warmup]?.time ?? null,
    stepCandles[stepCandles.length - 1]?.time ?? null,
    setups,
  );

  const realism = { costPerTrade, fillWithinBars, analysisCandles };
  if (holdoutPct <= 0) {
    return { ...base, ...realism, holdoutPct: 0 };
  }

  const train = segmentStats(trainSetups);
  const hold = segmentStats(holdoutSetups);
  return {
    ...base,
    ...realism,
    holdoutPct,
    trainResolved: train.resolved,
    trainWinRate: train.winRate,
    trainAvgR: train.avgR,
    trainTotalR: train.totalR,
    trainMedianR: train.medianR,
    trainAvgRExcludingBest: train.avgRExcludingBest,
    trainMaxConsecutiveLosses: train.maxConsecutiveLosses,
    holdoutResolved: hold.resolved,
    holdoutWinRate: hold.winRate,
    holdoutAvgR: hold.avgR,
    holdoutTotalR: hold.totalR,
    holdoutMedianR: hold.medianR,
    holdoutAvgRExcludingBest: hold.avgRExcludingBest,
    holdoutMaxConsecutiveLosses: hold.maxConsecutiveLosses,
    holdoutFrom: stepCandles[holdoutStartIndex]?.time ?? null,
    holdoutTo: stepCandles[stepCandles.length - 1]?.time ?? null,
  };
}
