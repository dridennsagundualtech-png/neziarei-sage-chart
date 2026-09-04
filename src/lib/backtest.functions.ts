import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { anyDb } from "@/lib/db-types";

/**
 * Runs the whole walk-forward backtest in one request (hundreds of internal
 * analysis passes, a single round trip).
 */
export const runBacktest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: {
    symbol: string;
    timeframes?: string[];
    candleCount?: number;
    stepTimeframe?: string;
    minRR?: number;
    strictMode?: boolean;
    requireVolume?: boolean;
    warmup?: number;
    maxLookout?: number;
  }) => ({
    symbol: String(data.symbol ?? "").trim().slice(0, 24),
    timeframes: (Array.isArray(data.timeframes) ? data.timeframes : [])
      .map((tf) => String(tf).trim().slice(0, 8))
      .filter(Boolean)
      .slice(0, 8),
    candleCount: Math.max(60, Math.min(2000, Math.round(Number(data.candleCount) || 400))),
    stepTimeframe: String(data.stepTimeframe ?? "").trim().slice(0, 8),
    minRR: Number.isFinite(Number(data.minRR)) ? Number(data.minRR) : 2,
    strictMode: data.strictMode !== false,
    requireVolume: data.requireVolume === true,
    warmup: Math.max(20, Math.min(500, Math.round(Number(data.warmup) || 60))),
    maxLookout: Math.max(10, Math.min(1000, Math.round(Number(data.maxLookout) || 200))),
  }))
  .handler(async ({ data, context }) => {
    if (!data.symbol) throw new Error("Pick a symbol to backtest.");
    if (!data.timeframes.length) throw new Error("Pick at least one timeframe.");

    const { supabaseAdmin: rawAdmin } = await import("@/integrations/supabase/client.server");
    const admin = anyDb(rawAdmin);
    const { requireAdmin } = await import("./premium.server");
    const email = (context.claims["email"] as string | undefined) ?? null;
    await requireAdmin(admin, context.userId, email);

    const { fetchCandles, sortTimeframes } = await import("./market.server");
    const { runDenBacktest } = await import("./den-backtest.server");

    const ordered = sortTimeframes(data.timeframes);
    const series = await Promise.all(
      ordered.map(async (timeframe) => ({
        timeframe,
        candles: await fetchCandles(admin, data.symbol, timeframe, data.candleCount),
      })),
    );
    const available = series.filter((set) => set.candles.length >= 12);
    if (!available.length) throw new Error(`No candles stored for ${data.symbol}.`);

    const { data: settingsRow } = await context.supabase
      .from("settings")
      .select("den_rules")
      .eq("user_id", context.userId)
      .maybeSingle();

    const step =
      available.find((set) => set.timeframe === data.stepTimeframe)?.timeframe ??
      available[available.length - 1]!.timeframe;

    return runDenBacktest({
      symbol: data.symbol,
      series: available,
      stepTimeframe: step,
      minRR: data.minRR,
      requireVolume: data.requireVolume,
      strictMode: data.strictMode,
      rules: (settingsRow as { den_rules?: unknown } | null)?.den_rules ?? null,
      warmup: data.warmup,
      maxLookout: data.maxLookout,
    });
  });
