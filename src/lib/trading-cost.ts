/**
 * What trading cost, estimated from the journal. With no edge a trade averages
 * minus its cost (planOdds in price-map.ts), so this is the part of a week's
 * result that is certain whatever the trades did. Each finished trade costs the
 * app's typical spread and commission for its symbol (typicalCost) divided by
 * its own stop distance, in R. It is an estimate, not the broker's statement.
 */
import type { Outcome } from "./analysis-types";
import { typicalCost } from "./instruments";
import { midpointOf } from "./stats";

export interface TradingCostRow {
  asset: string;
  outcome: string;
  r_result: number | null;
  entry_zone: string | null;
  stop_loss: string | null;
  created_at: string;
  closed_at?: string | null;
}

export interface TradingCost {
  days: number;
  /** Finished trades (win, loss or breakeven with a result) that ended in the window. */
  trades: number;
  /** Of those, the trades whose cost could be worked out. */
  counted: number;
  /** Their total cost in R, and the average per counted trade. */
  costR: number;
  avgCostR: number | null;
}

const FINISHED: Outcome[] = ["WIN", "LOSS", "BREAKEVEN"];
/** A spread wider than the stop itself is a data slip, not a cost to add up. */
const MAX_COST_PER_TRADE_R = 1;

/** One trade's cost in R; null when the symbol has no typical cost or the levels aren't prices. */
export function tradeCostR(row: Pick<TradingCostRow, "asset" | "entry_zone" | "stop_loss">) {
  const cost = typicalCost(row.asset);
  const entry = midpointOf(row.entry_zone);
  const stop = midpointOf(row.stop_loss);
  if (!(cost > 0) || entry === null || stop === null) return null;
  const risk = Math.abs(entry - stop);
  return risk > 0 ? Math.min(MAX_COST_PER_TRADE_R, cost / risk) : null;
}

/** The trades that finished in the last `days` days, and what they cost. */
export function tradingCost(rows: TradingCostRow[], now: Date = new Date(), days = 7): TradingCost {
  const until = now.getTime();
  const since = until - days * 86_400_000;
  let trades = 0;
  let counted = 0;
  let costR = 0;
  for (const row of rows) {
    if (!FINISHED.includes(row.outcome as Outcome) || typeof row.r_result !== "number") continue;
    const when = Date.parse(row.closed_at ?? row.created_at);
    if (!Number.isFinite(when) || when <= since || when > until) continue;
    trades += 1;
    const cost = tradeCostR(row);
    if (cost === null) continue;
    counted += 1;
    costR += cost;
  }
  return { days, trades, counted, costR, avgCostR: counted ? costR / counted : null };
}
