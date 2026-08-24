import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { runAnalysis } from "./analyze.server";

const inputSchema = z.object({
  images: z
    .array(
      z.object({
        dataUrl: z.string().min(32),
        timeframe: z.string().max(8).nullable().optional(),
      }),
    )
    .min(1)
    .max(6),
  assetHint: z.string().max(24).nullable().optional(),
  minRR: z.number().min(0).max(20).default(2),
  requireVolume: z.boolean().default(false),
  strictMode: z.boolean().default(true),
});

export const analyzeChart = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { requirePremiumAccess } = await import("./premium.server");
    const email = (context.claims["email"] as string | undefined) ?? null;
    await requirePremiumAccess(supabaseAdmin, context.userId, email);
    return runAnalysis({
      images: data.images.map((img) => ({ dataUrl: img.dataUrl, timeframe: img.timeframe ?? null })),
      assetHint: data.assetHint ?? null,
      minRR: data.minRR,
      requireVolume: data.requireVolume,
      strictMode: data.strictMode,
      model: data.model ?? null,
    });
  });

const dataInputSchema = z.object({
  symbol: z.string().min(1).max(24),
  timeframes: z.array(z.string().min(1).max(8)).min(1).max(6),
  minRR: z.number().min(0).max(20).default(2),
  requireVolume: z.boolean().default(false),
  strictMode: z.boolean().default(true),
  model: z.string().max(64).nullable().optional(),
});

/** Symbols available in the stored OHLC feed. */
export const listDataSymbols = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { anyDb } = await import("./db-types");
    const { requirePremiumAccess } = await import("./premium.server");
    const admin = anyDb(supabaseAdmin);
    const email = (context.claims["email"] as string | undefined) ?? null;
    await requirePremiumAccess(admin, context.userId, email);
    const { data, error } = await admin.rpc("ohlc_symbols");
    if (error) throw new Error("Could not read market data.");
    const set = new Set<string>();
    for (const row of (data ?? []) as string[]) if (row) set.add(row);
    return [...set].sort();
  });

/** Timeframes available for one symbol. */
export const listDataTimeframes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ symbol: z.string().min(1).max(24) }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { anyDb } = await import("./db-types");
    const { requirePremiumAccess } = await import("./premium.server");
    const admin = anyDb(supabaseAdmin);
    const email = (context.claims["email"] as string | undefined) ?? null;
    await requirePremiumAccess(admin, context.userId, email);
    const { data: rows, error } = await admin.rpc("ohlc_timeframes", { _symbol: data.symbol });
    if (error) throw new Error("Could not read market data.");
    const set = new Set<string>();
    for (const row of (rows ?? []) as string[]) {
      if (row) set.add(row);
    }
    return [...set];
  });

/** Most recent stored candle time per timeframe, for the freshness indicator. */
export const listDataFreshness = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        symbol: z.string().min(1).max(24),
        timeframes: z.array(z.string().min(1).max(8)).min(1).max(6),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { anyDb } = await import("./db-types");
    const { requirePremiumAccess } = await import("./premium.server");
    const admin = anyDb(supabaseAdmin);
    const email = (context.claims["email"] as string | undefined) ?? null;
    await requirePremiumAccess(admin, context.userId, email);

    const rows: { timeframe: string; lastTime: string | null }[] = [];
    for (const timeframe of data.timeframes) {
      const { data: latest, error } = await admin
        .from("ohlc_data")
        .select("time")
        .eq("symbol", data.symbol)
        .eq("timeframe", timeframe)
        .order("time", { ascending: false })
        .limit(1);
      if (error) throw new Error("Could not read market data.");
      const first = (latest ?? [])[0] as { time: string | null } | undefined;
      rows.push({ timeframe, lastTime: first?.time ?? null });
    }
    return rows;
  });

/** Analysis driven by stored OHLC candles instead of screenshots. */
export const analyzeChartFromData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => dataInputSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { anyDb } = await import("./db-types");
    const { requirePremiumAccess } = await import("./premium.server");
    const { fetchCandles } = await import("./market.server");
    const { runAnalysisFromData } = await import("./analyze.server");
    const admin = anyDb(supabaseAdmin);
    const email = (context.claims["email"] as string | undefined) ?? null;
    await requirePremiumAccess(admin, context.userId, email);

    const series = [];
    for (const timeframe of data.timeframes) {
      const candles = await fetchCandles(admin, data.symbol, timeframe, 150);
      series.push({ timeframe, candles });
    }

    return runAnalysisFromData({
      symbol: data.symbol,
      series,
      minRR: data.minRR,
      requireVolume: data.requireVolume,
      strictMode: data.strictMode,
      model: data.model ?? null,
    });
  });
