/**
 * Trade Tracker – used for automatic journal outcome tracking.
 * This file contains the pure logic. Actual price checking should be done
 * in a Supabase Edge Function on a cron schedule.
 */

export type TrackedTradeStatus = "PENDING" | "OPEN" | "CLOSED" | "INVALIDATED";

export type TrackedOutcome = "WIN" | "LOSS" | "BREAKEVEN" | "INVALIDATED" | null;

export interface TrackedTrade {
  id: string;
  analysisId: string;
  symbol: string;
  direction: "LONG" | "SHORT";
  entry: number;
  stop: number;
  tp1: number | null;
  tp2: number | null;
  status: TrackedTradeStatus;
  outcome: TrackedOutcome;
  openedAt: string | null;
  closedAt: string | null;
  createdAt: string;
}

/**
 * Determines the new status of a tracked trade based on the latest price.
 */
export function evaluateTradeStatus(
  trade: TrackedTrade,
  currentPrice: number,
): { status: TrackedTradeStatus; outcome: TrackedOutcome } {
  const isLong = trade.direction === "LONG";

  // Still waiting for entry
  if (trade.status === "PENDING") {
    const entered = isLong
      ? currentPrice >= trade.entry
      : currentPrice <= trade.entry;

    if (entered) {
      return { status: "OPEN", outcome: null };
    }
    return { status: "PENDING", outcome: null };
  }

  // Already open — check exits
  if (trade.status === "OPEN") {
    // Stop hit
    const stopped = isLong
      ? currentPrice <= trade.stop
      : currentPrice >= trade.stop;

    if (stopped) {
      return { status: "CLOSED", outcome: "LOSS" };
    }

    // TP2 hit (full target)
    if (trade.tp2 != null) {
      const hitTp2 = isLong
        ? currentPrice >= trade.tp2
        : currentPrice <= trade.tp2;

      if (hitTp2) {
        return { status: "CLOSED", outcome: "WIN" };
      }
    }

    // TP1 hit (can be treated as partial win or still OPEN depending on your rules)
    if (trade.tp1 != null) {
      const hitTp1 = isLong
        ? currentPrice >= trade.tp1
        : currentPrice <= trade.tp1;

      if (hitTp1) {
        // For simplicity we keep it OPEN until TP2 or Stop.
        // You can later expand this to support partial closes.
        return { status: "OPEN", outcome: null };
      }
    }
  }

  return { status: trade.status, outcome: trade.outcome };
}
