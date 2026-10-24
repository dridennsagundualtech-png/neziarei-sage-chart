/**
 * Volume profile of one trading day from small candles (M15 is ideal).
 *
 * Retail FX and metal feeds carry tick volume (how often the price changed),
 * not exchange volume, and candles don't say where inside their range the
 * trading happened. So each candle's volume is spread evenly over its
 * high–low range on a grid of BINS steps across the day. Good enough for
 * daily levels; not a substitute for a real exchange profile.
 *
 * Context only: the fade, 80%-rule and breakout strategies built on these
 * levels lost money in testing (2019–2022, 5 symbols), so nothing here
 * produces a signal.
 */

export interface ProfileCandle {
  time: string;
  high: number;
  low: number;
  volume: number | null;
}

export interface DayProfile {
  /** Broker day, YYYY-MM-DD as stamped on the candles. */
  day: string;
  /** Point of control: the price with the most volume. */
  poc: number;
  /** Value area high / low: the band holding 70% of the day's volume. */
  vah: number;
  val: number;
}

const BINS = 100;
const VALUE_SHARE = 0.7;

export function dayProfile(candles: ProfileCandle[]): Omit<DayProfile, "day"> | null {
  if (candles.length === 0) return null;
  const lo = Math.min(...candles.map((c) => c.low));
  const hi = Math.max(...candles.map((c) => c.high));
  if (!(hi > lo)) return null;
  const step = (hi - lo) / BINS;
  const vol = new Array<number>(BINS).fill(0);
  for (const c of candles) {
    const v = c.volume ?? 0;
    if (!(v > 0)) continue;
    const span = c.high - c.low;
    if (span <= 0) {
      vol[Math.min(BINS - 1, Math.floor((c.low - lo) / step))]! += v;
      continue;
    }
    const first = Math.max(0, Math.floor((c.low - lo) / step));
    const last = Math.min(BINS - 1, Math.floor((c.high - lo) / step));
    for (let b = first; b <= last; b += 1) {
      const overlap = Math.min(c.high, lo + (b + 1) * step) - Math.max(c.low, lo + b * step);
      if (overlap > 0) vol[b]! += (v * overlap) / span;
    }
  }
  const total = vol.reduce((a, b) => a + b, 0);
  if (total <= 0) return null;

  const poc = vol.indexOf(Math.max(...vol));
  let a = poc;
  let b = poc;
  let inside = vol[poc]!;
  // Grow from the POC, each time adding the fuller neighbouring step.
  while (inside < VALUE_SHARE * total && (a > 0 || b < BINS - 1)) {
    const up = b < BINS - 1 ? vol[b + 1]! : -1;
    const down = a > 0 ? vol[a - 1]! : -1;
    if (up >= down) inside += vol[++b]!;
    else inside += vol[--a]!;
  }
  return { poc: lo + (poc + 0.5) * step, vah: lo + (b + 1) * step, val: lo + a * step };
}

/**
 * Profile of the most recent day that has fully ended by `nowMs`. Candle
 * times are the broker's clock, so a day counts as ended 24h after its stamp,
 * which is never early.
 */
export function lastCompleteDayProfile(
  candles: ProfileCandle[],
  nowMs: number,
  minCandles = 8,
): DayProfile | null {
  const days = new Map<string, ProfileCandle[]>();
  for (const c of candles) {
    const day = c.time.slice(0, 10);
    const list = days.get(day);
    if (list) list.push(c);
    else days.set(day, [c]);
  }
  const ended = [...days.keys()]
    .filter((day) => Date.parse(`${day}T00:00:00Z`) + 86_400_000 <= nowMs)
    .sort();
  for (let i = ended.length - 1; i >= 0; i -= 1) {
    const list = days.get(ended[i]!)!;
    if (list.length < minCandles) continue; // a stub Sunday open is not a day
    const p = dayProfile(list);
    if (p) return { day: ended[i]!, ...p };
  }
  return null;
}
