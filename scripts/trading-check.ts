// Run: bun scripts/trading-check.ts  (or: npx tsx scripts/trading-check.ts)
// Checks the trading core: zone parsing, plan checks, position sizing, fills,
// costs, closed-candle handling, sessions, and that every Den plan is a real trade.
import assert from "node:assert/strict";

import { resolveOutcome } from "../src/lib/backtest-shared.server";
import { runDenAnalysis } from "../src/lib/den-analyzer.server";
import { componentsFromPreset, DEN_PRESETS } from "../src/lib/den-rules";
import { sessionFromTimestamp } from "../src/lib/edge-board";
import { closedCandlesAt } from "../src/lib/freshness";
import { instrumentOf, sizePosition } from "../src/lib/instruments";
import type { Candle } from "../src/lib/market.server";
import { checkPlan, midpointOf, realizedRToday } from "../src/lib/stats";

const near = (a: number | null | undefined, b: number, eps = 1e-6) =>
  assert.ok(a != null && Math.abs(a - b) < eps, `${a} != ${b}`);

// ---- zones
assert.equal(midpointOf("4,218–4,224"), 4221);
assert.equal(midpointOf("2318-2322"), 2320);
near(midpointOf("1.0850 - 1.0860"), 1.0855);
assert.equal(midpointOf("Below 4,196 swing low (1H)"), 4196);
assert.equal(midpointOf("Not visible"), null);

// ---- plan geometry
assert.equal(checkPlan("POTENTIAL LONG", "2320", "2310", "2350").rr, 3);
assert.equal(checkPlan("POTENTIAL LONG", "2320", "2330", "2350").ok, false); // stop above a long
assert.equal(checkPlan("POTENTIAL SHORT", "2320", "2330", "2350").ok, false); // target above a short
assert.equal(checkPlan("WAIT", "2320", "2330", "2350").ok, true);

// ---- instruments and sizing
assert.equal(instrumentOf("XAUUSD.r").quote, "USD");
assert.equal(instrumentOf("XAUUSD.r").contractSize, 100);
assert.equal(instrumentOf("EURUSDm").core, "EURUSD");
assert.equal(instrumentOf("EUR/USD").quote, "USD");
assert.equal(instrumentOf("USDJPY").quote, "JPY");
assert.equal(instrumentOf("BTCUSDT").quote, "USD");
assert.equal(instrumentOf("NAS100").quote, "USD");
assert.equal(instrumentOf("XTIUSD").quote, "USD");
// $100,000 at 0.5% = $500 risk; gold stop 10 → 50 oz = 0.5 lots
const gold = sizePosition({
  symbol: "XAUUSD",
  balance: 100000,
  riskPct: 0.5,
  accountCurrency: "USD",
  entry: 2320,
  stop: 2310,
});
near(gold.units, 50);
near(gold.lots, 0.5);
// ₱100,000 at 0.5% = ₱500; without the USD→PHP rate it must refuse, with it ≈ 0.86 oz
const phpNoRate = sizePosition({
  symbol: "XAUUSD",
  balance: 100000,
  riskPct: 0.5,
  accountCurrency: "₱",
  entry: 2320,
  stop: 2310,
});
assert.equal(phpNoRate.units, null);
assert.equal(phpNoRate.needsRate, true);
const php = sizePosition({
  symbol: "XAUUSD",
  balance: 100000,
  riskPct: 0.5,
  accountCurrency: "PHP",
  entry: 2320,
  stop: 2310,
  quoteToAccount: 58,
});
near(php.units, 500 / (10 * 58));
// USDJPY, $10,000 at 1% = $100; 50-pip stop (0.50 JPY) at 150 JPY per USD → 30,000 units
const jpy = sizePosition({
  symbol: "USDJPY",
  balance: 10000,
  riskPct: 1,
  accountCurrency: "USD",
  entry: 150.5,
  stop: 150.0,
  quoteToAccount: 1 / 150,
});
near(jpy.units, 30000, 1e-3);
near(jpy.lots, 0.3, 1e-6);

// ---- fills, stops, targets, costs
const bar = (time: number, o: number, h: number, l: number, c: number): Candle => ({
  time: new Date(Date.UTC(2026, 0, 5, 8, time * 15)).toISOString(),
  open: o,
  high: h,
  low: l,
  close: c,
  volume: null,
});
const longPlan = { direction: "POTENTIAL LONG", entry: 100, stop: 95, tp1: 110, tp2: null };
// market entry (entry == signal close) → TP1 = +2R
assert.equal(
  resolveOutcome([bar(1, 100, 111, 99, 110)], longPlan, 50, { signalPrice: 100 }).realizedR,
  2,
);
// limit entry below price: price runs to target without pulling back → NOT_FILLED, never a win
assert.equal(
  resolveOutcome([bar(1, 104, 111, 103, 110)], longPlan, 50, { signalPrice: 104 }).outcome,
  "NOT_FILLED",
);
// fills on bar 1, stops on bar 2 → loss
assert.equal(
  resolveOutcome([bar(1, 104, 104, 99, 101), bar(2, 101, 102, 94, 95)], longPlan, 50, {
    signalPrice: 104,
  }).outcome,
  "STOP",
);
// fill bar also touches the target: it does not count; the trade resolves later
const sameBar = resolveOutcome(
  [bar(1, 104, 111, 99, 108), bar(2, 108, 109, 94, 95)],
  longPlan,
  50,
  { signalPrice: 104 },
);
assert.equal(sameBar.outcome, "STOP");
// history ends while the order is still waiting → unresolved, not "missed"
assert.equal(
  resolveOutcome([bar(1, 104, 105, 103, 104)], longPlan, 50, { signalPrice: 104, fillWithin: 30 })
    .outcome,
  "UNRESOLVED",
);
// 0.5 spread on a 5-point stop = 0.1R per trade
near(
  resolveOutcome([bar(1, 100, 111, 99, 110)], longPlan, 50, { signalPrice: 100, cost: 0.5 })
    .realizedR,
  1.9,
);
near(
  resolveOutcome([bar(1, 100, 101, 94, 95)], longPlan, 50, { signalPrice: 100, cost: 0.5 })
    .realizedR,
  -1.1,
);

// ---- closed candles: an H1 bar that opened 12:00 is not closed at 12:30
const h1 = (hour: number): Candle => ({
  time: new Date(Date.UTC(2026, 0, 5, hour)).toISOString(),
  open: 1,
  high: 1,
  low: 1,
  close: 1,
  volume: null,
});
assert.equal(
  closedCandlesAt([h1(10), h1(11), h1(12)], "H1", Date.UTC(2026, 0, 5, 12, 30)).length,
  2,
);
assert.equal(
  closedCandlesAt([h1(10), h1(11), h1(12)], "H1", Date.UTC(2026, 0, 5, 13, 0)).length,
  3,
);

// ---- sessions use the app's clock (overlap is 13:00–17:00 UTC)
assert.equal(sessionFromTimestamp("2026-01-06T14:00:00Z"), "London + NY overlap");
assert.equal(sessionFromTimestamp("2026-01-06T19:00:00Z"), "New York");

// ---- today's realised R
const today = new Date();
assert.equal(
  realizedRToday([
    {
      outcome: "LOSS",
      r_result: -1,
      created_at: today.toISOString(),
      closed_at: today.toISOString(),
    },
    {
      outcome: "WIN",
      r_result: 2,
      created_at: "2020-01-01T00:00:00Z",
      closed_at: "2020-01-01T00:00:00Z",
    },
    { outcome: "OPEN", r_result: null, created_at: today.toISOString() },
  ]),
  -1,
);

// ---- Den: sweep the lows, close back inside, then rally through the highs.
// The rally must not be read as a buy-side sweep (the old engine did exactly that).
{
  const t0 = Date.UTC(2026, 0, 5);
  const c = (i: number, o: number, h: number, l: number, cl: number): Candle => ({
    time: new Date(t0 + i * 15 * 60_000).toISOString(),
    open: o,
    high: h,
    low: l,
    close: cl,
    volume: null,
  });
  const candles: Candle[] = [];
  for (let i = 0; i < 20; i += 1)
    candles.push(c(i, 100, 100.5 + (i === 12 ? 1.5 : 0), 99.5 - (i === 8 ? 1 : 0), 100));
  candles.push(c(20, 100, 100.2, 97.5, 100.6)); // sweep below the lows, close back inside
  candles.push(c(21, 100.6, 101.8, 100.4, 101.6));
  candles.push(c(22, 101.6, 103.2, 101.5, 103)); // break above the highs, close beyond
  candles.push(c(23, 103, 104.2, 102.8, 104));
  const read = runDenAnalysis({
    symbol: "TEST",
    series: [{ timeframe: "M15", candles }],
    minRR: 2,
    requireVolume: false,
    strictMode: false,
    rules: { components: componentsFromPreset(DEN_PRESETS.full) },
    now: new Date(Date.UTC(2027, 0, 1)),
  });
  const sweepRow = read.checklist.find((item) => item.key === "liquidity_sweep");
  assert.equal(sweepRow?.status, "Low swept and reclaimed", `sweep read as: ${sweepRow?.status}`);
}

// ---- Den: every plan it proposes is a real trade (stop beyond entry, target in front)
let seed = 7;
const rand = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
function walk(n: number, start: number, step: number, minutes: number): Candle[] {
  const out: Candle[] = [];
  let price = start;
  const t0 = Date.UTC(2026, 0, 1);
  for (let i = 0; i < n; i += 1) {
    const open = price;
    const drift = (rand() - 0.5) * step * (rand() < 0.08 ? 6 : 1.6);
    const close = Math.max(step, open + drift);
    const high = Math.max(open, close) + rand() * step;
    const low = Math.max(step / 2, Math.min(open, close) - rand() * step);
    out.push({
      time: new Date(t0 + i * minutes * 60_000).toISOString(),
      open,
      high,
      low,
      close,
      volume: 100 + rand() * 50,
    });
    price = close;
  }
  return out;
}
let directional = 0;
for (let run = 0; run < 600; run += 1) {
  const preset = run % 2 === 0 ? DEN_PRESETS.full : DEN_PRESETS.simple;
  const m15 = walk(160, 2000, 3, 15);
  const h1 = walk(150, 2000, 6, 60);
  const result = runDenAnalysis({
    symbol: "TEST",
    series: [
      { timeframe: "M15", candles: m15 }, // deliberately low timeframe first: the engine must reorder
      { timeframe: "H1", candles: h1 },
    ],
    minRR: 2,
    requireVolume: false,
    strictMode: run % 3 === 0,
    rules: { components: componentsFromPreset(preset) },
    now: new Date(Date.UTC(2027, 0, 1)),
  });
  assert.equal(result.timeframes[0], "H1", "highest timeframe must come first");
  if (result.direction !== "POTENTIAL LONG" && result.direction !== "POTENTIAL SHORT") continue;
  directional += 1;
  const entry = Number(result.entry_zone);
  const stop = Number(result.stop_loss);
  const tp1 = Number(result.tp1);
  const long = result.direction === "POTENTIAL LONG";
  assert.ok(
    long ? stop < entry && entry < tp1 : tp1 < entry && entry < stop,
    `bad plan ${result.direction} e=${entry} s=${stop} t=${tp1}`,
  );
  assert.ok(result.risk_reward !== null && result.risk_reward > 0);
}
assert.ok(
  directional > 20,
  `only ${directional} directional reads; the fuzz is not exercising plans`,
);

console.log(`trading-check: ok (${directional} Den plans checked)`);
