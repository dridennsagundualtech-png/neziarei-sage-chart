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
  /** The trader marked it "I placed this": its result may be recorded without asking. */
  placed: boolean;
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
    const { resultCheckTimeframes, timeframeMinutes } = await import("./freshness");

    const { data, error } = await anyDb(context.supabase)
      .from("analyses")
      .select("id, asset, direction, entry_zone, stop_loss, tp1, created_at, placed_at")
      .eq("outcome", "OPEN")
      .in("direction", ["POTENTIAL LONG", "POTENTIAL SHORT"])
      // Placed trades first, so a long list of open reads never crowds them out of the 40.
      .order("placed_at", { ascending: false, nullsFirst: false })
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
      placed_at: string | null;
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
        placed: Boolean(row.placed_at),
      };
      // A trade marked as placed is followed from then: that is when the order went in.
      const since =
        row.placed_at && Date.parse(row.placed_at) > Date.parse(row.created_at)
          ? row.placed_at
          : row.created_at;
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

      // A low timeframe shows what came first. The table keeps a limited number
      // of candles per timeframe, so when the lowest one no longer reaches back
      // to the trade, the next one up is used. If none does, the trade is not
      // judged: candles that start after the trade could miss its real ending.
      const timeframes = await listTimeframes(admin, symbol);
      let timeframe: string | null = null;
      let before: Awaited<ReturnType<typeof lastCandleBefore>> = null;
      for (const candidate of resultCheckTimeframes(timeframes)) {
        const prior = await lastCandleBefore(admin, symbol, candidate, since);
        if (prior) {
          timeframe = candidate;
          before = prior;
          break;
        }
      }
      if (!timeframe || !before) {
        out.push({
          ...base,
          symbol,
          status: "SKIPPED",
          note: `Stored prices for ${symbol} no longer reach back to when this trade was ${row.placed_at ? "placed" : "saved"}.`,
        });
        continue;
      }
      const future = await fetchCandlesSince(admin, symbol, timeframe, since, 5000);
      const result = resolveOutcome(future, plan, future.length, {
        signalPrice: before.close,
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
