/**
 * Time-series momentum (trend-following), as tested by Moskowitz, Ooi &
 * Pedersen (2012) and Hurst, Ooi & Pedersen (2017): at each month end, go long
 * a market whose price rose over the past 12 months and short one that fell,
 * sized so every market carries the same expected risk, and hold one month.
 *
 * Settings are fixed in advance. Each signal only reads bars up to its own
 * month end; the month it trades is used only to score the trade.
 */

export interface DailyClose {
  /** Broker date, YYYY-MM-DD, weekdays only, oldest first. */
  date: string;
  close: number;
}

export interface TrendTrade {
  /** Month held, YYYY-MM. */
  month: string;
  /** 1 long, -1 short. */
  sign: 1 | -1;
  /** Simple price return over the month held. */
  ret: number;
  /** Expected one-month standard deviation of returns at entry, as a fraction. */
  sigma: number;
  /** Close at entry. */
  entry: number;
  /** Calendar days held. */
  days: number;
}

export const LOOKBACK_MONTHS = 12;
/** EWMA of squared daily log returns with a 60-day centre of mass. */
export const VOL_LAMBDA = 60 / 61;
/** Daily returns needed before a signal's volatility counts. */
export const MIN_VOL_DAYS = 120;
const DAYS_PER_MONTH = 21;
/** A month end more than this many days after the previous one means a data gap: skip. */
const MAX_HOLD_DAYS = 45;

const DAY = 86_400_000;
const daysBetween = (a: string, b: string) =>
  Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / DAY);

/** Index of the last bar of each calendar month. */
export function monthEnds(bars: DailyClose[]): number[] {
  const out: number[] = [];
  bars.forEach((bar, i) => {
    const next = bars[i + 1];
    if (!next || next.date.slice(0, 7) !== bar.date.slice(0, 7)) out.push(i);
  });
  return out;
}

/** One trade per month end that has 12 months of history, enough volatility history and a next month end. */
export function trendTrades(bars: DailyClose[]): TrendTrade[] {
  const ends = monthEnds(bars);
  // Ex-ante variance at each bar, from returns up to and including that bar.
  const variance: (number | null)[] = Array(bars.length).fill(null);
  let v: number | null = null;
  for (let i = 1; i < bars.length; i += 1) {
    const r = Math.log(bars[i]!.close / bars[i - 1]!.close);
    if (i === 20) {
      let sum = 0;
      for (let j = 1; j <= 20; j += 1) sum += Math.log(bars[j]!.close / bars[j - 1]!.close) ** 2;
      v = sum / 20;
    } else if (v !== null) v = VOL_LAMBDA * v + (1 - VOL_LAMBDA) * r * r;
    if (i >= MIN_VOL_DAYS) variance[i] = v;
  }

  const trades: TrendTrade[] = [];
  for (let k = LOOKBACK_MONTHS; k < ends.length - 1; k += 1) {
    const now = ends[k]!;
    const then = ends[k - LOOKBACK_MONTHS]!;
    const next = ends[k + 1]!;
    const held = daysBetween(bars[now]!.date, bars[next]!.date);
    const v = variance[now];
    if (v == null || v <= 0 || held > MAX_HOLD_DAYS) continue;
    const past = bars[now]!.close / bars[then]!.close - 1;
    if (past === 0) continue;
    trades.push({
      month: bars[next]!.date.slice(0, 7),
      sign: past > 0 ? 1 : -1,
      ret: bars[next]!.close / bars[now]!.close - 1,
      sigma: Math.sqrt(v * DAYS_PER_MONTH),
      entry: bars[now]!.close,
      days: held,
    });
  }
  return trades;
}

/** MT5 symbol costs, as mt5_export_history.py saves them to symbols.csv. */
export interface SymbolCosts {
  /** MT5 swap mode: 0 off, 1 points, 2 base currency, 3 margin currency, 4 deposit currency, 5/6 annual %. */
  swapMode: number;
  swapLong: number;
  swapShort: number;
  point: number;
  contractSize: number;
  /** Current spread in points. */
  spread: number;
  /** Current bid, to turn the spread into a fraction of price. */
  bid: number;
  /** Charged a raw-account commission ($6 per lot per round trip, about 0.006% of notional). */
  commission: boolean;
  /**
   * Swap modes 2 and 3 charge money per lot. When that money is the quote
   * currency (an index or commodity: US30 is USD/USD), a lot is worth
   * contract × price; when it's the traded currency itself (EUR in EURUSD), a
   * lot is the contract size.
   */
  swapMoneyIsQuote: boolean;
  /** Round-trip spread as a fraction of price. When set, used instead of spread × point / bid. */
  spreadFraction?: number | null;
}

/** Round trip cost as a fraction of price: the spread (capped at 0.5%, in case it was read off-hours) plus commission. */
export function roundTripCost(c: SymbolCosts): number {
  const spread =
    c.spreadFraction != null
      ? c.spreadFraction
      : c.bid > 0
        ? Math.min((c.spread * c.point) / c.bid, 0.005)
        : 0.005;
  return spread + (c.commission ? 0.00006 : 0);
}

/**
 * Financing for holding one month, as a fraction of the entry price: positive
 * is a credit, negative a cost. Today's swap rates are applied to every month.
 * Null when the swap mode isn't one of the known ones.
 */
export function monthlySwap(
  c: SymbolCosts,
  sign: 1 | -1,
  entry: number,
  days: number,
): number | null {
  const swap = sign === 1 ? c.swapLong : c.swapShort;
  let perDay: number;
  switch (c.swapMode) {
    case 0:
      perDay = 0;
      break;
    case 1:
      perDay = (swap * c.point) / entry;
      break;
    case 2:
    case 3:
      perDay = swap / (c.contractSize * (c.swapMoneyIsQuote ? entry : 1));
      break;
    case 4:
      // Approximation: the deposit-currency amount is treated as quote-currency money.
      perDay = swap / (c.contractSize * entry);
      break;
    case 5:
    case 6:
      perDay = swap / 100 / 360;
      break;
    default:
      return null;
  }
  return perDay * days;
}
