// Run: bun scripts/range-forecast-study.ts <ranges.json>
//
// Does a model forecast tomorrow's daily range better than the 20-day average
// a trader would use? Everything below was written and committed before any
// result was looked at; change nothing here after seeing results, or the test
// no longer means anything.
//
// Data: daily (D1) bars, Monday to Friday only. Range = ln(high / low).
// Input JSON: { series: [{ symbol, start, deltas, values, count, sum }] } where
// start is the first bar's date (YYYY-MM-DD), deltas holds one digit per later
// bar (days since the previous bar), values holds comma-separated
// round(range × 100000), and count / sum must match the decoded values.
//
// Forecasts (src/lib/range-forecast.ts, settings fixed in advance): average
// (the baseline), ewma, har. Every model is scored on the same days: from day
// FIRST_FORECAST (272) of each symbol to its last day.
//
// Loss: squared error of the log range, (ln actual − ln forecast)². All three
// forecasts are medians in log space, so the loss treats them alike.
//
// Primary tests, two of them: ewma vs average, har vs average, pooled across
// symbols. Each day's loss difference (average − model) is averaged over the
// symbols trading that day, then a one-sided Diebold–Mariano test with a
// Newey–West variance (lag 5). A model passes only if
//   p ≤ 0.025 (5% split across the two tests) AND
//   its pooled loss is at least 5% below the average's.
// Everything else (per-symbol rows, calibration) is description, not a pass.
import { readFileSync } from "node:fs";

import { FIRST_FORECAST, RANGE_MODELS, forecastRanges, quantile } from "../src/lib/range-forecast";

const ALPHA = 0.025;
const MIN_GAIN = 0.05;
const NW_LAG = 5;
const DAY = 86_400_000;

interface Packed {
  symbol: string;
  start: string;
  deltas: string;
  values: string;
  count: number;
  sum: number;
}

function unpack(p: Packed) {
  const ints = p.values.split(",").map((v) => Number(v.trim()));
  const total = ints.reduce((s, v) => s + v, 0);
  if (ints.length !== p.count || total !== p.sum || p.deltas.length !== p.count - 1) {
    throw new Error(
      `${p.symbol}: data doesn't match its checksum (${ints.length}/${p.count} values, sum ${total}/${p.sum}, ${p.deltas.length + 1} dates)`,
    );
  }
  if (ints.some((v) => !Number.isInteger(v) || v <= 0)) throw new Error(`${p.symbol}: bad range`);
  let ms = Date.parse(`${p.start}T00:00:00Z`);
  const dates = [p.start];
  for (const ch of p.deltas) {
    ms += Number(ch) * DAY;
    dates.push(new Date(ms).toISOString().slice(0, 10));
  }
  return { symbol: p.symbol, dates, ranges: ints.map((v) => v / 100_000) };
}

/** Standard normal CDF (Abramowitz–Stegun 7.1.26, error below 1.5e-7). */
function phi(z: number): number {
  const t = 1 / (1 + 0.3275911 * (Math.abs(z) / Math.SQRT2));
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t *
      Math.exp(-(z * z) / 2);
  return z >= 0 ? 0.5 * (1 + y) : 0.5 * (1 - y);
}

/** One-sided Diebold–Mariano: is the mean of d above zero? Newey–West variance. */
function dieboldMariano(d: number[]) {
  const n = d.length;
  const m = d.reduce((s, v) => s + v, 0) / n;
  const gamma = (k: number) => {
    let s = 0;
    for (let i = k; i < n; i += 1) s += (d[i]! - m) * (d[i - k]! - m);
    return s / n;
  };
  let variance = gamma(0);
  for (let k = 1; k <= NW_LAG; k += 1) variance += 2 * (1 - k / (NW_LAG + 1)) * gamma(k);
  const stat = m / Math.sqrt(variance / n);
  return { stat, p: 1 - phi(stat) };
}

const pct = (v: number) => `${(v * 100).toFixed(1)}%`;
/** "12.0% lower" or "3.4% higher" than the average's loss. */
const vsBase = (gain: number) => (gain >= 0 ? `${pct(gain)} lower` : `${pct(-gain)} higher`);

const file = process.argv[2];
if (!file) throw new Error("Usage: bun scripts/range-forecast-study.ts <ranges.json>");
const series = (JSON.parse(readFileSync(file, "utf8")) as { series: Packed[] }).series.map(unpack);

type Errors = Record<string, Map<string, number>>; // model → date → log error
const perSymbol: { symbol: string; errors: Errors; days: number }[] = [];
for (const s of series) {
  const forecasts = forecastRanges(s.ranges);
  const errors: Errors = Object.fromEntries(RANGE_MODELS.map((m) => [m, new Map()]));
  for (let t = FIRST_FORECAST; t < s.ranges.length; t += 1) {
    if (RANGE_MODELS.some((m) => forecasts[m][t] == null)) continue;
    for (const m of RANGE_MODELS) {
      errors[m]!.set(s.dates[t]!, Math.log(s.ranges[t]!) - Math.log(forecasts[m][t]!));
    }
  }
  perSymbol.push({ symbol: s.symbol, errors, days: errors.average!.size });
}

const lossOf = (errors: Map<string, number>) =>
  [...errors.values()].reduce((s, e) => s + e * e, 0) / errors.size;

console.log("Range forecast study: tomorrow's daily range, scored out of sample\n");
console.log(
  "Per symbol (description only): mean squared log error, and how much lower than the average's",
);
for (const row of perSymbol) {
  const base = lossOf(row.errors.average!);
  const cells = RANGE_MODELS.map((m) => {
    const loss = lossOf(row.errors[m]!);
    return m === "average"
      ? `average ${loss.toFixed(4)}`
      : `${m} ${loss.toFixed(4)} (${vsBase(1 - loss / base)})`;
  });
  const dates = [...row.errors.average!.keys()];
  console.log(
    `  ${row.symbol.padEnd(10)} ${row.days} days ${dates[0]} to ${dates[dates.length - 1]}: ${cells.join(", ")}`,
  );
}

console.log(
  "\nPrimary tests (pooled across symbols, each day averaged over the symbols trading it)",
);
const allDates = [...new Set(perSymbol.flatMap((r) => [...r.errors.average!.keys()]))].sort();
for (const model of RANGE_MODELS.filter((m) => m !== "average")) {
  const d: number[] = [];
  let baseSum = 0;
  let modelSum = 0;
  let cells = 0;
  for (const date of allDates) {
    let diff = 0;
    let k = 0;
    for (const row of perSymbol) {
      const b = row.errors.average!.get(date);
      const e = row.errors[model]!.get(date);
      if (b === undefined || e === undefined) continue;
      diff += b * b - e * e;
      baseSum += b * b;
      modelSum += e * e;
      k += 1;
      cells += 1;
    }
    if (k) d.push(diff / k);
  }
  const gain = 1 - modelSum / baseSum;
  const { stat, p } = dieboldMariano(d);
  const pass = p <= ALPHA && gain >= MIN_GAIN;
  console.log(
    `  ${model} vs average: loss ${vsBase(gain)} over ${cells} symbol-days (${d.length} dates); DM ${stat.toFixed(2)}, one-sided p ${p < 0.0001 ? "< 0.0001" : p.toFixed(4)} → ${pass ? "PASS" : "FAIL"} (needs p ≤ ${ALPHA} and ≥ ${pct(MIN_GAIN)} lower)`,
  );
}

console.log("\nCalibration (description only), all symbols");
for (const model of RANGE_MODELS) {
  let above = 0;
  let total = 0;
  let inside = 0;
  let banded = 0;
  for (const row of perSymbol) {
    const errs = [...row.errors[model]!.values()];
    errs.forEach((e, i) => {
      total += 1;
      if (e > 0) above += 1;
      // 80% band from this model's own earlier errors on this symbol, once 60 exist.
      if (i >= 60) {
        const past = errs.slice(0, i);
        banded += 1;
        if (e >= quantile(past, 0.1) && e <= quantile(past, 0.9)) inside += 1;
      }
    });
  }
  console.log(
    `  ${model.padEnd(8)} actual above the forecast on ${pct(above / total)} of days (a median should be 50%); 80% band held ${pct(inside / banded)} of ${banded} days`,
  );
}
