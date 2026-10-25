/**
 * Price map: where price could realistically be, and how likely it is to touch
 * a level, from closed daily bars. It never picks a direction: every figure
 * treats up and down as equally likely, because no test found a way to tilt
 * them (docs/research/). The app shows only the parts that passed the
 * calibration check in docs/research/price-map.md.
 *
 * Settings are fixed in advance:
 *   volatility  EWMA of daily log returns, λ = 0.94 (RiskMetrics)
 *   bands       quantiles of the last 1,000 past moves measured in volatility
 *               units (at least 250, normal quantiles until then), so fat
 *               tails come from the data
 *   touch odds  driftless random-walk maths on log prices: a target and a stop
 *               race as stop / (stop + target); a level within n days is
 *               touched with chance 2 × (1 − Φ(distance / (σ√n)))
 */

export const VOL_LAMBDA = 0.94;
export const BAND_WINDOW = 1000;
export const MIN_BAND_OBS = 250;
/** Trading days ahead the map covers: tomorrow and one week. */
export const HORIZONS = [1, 5] as const;
const SEED_DAYS = 20;

/** Standard normal CDF (Abramowitz–Stegun 7.1.26, error below 1.5e-7). */
export function normalCdf(z: number): number {
  const t = 1 / (1 + 0.3275911 * (Math.abs(z) / Math.SQRT2));
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t *
      Math.exp(-(z * z) / 2);
  return z >= 0 ? 0.5 * (1 + y) : 0.5 * (1 - y);
}

/** Daily volatility at each close, from returns up to and including that close. Null for the first 20. */
export function ewmaSigmas(closes: number[]): (number | null)[] {
  const out: (number | null)[] = Array(closes.length).fill(null);
  let v: number | null = null;
  for (let i = 1; i < closes.length; i += 1) {
    const r = Math.log(closes[i]! / closes[i - 1]!);
    if (i === SEED_DAYS) {
      let sum = 0;
      for (let j = 1; j <= SEED_DAYS; j += 1) sum += Math.log(closes[j]! / closes[j - 1]!) ** 2;
      v = sum / SEED_DAYS;
    } else if (v !== null) v = VOL_LAMBDA * v + (1 - VOL_LAMBDA) * r * r;
    if (v !== null) out[i] = Math.sqrt(v);
  }
  return out;
}

/** The move from close t to close t + days, in volatility units known at t. Null where unknown. */
export function scaledMoves(
  closes: number[],
  sigmas: (number | null)[],
  days: number,
): (number | null)[] {
  return closes.map((close, t) => {
    const sigma = sigmas[t];
    const later = closes[t + days];
    return sigma && later ? Math.log(later / close) / (sigma * Math.sqrt(days)) : null;
  });
}

const NORMAL = { q10: -1.2816, q25: -0.6745, q75: 0.6745, q90: 1.2816 };

/** Linear-interpolated quantile of an ascending list. */
function sortedQuantile(sorted: number[], q: number): number {
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return sorted[lo]! + (sorted[hi]! - sorted[lo]!) * (pos - lo);
}

/** Band edges in volatility units from past moves (ascending); normal ones when there are too few. */
export function bandQuantiles(sortedPast: number[]) {
  if (sortedPast.length < MIN_BAND_OBS) return { ...NORMAL, fromHistory: false };
  return {
    q10: sortedQuantile(sortedPast, 0.1),
    q25: sortedQuantile(sortedPast, 0.25),
    q75: sortedQuantile(sortedPast, 0.75),
    q90: sortedQuantile(sortedPast, 0.9),
    fromHistory: true,
  };
}

export interface PriceBand {
  low: number;
  high: number;
}

export interface PriceMapHorizon {
  /** Trading days ahead. */
  days: number;
  /** Half of the time the close lands in here. */
  half: PriceBand;
  /** 8 times in 10 the close lands in here. */
  most: PriceBand;
}

export interface PriceMap {
  /** Stored symbol the bars came from. */
  symbol: string;
  /** Date of the last closed daily bar. */
  asOf: string;
  /** Last close. */
  price: number;
  /** Daily volatility as a fraction of price. */
  sigma: number;
  horizons: PriceMapHorizon[];
  /** Bands came from this market's own past moves, not the normal-curve fallback. */
  fromHistory: boolean;
}

/** The map from closed daily bars, oldest first. Null when there are too few. */
export function priceMap(symbol: string, bars: { time: string; close: number }[]): PriceMap | null {
  const days = bars.filter((bar) => {
    const weekday = new Date(`${bar.time.slice(0, 10)}T00:00:00Z`).getUTCDay();
    return weekday !== 0 && weekday !== 6 && bar.close > 0;
  });
  const closes = days.map((bar) => bar.close);
  const n = closes.length;
  const sigmas = ewmaSigmas(closes);
  const sigma = sigmas[n - 1];
  if (!sigma) return null;
  const price = closes[n - 1]!;
  let fromHistory = true;
  const horizons = HORIZONS.map((h) => {
    const past = scaledMoves(closes, sigmas, h)
      .slice(0, Math.max(0, n - h))
      .filter((z): z is number => z !== null)
      .slice(-BAND_WINDOW)
      .sort((a, b) => a - b);
    const q = bandQuantiles(past);
    fromHistory &&= q.fromHistory;
    const at = (z: number) => price * Math.exp(z * sigma * Math.sqrt(h));
    return {
      days: h,
      half: { low: at(q.q25), high: at(q.q75) },
      most: { low: at(q.q10), high: at(q.q90) },
    };
  });
  return { symbol, asOf: days[n - 1]!.time.slice(0, 10), price, sigma, horizons, fromHistory };
}

/** Chance the target is touched before the stop, with no edge either way. */
export function touchBefore(entry: number, stop: number, target: number): number | null {
  if (!(entry > 0 && stop > 0 && target > 0)) return null;
  const toStop = Math.abs(Math.log(stop / entry));
  const toTarget = Math.abs(Math.log(target / entry));
  if (toStop + toTarget === 0) return null;
  return toStop / (toStop + toTarget);
}

/** Chance a level is touched at some point within `days` trading days. */
export function touchWithin(
  entry: number,
  level: number,
  sigma: number,
  days: number,
): number | null {
  if (!(entry > 0 && level > 0 && sigma > 0 && days > 0)) return null;
  const distance = Math.abs(Math.log(level / entry)) / (sigma * Math.sqrt(days));
  return Math.min(1, 2 * (1 - normalCdf(distance)));
}
