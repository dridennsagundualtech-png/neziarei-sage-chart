// Run: bun scripts/price-map-study.ts <history folder>
//
// Do the price map's numbers come true as often as they say? Written and
// committed before it was run on the data; change nothing here after seeing
// results.
//
// Data: every SYMBOL_D1.csv in the folder (mt5_export_history.py), weekdays
// with high > low > 0. Every figure is made at a day's close from that close
// and earlier, then checked against the bars that follow (src/lib/price-map.ts).
//
// Three claims, each checked pooled across all markets and both directions:
//   1. Bands: the close 1 and 5 trading days later lands inside the half band
//      50% of the time and inside the 8-in-10 band 80% of the time.
//   2. Race: with the stop k and the target m daily volatilities away
//      (k = 0.5, 1, 2; m = 1, 2, 4), long and short from every close, the
//      target is touched first with chance k / (k + m). Daily bars follow until
//      one is touched (at most 60); a day touching both counts as half, since
//      the order inside a day is unknown; never-touched races are left out.
//   3. Reach: a level x volatilities × √n away (x = 0.5, 1, 1.5; n = 1, 5),
//      up and down, is touched within n days with chance 2 × (1 − Φ(x)).
//
// A claim passes when every one of its cells is within 3 percentage points of
// what it promised. Only claims that pass are shown in the app. Rows by group
// and by period (before 2016 and from 2016) are description only.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import {
  BAND_WINDOW,
  HORIZONS,
  bandQuantiles,
  ewmaSigmas,
  normalCdf,
  scaledMoves,
} from "../src/lib/price-map";

const TOLERANCE = 0.03;
const WARMUP = 300;
const RACE_DAYS = 60;
const STOPS = [0.5, 1, 2];
const TARGETS = [1, 2, 4];
const REACH = [0.5, 1, 1.5];
const SPLIT = "2016-01-01";
const METALS = ["XAU", "XAG", "XPT", "XPD"];

interface Bar {
  date: string;
  high: number;
  low: number;
  close: number;
}

const groupOf = (symbol: string) => {
  const base = symbol.toUpperCase().split(/[._+\-#!]/)[0]!;
  if (METALS.some((m) => base.startsWith(m))) return "Metals";
  if (/^X(TI|BR|NG)/.test(base)) return "Energies";
  if (/COFFEE|COCOA|SUGAR|COTTON|CORN|WHEAT|SOY/.test(base)) return "Softs and grains";
  if (/^[A-Z]{6}$/.test(base)) return "FX";
  return "Stock indices";
};

/** One cell: how often something happened against how often it was promised. */
class Cell {
  hits = 0;
  promised = 0;
  n = 0;
  add(hit: number, promise: number) {
    this.hits += hit;
    this.promised += promise;
    this.n += 1;
  }
  get actual() {
    return this.hits / this.n;
  }
  get expected() {
    return this.promised / this.n;
  }
  get ok() {
    return this.n > 0 && Math.abs(this.actual - this.expected) <= TOLERANCE;
  }
}

/** Cells keyed by claim, then by scope ("all", a group, or a period). */
const cells = new Map<string, Map<string, Cell>>();
function record(key: string, scopes: string[], hit: number, promise: number) {
  const byScope = cells.get(key) ?? new Map<string, Cell>();
  for (const scope of scopes) {
    const cell = byScope.get(scope) ?? new Cell();
    cell.add(hit, promise);
    byScope.set(scope, cell);
  }
  cells.set(key, byScope);
}

/** Inserts into an ascending list. */
function insertSorted(list: number[], value: number) {
  let lo = 0;
  let hi = list.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (list[mid]! < value) lo = mid + 1;
    else hi = mid;
  }
  list.splice(lo, 0, value);
}

function removeSorted(list: number[], value: number) {
  let lo = 0;
  let hi = list.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (list[mid]! < value) lo = mid + 1;
    else hi = mid;
  }
  list.splice(lo, 1);
}

const dir = process.argv[2];
if (!dir) throw new Error("Usage: bun scripts/price-map-study.ts <history folder>");

const files = readdirSync(dir)
  .filter((f) => f.endsWith("_D1.csv"))
  .sort();
let markets = 0;
for (const file of files) {
  const symbol = file.slice(0, -"_D1.csv".length);
  const group = groupOf(symbol);
  const bars: Bar[] = readFileSync(join(dir, file), "utf8")
    .trim()
    .split(/\r?\n/)
    .slice(1)
    .map((line) => {
      const [time, , high, low, close] = line.split(",");
      return {
        date: time!.slice(0, 10),
        high: Number(high),
        low: Number(low),
        close: Number(close),
      };
    })
    .filter((bar) => {
      const weekday = new Date(`${bar.date}T00:00:00Z`).getUTCDay();
      return weekday !== 0 && weekday !== 6 && bar.low > 0 && bar.high > bar.low && bar.close > 0;
    });
  if (bars.length < WARMUP + RACE_DAYS) continue;
  markets += 1;
  const closes = bars.map((bar) => bar.close);
  const sigmas = ewmaSigmas(closes);
  const scopesAt = (t: number) => [
    "all",
    group,
    bars[t]!.date < SPLIT ? "before 2016" : "from 2016",
  ];

  // 1. Bands, with a sliding window of past moves that had finished by each close.
  for (const h of HORIZONS) {
    const z = scaledMoves(closes, sigmas, h);
    const window: number[] = [];
    const queue: number[] = [];
    for (let t = 0; t + h < closes.length; t += 1) {
      const known = z[t - h];
      if (t - h >= 0 && known != null) {
        insertSorted(window, known);
        queue.push(known);
        if (queue.length > BAND_WINDOW) removeSorted(window, queue.shift()!);
      }
      if (t < WARMUP || z[t] == null) continue;
      const q = bandQuantiles(window);
      const move = z[t]!;
      record(`band ${h}d half`, scopesAt(t), move >= q.q25 && move <= q.q75 ? 1 : 0, 0.5);
      record(`band ${h}d 8-in-10`, scopesAt(t), move >= q.q10 && move <= q.q90 ? 1 : 0, 0.8);
    }
  }

  for (let t = WARMUP; t < closes.length - 1; t += 1) {
    const sigma = sigmas[t];
    if (!sigma) continue;
    const entry = closes[t]!;

    // 2. Race between a stop and a target, long and short.
    for (const k of STOPS) {
      for (const m of TARGETS) {
        for (const side of [1, -1] as const) {
          const target = entry * Math.exp(side * m * sigma);
          const stop = entry * Math.exp(-side * k * sigma);
          for (let d = t + 1; d < Math.min(closes.length, t + 1 + RACE_DAYS); d += 1) {
            const bar = bars[d]!;
            const hitTarget = side === 1 ? bar.high >= target : bar.low <= target;
            const hitStop = side === 1 ? bar.low <= stop : bar.high >= stop;
            if (!hitTarget && !hitStop) continue;
            record(
              `race stop ${k} target ${m}`,
              scopesAt(t),
              hitTarget && hitStop ? 0.5 : hitTarget ? 1 : 0,
              k / (k + m),
            );
            break;
          }
        }
      }
    }

    // 3. Reach: a level touched within n days.
    for (const h of HORIZONS) {
      if (t + h >= closes.length) continue;
      let high = -Infinity;
      let low = Infinity;
      for (let d = t + 1; d <= t + h; d += 1) {
        high = Math.max(high, bars[d]!.high);
        low = Math.min(low, bars[d]!.low);
      }
      for (const x of REACH) {
        const step = x * sigma * Math.sqrt(h);
        const promise = 2 * (1 - normalCdf(x));
        record(`reach ${x} in ${h}d`, scopesAt(t), high >= entry * Math.exp(step) ? 1 : 0, promise);
        record(`reach ${x} in ${h}d`, scopesAt(t), low <= entry * Math.exp(-step) ? 1 : 0, promise);
      }
    }
  }
}

const pct = (v: number) => `${(v * 100).toFixed(1)}%`;
console.log(
  `Price map check: ${markets} markets, figures made at each close and checked against what followed\n`,
);
for (const [claim, prefix] of [
  ["1. Bands", "band"],
  ["2. Race (target before stop)", "race"],
  ["3. Reach (level touched within n days)", "reach"],
] as const) {
  const keys = [...cells.keys()].filter((k) => k.startsWith(prefix));
  const pass = keys.every((k) => cells.get(k)!.get("all")!.ok);
  console.log(`${claim}: ${pass ? "PASS" : "FAIL"} (every cell within ${TOLERANCE * 100} points)`);
  for (const key of keys) {
    const all = cells.get(key)!.get("all")!;
    console.log(
      `  ${key.padEnd(24)} promised ${pct(all.expected).padStart(6)}  happened ${pct(all.actual).padStart(6)}  ${all.ok ? "ok" : "OFF"}  (${all.n.toLocaleString("en-US")})`,
    );
  }
}

console.log("\nDescription only: happened minus promised, by group and period");
const scopes = [...new Set([...cells.values()].flatMap((m) => [...m.keys()]))]
  .filter((s) => s !== "all")
  .sort();
for (const key of cells.keys()) {
  const row = scopes
    .map((scope) => {
      const cell = cells.get(key)!.get(scope);
      return cell ? `${scope} ${((cell.actual - cell.expected) * 100).toFixed(1)}` : null;
    })
    .filter(Boolean)
    .join(" | ");
  console.log(`  ${key.padEnd(24)} ${row}`);
}
