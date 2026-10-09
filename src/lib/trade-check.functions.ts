import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { anyDb } from "@/lib/db-types";

export interface TradeCheck {
  id: string;
  asset: string;
  /** Stored market-data symbol the check used, e.g. "XAUUSD.r". */
  symbol: string | null;
  timeframe: string | null;
  /** WIN / LOSS / MISSED are proposals to apply; OPEN = still running; SKIPPED = not checkable. */
  status: "WIN" | "LOSS" | "MISSED" | "OPEN" | "SKIPPED";
  r: number | null;
  /** When the stop, target or cancellation happened. */
  at: string | null;
  note: string;
}

/** A resting entry that hasn't traded within this long is treated as missed. */
const FILL_WINDOW_MINUTES = 24 * 60;

/**
 * Checks the signed-in user's OPEN journal trades against stored market data:
 * did the entry fill, then which came first, the stop or TP1. Same rules as the
 * backtester. Nothing is written here; the client applies the proposals.
 */
export const checkOpenTrades = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<TradeCheck[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin = anyDb(supabaseAdmin);
    const { requireMarketDataAccess } = await import("./premium.server");
    const email = (context.claims["email"] as string | undefined) ?? null;
    await requireMarketDataAccess(admin, context.userId, email);

    const { fetchCandlesSince, lastCandleBefore, listTimeframes } = await import("./market.server");
    const { resolveSymbolName } = await import("./setup-alerts.server");
    const { resolveOutcome, isValidSetupGeometry } = await import("./backtest-shared.server");
    const { midpointOf } = await import("./stats");
    const { instrumentOf } = await import("./instruments");
    const { timeframeMinutes } = await import("./freshness");

    const { data, error } = await anyDb(context.supabase)
      .from("analyses")
      .select("id, asset, direction, entry_zone, stop_loss, tp1, created_at")
      .eq("outcome", "OPEN")
      .in("direction", ["POTENTIAL LONG", "POTENTIAL SHORT"])
      .order("created_at", { ascending: false })
      .limit(40);
    if (error) throw new Error("Could not read your open trades.");

    const rows = (data ?? []) as {
      id: string;
      asset: string;
      direction: "POTENTIAL LONG" | "POTENTIAL SHORT";
      entry_zone: string | null;
      stop_loss: string | null;
      tp1: string | null;
      created_at: string;
    }[];

    const symbolCache = new Map<string, string | null>();
    const out: TradeCheck[] = [];

    for (const row of rows) {
      const base = {
        id: row.id,
        asset: row.asset,
        symbol: null,
        timeframe: null,
        r: null,
        at: null,
      };
      const plan = {
        direction: row.direction,
        entry: midpointOf(row.entry_zone) ?? NaN,
        stop: midpointOf(row.stop_loss) ?? NaN,
        tp1: midpointOf(row.tp1) ?? NaN,
        tp2: null,
      };
      if (!isValidSetupGeometry(plan)) {
        out.push({
          ...base,
          status: "SKIPPED",
          note: "Entry, stop and TP1 are not readable as a valid trade.",
        });
        continue;
      }

      const key = row.asset.toUpperCase();
      if (!symbolCache.has(key)) {
        symbolCache.set(
          key,
          (await resolveSymbolName(admin, row.asset)) ??
            (await resolveSymbolName(admin, instrumentOf(row.asset).core)),
        );
      }
      const symbol = symbolCache.get(key) ?? null;
      if (!symbol) {
        out.push({ ...base, status: "SKIPPED", note: `No market data stored for ${row.asset}.` });
        continue;
      }

      // A low timeframe shows what came first; 5 minutes or more keeps 5000
      // candles covering a couple of weeks.
      const timeframes = await listTimeframes(admin, symbol);
      const timeframe =
        [...timeframes].reverse().find((tf) => timeframeMinutes(tf) >= 5) ??
        timeframes[timeframes.length - 1]!;
      const before = await lastCandleBefore(admin, symbol, timeframe, row.created_at);
      const future = await fetchCandlesSince(admin, symbol, timeframe, row.created_at, 5000);
      const result = resolveOutcome(future, plan, future.length, {
        signalPrice: before?.close ?? null,
        fillWithin: Math.ceil(FILL_WINDOW_MINUTES / timeframeMinutes(timeframe)),
      });
      const found = { ...base, symbol, timeframe, at: result.resolvedAt };

      if (result.outcome === "STOP") {
        out.push({ ...found, status: "LOSS", r: result.realizedR, note: "Stop hit before TP1." });
      } else if (result.outcome === "TP1" || result.outcome === "TP2") {
        out.push({
          ...found,
          status: "WIN",
          r: result.realizedR,
          note: "TP1 reached before the stop.",
        });
      } else if (result.outcome === "NOT_FILLED") {
        out.push({
          ...found,
          status: "MISSED",
          note: "Price never traded at the entry: it ran away or 24 hours passed.",
        });
      } else {
        out.push({
          ...found,
          status: "OPEN",
          note: `Still running after ${future.length} ${timeframe} candles.`,
        });
      }
    }
    return out;
  });
