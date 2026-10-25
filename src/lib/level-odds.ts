/**
 * The chance of each price in a plan, with no edge either way, from the price
 * map's maths (docs/research/price-map.md: touch odds within 1 and 5 days came
 * true within about 2 points on 20 years of 50 markets). None of this knows the
 * direction. A read only beats these odds if its track record shows it, which
 * hitRecord measures.
 */
import { closedCandlesAt, timeframeMinutes } from "./freshness";
import { oddsTrades, type OddsRowLike } from "./odds-edge";
import { touchBefore, touchWithin } from "./price-map";

/** Trading days a pending entry gets to fill in the out-of-100 count. */
export const FILL_DAYS = 5;

export interface LevelChance {
  key: "entry" | "stop" | "tp1" | "tp2";
  label: string;
  price: number;
  /** Chance price trades at this level within 1 and within FILL_DAYS trading days. */
  day1: number | null;
  day5: number | null;
}

/** How often price trades at each level, starting from `now`. */
export function levelChances(
  now: number,
  sigma: number,
  levels: { entry: number | null; stop: number | null; tp1: number | null; tp2: number | null },
): LevelChance[] {
  const list = [
    ["entry", "Entry", levels.entry],
    ["stop", "Stop", levels.stop],
    ["tp1", "TP1", levels.tp1],
    ["tp2", "TP2", levels.tp2],
  ] as const;
  return list.flatMap(([key, label, price]) =>
    price !== null && price > 0
      ? [
          {
            key,
            label,
            price,
            day1: touchWithin(now, price, sigma, 1),
            day5: touchWithin(now, price, sigma, FILL_DAYS),
          },
        ]
      : [],
  );
}

export interface PlanOutcomes {
  /**
   * Chance the entry is reached within FILL_DAYS. Null without a current price
   * or daily data; the shares below then count only plans that fill.
   */
  fill: number | null;
  /** Shares of plans, adding up to 1. */
  tp1: number;
  stop: number;
  unfilled: number;
}

/**
 * What happens to plans like this one with no edge: the entry fills (or not)
 * within FILL_DAYS, then TP1 and the stop race from the entry. A random walk
 * forgets how it reached the entry, so the two chances multiply.
 */
export function planOutcomes(
  now: number | null,
  sigma: number | null,
  entry: number,
  stop: number,
  tp1: number,
): PlanOutcomes | null {
  const race = entry === stop ? null : touchBefore(entry, stop, tp1);
  if (race === null) return null;
  const fill =
    now !== null && now > 0 && sigma !== null && sigma > 0
      ? touchWithin(now, entry, sigma, FILL_DAYS)
      : null;
  const filled = fill ?? 1;
  return { fill, tp1: filled * race, stop: filled * (1 - race), unfilled: 1 - filled };
}

/**
 * Shares as counts out of 100, in steps of 5 (the odds are good to about 2
 * points, not 1), that still add up to 100: largest remainder first.
 */
export function outOf100(shares: number[]): number[] {
  const units = shares.map((share) => Math.max(0, share) * 20);
  const counts = units.map((u) => Math.floor(u + 1e-9));
  let left = 20 - counts.reduce((sum, c) => sum + c, 0);
  const order = units
    .map((u, i) => ({ rest: u - Math.floor(u + 1e-9), i }))
    .sort((a, b) => b.rest - a.rest);
  for (const { i } of order) {
    if (left <= 0) break;
    counts[i]! += 1;
    left -= 1;
  }
  return counts.map((c) => c * 5);
}

/** The last closed bar's close on the shortest timeframe at `nowMs`. Null without bars. */
export function latestClosedPrice(
  series: { timeframe: string; candles: { time: string; close: number }[] }[],
  nowMs: number,
): { price: number; time: string; timeframe: string } | null {
  const shortestFirst = [...series].sort(
    (a, b) => timeframeMinutes(a.timeframe) - timeframeMinutes(b.timeframe),
  );
  for (const set of shortestFirst) {
    const closed = closedCandlesAt(set.candles, set.timeframe, nowMs);
    const last = closed[closed.length - 1];
    if (last && last.close > 0) {
      return { price: last.close, time: last.time, timeframe: set.timeframe };
    }
  }
  return null;
}

export interface HitRecord {
  /** Finished wins and losses with valid levels. */
  trades: number;
  /** How often TP1 came first, and how often the odds for those levels said it would. */
  hitRate: number | null;
  oddsRate: number | null;
}

/** Past reads against the odds for their own levels. A description, never a verdict. */
export function hitRecord(rows: OddsRowLike[]): HitRecord {
  const { trades } = oddsTrades(rows);
  const n = trades.length;
  return {
    trades: n,
    hitRate: n ? trades.filter((t) => t.won).length / n : null,
    oddsRate: n ? trades.reduce((sum, t) => sum + t.odds, 0) / n : null,
  };
}

/** Backtest signals as journal-style rows: TP1 or TP2 first is a win, the stop a loss. */
export function setupRows(
  symbol: string,
  setups: {
    time: string;
    direction: string;
    entry: number;
    stop: number;
    tp1: number;
    outcome: string;
  }[],
): OddsRowLike[] {
  return setups.map((s) => ({
    created_at: s.time,
    asset: symbol,
    direction: s.direction,
    outcome:
      s.outcome === "TP1" || s.outcome === "TP2" ? "WIN" : s.outcome === "STOP" ? "LOSS" : "OPEN",
    entry_zone: String(s.entry),
    stop_loss: String(s.stop),
    tp1: String(s.tp1),
  }));
}
