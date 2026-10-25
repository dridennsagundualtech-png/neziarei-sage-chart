// Run: bun scripts/mt5-daily-ranges.ts [--from YYYY-MM-DD] [--to YYYY-MM-DD] <csv>... > ranges.json
//
// Turns MT5 CSV exports (time,open,high,low,close,tick_volume, as mt5_data_auto.py
// writes them) into the daily ranges scripts/range-forecast-study.ts reads. D1
// files are used as they are; intraday files (H4, H1, …) are grouped into days
// by the bar's broker date, the same way MT5 builds its D1 bars. Weekends are
// dropped, and so is each file's first date: an export can start mid-day.
// --from is inclusive, --to exclusive. The symbol is the file name up to the
// last underscore ("EURUSD.r_H4.csv" → "EURUSD.r").
import { readFileSync } from "node:fs";
import { basename } from "node:path";

const args = process.argv.slice(2);
const option = (name: string) => {
  const i = args.indexOf(name);
  if (i === -1) return null;
  const value = args[i + 1];
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    throw new Error(`${name} needs a YYYY-MM-DD date`);
  args.splice(i, 2);
  return value;
};
const from = option("--from");
const to = option("--to");
if (!args.length)
  throw new Error("Usage: bun scripts/mt5-daily-ranges.ts [--from D] [--to D] <csv>...");

const series = args.map((file) => {
  const symbol = basename(file).replace(/_[^_]+$/, "");
  const lines = readFileSync(file, "utf8").trim().split(/\r?\n/);
  const header = lines[0]!.split(",").map((h) => h.trim().toLowerCase());
  const col = (name: string) => {
    const i = header.indexOf(name);
    if (i === -1) throw new Error(`${file}: no "${name}" column`);
    return i;
  };
  const [ti, hi, lo] = [col("time"), col("high"), col("low")];
  const days = new Map<string, { high: number; low: number }>();
  const first = lines[1]?.split(",")[ti]?.trim().slice(0, 10);
  for (const line of lines.slice(1)) {
    const cells = line.split(",");
    const date = cells[ti]!.trim().slice(0, 10);
    const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
    if (weekday === 0 || weekday === 6) continue;
    if ((from && date < from) || (to && date >= to)) continue;
    const high = Number(cells[hi]);
    const low = Number(cells[lo]);
    if (!Number.isFinite(high) || !Number.isFinite(low))
      throw new Error(`${file}: bad row "${line}"`);
    const day = days.get(date);
    if (day) {
      day.high = Math.max(day.high, high);
      day.low = Math.min(day.low, low);
    } else days.set(date, { high, low });
  }
  const dates = [...days.keys()]
    .filter((d) => d !== first && days.get(d)!.high > days.get(d)!.low)
    .sort();
  if (!dates.length) throw new Error(`${file}: no trading days in range`);
  const values = dates.map((d) =>
    Math.round(Math.log(days.get(d)!.high / days.get(d)!.low) * 100_000),
  );
  const deltas = dates
    .slice(1)
    .map((d, i) => {
      const gap = (Date.parse(`${d}T00:00:00Z`) - Date.parse(`${dates[i]}T00:00:00Z`)) / 86_400_000;
      if (gap > 9) throw new Error(`${file}: ${gap}-day gap before ${d}`);
      return String(gap);
    })
    .join("");
  return {
    symbol,
    start: dates[0]!,
    count: values.length,
    sum: values.reduce((s, v) => s + v, 0),
    deltas,
    values: values.join(","),
  };
});

console.log(JSON.stringify({ series }));
