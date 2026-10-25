/**
 * Typical daily range: how far price usually travels between a day's high and
 * low, from closed daily bars. It describes a typical day; it isn't a forecast
 * of direction, and no test found a range forecast that clearly beats this
 * plain average (docs/research/range-forecast.md).
 *
 * The middle figure is the geometric mean of the last 20 daily ranges, so about
 * half of days move more. The band comes from how far that same average missed
 * on up to 250 earlier days: 8 in 10 days landed inside it. Across ~14,000
 * symbol-days in three periods, a band built this way held on 78–81% of days.
 */
import { AVERAGE_DAYS, quantile } from "./range-forecast";

export interface TypicalMove {
  /** Stored symbol the bars came from, e.g. "XAUUSD.r". */
  symbol: string;
  /** Date of the last closed daily bar used. */
  asOf: string;
  /** High-to-low distance in price on a typical day. */
  median: number;
  /** 8 in 10 days moved between low and high. */
  low: number;
  high: number;
  /** Earlier days the band was built from. */
  days: number;
}

const BAND_DAYS = 250;
const MIN_BAND_DAYS = 60;

interface DailyBar {
  time: string;
  high: number;
  low: number;
  close: number;
}

/** Null when there aren't enough closed weekday bars. Bars must be oldest first and closed. */
export function typicalMove(symbol: string, bars: DailyBar[]): TypicalMove | null {
  const days = bars.filter((bar) => {
    const weekday = new Date(`${bar.time.slice(0, 10)}T00:00:00Z`).getUTCDay();
    return weekday !== 0 && weekday !== 6 && bar.high > bar.low && bar.low > 0;
  });
  const n = days.length;
  if (n < AVERAGE_DAYS + MIN_BAND_DAYS) return null;

  // Work in log ranges: the 20-day forecast is the mean of the last 20 logs.
  const logs = days.map((bar) => Math.log(Math.log(bar.high / bar.low)));
  const forecast = (t: number) => {
    let sum = 0;
    for (let i = t - AVERAGE_DAYS; i < t; i += 1) sum += logs[i]!;
    return sum / AVERAGE_DAYS;
  };
  const misses: number[] = [];
  for (let t = Math.max(AVERAGE_DAYS, n - BAND_DAYS); t < n; t += 1) {
    misses.push(logs[t]! - forecast(t));
  }

  const next = forecast(n);
  const close = days[n - 1]!.close;
  const toPrice = (logRange: number) => close * (Math.exp(Math.exp(logRange)) - 1);
  return {
    symbol,
    asOf: days[n - 1]!.time.slice(0, 10),
    median: toPrice(next),
    low: toPrice(next + quantile(misses, 0.1)),
    high: toPrice(next + quantile(misses, 0.9)),
    days: misses.length,
  };
}
