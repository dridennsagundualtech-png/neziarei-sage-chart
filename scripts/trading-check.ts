// Run: bun scripts/trading-check.ts  (or: npx tsx scripts/trading-check.ts)
// Checks the trading core: zone parsing, plan checks, position sizing, fills,
// costs, closed-candle handling, sessions, and that every Den plan is a real trade.
import assert from "node:assert/strict";

import { resolveOutcome, type BacktestSetup } from "../src/lib/backtest-shared.server";
import type { AnyDb } from "../src/lib/db-types";
import { denTestSpec, judgeBacktest, strategyVerdict } from "../src/lib/edge-checks.server";
import { runDenBacktest } from "../src/lib/den-backtest.server";
import { barFor, coinFlipP, edgeVerdict, tradesNeeded } from "../src/lib/edge-verdict";
import { FIRST_FORECAST, RANGE_MODELS, forecastRanges, quantile } from "../src/lib/range-forecast";
import { monthEnds, monthlySwap, roundTripCost, trendTrades } from "../src/lib/trend-following";
import { dayProfile, lastCompleteDayProfile } from "../src/lib/volume-profile";
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

// ---- edge verdict: fixed thresholds, and neither luck nor tuning can fake an edge
const DAY = 86_400_000;
const fake = (
  rs: number[],
  mirror: number[],
  time = (i: number) => new Date(Date.UTC(2020, 0, 1) + i * DAY).toISOString(),
) =>
  rs.map((r, i) => ({
    outcome: r > 0 ? "TP1" : "STOP",
    realizedR: r,
    mirrorOutcome: mirror[i]! > 0 ? "TP1" : "STOP",
    mirrorR: mirror[i]!,
    time: time(i),
  }));
const counted = { tests: 1, costs: true };
// Real side wins 40% at 2R (+0.20R), mirrored side 25% (−0.25R): a real directional edge.
const skillOf = (n: number) =>
  fake(
    Array.from({ length: n }, (_, i) => (i % 5 < 2 ? 2 : -1)),
    Array.from({ length: n }, (_, i) => (i % 4 === 0 ? 2 : -1)),
  );
assert.equal(edgeVerdict(fake([2, -1], [-1, 2]), counted).level, "thin");
// 40 trades can't show a realistic edge, however good they look.
assert.equal(edgeVerdict(skillOf(40), counted).level, "thin");
const skill = edgeVerdict(skillOf(1500), counted);
assert.equal(skill.level, "edge", skill.headline);
assert.ok(skill.coinFlipP! > 0, "a coin flip share is never exactly zero");
// The bar rises with every logged test: the same trades are too few after a second test…
assert.ok(tradesNeeded(skill.sdR, 2) > 1500);
assert.equal(edgeVerdict(skillOf(1500), { tests: 2, costs: true }).level, "thin");
// …and a longer record clears a 20-test bar.
assert.equal(edgeVerdict(skillOf(3000), { tests: 20, costs: true }).level, "edge");
assert.ok(barFor(20) < barFor(1));
// No spread or commission, or tests not counted: never an edge.
assert.equal(edgeVerdict(skillOf(1500), { tests: 1, costs: false }).level, "unproven");
assert.equal(edgeVerdict(skillOf(1500), { tests: null, costs: true }).level, "unproven");
// Wins whichever side you take: positive, but direction adds nothing.
const both = fake(Array(1500).fill(1), Array(1500).fill(1));
assert.equal(edgeVerdict(both, counted).level, "unproven");
assert.ok(coinFlipP(both)! > 0.99);
assert.equal(edgeVerdict(fake(Array(1500).fill(-1), Array(1500).fill(2)), counted).level, "none");
// Ten signals on the same day ride one move: one coin per day, not ten.
{
  const winDay = (d: number) => d % 5 < 3; // 12 of 20 days go the real way
  const rs = Array.from({ length: 200 }, (_, i) => (winDay(Math.floor(i / 10)) ? 2 : -1));
  const ms = rs.map((r) => (r > 0 ? -1 : 2));
  const sameDay = coinFlipP(
    fake(rs, ms, (i) => new Date(Date.UTC(2020, 0, 1) + Math.floor(i / 10) * DAY).toISOString()),
  )!;
  const ownDay = coinFlipP(fake(rs, ms))!;
  assert.ok(
    sameDay > 0.1 && ownDay < 0.01,
    `clustered trades counted as separate bets: ${sameDay} vs ${ownDay}`,
  );
}
// Missing mirrors (older saved runs): never called an edge.
assert.equal(coinFlipP([{ outcome: "TP1", realizedR: 2 }]), null);

// ---- test log: every judged run counts, thin runs and repeats don't, and a broken log never certifies
{
  type Row = Record<string, unknown>;
  const fakeDb = (broken = false) => {
    const rows = new Map<string, Row>();
    const table = {
      select: (_cols: string, opts?: { head?: boolean }) => {
        if (opts?.head)
          return Promise.resolve(
            broken
              ? { count: null, error: { message: "down" } }
              : { count: rows.size, error: null },
          );
        const filters: [string, unknown][] = [];
        const chain = {
          eq: (col: string, v: unknown) => (filters.push([col, v]), chain),
          order: () => chain,
          limit: (n: number) =>
            Promise.resolve(
              broken
                ? { data: null, error: { message: "down" } }
                : {
                    data: [...rows.values()]
                      .filter((r) => filters.every(([c, v]) => r[c] === v))
                      .slice(-n),
                    error: null,
                  },
            ),
        };
        return chain;
      },
      upsert: (row: Row) => {
        if (broken) return Promise.resolve({ error: { message: "down" } });
        rows.set(String(row.look_key), {
          ...rows.get(String(row.look_key)),
          ...row,
          id: row.look_key,
        });
        return Promise.resolve({ error: null });
      },
      update: (patch: Row) => ({
        eq: (_col: string, id: unknown) => {
          const key = [...rows.keys()].find((k) => rows.get(k)!.id === id)!;
          rows.set(key, { ...rows.get(key), ...patch });
          return Promise.resolve({ error: null });
        },
      }),
    };
    return { db: { from: () => table } as unknown as AnyDb, rows };
  };
  // Same skill pattern, shifted by whole days: a rolling window of stored candles.
  const asSetups = (trades: ReturnType<typeof skillOf>, shiftDays = 0) =>
    trades.map((t) => ({
      ...t,
      time: new Date(Date.parse(t.time) + shiftDays * DAY).toISOString(),
      tradable: true,
    })) as unknown as BacktestSetup[];
  const specFor = (candleCount: number) =>
    denTestSpec({
      symbol: "EURUSD",
      timeframes: ["H1", "M15"],
      stepTimeframe: "M15",
      candleCount,
      minRR: 2,
      strictMode: true,
      requireVolume: false,
      rules: null,
      warmup: 60,
      maxLookout: 200,
      costPerTrade: 0.0001,
      analysisCandles: 150,
      fromTime: null,
    });
  const { db, rows } = fakeDb();
  // Thin runs aren't tests: they can't pass, so they don't raise the bar.
  const thin = await judgeBacktest(db, "u", asSetups(skillOf(40)), specFor(8000));
  assert.equal(thin.every.level, "thin");
  assert.equal(rows.size, 0);
  // A judged run logs both reads; the same run again is not a new test.
  const first = await judgeBacktest(db, "u", asSetups(skillOf(3000)), specFor(8000));
  assert.equal(first.tests, 2);
  assert.equal((await judgeBacktest(db, "u", asSetups(skillOf(3000)), specFor(8000))).tests, 2);
  assert.equal(first.approved?.level, "edge", first.approved?.headline);
  // A different history depth is a new test.
  assert.equal((await judgeBacktest(db, "u", asSetups(skillOf(3000)), specFor(2000))).tests, 4);
  // Candles roll forward: a few new days update the look, a tenth of new trades is a new look,
  // and small daily changes add up instead of resetting the window.
  assert.equal(
    (await judgeBacktest(db, "u", asSetups(skillOf(3000), 100), specFor(8000))).tests,
    4,
  );
  assert.equal(
    (await judgeBacktest(db, "u", asSetups(skillOf(3000), 200), specFor(8000))).tests,
    4,
  );
  assert.equal(
    (await judgeBacktest(db, "u", asSetups(skillOf(3000), 320), specFor(8000))).tests,
    6,
  );
  assert.equal((await judgeBacktest(db, "u", asSetups(skillOf(6100)), specFor(8000))).tests, 8);
  // Alerts read the standard track record for the same strategy, against today's bar.
  assert.ok(specFor(8000).standard && !specFor(2000).standard);
  const vouched = await strategyVerdict(db, specFor(8000).strategy);
  assert.equal(vouched?.tests, 8);
  assert.equal(await strategyVerdict(db, { ...specFor(8000).strategy, minRR: 3 }), null);
  // Trying many versions until one passes: each try raises the bar for all of them.
  for (let i = 0; i < 300; i += 1) rows.set(`other-${i}`, { look_key: `other-${i}` });
  assert.notEqual(
    (await judgeBacktest(db, "u", asSetups(skillOf(3000)), specFor(8000))).approved?.level,
    "edge",
  );
  // A log that can't be read or written never certifies an edge.
  const down = await judgeBacktest(fakeDb(true).db, "u", asSetups(skillOf(3000)), specFor(8000));
  assert.equal(down.tests, null);
  assert.notEqual(down.approved?.level, "edge");
  await assert.rejects(strategyVerdict(fakeDb(true).db, specFor(8000).strategy));
  // No costs: never an edge, and never standard.
  const free = denTestSpec({
    ...(specFor(8000).test as never),
    symbol: "EURUSD",
    timeframes: ["H1", "M15"],
    stepTimeframe: "M15",
    candleCount: 8000,
    minRR: 2,
    strictMode: true,
    requireVolume: false,
    rules: null,
    warmup: 60,
    maxLookout: 200,
    costPerTrade: 0,
    analysisCandles: 150,
    fromTime: null,
  });
  assert.ok(!free.standard && !free.costs);
  const freeDb = fakeDb();
  assert.notEqual(
    (await judgeBacktest(freeDb.db, "u", asSetups(skillOf(3000)), free)).approved?.level,
    "edge",
  );
  assert.equal(freeDb.rows.size, 0, "a run that can't pass doesn't raise the bar");
}

// ---- Den backtest records the gate, the mirror trade, and respects a forward start
{
  seed = 11;
  const h1 = walk(700, 2000, 6, 60);
  const m15 = walk(2400, 2000, 3, 15);
  const input = {
    symbol: "TEST",
    series: [
      { timeframe: "H1", candles: h1 },
      { timeframe: "M15", candles: m15 },
    ],
    stepTimeframe: "M15",
    minRR: 2,
    requireVolume: false,
    strictMode: false,
    rules: { components: componentsFromPreset(DEN_PRESETS.full) },
  };
  const all = runDenBacktest(input);
  assert.ok(all.setups.length > 0, "fuzz backtest found no setups");
  for (const s of all.setups) {
    assert.equal(typeof s.tradable, "boolean");
    assert.ok(s.mirrorOutcome !== undefined, "every setup carries its mirror");
  }
  const from = m15[1600]!.time;
  const forward = runDenBacktest({ ...input, fromTime: from });
  assert.ok(
    forward.setups.every((s) => s.time >= from),
    "forward record leaked older signals",
  );
  assert.ok(forward.setups.length < all.setups.length);
}

// ---- range forecasts: never read the day they forecast, and find planted volatility clustering
{
  let x = 7;
  const rnd = () => (x = (Math.imul(x, 1103515245) + 12345) >>> 0) / 2 ** 32;
  const gauss = () => Math.sqrt(-2 * Math.log(rnd() || 1e-12)) * Math.cos(2 * Math.PI * rnd());
  // Log range = level that drifts slowly (clustering) + daily noise.
  let level = 0;
  const ranges = Array.from({ length: 900 }, () => {
    level = 0.97 * level + 0.12 * gauss();
    return Math.exp(Math.log(0.008) + level + 0.3 * gauss());
  });
  const f = forecastRanges(ranges);
  assert.equal(f.har[FIRST_FORECAST - 1], null);
  assert.ok(
    f.har[FIRST_FORECAST]! > 0 && f.ewma[FIRST_FORECAST]! > 0 && f.average[FIRST_FORECAST]! > 0,
  );
  // Changing day t and later must not change the forecast for day t.
  const t = 600;
  const changed = forecastRanges([...ranges.slice(0, t), ...ranges.slice(t).map((r) => r * 3)]);
  for (const m of RANGE_MODELS) near(changed[m][t], f[m][t]!, 1e-12);
  assert.notEqual(changed.har[t + 1], f.har[t + 1]);
  // On clustered data, HAR's log error beats a constant forecast by a wide margin.
  const loss = (m: "average" | "har") => {
    let sum = 0;
    for (let i = FIRST_FORECAST; i < ranges.length; i += 1)
      sum += (Math.log(ranges[i]!) - Math.log(f[m][i]!)) ** 2;
    return sum / (ranges.length - FIRST_FORECAST);
  };
  const flat =
    ranges.slice(FIRST_FORECAST).reduce((s, r) => s + (Math.log(r) - Math.log(0.008)) ** 2, 0) /
    (ranges.length - FIRST_FORECAST);
  assert.ok(loss("har") < 0.8 * flat, `HAR missed planted clustering: ${loss("har")} vs ${flat}`);
  assert.ok(loss("average") < flat);
  near(quantile([1, 2, 3, 4], 0.5), 2.5);
}

// ---- trend-following: signals never read the month they trade; costs convert correctly
{
  let x = 11;
  const rnd = () => (x = (Math.imul(x, 1103515245) + 12345) >>> 0) / 2 ** 32;
  const gauss = () => Math.sqrt(-2 * Math.log(rnd() || 1e-12)) * Math.cos(2 * Math.PI * rnd());
  // Weekday closes with slow drift regimes, so 12-month trends persist.
  const bars: { date: string; close: number }[] = [];
  let price = 100;
  let drift = 0.0008;
  for (let d = Date.UTC(2006, 0, 2); bars.length < 4000; d += DAY) {
    const day = new Date(d);
    if (day.getUTCDay() === 0 || day.getUTCDay() === 6) continue;
    if (bars.length % 500 === 0) drift = -drift;
    price *= Math.exp(drift + 0.006 * gauss());
    bars.push({ date: day.toISOString().slice(0, 10), close: price });
  }
  const ends = monthEnds(bars);
  assert.ok(
    ends.every((i) => !bars[i + 1] || bars[i + 1]!.date.slice(0, 7) !== bars[i]!.date.slice(0, 7)),
  );
  const trades = trendTrades(bars);
  assert.ok(trades.length > 150);
  assert.ok(trades.every((t) => t.sigma > 0 && (t.sign === 1 || t.sign === -1)));
  // Changing the month traded can't change its signal or size.
  const k = 100;
  const t = trades[k]!;
  const cut = bars.findIndex((b) => b.date.slice(0, 7) === t.month);
  const shocked = [
    ...bars.slice(0, cut),
    ...bars.slice(cut).map((b) => ({ ...b, close: b.close * 5 })),
  ];
  const again = trendTrades(shocked).find((u) => u.month === t.month)!;
  assert.equal(again.sign, t.sign);
  near(again.sigma, t.sigma, 1e-12);
  assert.notEqual(again.ret, t.ret);
  // Persistent trends: going with the 12-month move earns, on average.
  assert.ok(trades.reduce((s, u) => s + (u.sign * u.ret) / u.sigma, 0) / trades.length > 0);
  const costs = {
    swapMode: 1,
    swapLong: -7.1,
    swapShort: 1.2,
    point: 0.00001,
    contractSize: 100000,
    spread: 2,
    bid: 1.1,
    commission: true,
  };
  near(monthlySwap(costs, 1, 1.1, 30)!, (-7.1 * 0.00001 * 30) / 1.1, 1e-15);
  near(monthlySwap({ ...costs, swapMode: 5, swapLong: -3.65 }, 1, 1.1, 360)!, -0.0365, 1e-12);
  near(monthlySwap({ ...costs, swapMode: 2, swapShort: 5 }, -1, 1.1, 1)!, 5 / 100000, 1e-15);
  assert.equal(monthlySwap({ ...costs, swapMode: 7 }, 1, 1.1, 1), null);
  near(roundTripCost(costs), (2 * 0.00001) / 1.1 + 0.00006, 1e-15);
  near(roundTripCost({ ...costs, spread: 1e9 }), 0.005 + 0.00006, 1e-15); // off-hours spreads are capped
}

// ---- volume profile: POC sits where the volume is, value area holds it, only finished days
{
  const bar = (time: string, low: number, high: number, volume: number) => ({
    time,
    low,
    high,
    volume,
  });
  const day = [
    bar("2026-01-05T00:00:00+00:00", 100, 110, 10),
    bar("2026-01-05T00:15:00+00:00", 104, 105, 500),
    bar("2026-01-05T00:30:00+00:00", 104.2, 104.8, 400),
    bar("2026-01-05T00:45:00+00:00", 101, 109, 20),
  ];
  const p = dayProfile(day)!;
  assert.ok(p.poc > 104 && p.poc < 105, `POC ${p.poc} should sit in the heavy 104–105 band`);
  assert.ok(p.val <= p.poc && p.poc <= p.vah && p.vah - p.val < 10);
  const twoDays = [...day, ...day.map((c) => ({ ...c, time: c.time.replace("01-05", "01-06") }))];
  // Midday on the 6th: the 6th has not ended, so the 5th is the last full day.
  assert.equal(
    lastCompleteDayProfile(twoDays, Date.parse("2026-01-06T12:00:00Z"), 4)?.day,
    "2026-01-05",
  );
  assert.equal(
    lastCompleteDayProfile(twoDays, Date.parse("2026-01-07T00:00:00Z"), 4)?.day,
    "2026-01-06",
  );
  assert.equal(dayProfile([bar("2026-01-05T00:00:00+00:00", 1, 1, 5)]), null);
}

console.log(`trading-check: ok (${directional} Den plans checked)`);
