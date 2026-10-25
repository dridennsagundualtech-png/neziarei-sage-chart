/**
 * Your edge against the odds: each finished journal trade is compared with the
 * price map's no-edge odds for its own levels. With no edge, TP1 comes before
 * the stop with chance stop / (stop + target) on log distances (checked on 20
 * years of 50 markets, docs/research/price-map.md), so beating that rate over
 * many trades is what an edge looks like.
 *
 * Counted: WIN (TP1 first) and LOSS (stop first) trades, long or short, with
 * valid levels. Breakevens and open, missed or invalidated trades don't settle
 * the race, so they're left out (and the number left out is shown).
 *
 * Each trade scores R from its own levels: +reward/risk for a win, −1 for a
 * loss; with no edge it expects p × (reward/risk + 1) − 1. The luck check
 * replays every trade winning only with its own odds, 20,000 times; trades on
 * the same day, symbol and side share one draw, since they ride the same move.
 * Verdict rules match the rest of the app: enough trades to see a +0.10R edge,
 * a positive margin, and luck matching it less often than the bar. A trader
 * looks at this again and again as trades come in, so the bar is 1%, not 5%.
 */
import { barFor, shareText, tradesNeeded, type VerdictLevel } from "./edge-verdict";
import { touchBefore } from "./price-map";
import { checkPlan, midpointOf } from "./stats";

/** 1% = 5% split five ways: an allowance for checking the verdict over and over. */
export const ODDS_TESTS = 5;
const RUNS = 20_000;

export interface OddsRowLike {
  created_at: string;
  asset: string;
  direction: string;
  outcome: string;
  entry_zone: string | null;
  stop_loss: string | null;
  tp1: string | null;
}

export interface OddsTrade {
  won: boolean;
  /** No-edge chance TP1 comes first. */
  odds: number;
  /** Reward over risk, from the levels. */
  reward: number;
  /** Trades sharing this key ride the same move. */
  cluster: string;
  asset: string;
  created_at: string;
}

/** The trades that settled the race, and how many finished ones couldn't be counted. */
export function oddsTrades(rows: OddsRowLike[]): { trades: OddsTrade[]; leftOut: number } {
  const trades: OddsTrade[] = [];
  let leftOut = 0;
  for (const row of rows) {
    if (row.outcome === "OPEN") continue;
    const settled = row.outcome === "WIN" || row.outcome === "LOSS";
    const side = /LONG/.test(row.direction) ? "long" : /SHORT/.test(row.direction) ? "short" : null;
    const entry = midpointOf(row.entry_zone);
    const stop = midpointOf(row.stop_loss);
    const tp1 = midpointOf(row.tp1);
    const odds =
      entry !== null && stop !== null && tp1 !== null ? touchBefore(entry, stop, tp1) : null;
    const valid =
      side && odds !== null && checkPlan(row.direction, row.entry_zone, row.stop_loss, row.tp1).ok;
    if (!settled || !valid) {
      if (row.outcome !== "NO TRADE") leftOut += 1;
      continue;
    }
    trades.push({
      won: row.outcome === "WIN",
      odds: odds!,
      reward: Math.abs(tp1! - entry!) / Math.abs(entry! - stop!),
      cluster: `${row.created_at.slice(0, 10)}|${row.asset}|${side}`,
      asset: row.asset,
      created_at: row.created_at,
    });
  }
  return { trades, leftOut };
}

const score = (t: OddsTrade) => (t.won ? t.reward : -1);
const expected = (t: OddsTrade) => t.odds * (t.reward + 1) - 1;

/** Share of no-edge replays that did at least as well, +1 corrected; seeded, so it never changes. */
export function luckShare(trades: OddsTrade[]): number | null {
  if (!trades.length) return null;
  const clusters = [...new Set(trades.map((t) => t.cluster))];
  const index = new Map(clusters.map((c, i) => [c, i]));
  const real = trades.reduce((sum, t) => sum + score(t), 0);
  let seed = 20261025;
  const rnd = () => {
    seed = (seed + 0x6d2b79f5) >>> 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 2 ** 32;
  };
  const draws = new Float64Array(clusters.length);
  let atLeast = 0;
  for (let run = 0; run < RUNS; run += 1) {
    for (let i = 0; i < draws.length; i += 1) draws[i] = rnd();
    let sum = 0;
    for (const t of trades) sum += draws[index.get(t.cluster)!]! < t.odds ? t.reward : -1;
    if (sum >= real - 1e-9) atLeast += 1;
  }
  return (atLeast + 1) / (RUNS + 1);
}

export interface OddsEdge {
  level: VerdictLevel;
  trades: number;
  leftOut: number;
  /** Trades it takes to see a +0.10R edge at this bar. */
  needed: number;
  /** How often TP1 actually came first, and how often the odds said it would. */
  hitRate: number | null;
  oddsRate: number | null;
  /** Average R per trade above what the odds expect. */
  marginR: number | null;
  luck: number | null;
  bar: number;
  headline: string;
}

const pct = (v: number) => `${Math.round(v * 100)}%`;

export function oddsEdge(rows: OddsRowLike[]): OddsEdge {
  const { trades, leftOut } = oddsTrades(rows);
  const n = trades.length;
  const bar = barFor(ODDS_TESTS);
  const scores = trades.map(score);
  const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
  const sd =
    n >= 10 ? Math.sqrt(scores.reduce((s, x) => s + (x - mean(scores)) ** 2, 0) / (n - 1)) : null;
  const needed = tradesNeeded(sd, ODDS_TESTS);
  const hitRate = n ? trades.filter((t) => t.won).length / n : null;
  const oddsRate = n ? mean(trades.map((t) => t.odds)) : null;
  const marginR = n ? mean(scores) - mean(trades.map(expected)) : null;
  const base = { trades: n, leftOut, needed, hitRate, oddsRate, marginR, bar };
  const vs =
    hitRate !== null && oddsRate !== null
      ? `TP1 came first ${pct(hitRate)} of the time; the odds said ${pct(oddsRate)}`
      : "";

  if (n < needed) {
    return {
      ...base,
      luck: null,
      level: "thin",
      headline: n
        ? `Not enough trades to judge yet: ${n} counted, and seeing a +0.10R edge takes about ${needed.toLocaleString("en-US")}. So far, ${vs}.`
        : "No finished wins or losses with valid levels yet.",
    };
  }
  if (marginR! <= 0) {
    return { ...base, luck: null, level: "none", headline: `Not beating the odds: ${vs}.` };
  }
  const luck = luckShare(trades);
  if (luck === null || luck > bar) {
    return {
      ...base,
      luck,
      level: "unproven",
      headline: `Ahead of the odds, not proven: ${vs}, and luck alone did as well ${luck === null ? "too often" : `${shareText(luck)} of the time`}.`,
    };
  }
  return {
    ...base,
    luck,
    level: "edge",
    headline: `Beating the odds: ${vs} over ${n.toLocaleString("en-US")} trades, and luck alone matched it only ${shareText(luck)} of the time.`,
  };
}

export interface OddsGroup {
  label: string;
  trades: number;
  hitRate: number;
  oddsRate: number;
}

/** Groups with at least `min` counted trades: description, never a verdict. */
export function oddsGroups(
  rows: OddsRowLike[],
  keyOf: (trade: OddsTrade) => string,
  min = 20,
): OddsGroup[] {
  const groups = new Map<string, OddsTrade[]>();
  for (const trade of oddsTrades(rows).trades) {
    const key = keyOf(trade);
    groups.set(key, [...(groups.get(key) ?? []), trade]);
  }
  return [...groups.entries()]
    .filter(([, list]) => list.length >= min)
    .map(([label, list]) => ({
      label,
      trades: list.length,
      hitRate: list.filter((t) => t.won).length / list.length,
      oddsRate: list.reduce((s, t) => s + t.odds, 0) / list.length,
    }))
    .sort((a, b) => b.trades - a.trades);
}
