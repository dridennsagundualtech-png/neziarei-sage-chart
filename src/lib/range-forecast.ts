/**
 * Daily range forecasts: how far price is likely to travel in a day, from
 * closed daily bars only. Says nothing about direction.
 *
 * A day's range is ln(high / low), so symbols and price levels compare. Every
 * forecast is a median ("half of days move more than this"), made in log
 * space, with settings fixed before any testing:
 *   average  geometric mean of the last 20 ranges (what an ATR-style stop assumes)
 *   ewma     exponentially weighted mean of past log ranges, λ = 0.94 (RiskMetrics)
 *   har      Corsi's HAR model on log ranges (yesterday, last 5 days, last 22 days),
 *            refit by least squares on every earlier day
 * The forecast for day t only reads days before t.
 */

export const AVERAGE_DAYS = 20;
export const EWMA_LAMBDA = 0.94;
/** Days of HAR fitting before its first forecast. */
export const HAR_MIN_FIT = 250;
/** First day every model can forecast: 22 lags plus the HAR fit. */
export const FIRST_FORECAST = 22 + HAR_MIN_FIT;

export type RangeModel = "average" | "ewma" | "har";
export const RANGE_MODELS: RangeModel[] = ["average", "ewma", "har"];

/** Solves a small dense system by Gaussian elimination with partial pivoting. Null when singular. */
function solve(a: number[][], b: number[]): number[] | null {
  const n = b.length;
  const m = a.map((row, i) => [...row, b[i]!]);
  for (let col = 0; col < n; col += 1) {
    let pivot = col;
    for (let row = col + 1; row < n; row += 1) {
      if (Math.abs(m[row]![col]!) > Math.abs(m[pivot]![col]!)) pivot = row;
    }
    if (Math.abs(m[pivot]![col]!) < 1e-12) return null;
    [m[col], m[pivot]] = [m[pivot]!, m[col]!];
    for (let row = col + 1; row < n; row += 1) {
      const f = m[row]![col]! / m[col]![col]!;
      for (let k = col; k <= n; k += 1) m[row]![k]! -= f * m[col]![k]!;
    }
  }
  const x = Array<number>(n).fill(0);
  for (let row = n - 1; row >= 0; row -= 1) {
    let sum = m[row]![n]!;
    for (let k = row + 1; k < n; k += 1) sum -= m[row]![k]! * x[k]!;
    x[row] = sum / m[row]![row]!;
  }
  return x;
}

const mean = (list: number[], from: number, to: number) => {
  let sum = 0;
  for (let i = from; i < to; i += 1) sum += list[i]!;
  return sum / (to - from);
};

/**
 * Median range forecasts for every day, each from earlier days only. Index t
 * holds the forecast for day t (null before a model can forecast). Ranges must
 * be positive: ln(high / low) of consecutive trading days.
 */
export function forecastRanges(ranges: number[]): Record<RangeModel, (number | null)[]> {
  const logs = ranges.map((r) => Math.log(r));
  const n = logs.length;
  const out: Record<RangeModel, (number | null)[]> = {
    average: Array(n).fill(null),
    ewma: Array(n).fill(null),
    har: Array(n).fill(null),
  };

  let ewma: number | null = null;
  const xtx = [0, 1, 2, 3].map(() => [0, 0, 0, 0]);
  const xty = [0, 0, 0, 0];
  let fitted = 0;
  const features = (t: number) => [1, logs[t - 1]!, mean(logs, t - 5, t), mean(logs, t - 22, t)];

  for (let t = 0; t < n; t += 1) {
    if (t >= AVERAGE_DAYS) out.average[t] = Math.exp(mean(logs, t - AVERAGE_DAYS, t));

    // EWMA starts from the first 20-day mean and then folds in each closed day.
    if (t === AVERAGE_DAYS) ewma = mean(logs, 0, AVERAGE_DAYS);
    else if (ewma !== null) ewma = EWMA_LAMBDA * ewma + (1 - EWMA_LAMBDA) * logs[t - 1]!;
    if (ewma !== null) out.ewma[t] = Math.exp(ewma);

    // HAR: add day t-1 as a training row (its features only use days before it), then forecast day t.
    if (t - 1 >= 22) {
      const x = features(t - 1);
      for (let i = 0; i < 4; i += 1) {
        xty[i]! += x[i]! * logs[t - 1]!;
        for (let j = 0; j < 4; j += 1) xtx[i]![j]! += x[i]! * x[j]!;
      }
      fitted += 1;
    }
    if (t >= 22 && fitted >= HAR_MIN_FIT) {
      const beta = solve(xtx, xty);
      if (beta) {
        const x = features(t);
        out.har[t] = Math.exp(x.reduce((sum, v, i) => sum + v * beta[i]!, 0));
      }
    }
  }
  return out;
}

/** The q quantile (0 to 1) of a list, linearly interpolated. */
export function quantile(values: number[], q: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return sorted[lo]! + (sorted[hi]! - sorted[lo]!) * (pos - lo);
}
