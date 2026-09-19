import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { anyDb } from "@/lib/db-types";

/**
 * Runs the whole walk-forward backtest in one request (hundreds of internal
 * analysis passes, a single round trip).
 */
export const runBacktest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      symbol: string;
      timeframes?: string[];
      candleCount?: number;
      stepTimeframe?: string;
      minRR?: number;
      strictMode?: boolean;
      requireVolume?: boolean;
      warmup?: number;
      maxLookout?: number;
      /** Optional local rulebook. When provided, overrides the saved settings for this run only. */
      denRules?: unknown;
    }) => ({
      symbol: String(data.symbol ?? "")
        .trim()
        .slice(0, 24),
      timeframes: (Array.isArray(data.timeframes) ? data.timeframes : [])
        .map((tf) => String(tf).trim().slice(0, 8))
        .filter(Boolean)
        .slice(0, 8),
      candleCount: Math.max(60, Math.min(8000, Math.round(Number(data.candleCount) || 400))),
      stepTimeframe: String(data.stepTimeframe ?? "")
        .trim()
        .slice(0, 8),
      minRR: Number.isFinite(Number(data.minRR)) ? Number(data.minRR) : 2,
      strictMode: data.strictMode !== false,
      requireVolume: data.requireVolume === true,
      warmup: Math.max(20, Math.min(500, Math.round(Number(data.warmup) || 60))),
      maxLookout: Math.max(10, Math.min(1000, Math.round(Number(data.maxLookout) || 200))),
      denRules: data.denRules ?? null,
    }),
  )
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

    // Prefer the local rules passed from the Backtest page.
    // Fall back to the user's saved settings only when no local rules were provided.
    let rulesToUse = data.denRules;

    if (rulesToUse == null) {
      const { data: settingsRow } = await context.supabase
        .from("settings")
        .select("den_rules")
        .eq("user_id", context.userId)
        .maybeSingle();

      rulesToUse = (settingsRow as { den_rules?: unknown } | null)?.den_rules ?? null;
    }

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
      rules: rulesToUse,
      warmup: data.warmup,
      maxLookout: data.maxLookout,
    });
  });

/**
 * Runs the AI-engine walk-forward backtest: same no-lookahead replay as
 * runBacktest above, but each sampled step is a real call to the live AI
 * analyzer (via the same model cascade the Analyze screen uses), not the
 * free rule-based engine. Samples are capped and batched: see
 * ai-backtest.server.ts for why. Admin-only, same as the Den backtest.
 */
export const runAIBacktest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      symbol: string;
      timeframes?: string[];
      candleCount?: number;
      stepTimeframe?: string;
      minRR?: number;
      strictMode?: boolean;
      requireVolume?: boolean;
      model?: string | null;
      warmup?: number;
      maxLookout?: number;
      maxSamples?: number;
      batchSize?: number;
    }) => ({
      symbol: String(data.symbol ?? "")
        .trim()
        .slice(0, 24),
      timeframes: (Array.isArray(data.timeframes) ? data.timeframes : [])
        .map((tf) => String(tf).trim().slice(0, 8))
        .filter(Boolean)
        .slice(0, 8),
      candleCount: Math.max(60, Math.min(8000, Math.round(Number(data.candleCount) || 400))),
      stepTimeframe: String(data.stepTimeframe ?? "")
        .trim()
        .slice(0, 8),
      minRR: Number.isFinite(Number(data.minRR)) ? Number(data.minRR) : 2,
      strictMode: data.strictMode !== false,
      requireVolume: data.requireVolume === true,
      model: data.model ? String(data.model).trim().slice(0, 64) : null,
      warmup: Math.max(20, Math.min(500, Math.round(Number(data.warmup) || 60))),
      maxLookout: Math.max(10, Math.min(1000, Math.round(Number(data.maxLookout) || 200))),
      maxSamples: Math.max(1, Math.min(60, Math.round(Number(data.maxSamples) || 20))),
      batchSize: Math.max(1, Math.min(8, Math.round(Number(data.batchSize) || 4))),
    }),
  )
  .handler(async ({ data, context }) => {
    if (!data.symbol) throw new Error("Pick a symbol to backtest.");
    if (!data.timeframes.length) throw new Error("Pick at least one timeframe.");

    const { supabaseAdmin: rawAdmin } = await import("@/integrations/supabase/client.server");
    const admin = anyDb(rawAdmin);
    const { requireAdmin } = await import("./premium.server");
    const email = (context.claims["email"] as string | undefined) ?? null;
    await requireAdmin(admin, context.userId, email);

    const { fetchCandles, sortTimeframes } = await import("./market.server");
    const { runAIBacktest: runIt } = await import("./ai-backtest.server");

    const ordered = sortTimeframes(data.timeframes);
    const series = await Promise.all(
      ordered.map(async (timeframe) => ({
        timeframe,
        candles: await fetchCandles(admin, data.symbol, timeframe, data.candleCount),
      })),
    );
    const available = series.filter((set) => set.candles.length >= 12);
    if (!available.length) throw new Error(`No candles stored for ${data.symbol}.`);

    const step =
      available.find((set) => set.timeframe === data.stepTimeframe)?.timeframe ??
      available[available.length - 1]!.timeframe;

    return runIt({
      symbol: data.symbol,
      series: available,
      stepTimeframe: step,
      minRR: data.minRR,
      requireVolume: data.requireVolume,
      strictMode: data.strictMode,
      model: data.model,
      warmup: data.warmup,
      maxLookout: data.maxLookout,
      maxSamples: data.maxSamples,
      batchSize: data.batchSize,
    });
  });
