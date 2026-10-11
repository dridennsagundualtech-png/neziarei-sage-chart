/**
 * Tiny scene language for the Breakthrough illustrations.
 *
 * A scene is a list of candles (written by hand with `k()` or generated with
 * `go()`), plus zones, lines and marks that point at candles by index or id.
 * Steps reveal the candles a few at a time, so a pattern can be watched forming.
 * Prices are arbitrary units: the chart scales itself.
 */

export type Tone = "bull" | "bear" | "warn" | "primary" | "muted";

/** A candle index, or the id given to a `k()` / `go()` item (resolves to its last candle). */
export type Ref = number | string;

export interface Candle {
  o: number;
  h: number;
  l: number;
  c: number;
}

export interface KItem extends Candle {
  type: "k";
  id?: string;
}

export interface GoItem {
  type: "go";
  to: number;
  n: number;
  id?: string;
  /** Noise around the straight path, 0 to 1. Default 0.6. */
  amp?: number;
}

export type Item = KItem | GoItem;

/** One hand-written candle. */
export function k(o: number, h: number, l: number, c: number, id?: string): KItem {
  return id === undefined ? { type: "k", o, h, l, c } : { type: "k", o, h, l, c, id };
}

/** Generate `n` candles that travel from the previous close to `to`. */
export function go(to: number, n: number, id?: string, amp?: number): GoItem {
  const item: GoItem = { type: "go", to, n };
  if (id !== undefined) item.id = id;
  if (amp !== undefined) item.amp = amp;
  return item;
}

export interface ZoneSpec {
  from: Ref;
  /** Defaults to the right edge of the chart. */
  to?: Ref;
  top: number;
  bottom: number;
  tone: Tone;
  label?: string;
  /** When to show it. Defaults to `from`. */
  appear?: Ref;
}

export interface LineSpec {
  y: number;
  /** End price for a sloped line (trendline). Sloped lines run from candle centre to candle centre. */
  y2?: number;
  from?: Ref;
  to?: Ref;
  label?: string;
  /** Put the label at the left end of the line instead of the right. */
  labelAt?: "start" | "end";
  tone?: Tone;
  dashed?: boolean;
  appear?: Ref;
}

export interface MarkSpec {
  at: Ref;
  y: number;
  text: string;
  tone?: Tone;
  /** Arrow pointing at the price: "up" sits under the price, "down" sits above it. */
  dir?: "up" | "down";
  appear?: Ref;
}

export interface SeriesSpec {
  name?: string;
  values: (number | null)[];
  tone?: Tone;
  dashed?: boolean;
}

/** Lower panel. For "bars" and "hist", series[0] is drawn as bars and any further series as lines. */
export interface PanelSpec {
  name: string;
  kind: "line" | "bars" | "hist";
  series: SeriesSpec[];
  levels?: number[];
  domain?: [number, number];
}

export interface ProfileSpec {
  /** Price bands with relative volume, drawn as a sideways histogram on the right. */
  bins: { top: number; bottom: number; w: number }[];
}

export interface StepSpec {
  upTo: Ref;
  text: string;
}

export interface SceneSpec {
  items: Item[];
  /** Price the first `go()` starts from when no candle comes before it. */
  start?: number;
  zones?: ZoneSpec[];
  lines?: LineSpec[];
  marks?: MarkSpec[];
  series?: SeriesSpec[] | ((candles: Candle[]) => SeriesSpec[]);
  panel?: PanelSpec | ((candles: Candle[]) => PanelSpec);
  profile?: ProfileSpec;
  steps: StepSpec[];
}

export interface BuiltScene {
  candles: Candle[];
  index: (ref: Ref | undefined, fallback: number) => number;
  series: SeriesSpec[];
  panel: PanelSpec | null;
}

function rng(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildScene(spec: SceneSpec): BuiltScene {
  const candles: Candle[] = [];
  const ids = new Map<string, number>();
  let prev = spec.start ?? 50;
  const first = spec.items[0];
  if (first && first.type === "k") prev = first.o;

  spec.items.forEach((item, ii) => {
    if (item.type === "k") {
      candles.push({ o: item.o, h: item.h, l: item.l, c: item.c });
      prev = item.c;
    } else {
      const rand = rng(ii * 7919 + item.n * 31 + Math.round(item.to * 10));
      const p0 = prev;
      const stepSize = Math.abs(item.to - p0) / item.n || 1;
      const amp = item.amp ?? 0.6;
      for (let i = 0; i < item.n; i++) {
        const target = p0 + ((item.to - p0) * (i + 1)) / item.n;
        const c = i === item.n - 1 ? item.to : target + (rand() - 0.5) * 2 * stepSize * amp;
        const o = prev;
        const base = Math.max(Math.abs(c - o) * 0.35, stepSize * 0.3);
        const h = Math.max(o, c) + base * (0.2 + rand());
        const l = Math.min(o, c) - base * (0.2 + rand());
        candles.push({ o, h, l, c });
        prev = c;
      }
    }
    if (item.id) ids.set(item.id, candles.length - 1);
  });

  const index = (ref: Ref | undefined, fallback: number) => {
    if (ref === undefined) return fallback;
    if (typeof ref === "number") return Math.max(0, Math.min(candles.length - 1, ref));
    const hit = ids.get(ref);
    if (hit === undefined) {
      if (import.meta.env.DEV) console.warn(`Breakthrough scene: unknown ref "${ref}"`);
      return fallback;
    }
    return hit;
  };

  const series = typeof spec.series === "function" ? spec.series(candles) : (spec.series ?? []);
  const panel = typeof spec.panel === "function" ? spec.panel(candles) : (spec.panel ?? null);
  return { candles, index, series, panel };
}

/* ---------- indicator helpers for scenes ---------- */

export const closes = (c: Candle[]) => c.map((x) => x.c);

export function sma(values: number[], period: number): (number | null)[] {
  return values.map((_, i) => {
    if (i < period - 1) return null;
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += values[j] ?? 0;
    return sum / period;
  });
}

export function ema(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = [];
  const kf = 2 / (period + 1);
  let prev: number | null = null;
  values.forEach((v, i) => {
    if (i < period - 1) {
      out.push(null);
      return;
    }
    if (prev === null) {
      const seed = values.slice(i - period + 1, i + 1);
      prev = seed.reduce((a, b) => a + b, 0) / period;
    } else {
      prev = v * kf + prev * (1 - kf);
    }
    out.push(prev);
  });
  return out;
}

export function rsi(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = [null];
  let gain = 0;
  let loss = 0;
  for (let i = 1; i < values.length; i++) {
    const d = (values[i] ?? 0) - (values[i - 1] ?? 0);
    const g = Math.max(d, 0);
    const l = Math.max(-d, 0);
    if (i <= period) {
      gain += g / period;
      loss += l / period;
      out.push(i === period ? 100 - 100 / (1 + gain / (loss || 1e-9)) : null);
    } else {
      gain = (gain * (period - 1) + g) / period;
      loss = (loss * (period - 1) + l) / period;
      out.push(100 - 100 / (1 + gain / (loss || 1e-9)));
    }
  }
  return out;
}

export function stdevBands(values: number[], period: number, mult: number) {
  const mid = sma(values, period);
  const up: (number | null)[] = [];
  const dn: (number | null)[] = [];
  values.forEach((_, i) => {
    const m = mid[i];
    if (m === null || m === undefined) {
      up.push(null);
      dn.push(null);
      return;
    }
    const slice = values.slice(i - period + 1, i + 1);
    const sd = Math.sqrt(slice.reduce((s, v) => s + (v - m) ** 2, 0) / period);
    up.push(m + mult * sd);
    dn.push(m - mult * sd);
  });
  return { mid, up, dn };
}

export function trueRange(c: Candle[]): number[] {
  return c.map((x, i) => {
    const pc = i > 0 ? (c[i - 1]?.c ?? x.o) : x.o;
    return Math.max(x.h - x.l, Math.abs(x.h - pc), Math.abs(x.l - pc));
  });
}

/** Pseudo volume for illustrations: bigger candles trade more. Not real data. */
export function rangeVolume(c: Candle[]): number[] {
  return c.map((x) => Math.max(0.2, x.h - x.l));
}

export function macd(values: number[]) {
  const fast = ema(values, 12);
  const slow = ema(values, 26);
  const line = values.map((_, i) => {
    const f = fast[i];
    const sl = slow[i];
    return f === null || f === undefined || sl === null || sl === undefined ? null : f - sl;
  });
  const firstIdx = line.findIndex((v) => v !== null);
  const sig: (number | null)[] = line.map(() => null);
  if (firstIdx >= 0) {
    const tail = ema(line.slice(firstIdx) as number[], 9);
    tail.forEach((v, j) => (sig[firstIdx + j] = v));
  }
  const hist = line.map((v, i) =>
    v === null || sig[i] === null || sig[i] === undefined ? null : v - (sig[i] as number),
  );
  return { line, signal: sig, hist };
}

/** Wilder-smoothed average true range. */
export function atr(c: Candle[], period: number): (number | null)[] {
  const tr = trueRange(c);
  const out: (number | null)[] = [];
  let prev: number | null = null;
  tr.forEach((v, i) => {
    if (i < period - 1) {
      out.push(null);
      return;
    }
    prev =
      prev === null
        ? tr.slice(0, period).reduce((a, b) => a + b, 0) / period
        : (prev * (period - 1) + v) / period;
    out.push(prev);
  });
  return out;
}

/** Volume-weighted average price from candle `from` onward, using the illustrative range volume. */
export function vwap(c: Candle[], from = 0): (number | null)[] {
  const vol = rangeVolume(c);
  let pv = 0;
  let vv = 0;
  return c.map((x, i) => {
    if (i < from) return null;
    const typical = (x.h + x.l + x.c) / 3;
    pv += typical * (vol[i] ?? 0);
    vv += vol[i] ?? 0;
    return vv ? pv / vv : null;
  });
}

/** Heikin Ashi candles from regular candles (averaged, so they are not real traded prices). */
export function heikinAshi(c: Candle[]): Candle[] {
  const out: Candle[] = [];
  c.forEach((x, i) => {
    const prev = out[i - 1];
    const hc = (x.o + x.h + x.l + x.c) / 4;
    const ho = prev ? (prev.o + prev.c) / 2 : (x.o + x.c) / 2;
    out.push({ o: ho, c: hc, h: Math.max(x.h, ho, hc), l: Math.min(x.l, ho, hc) });
  });
  return out;
}
