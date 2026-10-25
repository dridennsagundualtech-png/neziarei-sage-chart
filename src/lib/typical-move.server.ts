/**
 * Looks up the typical daily range for an analysed symbol from stored daily
 * bars (server only). It never fails an analysis: anything missing means no
 * typical day is shown.
 */
import type { AnyDb } from "./db-types";
import { closedCandlesAt } from "./freshness";
import { typicalMove, type TypicalMove } from "./typical-move";

/** Enough closed daily bars for the 20-day average and a 250-day band. */
const DAILY_BARS = 330;

export async function typicalMoveFor(
  db: AnyDb,
  requested: string | null | undefined,
): Promise<TypicalMove | null> {
  // "XAU/USD" → "XAUUSD"; screenshots may report UNKNOWN.
  const name = String(requested ?? "").replace(/[^A-Za-z0-9.]/g, "");
  if (!name || name.toUpperCase() === "UNKNOWN") return null;
  try {
    const { resolveSymbolName } = await import("./setup-alerts.server");
    const { fetchCandles } = await import("./market.server");
    const symbol = await resolveSymbolName(db, name);
    if (!symbol) return null;
    const bars = await fetchCandles(db, symbol, "D1", DAILY_BARS);
    return typicalMove(symbol, closedCandlesAt(bars, "D1", Date.now()));
  } catch {
    return null;
  }
}
