/**
 * The test log behind every edge verdict (server only).
 *
 * A backtest with enough trades to pass at all is one test. Every test is
 * logged: a different symbol, timeframe set, rulebook, cost or history window
 * is a new test, and so is the same test re-run once a tenth of its trades
 * are new (stored candles roll forward, and each look at fresh data is another
 * chance for luck). The verdict's bar is 5% split across every logged test, so
 * trying versions until one passes only makes passing harder. When the log
 * can't be read or written, no verdict can call an edge.
 */
import { isResolvedOutcome, type BacktestSetup } from "./backtest-shared.server";
import type { AnyDb } from "./db-types";
import { normalizeDenRules } from "./den-rules";
import {
  TRACK_RECORD,
  judge,
  verdictStats,
  type BacktestVerdicts,
  type EdgeVerdict,
} from "./edge-verdict";
import { typicalCost } from "./instruments";

const TABLE = "edge_checks";

export interface TestSpec {
  /** Everything that decides which trades are taken and how they are scored. */
  test: Record<string, unknown>;
  /** The strategy alone, without history window or costs: what alerts match on. */
  strategy: Record<string, unknown>;
  symbol: string;
  /** Run with the standard track-record settings; only these can vouch for an alert. */
  standard: boolean;
  /** Spread and commission were charged. */
  costs: boolean;
}

/** JSON with sorted keys, so the same settings always hash the same. */
function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : 1));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableJson(v)}`).join(",")}}`;
  }
  return JSON.stringify(value ?? null);
}

async function hash(value: unknown): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(stableJson(value)));
  return [...new Uint8Array(digest)]
    .slice(0, 16)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** The Den strategy as alerts and track records both describe it. */
export function denStrategy(input: {
  symbol: string;
  /** Highest timeframe first; the last one steps the clock. */
  timeframes: string[];
  minRR: number;
  strictMode: boolean;
  requireVolume: boolean;
  rules: unknown;
}): Record<string, unknown> {
  const timeframes = input.timeframes.map((tf) => tf.toUpperCase());
  return {
    engine: "den",
    symbol: input.symbol.toUpperCase(),
    timeframes,
    step: timeframes[timeframes.length - 1] ?? null,
    minRR: Number(input.minRR),
    strictMode: input.strictMode,
    requireVolume: input.requireVolume,
    rules: normalizeDenRules(input.rules),
  };
}

/** A Den backtest's spec. Standard only with the track-record settings and typical costs or more. */
export function denTestSpec(input: {
  symbol: string;
  timeframes: string[];
  stepTimeframe: string;
  candleCount: number;
  minRR: number;
  strictMode: boolean;
  requireVolume: boolean;
  rules: unknown;
  warmup: number;
  maxLookout: number;
  costPerTrade: number;
  analysisCandles: number;
  fromTime: string | null;
}): TestSpec {
  const ordered = [
    ...input.timeframes.filter((tf) => tf !== input.stepTimeframe),
    input.stepTimeframe,
  ];
  const strategy = denStrategy({ ...input, timeframes: ordered });
  const typical = typicalCost(input.symbol);
  return {
    strategy,
    test: {
      ...strategy,
      timeframes: input.timeframes.map((tf) => tf.toUpperCase()),
      step: input.stepTimeframe.toUpperCase(),
      candleCount: input.candleCount,
      warmup: input.warmup,
      maxLookout: input.maxLookout,
      costPerTrade: input.costPerTrade,
      analysisCandles: input.analysisCandles,
      fromTime: input.fromTime,
    },
    symbol: input.symbol.toUpperCase(),
    standard:
      input.candleCount === TRACK_RECORD.candleCount &&
      input.warmup === TRACK_RECORD.warmup &&
      input.maxLookout === TRACK_RECORD.maxLookout &&
      input.analysisCandles === TRACK_RECORD.analysisCandles &&
      input.fromTime === null &&
      typical > 0 &&
      input.costPerTrade >= typical,
    costs: input.costPerTrade > 0,
  };
}

async function countTests(db: AnyDb): Promise<number | null> {
  const { count, error } = await db.from(TABLE).select("id", { count: "exact", head: true });
  return error || typeof count !== "number" ? null : count;
}

/** A re-run is a new look once this share of its finished trades falls outside the last counted look. */
const NEW_LOOK_SHARE = 0.1;

interface LastLook {
  id: string;
  first_trade: string | null;
  last_trade: string | null;
}

/**
 * Logs this run's tests and judges them against the bar for every test logged
 * so far. "Every long or short read" and "trades the app would let you take"
 * are separate tests: either could be the one someone points to.
 */
export async function judgeBacktest(
  db: AnyDb,
  userId: string,
  setups: BacktestSetup[],
  spec: TestSpec,
): Promise<BacktestVerdicts> {
  const gated = setups.some((s) => typeof s.tradable === "boolean");
  const groups = [
    { filter: "every", trades: setups },
    ...(gated ? [{ filter: "approved", trades: setups.filter((s) => s.tradable) }] : []),
  ];
  const before = await countTests(db);
  // Judge first as if every group were a new test; a group too thin to pass isn't a test.
  const provisional = before === null ? null : before + groups.length;
  const measured = groups.map((group) => {
    const stats = verdictStats(group.trades, provisional);
    return { ...group, stats, first: judge(stats, { tests: provisional, costs: spec.costs }) };
  });

  let tests: number | null = before;
  // Without costs a run can never pass, whatever the data, so it isn't a test either.
  const toLog = spec.costs ? measured.filter((group) => group.first.level !== "thin") : [];
  if (tests !== null && toLog.length) {
    const [testKey, strategyKey] = await Promise.all([hash(spec.test), hash(spec.strategy)]);
    const now = new Date().toISOString();
    for (const group of toLog) {
      const times = group.trades
        .filter((t) => isResolvedOutcome(t.outcome))
        .map((t) => Date.parse(t.time))
        .filter(Number.isFinite)
        .sort((a, b) => a - b);
      const first = times.length ? new Date(times[0]!).toISOString() : null;
      const last = times.length ? new Date(times[times.length - 1]!).toISOString() : null;
      const { data: prior, error: readError } = await db
        .from(TABLE)
        .select("id, first_trade, last_trade")
        .eq("test_key", testKey)
        .eq("filter", group.filter)
        .order("created_at", { ascending: false })
        .limit(1);
      if (readError) {
        tests = null;
        break;
      }
      const prev = (prior as LastLook[] | null)?.[0];
      const from = prev?.first_trade ? Date.parse(prev.first_trade) : Infinity;
      const to = prev?.last_trade ? Date.parse(prev.last_trade) : -Infinity;
      const fresh = times.filter((t) => t < from || t > to).length;
      const stats = {
        strategy_key: strategyKey,
        symbol: spec.symbol,
        standard: spec.standard,
        costs: spec.costs,
        trades: group.stats.trades,
        avg_r: group.stats.avgR,
        sd_r: group.stats.sdR,
        coin_flip_p: group.stats.coinFlipP,
        created_by: userId,
        updated_at: now,
      };
      // The counted look keeps its trade window, so small daily changes add up to a new look.
      const { error } =
        prev && fresh < NEW_LOOK_SHARE * times.length
          ? await db.from(TABLE).update(stats).eq("id", prev.id)
          : await db.from(TABLE).upsert(
              {
                ...stats,
                look_key: `${testKey}:${group.filter}:${first}:${last}`,
                test_key: testKey,
                filter: group.filter,
                first_trade: first,
                last_trade: last,
              },
              { onConflict: "look_key" },
            );
      if (error) {
        tests = null;
        break;
      }
    }
    if (tests !== null) tests = await countTests(db);
  }

  const final = (group: (typeof measured)[number]): EdgeVerdict =>
    group.first.level === "thin" ? group.first : judge(group.stats, { tests, costs: spec.costs });
  const every = measured.find((group) => group.filter === "every")!;
  const approved = measured.find((group) => group.filter === "approved");
  return {
    tests,
    costs: spec.costs,
    every: final(every),
    approved: approved ? final(approved) : null,
  };
}

/**
 * The latest standard track record logged for this exact strategy, judged
 * against today's bar. Null when it was never tested with enough trades;
 * throws when the log can't be read.
 */
export async function strategyVerdict(
  db: AnyDb,
  strategy: Record<string, unknown>,
): Promise<EdgeVerdict | null> {
  const key = await hash(strategy);
  const [{ data, error }, tests] = await Promise.all([
    db
      .from(TABLE)
      .select("trades, avg_r, sd_r, coin_flip_p, costs")
      .eq("strategy_key", key)
      .eq("filter", "approved")
      .eq("standard", true)
      .order("updated_at", { ascending: false })
      .limit(1),
    countTests(db),
  ]);
  if (error) throw new Error(error.message);
  const row = (
    data as
      | {
          trades: number;
          avg_r: number | null;
          sd_r: number | null;
          coin_flip_p: number | null;
          costs: boolean;
        }[]
      | null
  )?.[0];
  if (!row) return null;
  return judge(
    { trades: row.trades, avgR: row.avg_r, sdR: row.sd_r, coinFlipP: row.coin_flip_p },
    { tests, costs: row.costs },
  );
}

export interface EdgeNote {
  /** The track record for this exact strategy passes today's bar. */
  measured: boolean;
  /** One plain line, always first in an alert or shared signal. */
  text: string;
}

/** Whether this Den strategy has a measured edge, in words, for alerts and shared signals. */
export async function denEdgeNote(db: AnyDb, strategy: Record<string, unknown>): Promise<EdgeNote> {
  try {
    const verdict = await strategyVerdict(db, strategy);
    if (verdict?.level === "edge") {
      return {
        measured: true,
        text: `Measured edge: this symbol, timeframes and rules passed their track record. ${verdict.headline}`,
      };
    }
    if (verdict) {
      return {
        measured: false,
        text: `No measured edge. Track record for this symbol, timeframes and rules: ${verdict.headline}`,
      };
    }
    return {
      measured: false,
      text: "No measured edge: this symbol, timeframes and rules haven't been tested on enough trades. The checklist grade is not a chance of winning.",
    };
  } catch {
    return {
      measured: false,
      text: "No measured edge: the test log couldn't be read, so nothing here has been checked.",
    };
  }
}

const NOTE_LINE = /^(?:No measured edge|Measured edge)[^\n]*\n?/;

/** Puts the edge note first, replacing an older one. */
export function withEdgeNote(summary: string | null | undefined, note: EdgeNote): string {
  const rest = (summary ?? "").replace(NOTE_LINE, "").trim();
  return rest ? `${note.text}\n${rest}` : note.text;
}
