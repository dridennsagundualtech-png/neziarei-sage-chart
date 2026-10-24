/**
 * Does a set of backtested signals show an edge, or could a coin flip have done
 * as well? Shared by the Backtest page and the Den track record on Market.
 *
 * Each signal is replayed twice: as given, and mirrored (the same entry, stop
 * and target distances, opposite direction, same fill and cost rules). Picking
 * the side by coin flip thousands of times shows how often luck alone matches
 * the real total. Rules, fixed in advance:
 *   fewer than MIN_TRADES finished trades → "thin" (not enough to judge)
 *   average R at or below zero            → "none"
 *   coin flip matches it more than 5%     → "unproven"
 *   otherwise                             → "edge"
 */

export const MIN_TRADES = 30;
export const MAX_P = 0.05;

export interface VerdictTrade {
  outcome: string;
  realizedR: number | null;
  mirrorOutcome?: string | null;
  mirrorR?: number | null;
}

export type VerdictLevel = "edge" | "unproven" | "none" | "thin";

export interface EdgeVerdict {
  level: VerdictLevel;
  trades: number;
  avgR: number | null;
  /** Share of coin-flip runs that did at least as well. Null when not measurable. */
  coinFlipP: number | null;
  headline: string;
}

const finished = (o: string | null | undefined) => o === "TP1" || o === "TP2" || o === "STOP";
const value = (o: string | null | undefined, r: number | null | undefined) =>
  finished(o) ? (r ?? 0) : 0;

/** Seeded, so the same backtest always gets the same verdict. */
export function coinFlipP(trades: VerdictTrade[], runs = 4000): number | null {
  const usable = trades.filter((t) => finished(t.outcome) || finished(t.mirrorOutcome));
  if (usable.length === 0 || usable.some((t) => t.mirrorOutcome === undefined)) return null;
  const real = usable.reduce((sum, t) => sum + value(t.outcome, t.realizedR), 0);
  let seed = 20261024;
  const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32;
  let atLeast = 0;
  for (let run = 0; run < runs; run += 1) {
    let sum = 0;
    for (const t of usable) {
      sum += rnd() < 0.5 ? value(t.outcome, t.realizedR) : value(t.mirrorOutcome, t.mirrorR);
    }
    if (sum >= real - 1e-9) atLeast += 1;
  }
  return atLeast / runs;
}

const r2 = (v: number) =>
  Math.abs(v) < 0.005 ? "0.00R" : `${v > 0 ? "+" : "−"}${Math.abs(v).toFixed(2)}R`;

export function edgeVerdict(trades: VerdictTrade[]): EdgeVerdict {
  const done = trades.filter((t) => finished(t.outcome));
  const n = done.length;
  const avgR = n ? done.reduce((sum, t) => sum + (t.realizedR ?? 0), 0) / n : null;
  const p = n ? coinFlipP(trades) : null;
  const per = avgR === null ? "" : `${r2(avgR)} per trade over ${n} trades`;
  if (n < MIN_TRADES) {
    return {
      level: "thin",
      trades: n,
      avgR,
      coinFlipP: p,
      headline: `Not enough history to judge: ${n} finished trade${n === 1 ? "" : "s"}, ${MIN_TRADES} needed.`,
    };
  }
  if (avgR! <= 0) {
    return {
      level: "none",
      trades: n,
      avgR,
      coinFlipP: p,
      headline: `No edge: ${per}, after costs.`,
    };
  }
  if (p === null || p > MAX_P) {
    return {
      level: "unproven",
      trades: n,
      avgR,
      coinFlipP: p,
      headline: `Positive but not proven: ${per}${p === null ? "" : `, and a coin flip on direction did as well ${Math.round(p * 100)}% of the time`}.`,
    };
  }
  return {
    level: "edge",
    trades: n,
    avgR,
    coinFlipP: p,
    headline: `Edge on this history: ${per}; a coin flip matched it ${p < 0.01 ? "under 1%" : `only ${Math.round(p * 100)}%`} of the time.`,
  };
}
