// Run: bun scripts/trend-study.ts <history folder>
//
// Does trend-following (12-month time-series momentum) have an edge on this
// broker's markets after costs? Written and committed before the full export it
// runs on arrived; change nothing here after seeing results.
//
// Prior look: an earlier ChartPilot test already tried 12-month momentum on this
// broker's history (positive, but it didn't clear the coin flip after swap). So
// this is the second look at the claim and the bar is 0.05 / 2 = 0.025.
//
// Data: every SYMBOL_D1.csv in the folder (mt5_export_history.py), weekdays
// only, with its row in symbols.csv. A symbol is left out when it has no
// symbols.csv row, an unknown swap mode, or fewer than 36 months traded.
//
// Rules (src/lib/trend-following.ts): at each month end, long if the close is
// above the close 12 month ends earlier, short if below; hold to the next month
// end. Each trade is scored in risk units: its return divided by its expected
// one-month standard deviation (EWMA, 60-day centre of mass), so every market
// carries the same risk. The book's result for a month is the average over the
// markets traded that month.
//
// Costs, deliberately harsh: a full round trip (spread plus commission on FX
// and metals) is charged every month on every position, as if nothing were
// netted; financing uses today's swap rates for every month, and in the
// primary version swap credits are ignored (costs only). Versions with no
// financing and with full swap (credits too) are description only.
//
// Spreads: the export was taken with the market closed, so symbols.csv has no
// usable spreads. Each market is charged a fixed spread for its group, set on
// the high side of raw-account spreads before the run (SPREAD_BY_GROUP; see the
// pre-run corrections in docs/research/trend-following.md).
//
// Pass, all three needed (primary, costs-only version):
//   1. the average monthly result is above zero;
//   2. coin flip: one coin per month picks the book or its mirror (every
//      position reversed, its own costs), 20,000 runs; the share matching the
//      real total, +1 corrected, is at most 0.025;
//   3. the average is above zero both before 2016 and from 2016 on.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import {
  monthlySwap,
  roundTripCost,
  trendTrades,
  type DailyClose,
  type SymbolCosts,
  type TrendTrade,
} from "../src/lib/trend-following";

const ALPHA = 0.025;
const MIN_MONTHS = 36;
const SPLIT = "2016-01";
const RUNS = 20_000;
const METALS = ["XAU", "XAG", "XPT", "XPD"];
/** Round-trip spread as a fraction of price, by group: deliberately on the high side. */
const SPREAD_BY_GROUP: Record<string, number> = {
  FX: 0.0003,
  Metals: 0.001,
  Energies: 0.002,
  "Stock indices": 0.0005,
  "Softs and grains": 0.003,
};

/** Splits one CSV line, honouring double quotes. */
function cells(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i]!;
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else if (ch === '"') quoted = false;
      else cur += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

/** Splits CSV text into records; a line break inside double quotes stays in its field. */
function records(text: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (const line of text.split(/\r?\n/)) {
    cur = cur ? `${cur}\n${line}` : line;
    quoted = (line.match(/"/g)?.length ?? 0) % 2 === 1 ? !quoted : quoted;
    if (!quoted) {
      out.push(cur);
      cur = "";
    }
  }
  if (cur) out.push(cur);
  return out;
}

function readCsv(path: string): Record<string, string>[] {
  const [head, ...rows] = records(readFileSync(path, "utf8").trim());
  const keys = cells(head!).map((k) => k.trim());
  return rows.map((row) => Object.fromEntries(cells(row).map((v, i) => [keys[i]!, v.trim()])));
}

const dir = process.argv[2];
if (!dir) throw new Error("Usage: bun scripts/trend-study.ts <history folder>");

const specs = new Map(readCsv(join(dir, "symbols.csv")).map((row) => [row.name!, row]));

interface Market {
  symbol: string;
  group: string;
  trades: TrendTrade[];
  costs: SymbolCosts;
}

const groupOf = (symbol: string, market: string) => {
  const base = symbol.toUpperCase().split(/[._+\-#!]/)[0]!;
  if (METALS.some((m) => base.startsWith(m))) return "Metals";
  if (/^[A-Z]{6}$/.test(market)) return "FX";
  if (/oil|gas/i.test(market)) return "Energies";
  if (/coffee|cocoa|sugar|cotton|corn|wheat|soy/i.test(market)) return "Softs and grains";
  return "Stock indices";
};

const markets: Market[] = [];
const excluded: string[] = [];
for (const file of readdirSync(dir)
  .filter((f) => f.endsWith("_D1.csv"))
  .sort()) {
  const symbol = file.slice(0, -"_D1.csv".length);
  const spec = specs.get(symbol);
  if (!spec) {
    excluded.push(`${symbol} (no symbols.csv row)`);
    continue;
  }
  const bars: DailyClose[] = readCsv(join(dir, file))
    .map((row) => ({ date: row.time!.slice(0, 10), close: Number(row.close) }))
    .filter((bar) => {
      const weekday = new Date(`${bar.date}T00:00:00Z`).getUTCDay();
      return weekday !== 0 && weekday !== 6 && bar.close > 0;
    });
  const base = symbol.toUpperCase().split(/[._+\-#!]/)[0]!;
  const group = groupOf(symbol, spec.market ?? "");
  const costs: SymbolCosts = {
    swapMode: Number(spec.swap_mode),
    swapLong: Number(spec.swap_long),
    swapShort: Number(spec.swap_short),
    point: Number(spec.point),
    contractSize: Number(spec.trade_contract_size),
    spread: Number(spec.spread),
    bid: Number(spec.bid),
    commission: group === "FX" || METALS.some((m) => base.startsWith(m)),
    swapMoneyIsQuote:
      (spec.swap_mode === "3" ? spec.currency_margin : spec.currency_base) === spec.currency_profit,
    spreadFraction: SPREAD_BY_GROUP[group]!,
  };
  if (monthlySwap(costs, 1, 1, 1) === null) {
    excluded.push(`${symbol} (swap mode ${spec.swap_mode})`);
    continue;
  }
  const trades = trendTrades(bars);
  if (trades.length < MIN_MONTHS) {
    excluded.push(`${symbol} (${trades.length} months)`);
    continue;
  }
  markets.push({ symbol, group, trades, costs });
}

type Version = "gross" | "costsOnly" | "fullSwap";
/** One trade's result in risk units, for the book (sign as traded) or its mirror (reversed). */
function score(m: Market, t: TrendTrade, version: Version, mirror = false): number {
  const sign = (mirror ? -t.sign : t.sign) as 1 | -1;
  if (version === "gross") return (sign * t.ret) / t.sigma;
  const swap = monthlySwap(m.costs, sign, t.entry, t.days)!;
  const financing = version === "costsOnly" ? Math.min(swap, 0) : swap;
  return (sign * t.ret + financing - roundTripCost(m.costs)) / t.sigma;
}

/** Month → average over the markets traded that month. */
function book(version: Version, mirror = false, only?: (m: Market) => boolean) {
  const sums = new Map<string, { sum: number; n: number }>();
  for (const m of markets.filter(only ?? (() => true))) {
    for (const t of m.trades) {
      const cell = sums.get(t.month) ?? { sum: 0, n: 0 };
      cell.sum += score(m, t, version, mirror);
      cell.n += 1;
      sums.set(t.month, cell);
    }
  }
  return new Map([...sums.entries()].sort().map(([month, c]) => [month, c.sum / c.n]));
}

const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
const sd = (xs: number[]) => {
  const m = mean(xs);
  return Math.sqrt(xs.reduce((s, x) => s + (x - m) ** 2, 0) / (xs.length - 1));
};
const fmt = (x: number) => `${x >= 0 ? "+" : "−"}${Math.abs(x).toFixed(3)}`;

function coinFlip(real: number[], mirror: number[]): number {
  let seed = 20261025;
  const rnd = () => {
    seed = (seed + 0x6d2b79f5) >>> 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 2 ** 32;
  };
  const total = real.reduce((s, x) => s + x, 0);
  let atLeast = 0;
  for (let run = 0; run < RUNS; run += 1) {
    let sum = 0;
    for (let i = 0; i < real.length; i += 1) sum += rnd() < 0.5 ? real[i]! : mirror[i]!;
    if (sum >= total - 1e-12) atLeast += 1;
  }
  return (atLeast + 1) / (RUNS + 1);
}

console.log("Trend-following study: 12-month time-series momentum, one-month holds\n");
console.log(`${markets.length} markets: ${markets.map((m) => m.symbol).join(", ")}`);
if (excluded.length) console.log(`Left out: ${excluded.join(", ")}`);

const primary = book("costsOnly");
const months = [...primary.keys()];
const real = [...primary.values()];
const mirrorBook = book("costsOnly", true);
const mirror = months.map((m) => mirrorBook.get(m)!);
const p = coinFlip(real, mirror);
const before = months.filter((m) => m < SPLIT).map((m) => primary.get(m)!);
const after = months.filter((m) => m >= SPLIT).map((m) => primary.get(m)!);
const avg = mean(real);
const pass = avg > 0 && p <= ALPHA && mean(before) > 0 && mean(after) > 0;

console.log(
  `\nPrimary (costs only), ${months.length} months ${months[0]} to ${months[months.length - 1]}`,
);
console.log(
  `  average ${fmt(avg)} risk units a month (yearly Sharpe ${((avg / sd(real)) * Math.sqrt(12)).toFixed(2)})`,
);
console.log(
  `  before ${SPLIT}: ${fmt(mean(before))} over ${before.length} months; from ${SPLIT}: ${fmt(mean(after))} over ${after.length} months`,
);
console.log(
  `  coin flip (one coin per month, book vs mirror) matched it ${(p * 100).toFixed(2)}% of the time`,
);
console.log(
  `  → ${pass ? "PASS" : "FAIL"} (needs average > 0, coin flip ≤ ${ALPHA * 100}%, and > 0 in both halves)`,
);

console.log("\nDescription only");
for (const version of ["gross", "fullSwap"] as const) {
  const xs = [...book(version).values()];
  console.log(
    `  ${version === "gross" ? "no financing" : "full swap (credits too)"}: average ${fmt(mean(xs))}, yearly Sharpe ${((mean(xs) / sd(xs)) * Math.sqrt(12)).toFixed(2)}`,
  );
}
for (const group of [...new Set(markets.map((m) => m.group))].sort()) {
  const xs = [...book("costsOnly", false, (m) => m.group === group).values()];
  const n = markets.filter((m) => m.group === group).length;
  console.log(`  ${group} (${n} markets): average ${fmt(mean(xs))} over ${xs.length} months`);
}
console.log("\nPer market (costs only, average risk units per trade)");
for (const m of markets) {
  const xs = m.trades.map((t) => score(m, t, "costsOnly"));
  console.log(
    `  ${m.symbol.padEnd(12)} ${m.group.padEnd(17)} ${String(xs.length).padStart(3)} months  ${fmt(mean(xs))}`,
  );
}
