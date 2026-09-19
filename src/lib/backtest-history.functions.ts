import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { anyDb } from "@/lib/db-types";
import type { BacktestResult } from "@/lib/backtest-shared.server";
import type { DenRules } from "@/lib/den-rules";

export interface BacktestRunRow {
  id: string;
  created_at: string;
  engine: "den" | "ai";
  label: string | null;
  symbol: string;
  timeframes: string[];
  step_timeframe: string;
  candle_count: number;
  min_rr: number | null;
  strict_mode: boolean;
  require_volume: boolean;
  model: string | null;
  den_rules: Partial<DenRules> | null;
  result: BacktestResult;
}

function toRow(raw: any): BacktestRunRow {
  return {
    id: raw.id as string,
    created_at: raw.created_at as string,
    engine: raw.engine === "ai" ? "ai" : "den",
    label: (raw.label as string | null) ?? null,
    symbol: raw.symbol as string,
    timeframes: Array.isArray(raw.timeframes) ? (raw.timeframes as string[]) : [],
    step_timeframe: raw.step_timeframe as string,
    candle_count: Number(raw.candle_count ?? 400),
    min_rr: raw.min_rr == null ? null : Number(raw.min_rr),
    strict_mode: Boolean(raw.strict_mode),
    require_volume: Boolean(raw.require_volume),
    model: (raw.model as string | null) ?? null,
    den_rules: (raw.den_rules as Partial<DenRules> | null) ?? null,
    result: raw.result as BacktestResult,
  };
}

const COLUMNS =
  "id, created_at, engine, label, symbol, timeframes, step_timeframe, candle_count, min_rr, strict_mode, require_volume, model, den_rules, result";

export const listBacktestRuns = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<BacktestRunRow[]> => {
    const db = anyDb(context.supabase);
    const { data, error } = await db
      .from("backtest_runs")
      .select(COLUMNS)
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return (data ?? []).map(toRow);
  });

export const getBacktestRun = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => ({ id: String(data?.id ?? "") }))
  .handler(async ({ data, context }): Promise<BacktestRunRow | null> => {
    if (!data.id) return null;
    const db = anyDb(context.supabase);
    const { data: row, error } = await db
      .from("backtest_runs")
      .select(COLUMNS)
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row ? toRow(row) : null;
  });

export const saveBacktestRun = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      engine: string;
      label?: string | null;
      symbol: string;
      timeframes: string[];
      stepTimeframe: string;
      candleCount: number;
      minRR?: number | null;
      strictMode?: boolean;
      requireVolume?: boolean;
      model?: string | null;
      denRules?: unknown;
      result: unknown;
    }) => ({
      engine: data.engine === "ai" ? "ai" : "den",
      label: data.label ? String(data.label).trim().slice(0, 80) : null,
      symbol: String(data.symbol ?? "").trim().slice(0, 24),
      timeframes: (Array.isArray(data.timeframes) ? data.timeframes : [])
        .map((tf) => String(tf).trim().slice(0, 8))
        .filter(Boolean)
        .slice(0, 8),
      stepTimeframe: String(data.stepTimeframe ?? "").trim().slice(0, 8),
      candleCount: Math.max(60, Math.min(8000, Math.round(Number(data.candleCount) || 400))),
      minRR: data.minRR == null ? null : Number(data.minRR),
      strictMode: data.strictMode !== false,
      requireVolume: data.requireVolume === true,
      model: data.model ? String(data.model).trim().slice(0, 64) : null,
      denRules: data.denRules ?? null,
      result: data.result,
    }),
  )
  .handler(async ({ data, context }): Promise<BacktestRunRow> => {
    if (!data.symbol) throw new Error("Missing symbol.");
    if (!data.timeframes.length) throw new Error("Missing timeframes.");
    if (!data.result) throw new Error("Missing backtest result.");

    const db = anyDb(context.supabase);
    const { data: row, error } = await db
      .from("backtest_runs")
      .insert({
        user_id: context.userId,
        engine: data.engine,
        label: data.label,
        symbol: data.symbol,
        timeframes: data.timeframes,
        step_timeframe: data.stepTimeframe,
        candle_count: data.candleCount,
        min_rr: data.minRR,
        strict_mode: data.strictMode,
        require_volume: data.requireVolume,
        model: data.model,
        den_rules: data.denRules,
        result: data.result,
      })
      .select(COLUMNS)
      .single();
    if (error) throw new Error(error.message);
    return toRow(row);
  });

export const deleteBacktestRun = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => ({ id: String(data?.id ?? "") }))
  .handler(async ({ data, context }) => {
    if (!data.id) throw new Error("Run id is required.");
    const db = anyDb(context.supabase);
    const { error } = await db
      .from("backtest_runs")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
