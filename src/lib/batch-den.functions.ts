/**
 * Batch Den: run the same analyzer as Market Analyze on every symbol in ohlc_data.
 */
import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { anyDb } from "@/lib/db-types";
import { candleCountForTf, getScanPreset, DEFAULT_SCAN_PRESET_ID } from "@/lib/scan-presets";
import { runDenAnalysis } from "@/lib/den-analyzer.server";
import { fetchCandles, listSymbols, listTimeframes, sortTimeframes } from "@/lib/market.server";

const TF_ALIASES: Record<string, string[]> = {
  D1: ["D1", "1D"],
  H4: ["H4", "4H"],
  H1: ["H1", "1H"],
  M30: ["M30", "30M"],
  M15: ["M15", "15M"],
  M5: ["M5", "5M"],
  M1: ["M1", "1M"],
};

export type BatchDenRow = {
  symbol: string;
  direction: string;
  grade: string;
  score: number | null;
  maxScore: number | null;
  tradable: boolean;
  summary: string;
  entryZone: string | null;
  stopLoss: string | null;
  tp1: string | null;
  tp2: string | null;
  timeframesUsed: string[];
  /** Full-ish Den payload for in-app share */
  details: any;
  error?: string;
};

function matchTfs(wanted: string[], available: string[]): string[] {
  const map = new Map(available.map((t) => [t.toUpperCase(), t]));
  const out: string[] = [];
  for (const w of wanted) {
    const hit = map.get(w.toUpperCase());
    if (hit && !out.includes(hit)) out.push(hit);
    else {
      for (const [c, aliases] of Object.entries(TF_ALIASES)) {
        if (c === w.toUpperCase() || aliases.some((a) => a.toUpperCase() === w.toUpperCase())) {
          const h = map.get(c) ?? aliases.map((a) => map.get(a.toUpperCase())).find(Boolean);
          if (h && !out.includes(h)) out.push(h);
          break;
        }
      }
    }
  }
  return sortTimeframes(out);
}

export const runBatchDen = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { scanPresetId?: string } = {}) => ({
    scanPresetId: String(data?.scanPresetId ?? DEFAULT_SCAN_PRESET_ID).slice(0, 32),
  }))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin: rawAdmin } = await import("@/integrations/supabase/client.server");
    const db = anyDb(rawAdmin);

    // Admin-only batch (same as market analyze)
    const { requireAdmin } = await import("@/lib/premium.server");
    const email = (context.claims["email"] as string | undefined) ?? null;
    await requireAdmin(db, context.userId, email);

    const { data: settings } = await context.supabase
      .from("settings")
      .select("min_rr, strict_mode, require_volume, den_rules, context_weights_enabled")
      .eq("user_id", context.userId)
      .maybeSingle();
    const row = settings as Record<string, unknown> | null;

    const preset = getScanPreset(data.scanPresetId);
    const symbols = (await listSymbols(db)).slice(0, 16);
    if (!symbols.length) {
      throw new Error("No symbols in ohlc_data. Run your MT5 uploader first.");
    }

    const results: BatchDenRow[] = [];

    for (const symbol of symbols) {
      try {
        const availableTfs = await listTimeframes(db, symbol);
        let tfs = matchTfs(preset.timeframes, availableTfs);
        if (!tfs.length) tfs = sortTimeframes(availableTfs).slice(0, 5);

        const series = await Promise.all(
          tfs.map(async (timeframe) => {
            const canon =
              Object.keys(TF_ALIASES).find(
                (c) =>
                  c === timeframe.toUpperCase() ||
                  TF_ALIASES[c]?.some((a) => a.toUpperCase() === timeframe.toUpperCase()),
              ) ?? timeframe.toUpperCase();
            const n = candleCountForTf(preset, canon);
            return {
              timeframe,
              candles: await fetchCandles(db, symbol, timeframe, n),
            };
          }),
        );
        const usable = series.filter((s) => s.candles.length >= 12);
        if (!usable.length) {
          results.push({
            symbol,
            direction: "—",
            grade: "—",
            score: null,
            maxScore: null,
            tradable: false,
            summary: "Not enough candles for this preset.",
            entryZone: null,
            stopLoss: null,
            tp1: null,
            tp2: null,
            timeframesUsed: [],
            details: null,
            error: "no_candles",
          });
          continue;
        }

        const analysis = runDenAnalysis({
          symbol,
          series: usable,
          minRR: Number(row?.min_rr ?? 2) || 2,
          requireVolume: row?.require_volume === true,
          strictMode: row?.strict_mode !== false,
          rules: row?.den_rules ?? null,
          contextWeights: row?.context_weights_enabled === true,
        });

        const details = {
          direction: analysis.direction,
          grade: analysis.grade,
          score: analysis.score,
          max_score: analysis.max_score,
          summary: analysis.summary,
          entry_zone: analysis.entry_zone,
          stop_loss: analysis.stop_loss,
          tp1: analysis.tp1,
          tp2: analysis.tp2,
          tradable: (analysis as { tradable?: boolean }).tradable,
          tradable_reasons: (analysis as { tradable_reasons?: string[] }).tradable_reasons,
          setup_stage: (analysis as { setup_stage?: string }).setup_stage,
          checklist: (analysis as { checklist?: unknown }).checklist ?? (analysis as { items?: unknown }).items,
          trade_plan: (analysis as { trade_plan?: unknown }).trade_plan,
          invalidation: (analysis as { invalidation?: unknown }).invalidation,
          invalidationConditions: (analysis as { invalidationConditions?: unknown }).invalidationConditions,
          bias: (analysis as { bias?: unknown }).bias,
          timeframes: usable.map((s) => s.timeframe),
          preset: preset.name,
        };
        results.push({
          symbol,
          direction: String(analysis.direction ?? "—"),
          grade: String(analysis.grade ?? "—"),
          score: analysis.score ?? null,
          maxScore: analysis.max_score ?? null,
          tradable: Boolean((analysis as { tradable?: boolean }).tradable),
          summary: String(analysis.summary ?? "").slice(0, 400),
          entryZone: analysis.entry_zone ?? null,
          stopLoss: analysis.stop_loss ?? null,
          tp1: analysis.tp1 ?? null,
          tp2: analysis.tp2 ?? null,
          timeframesUsed: usable.map((s) => s.timeframe),
          details,
        });
      } catch (e) {
        results.push({
          symbol,
          direction: "—",
          grade: "—",
          score: null,
          maxScore: null,
          tradable: false,
          summary: e instanceof Error ? e.message : "Failed",
          entryZone: null,
          stopLoss: null,
          tp1: null,
          tp2: null,
          timeframesUsed: [],
          details: null,
          error: "failed",
        });
      }
    }

    // Sort: tradable first, then long/short, then WAIT
    const rank = (r: BatchDenRow) => {
      if (r.tradable) return 0;
      const d = r.direction.toUpperCase();
      if (d.includes("LONG") || d.includes("SHORT")) return 1;
      if (d.includes("WAIT")) return 2;
      return 3;
    };
    results.sort((a, b) => rank(a) - rank(b) || a.symbol.localeCompare(b.symbol));

    return {
      presetId: preset.id,
      presetName: preset.name,
      count: results.length,
      results,
    };
  });
