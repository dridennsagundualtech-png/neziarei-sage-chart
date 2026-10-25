/**
 * Session VWAP (volume-weighted average price) for the Den's VWAP side rule.
 *
 * VWAP = Σ(typical price × volume) / Σ volume, where typical price is
 * (high + low + close) / 3, over the bars of the current trading day so far.
 * The day starts where the stored daily candles start (the broker's midnight,
 * which the stored times share). Forex and CFD feeds only carry tick volume,
 * so this is the tick-volume VWAP an MT5 chart shows, not exchange volume.
 *
 * Fixed in advance, nothing to tune: the anchor is the start of the day and
 * the bars are the shortest timeframe, which must be H1 or shorter.
 */
import { timeframeMinutes } from "./freshness";
import type { Direction } from "./analysis-types";

export interface SessionVwap {
  /** The day's VWAP so far. */
  vwap: number;
  /** The last closed bar's close, which the side is measured from. */
  close: number;
  side: "above" | "below" | "at";
  timeframe: string;
  /** Bars of the day that went into it. */
  bars: number;
}

/** The longest timeframe a day's VWAP is built from. */
export const VWAP_MAX_MINUTES = 60;

/** The day's VWAP from closed bars (oldest first). Null without tick volume or bars short enough. */
export function sessionVwap(
  candles: { time: string; high: number; low: number; close: number; volume: number | null }[],
  timeframe: string,
): SessionVwap | null {
  if (timeframeMinutes(timeframe) > VWAP_MAX_MINUTES) return null;
  const last = candles[candles.length - 1];
  if (!last) return null;
  const day = last.time.slice(0, 10);
  let priceVolume = 0;
  let volume = 0;
  let bars = 0;
  for (let i = candles.length - 1; i >= 0 && candles[i]!.time.slice(0, 10) === day; i -= 1) {
    const bar = candles[i]!;
    const v = bar.volume ?? 0;
    priceVolume += ((bar.high + bar.low + bar.close) / 3) * v;
    volume += v;
    bars += 1;
  }
  if (!(volume > 0)) return null;
  const vwap = priceVolume / volume;
  return {
    vwap,
    close: last.close,
    side: last.close > vwap ? "above" : last.close < vwap ? "below" : "at",
    timeframe,
    bars,
  };
}

/**
 * The VWAP side rule: a long needs the last close above the day's VWAP, a
 * short below it. Returns why a plan fails, or null when it passes (or isn't
 * a long or short, which other rules handle).
 */
export function vwapSideIssue(
  direction: Direction,
  vwap: SessionVwap | null,
  format: (price: number) => string,
): string | null {
  const long = direction === "POTENTIAL LONG";
  if (!long && direction !== "POTENTIAL SHORT") return null;
  if (!vwap) {
    return "VWAP side rule: today's VWAP couldn't be measured (it needs tick volume on an H1 or shorter timeframe).";
  }
  const wanted = long ? "above" : "below";
  if (vwap.side === wanted) return null;
  return `VWAP side rule: a ${long ? "long" : "short"} needs price ${wanted} today's VWAP; the last close ${format(vwap.close)} is ${vwap.side === "at" ? "on" : vwap.side} it (${format(vwap.vwap)}).`;
}
