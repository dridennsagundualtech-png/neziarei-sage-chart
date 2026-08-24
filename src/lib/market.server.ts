/**
 * Admin-only market analysis from stored OHLC data (server only).
 *
 * Unlike the screenshot analyzer, every number here comes from real candles in
 * `ohlc_data`. Deterministic maths (EMA, ATR, swings, range position) is done
 * in code; the model only interprets it. It still never outputs win rates.
 */
import { chatWithFallback } from "./ai-gateway.server";
import {
  MAX_SCORE,
  gradeFor,
  normalizeChecklist,
  totalScore,
  CHECKLIST_SPEC,
  type AnalysisResult,
  type Direction,
  type SetupStage,
} from "./analysis-types";
import type { AnyDb } from "./db-types";
import type { MarketAnalysis, TimeframeStats } from "./market-types";
import { cascadeModels } from "./ai-models";

export const TF_PLAN = [
  { timeframe: "D1", limit: 80 },
  { timeframe: "H4", limit: 100 },
  { timeframe: "H1", limit: 120 },
  { timeframe: "M15", limit: 150 },
  { timeframe: "M5", limit: 150 },
] as const;

export interface Candle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number | null;
}

export type { TimeframeStats, MarketAnalysis } from "./market-types";



function num(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

export async function listSymbols(admin: AnyDb): Promise<string[]> {
  const { data, error } = await admin.rpc("ohlc_symbols");
  if (error) throw new Error("Could not read market data.");
  const set = new Set<string>();
  for (const row of (data ?? []) as string[]) if (row) set.add(row);
  return [...set].sort();
}

export async function fetchCandles(
  admin: AnyDb,
  symbol: string,
  timeframe: string,
  limit: number,
): Promise<Candle[]> {
  const { data, error } = await admin
    .from("ohlc_data")
    .select("time, open, high, low, close, tick_volume")
    .eq("symbol", symbol)
    .eq("timeframe", timeframe)
    .order("time", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Could not read ${timeframe} candles.`);

  const rows = (data ?? []) as Record<string, unknown>[];
  return rows
    .map((row) => ({
      time: String(row["time"] ?? ""),
      open: num(row["open"]) ?? 0,
      high: num(row["high"]) ?? 0,
      low: num(row["low"]) ?? 0,
      close: num(row["close"]) ?? 0,
      volume: num(row["tick_volume"]),
    }))
    .filter((candle) => candle.time && candle.close > 0)
    .reverse();
}

function ema(values: number[], period: number): number | null {
  if (values.length < period) return null;
  const k = 2 / (period + 1);
  let value = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < values.length; i += 1) value = values[i]! * k + value * (1 - k);
  return value;
}

function atr(candles: Candle[], period = 14): number | null {
  if (candles.length < period + 1) return null;
  const trs: number[] = [];
  for (let i = 1; i < candles.length; i += 1) {
    const c = candles[i]!;
    const prev = candles[i - 1]!;
    trs.push(Math.max(c.high - c.low, Math.abs(c.high - prev.close), Math.abs(c.low - prev.close)));
  }
  const window = trs.slice(-period);
  return window.reduce((a, b) => a + b, 0) / window.length;
}

/** Fractal pivots: a high/low that is the extreme of a 2-bar window each side. */
function swings(candles: Candle[], side: "high" | "low", count: number): number[] {
  const out: { index: number; price: number }[] = [];
  for (let i = 2; i < candles.length - 2; i += 1) {
    const window = candles.slice(i - 2, i + 3);
    const price = candles[i]![side];
    const isPivot =
      side === "high"
        ? window.every((c) => c.high <= price)
        : window.every((c) => c.low >= price);
    if (isPivot) out.push({ index: i, price });
  }
  return out
    .slice(-count)
    .map((item) => item.price)
    .reverse();
}

function round(value: number | null, digits: number): number | null {
  if (value === null) return null;
  return Number(value.toFixed(digits));
}

function digitsFor(price: number): number {
  if (price >= 1000) return 2;
  if (price >= 100) return 2;
  if (price >= 10) return 3;
  if (price >= 1) return 4;
  return 6;
}

export function computeStats(timeframe: string, candles: Candle[]): TimeframeStats {
  if (!candles.length) {
    return {
      timeframe,
      candles: 0,
      from: null,
      to: null,
      last_close: null,
      change_pct: null,
      ema20: null,
      ema50: null,
      trend: "UNKNOWN",
      atr14: null,
      range_high: null,
      range_low: null,
      range_position_pct: null,
      swing_highs: [],
      swing_lows: [],
      volume_trend: "UNKNOWN",
    };
  }

  const closes = candles.map((c) => c.close);
  const last = candles[candles.length - 1]!;
  const first = candles[0]!;
  const d = digitsFor(last.close);
  const e20 = ema(closes, 20);
  const e50 = ema(closes, 50);
  const high = Math.max(...candles.map((c) => c.high));
  const low = Math.min(...candles.map((c) => c.low));

  let trend: TimeframeStats["trend"] = "UNKNOWN";
  if (e20 !== null && e50 !== null) {
    const spread = Math.abs(e20 - e50) / last.close;
    if (spread < 0.0008) trend = "FLAT";
    else trend = e20 > e50 ? "UP" : "DOWN";
  }

  const vols = candles.map((c) => c.volume ?? 0);
  const hasVolume = vols.some((v) => v > 0);
  let volumeTrend: TimeframeStats["volume_trend"] = "UNKNOWN";
  if (hasVolume && vols.length >= 20) {
    const recent = vols.slice(-5).reduce((a, b) => a + b, 0) / 5;
    const base = vols.slice(-20).reduce((a, b) => a + b, 0) / 20;
    const ratio = base > 0 ? recent / base : 1;
    volumeTrend = ratio > 1.2 ? "EXPANDING" : ratio < 0.8 ? "CONTRACTING" : "FLAT";
  }

  return {
    timeframe,
    candles: candles.length,
    from: first.time,
    to: last.time,
    last_close: round(last.close, d),
    change_pct: round(((last.close - first.close) / first.close) * 100, 2),
    ema20: round(e20, d),
    ema50: round(e50, d),
    trend,
    atr14: round(atr(candles), d),
    range_high: round(high, d),
    range_low: round(low, d),
    range_position_pct: high > low ? round(((last.close - low) / (high - low)) * 100, 1) : null,
    swing_highs: swings(candles, "high", 5).map((p) => round(p, d) as number),
    swing_lows: swings(candles, "low", 5).map((p) => round(p, d) as number),
    volume_trend: volumeTrend,
  };
}

function candleTable(timeframe: string, candles: Candle[]): string {
  const d = candles.length ? digitsFor(candles[candles.length - 1]!.close) : 2;
  const lines = candles.map(
    (c) =>
      `${c.time.slice(0, 16)},${c.open.toFixed(d)},${c.high.toFixed(d)},${c.low.toFixed(d)},${c.close.toFixed(d)},${c.volume ?? ""}`,
  );
  return `### ${timeframe} (${candles.length} candles, oldest→newest)\ntime,open,high,low,close,volume\n${lines.join("\n")}`;
}

function strArray(value: unknown, limit = 12): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => typeof item === "string" && item.trim().length > 0)
    .slice(0, limit)
    .map((item) => (item as string).trim().slice(0, 400));
}

const DIRECTIONS: Direction[] = [
  "POTENTIAL LONG",
  "POTENTIAL SHORT",
  "WAIT",
  "NO TRADE",
  "INSUFFICIENT DATA",
];

const STAGES: SetupStage[] = [
  "SETUP FORMING",
  "SETUP CONFIRMED",
  "ENTRY AVAILABLE",
  "ENTRY MISSED",
  "SETUP INVALIDATED",
  "NO TRADE",
];

function parseJson(text: string): Record<string, unknown> {
  const cleaned = text.replace(/^\s*```(?:json)?/i, "").replace(/```\s*$/, "").trim();
  try {
    return JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
    }
    throw new Error("The analysis engine returned an unreadable response. Please try again.");
  }
}

export interface MarketAnalyzeInput {
  symbol: string;
  minRR: number;
  strictMode: boolean;
  requireVolume: boolean;
  model?: string | null;
}

export async function runMarketAnalysis(
  admin: AnyDb,
  input: MarketAnalyzeInput,
): Promise<MarketAnalysis> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AI is not configured for this project.");

  const sets = await Promise.all(
    TF_PLAN.map(async (plan) => ({
      timeframe: plan.timeframe,
      candles: await fetchCandles(admin, input.symbol, plan.timeframe, plan.limit),
    })),
  );

  const available = sets.filter((set) => set.candles.length > 0);
  if (!available.length) {
    throw new Error(`No candles found for ${input.symbol} in the market data table.`);
  }

  const stats = available.map((set) => computeStats(set.timeframe, set.candles));
  const dataAsOf =
    available
      .flatMap((set) => set.candles.map((c) => c.time))
      .sort()
      .at(-1) ?? null;

  const checklistRules = CHECKLIST_SPEC.map((spec) => `- ${spec.key} (max ${spec.max}): ${spec.rule}`).join(
    "\n",
  );

  const system = `You are ChartPilot Market Engine. You analyse REAL OHLC candle data (not screenshots) across multiple timeframes.

ABSOLUTE RULES
1. Use only the candles and precomputed statistics provided. Never invent levels; every price you quote must be derived from the data.
2. Never output win rates, accuracy percentages or probabilities of winning. Never say "buy now" or "sell now".
3. "NO TRADE" and "WAIT" are valid, encouraged answers. ${input.strictMode ? "STRICT MODE: when the read is ambiguous, prefer WAIT." : ""}
4. Use D1/H4 for directional bias, H1 for intermediate structure, M15/M5 for timing only.
5. ${input.requireVolume ? "The user requires volume confirmation; if tick volume is missing or unsupportive, score volume 0 and say so." : "Tick volume is indicative only; if missing, score volume 0 and state 'Volume context unavailable'."}
6. The user's minimum reward-to-risk is ${input.minRR}:1. Flag measurable R:R below that as unfavourable.
7. Prices must be quoted with the same precision as the data (zones are fine, e.g. "3345.20–3348.60").

SCORING RULES (never exceed a component maximum)
${checklistRules}

Return ONLY minified JSON matching exactly:
{
 "market_type": "crypto"|"forex"|"stocks"|"commodities"|"indices"|"unknown",
 "htf_bias": "BULLISH"|"BEARISH"|"RANGING"|"UNCONFIRMED",
 "direction": "POTENTIAL LONG"|"POTENTIAL SHORT"|"WAIT"|"NO TRADE"|"INSUFFICIENT DATA",
 "setup_stage": "SETUP FORMING"|"SETUP CONFIRMED"|"ENTRY AVAILABLE"|"ENTRY MISSED"|"SETUP INVALIDATED"|"NO TRADE",
 "visual_evidence": "HIGH"|"MEDIUM"|"LOW",
 "summary": string,
 "momentum": string,
 "support_levels": string[],
 "resistance_levels": string[],
 "timeframe_reads": [{"timeframe": string, "read": string}],
 "checklist": [{"key": string, "status": string, "score": number, "evidence": string, "confidence": "HIGH"|"MEDIUM"|"LOW", "missing": string|null}],
 "entry_zone": string|null,
 "stop_loss": string|null,
 "tp1": string|null,
 "tp2": string|null,
 "risk_reward": number|null,
 "required_confirmation": string[],
 "invalidation": string[],
 "reasoning": string[],
 "missing_information": string[]
}

"visual_evidence" = how clear the evidence in the data is, NOT a probability of winning.
"momentum" = 2-4 sentences on current momentum (impulse vs correction, EMA relationship, volatility via ATR, volume behaviour).
"timeframe_reads" = one short read per provided timeframe.
"support_levels"/"resistance_levels" = 2-5 each, ordered nearest-first, each as "price or zone — why it matters".
"reasoning" = 4-8 plain-English steps. Do NOT output a total score.`;

  const user = [
    `Symbol: ${input.symbol}`,
    `Latest candle time: ${dataAsOf ?? "unknown"}`,
    "",
    "Precomputed statistics (authoritative):",
    JSON.stringify(stats),
    "",
    "Raw candles:",
    ...available.map((set) => candleTable(set.timeframe, set.candles)),
  ].join("\n");

  const { content } = await chatWithFallback(
    apiKey,
    cascadeModels(input.model),
    {
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
    },
  );

  const raw = parseJson(content);
  const checklist = normalizeChecklist(raw["checklist"]);
  const score = totalScore(checklist);

  let direction = DIRECTIONS.includes(raw["direction"] as Direction)
    ? (raw["direction"] as Direction)
    : "NO TRADE";
  let stage = STAGES.includes(raw["setup_stage"] as SetupStage)
    ? (raw["setup_stage"] as SetupStage)
    : "SETUP FORMING";

  if (
    input.strictMode &&
    score < 7 &&
    (direction === "POTENTIAL LONG" || direction === "POTENTIAL SHORT")
  ) {
    direction = "WAIT";
    stage = "SETUP FORMING";
  }

  const rr =
    typeof raw["risk_reward"] === "number" && Number.isFinite(raw["risk_reward"])
      ? Math.max(0, Math.min(Number(raw["risk_reward"]), 50))
      : null;

  const reads = Array.isArray(raw["timeframe_reads"])
    ? (raw["timeframe_reads"] as Record<string, unknown>[])
        .filter((item) => item && typeof item === "object")
        .slice(0, 6)
        .map((item) => ({
          timeframe: String(item["timeframe"] ?? "").slice(0, 8),
          read: String(item["read"] ?? "").slice(0, 600),
        }))
        .filter((item) => item.timeframe && item.read)
    : [];

  return {
    symbol: input.symbol,
    data_as_of: dataAsOf,
    stats,
    series: available.map((set) => ({
      timeframe: set.timeframe,
      candles: set.candles.slice(-120),
    })),
    support_levels: strArray(raw["support_levels"], 6),
    resistance_levels: strArray(raw["resistance_levels"], 6),
    momentum: String(raw["momentum"] ?? "").slice(0, 900),
    timeframe_reads: reads,

    asset: input.symbol.toUpperCase().slice(0, 24),
    market_type: String(raw["market_type"] ?? "unknown").toLowerCase().slice(0, 20),
    timeframes: stats.map((item) => item.timeframe),
    primary_timeframe: stats[0]?.timeframe ?? null,
    sufficient_information: true,
    requested_additional_images: [],
    missing_information: strArray(raw["missing_information"], 10),
    htf_bias: String(raw["htf_bias"] ?? "UNCONFIRMED").toUpperCase().slice(0, 20),
    direction,
    setup_stage: stage,
    checklist,
    score,
    max_score: MAX_SCORE,
    grade: gradeFor(score),
    visual_evidence:
      raw["visual_evidence"] === "HIGH" || raw["visual_evidence"] === "MEDIUM"
        ? (raw["visual_evidence"] as "HIGH" | "MEDIUM")
        : "LOW",
    summary: String(raw["summary"] ?? "").slice(0, 900),
    entry_zone: raw["entry_zone"] ? String(raw["entry_zone"]).slice(0, 80) : null,
    stop_loss: raw["stop_loss"] ? String(raw["stop_loss"]).slice(0, 80) : null,
    tp1: raw["tp1"] ? String(raw["tp1"]).slice(0, 80) : null,
    tp2: raw["tp2"] ? String(raw["tp2"]).slice(0, 80) : null,
    risk_reward: rr,
    required_confirmation: strArray(raw["required_confirmation"], 8),
    invalidation: strArray(raw["invalidation"], 8),
    reasoning: strArray(raw["reasoning"], 10),
  };
}
