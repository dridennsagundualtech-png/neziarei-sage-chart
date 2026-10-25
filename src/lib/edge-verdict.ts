/**
 * Does a set of backtested signals show an edge, or could luck have done as
 * well? Shared by the Backtest page, the Den track record on Market, Auto
 * Optimize and setup alerts.
 *
 * Each signal is replayed twice: as given, and mirrored (the same entry, stop
 * and target distances, opposite direction, same fill and cost rules). A coin
 * picks the side once per trading day (signals on the same day ride the same
 * move, so they are not separate bets), thousands of times, and shows how
 * often luck alone matches the real total. Rules, fixed in advance:
 *   fewer trades than it takes to see a +0.10R edge  → "thin"
 *   average R at or below zero                       → "none"
 *   no spread or commission charged                  → "unproven"
 *   tests not counted (older runs, log unreachable)  → "unproven"
 *   coin flip matches it more often than the bar     → "unproven"
 *   otherwise                                        → "edge"
 * The bar is 5% split across every test the app has logged (edge-checks.server.ts),
 * so trying more versions until one passes only makes passing harder.
 */

/** Never judge on fewer trades than this, whatever the spread of results. */
export const MIN_TRADES = 30;
/** The bar for a single test; split across every logged test. */
export const MAX_P = 0.05;
/** The edge size the trade count must be able to see. Real edges are small. */
export const REAL_EDGE_R = 0.1;
/** Chance of seeing a real +0.10R edge when there is one. */
const POWER = 0.8;
/** Spread of R per trade assumed until there are enough trades to measure it (a 1:2 trade). */
const DEFAULT_SD = Math.SQRT2;

export interface VerdictTrade {
  outcome: string;
  realizedR: number | null;
  mirrorOutcome?: string | null;
  mirrorR?: number | null;
  /** Signal time; trades on the same UTC day share one coin flip. */
  time?: string | null;
}

export type VerdictLevel = "edge" | "unproven" | "none" | "thin";

/** What a set of trades earned. Stored with each logged test so it can be judged again later. */
export interface VerdictStats {
  trades: number;
  avgR: number | null;
  /** Standard deviation of R per finished trade. */
  sdR: number | null;
  /** Share of coin-flip runs that did at least as well. Null when not measurable. */
  coinFlipP: number | null;
}

export interface VerdictOptions {
  /** Tests logged so far, this one included. Null when they could not be counted: never an edge. */
  tests: number | null;
  /** Spread and commission were charged. Without them, never an edge. */
  costs: boolean;
}

export interface EdgeVerdict extends VerdictStats {
  level: VerdictLevel;
  /** Finished trades it takes to see a +0.10R edge at this bar. */
  needed: number;
  /** The coin-flip share a result must beat. */
  bar: number;
  tests: number | null;
  headline: string;
}

/** A backtest's verdicts, judged on the server where the tests are logged. */
export interface BacktestVerdicts {
  /** Tests logged so far, this run's included. Null when the log was unreachable. */
  tests: number | null;
  costs: boolean;
  /** Every long or short read. */
  every: EdgeVerdict;
  /** Trades the app would have let you take; null when the engine records no gate. */
  approved: EdgeVerdict | null;
}

/**
 * The settings a Den track record uses: all stored history, the live analysis
 * window. Only a run with these and typical costs or more can vouch for an alert.
 */
export const TRACK_RECORD = {
  candleCount: 8000,
  warmup: 60,
  maxLookout: 200,
  analysisCandles: 150,
} as const;

const finished = (o: string | null | undefined) => o === "TP1" || o === "TP2" || o === "STOP";
const value = (o: string | null | undefined, r: number | null | undefined) =>
  finished(o) ? (r ?? 0) : 0;

/** Inverse of the standard normal CDF (Acklam's approximation, relative error about 1e-9). */
function normalQuantile(p: number): number {
  const a = [
    -39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716,
    2.506628277459239,
  ];
  const b = [
    -54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972,
    -13.28068155288572,
  ];
  const c = [
    -0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734,
    4.374664141464968, 2.938163982698783,
  ];
  const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
  const low = 0.02425;
  if (p < low) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (
      (((((c[0]! * q + c[1]!) * q + c[2]!) * q + c[3]!) * q + c[4]!) * q + c[5]!) /
      ((((d[0]! * q + d[1]!) * q + d[2]!) * q + d[3]!) * q + 1)
    );
  }
  if (p > 1 - low) return -normalQuantile(1 - p);
  const q = p - 0.5;
  const r = q * q;
  return (
    ((((((a[0]! * r + a[1]!) * r + a[2]!) * r + a[3]!) * r + a[4]!) * r + a[5]!) * q) /
    (((((b[0]! * r + b[1]!) * r + b[2]!) * r + b[3]!) * r + b[4]!) * r + 1)
  );
}

/** The coin-flip share a result must beat after this many tests. */
export function barFor(tests: number | null): number {
  return MAX_P / Math.max(1, tests ?? 1);
}

/** Finished trades it takes to see a +0.10R edge 80% of the time at this bar. */
export function tradesNeeded(sdR: number | null, tests: number | null): number {
  const z = normalQuantile(1 - barFor(tests)) + normalQuantile(POWER);
  const sd = sdR && sdR > 0 ? sdR : DEFAULT_SD;
  return Math.max(MIN_TRADES, Math.ceil(((z * sd) / REAL_EDGE_R) ** 2));
}

/**
 * Seeded, so the same backtest always gets the same verdict. One coin per UTC
 * day. Enough runs to measure shares well below the bar; the +1 keeps a run
 * that no coin flip matched from reading as impossible luck. A share already
 * ten times the bar stops early: it can't pass, now or after more tests.
 */
export function coinFlipP(trades: VerdictTrade[], bar = MAX_P): number | null {
  const usable = trades.filter((t) => finished(t.outcome) || finished(t.mirrorOutcome));
  if (usable.length === 0 || usable.some((t) => t.mirrorOutcome === undefined)) return null;
  const days = new Map<string, { real: number; mirror: number }>();
  usable.forEach((t, i) => {
    const key =
      t.time && !Number.isNaN(Date.parse(t.time))
        ? new Date(t.time).toISOString().slice(0, 10)
        : `#${i}`;
    const day = days.get(key) ?? { real: 0, mirror: 0 };
    day.real += value(t.outcome, t.realizedR);
    day.mirror += value(t.mirrorOutcome, t.mirrorR);
    days.set(key, day);
  });
  const reals = Float64Array.from(days.values(), (day) => day.real);
  const mirrors = Float64Array.from(days.values(), (day) => day.mirror);
  const real = reals.reduce((sum, v) => sum + v, 0);
  const runs = Math.min(200_000, Math.max(20_000, Math.ceil(20 / bar)));
  let seed = 20261024;
  // mulberry32; each 32-bit draw flips 32 coins
  const draw = () => {
    seed = (seed + 0x6d2b79f5) >>> 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (t ^ (t >>> 14)) >>> 0;
  };
  let atLeast = 0;
  let run = 0;
  for (; run < runs; run += 1) {
    let sum = 0;
    let bits = 0;
    for (let d = 0; d < reals.length; d += 1) {
      if ((d & 31) === 0) bits = draw();
      sum += bits & 1 ? reals[d]! : mirrors[d]!;
      bits >>>= 1;
    }
    if (sum >= real - 1e-9) atLeast += 1;
    if (run >= 2000 && (atLeast + 1) / (run + 2) > 10 * bar) {
      run += 1;
      break;
    }
  }
  return (atLeast + 1) / (run + 1);
}

/** Measures a set of trades. The coin flip only runs when there are enough trades to judge. */
export function verdictStats(trades: VerdictTrade[], tests: number | null): VerdictStats {
  const done = trades.filter((t) => finished(t.outcome));
  const n = done.length;
  const avgR = n ? done.reduce((sum, t) => sum + (t.realizedR ?? 0), 0) / n : null;
  const sdR =
    n >= 10 && avgR !== null
      ? Math.sqrt(done.reduce((sum, t) => sum + ((t.realizedR ?? 0) - avgR) ** 2, 0) / (n - 1))
      : null;
  const p =
    n >= tradesNeeded(sdR, tests) && avgR !== null && avgR > 0
      ? coinFlipP(trades, barFor(tests))
      : null;
  return { trades: n, avgR, sdR, coinFlipP: p };
}

const r2 = (v: number) =>
  Math.abs(v) < 0.005 ? "0.00R" : `${v > 0 ? "+" : "−"}${Math.abs(v).toFixed(2)}R`;

/** A share as plain text: "23%", "0.71%", "under 0.01%". */
export function shareText(v: number): string {
  if (v < 0.0001) return "under 0.01%";
  if (v < 0.01) return `${(v * 100).toFixed(2)}%`;
  return `${Math.round(v * 100)}%`;
}

/** Judges measured trades against the bar for this many tests. */
export function judge(stats: VerdictStats, options: VerdictOptions): EdgeVerdict {
  const { trades: n, avgR, coinFlipP: p } = stats;
  const tests = options.tests;
  const bar = barFor(tests);
  const needed = tradesNeeded(stats.sdR, tests);
  const base = { ...stats, needed, bar, tests };
  const per = avgR === null ? "" : `${r2(avgR)} per trade over ${n.toLocaleString("en-US")} trades`;
  if (n < needed) {
    return {
      ...base,
      level: "thin",
      headline: `Not enough history to judge: ${n.toLocaleString("en-US")} finished trade${n === 1 ? "" : "s"}. Seeing a +${REAL_EDGE_R.toFixed(2)}R edge takes about ${needed.toLocaleString("en-US")}.`,
    };
  }
  if (avgR! <= 0) {
    return {
      ...base,
      level: "none",
      headline: `No edge: ${per}, ${options.costs ? "after costs" : "even before costs"}.`,
    };
  }
  if (!options.costs) {
    return {
      ...base,
      level: "unproven",
      headline: `Not judged: ${per}, but no spread or commission was charged.`,
    };
  }
  if (tests === null) {
    return {
      ...base,
      level: "unproven",
      headline: `Not judged: ${per}, but this run's tests weren't counted, so the bar is unknown.`,
    };
  }
  const after = `${tests.toLocaleString("en-US")} test${tests === 1 ? "" : "s"}`;
  if (p === null || p > bar) {
    return {
      ...base,
      level: "unproven",
      headline: `Positive but not proven: ${per}${p === null ? "" : `; a coin flip on direction did as well ${shareText(p)} of the time, and after ${after} the bar is ${shareText(bar)}`}.`,
    };
  }
  return {
    ...base,
    level: "edge",
    headline: `Edge on this history: ${per}; a coin flip matched it ${shareText(p)} of the time, under the ${shareText(bar)} bar after ${after}.`,
  };
}

export function edgeVerdict(trades: VerdictTrade[], options: VerdictOptions): EdgeVerdict {
  return judge(verdictStats(trades, options.tests), options);
}
