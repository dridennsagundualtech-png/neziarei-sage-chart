import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { anyDb } from "@/lib/db-types";

export const listMarketSymbols = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin: rawAdmin } = await import("@/integrations/supabase/client.server");
    const admin = anyDb(rawAdmin);
    const { requireAdmin } = await import("./premium.server");
    const { listSymbols } = await import("./market.server");
    const email = (context.claims["email"] as string | undefined) ?? null;
    await requireAdmin(admin, context.userId, email);
    return listSymbols(admin);
  });

/** Timeframes actually stored for a symbol — picked up automatically as new ones appear. */
export const listMarketTimeframes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { symbol: string }) => ({
    symbol: String(data.symbol ?? "").trim().slice(0, 24),
  }))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin: rawAdmin } = await import("@/integrations/supabase/client.server");
    const admin = anyDb(rawAdmin);
    const { requireAdmin } = await import("./premium.server");
    const { listTimeframes } = await import("./market.server");
    const email = (context.claims["email"] as string | undefined) ?? null;
    await requireAdmin(admin, context.userId, email);
    if (!data.symbol) return [] as string[];
    return listTimeframes(admin, data.symbol);
  });

/** Most recent stored candle time per timeframe (last-candle-updated indicator). */
export const listMarketFreshness = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { symbol: string; timeframes: string[] }) => ({
    symbol: String(data.symbol ?? "").trim().slice(0, 24),
    timeframes: (Array.isArray(data.timeframes) ? data.timeframes : [])
      .map((tf) => String(tf).trim().slice(0, 8))
      .filter(Boolean)
      .slice(0, 12),
  }))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin: rawAdmin } = await import("@/integrations/supabase/client.server");
    const admin = anyDb(rawAdmin);
    const { requireAdmin } = await import("./premium.server");
    const { latestCandleTimes } = await import("./market.server");
    const email = (context.claims["email"] as string | undefined) ?? null;
    await requireAdmin(admin, context.userId, email);
    if (!data.symbol || !data.timeframes.length) return [];
    return latestCandleTimes(admin, data.symbol, data.timeframes);
  });

export const analyzeMarketData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: {
    symbol: string;
    timeframes?: string[];
    candleCount?: number;
    minRR?: number;
    strictMode?: boolean;
    requireVolume?: boolean;
    model?: string | null;
  }) => ({
    symbol: String(data.symbol ?? "").trim().slice(0, 24),
    timeframes: (Array.isArray(data.timeframes) ? data.timeframes : [])
      .map((tf) => String(tf).trim().slice(0, 8))
      .filter(Boolean)
      .slice(0, 8),
    candleCount: Math.max(10, Math.min(150, Math.round(Number(data.candleCount) || 150))),
    minRR: Number.isFinite(Number(data.minRR)) ? Number(data.minRR) : 2,
    strictMode: data.strictMode !== false,
    requireVolume: data.requireVolume === true,
    model: data.model ?? null,
  }))
  .handler(async ({ data, context }) => {
    if (!data.symbol) throw new Error("Pick a symbol to analyse.");
    const { supabaseAdmin: rawAdmin } = await import("@/integrations/supabase/client.server");
    const admin = anyDb(rawAdmin);
    const { requireAdmin } = await import("./premium.server");
    const { runMarketAnalysis } = await import("./market.server");
    const email = (context.claims["email"] as string | undefined) ?? null;
    await requireAdmin(admin, context.userId, email);
    return runMarketAnalysis(admin, data);
  });
