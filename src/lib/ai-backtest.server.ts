/**
 * AI Analyzer walk-forward backtest (server only).
 *
 * Same no-lookahead contract as den-backtest.server.ts: at every simulated
 * step the model only ever sees candles up to and including that step, on
 * every timeframe. The future is only used afterwards, to resolve outcome.
 *
 * Unlike the Den Analyzer (free, deterministic, instant), every step here is
 * a real paid/rate-limited model call through the same cascade the live
 * Analyze screen uses (chatWithFallback via runAnalysisFromData). Two things
 * follow from that, and both are deliberate:
 *
 * 1. SAMPLING: we do not analyse every candle. We pick `maxSamples` steps,
 *    evenly spaced across the requested range, so cost and wall-clock time
 *    stay bounded regardless of how much history is requested.
 * 2. BATCHING: Cloudflare Workers has a wall-clock execution limit, so
 *    samples are analysed in small concurrent batches rather than one long
 *    sequential chain: this keeps total latency roughly
 *    (samples / batchSize) * (one model call), not (samples) * (one call).
 *
 * A model failure on one sample is recorded and skipped (modelErrors), it
 * never aborts the run: a handful of rate-limited samples shouldn't throw
 * away every other result.
 */
import { runAnalysisFromData, type DataSeries } from "./analyze.server";
import type { Candle } from "./market.server";
import {
  priceOf,
  resolveOutcome,
  summarize,
  type BacktestResult,
  type BacktestSetup,
} from "./backtest-shared.server";

export interface AIBacktestInput {
  symbol: string;
  series: DataSeries[];
  stepTimeframe: string;
  minRR: number;
  requireVolume: boolean;
  strictMode: boolean;
  model?: string | null;
  warmup?: number;
  maxLookout?: number;
  /** Hard cap on real model calls this run will make. Keep this small by default. */
  maxSamples?: number;
  /** How many model calls run concurrently per batch. */
  batchSize?: number;
}

const MAX_SAMPLES_CAP = 60;
const DEFAULT_MAX_SAMPLES = 20;
const DEFAULT_BATCH_SIZE = 4;

/** Evenly-spaced step indices across [warmup, stepCandles.length - 2], inclusive-ish. */
function sampleIndices(from: number, to: number, count: number): number[] {
  if (to <= from) return [];
  const span = to - from;
  const n = Math.min(count, span);
  if (n <= 0) return [];
  const out: number[] = [];
  for (let k = 0; k < n; k += 1) {
    const idx = from + Math.round((k * span) / Math.max(1, n - 1));
    if (out[out.length - 1] !== idx) out.push(idx);
  }
  return out;
}

async function runBatched<T, R>(
  items: T[],
  batchSize: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const settled = await Promise.all(batch.map((item) => worker(item)));
    out.push(...settled);
  }
  return out;
}

export async function runAIBacktest(input: AIBacktestInput): Promise<BacktestResult> {
  const series = input.series.filter((set) => set.candles.length >= 12);
  if (!series.length) throw new Error("Not enough candles to backtest.");

  const step =
    series.find((set) => set.timeframe === input.stepTimeframe) ?? series[series.length - 1]!;
  const stepCandles = step.candles;
  const warmup = Math.max(20, Math.min(500, Math.round(input.warmup ?? 60)));
  const maxLookout = Math.max(10, Math.min(1000, Math.round(input.maxLookout ?? 200)));
  const maxSamples = Math.max(
    1,
    Math.min(MAX_SAMPLES_CAP, Math.round(input.maxSamples ?? DEFAULT_MAX_SAMPLES)),
  );
  const batchSize = Math.max(1, Math.min(8, Math.round(input.batchSize ?? DEFAULT_BATCH_SIZE)));

  if (stepCandles.length <= warmup + 10) {
    throw new Error(
      `Need more than ${warmup + 10} candles on ${step.timeframe} to run a walk-forward backtest.`,
    );
  }

  const indices = sampleIndices(warmup, stepCandles.length - 2, maxSamples);
  if (!indices.length) throw new Error("Not enough history to sample any steps.");

  let modelErrors = 0;

  type SampleOutcome = { index: number; setup: BacktestSetup | null };

  const results = await runBatched<number, SampleOutcome>(indices, batchSize, async (i) => {
    const now = stepCandles[i]!.time;

    // Snapshot every timeframe up to (and including) `now`: same no-lookahead
    // rule as the Den backtest, just recomputed per sample instead of via cursors,
    // since samples are non-contiguous and run out of order across batches.
    const snapshot: DataSeries[] = series.map((set) => ({
      timeframe: set.timeframe,
      candles: set.candles.filter((c) => c.time <= now),
    }));

    if (!snapshot.some((set) => set.candles.length >= 12)) {
      return { index: i, setup: null };
    }

    let result;
    try {
      result = await runAnalysisFromData({
        symbol: input.symbol,
        series: snapshot.filter((set) => set.candles.length >= 12),
        minRR: input.minRR,
        requireVolume: input.requireVolume,
        strictMode: input.strictMode,
        model: input.model ?? null,
      });
    } catch {
      modelErrors += 1;
      return { index: i, setup: null };
    }

    if (result.direction !== "POTENTIAL LONG" && result.direction !== "POTENTIAL SHORT") {
      return { index: i, setup: null };
    }
    const entry = priceOf(result.entry_zone);
    const stop = priceOf(result.stop_loss);
    const tp1 = priceOf(result.tp1);
    if (entry === null || stop === null || tp1 === null) return { index: i, setup: null };

    const future: Candle[] = stepCandles.slice(i + 1);
    const outcome = resolveOutcome(
      future,
      { direction: result.direction, entry, stop, tp1, tp2: priceOf(result.tp2) },
      maxLookout,
    );

    return {
      index: i,
      setup: {
        time: now,
        direction: result.direction,
        entry,
        stop,
        tp1,
        tp2: priceOf(result.tp2),
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
      },
    };
  });

  const setups = results
    .filter((r): r is SampleOutcome & { setup: BacktestSetup } => r.setup !== null)
    .map((r) => r.setup);

  return summarize(
    "ai",
    input.symbol,
    step.timeframe,
    series.map((set) => set.timeframe),
    indices.length,
    stepCandles[indices[0]!]?.time ?? null,
    stepCandles[indices[indices.length - 1]!]?.time ?? null,
    setups,
    { modelCallsMade: indices.length, modelErrors },
  );
}
