/**
 * Looks up an analysed symbol's daily context from stored daily bars (server
 * only): the typical day and the price map. It never fails an analysis:
 * anything missing just means that part isn't shown.
 */
import type { AnyDb } from "./db-types";
import { closedCandlesAt } from "./freshness";
import { priceMap, type PriceMap } from "./price-map";
import { typicalMove, type TypicalMove } from "./typical-move";

/** Enough closed daily bars for the price map's 1,000-move window and the typical day. */
const DAILY_BARS = 1100;

export interface DailyContext {
  typical_move: TypicalMove | null;
  price_map: PriceMap | null;
}

const NONE: DailyContext = { typical_move: null, price_map: null };

export async function dailyContextFor(
  db: AnyDb,
  requested: string | null | undefined,
): Promise<DailyContext> {
  // "XAU/USD" → "XAUUSD"; screenshots may report UNKNOWN.
  const name = String(requested ?? "").replace(/[^A-Za-z0-9.]/g, "");
  if (!name || name.toUpperCase() === "UNKNOWN") return NONE;
  try {
    const { resolveSymbolName } = await import("./setup-alerts.server");
    const { fetchCandles } = await import("./market.server");
    const symbol = await resolveSymbolName(db, name);
    if (!symbol) return NONE;
    const bars = closedCandlesAt(
      await fetchCandles(db, symbol, "D1", DAILY_BARS),
      "D1",
      Date.now(),
    );
    return { typical_move: typicalMove(symbol, bars), price_map: priceMap(symbol, bars) };
  } catch {
    return NONE;
  }
}
