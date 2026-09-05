import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { anyDb } from "@/lib/db-types";

/**
 * Live, rule-based Den Analyzer run on the most recent stored candles.
 * No AI, no credits — pure math over ohlc_data.
 */
export const runDenLive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: {
    symbol: string;
    timeframes?: string[];
    candleCount?: number;
    candleCounts?: Record<string, number> | null;
    minRR?: number;
    strictMode?: boolean;
    requireVolume?: boolean;
    denRules?: unknown;
  }) => ({
    symbol: String(data.symbol ?? "").trim().slice(0, 24),
    timeframes: (Array.isArray(data.timeframes) ? data.timeframes : [])
      .map((tf) => String(tf).trim().slice(0, 8))
      .filter(Boolean)
      .slice(0, 8),
    candleCount: Math.max(10, Math.min(300, Math.round(Number(data.candleCount) || 150))),
    candleCounts: Object.fromEntries(
      Object.entries(data.candleCounts ?? {})
        .slice(0, 12)
        .map(([tf, value]) => [
          String(tf).trim().slice(0, 8),
          Math.max(10, Math.min(300, Math.round(Number(value) || 150))),
        ]),
    ) as Record<string, number>,
    minRR: Number.isFinite(Number(data.minRR)) ? Number(data.minRR) : 2,
    strictMode: data.strictMode !== false,
    requireVolume: data.requireVolume === true,
    denRules: data.denRules ?? null,
  }))
  .handler(async ({ data, context }) => {
    if (!data.symbol) throw new Error("Pick a symbol to analyse.");
    if (!data.timeframes.length) throw new Error("Pick at least one timeframe.");

    const { supabaseAdmin: rawAdmin } = await import("@/integrations/supabase/client.server");
    const admin = anyDb(rawAdmin);
    const { requireAdmin } = await import("./premium.server");
    const email = (context.claims["email"] as string | undefined) ?? null;
    await requireAdmin(admin, context.userId, email);

    const { fetchCandles, sortTimeframes } = await import("./market.server");
    const { runDenAnalysis } = await import("./den-analyzer.server");

    const ordered = sortTimeframes(data.timeframes);
    const series = await Promise.all(
      ordered.map(async (timeframe) => ({
        timeframe,
        candles: await fetchCandles(
          admin,
          data.symbol,
          timeframe,
          data.candleCounts[timeframe] ?? data.candleCount,
        ),
      })),
    );
    const available = series.filter((set) => set.candles.length > 0);
    if (!available.length) {
      throw new Error(`No candles found for ${data.symbol} in the market data table.`);
    }

    // Fall back to the saved rulebook when the client did not send one.
    let rules = data.denRules;
    if (!rules || (typeof rules === "object" && !Object.keys(rules).length)) {
      const { data: settingsRow } = await context.supabase
        .from("settings")
        .select("den_rules")
        .eq("user_id", context.userId)
        .maybeSingle();
      rules = (settingsRow as { den_rules?: unknown } | null)?.den_rules ?? null;
    }

    return runDenAnalysis({
      symbol: data.symbol,
      series: available,
      minRR: data.minRR,
      requireVolume: data.requireVolume,
      strictMode: data.strictMode,
      rules,
    });
  });
