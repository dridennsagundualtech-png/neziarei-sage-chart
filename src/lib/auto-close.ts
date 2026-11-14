/**
 * Which checked trades may be recorded without asking. Only a trade the trader
 * marked "I placed this" that is still open, and only once the stored prices
 * show how it ended: the stop, TP1, or an entry that never filled. Everything
 * else stays a proposal the trader applies by hand (TradeResultCheck).
 */
import type { Outcome } from "./analysis-types";

export const AUTO_CLOSE_NOTE =
  "Closed for you from stored prices. Edit it if your real result was different.";

export interface AutoCloseRow {
  id: string;
  outcome: string;
  placed_at: string | null;
  notes: string | null;
}

export interface AutoCloseCheck {
  id: string;
  status: "WIN" | "LOSS" | "MISSED" | "OPEN" | "SKIPPED";
  r: number | null;
  at: string | null;
}

export interface AutoClosePatch {
  id: string;
  patch: {
    outcome: Outcome;
    r_result: number | null;
    closed_at: string;
    notes: string;
  };
}

export function autoClosePatches(
  rows: AutoCloseRow[],
  checks: AutoCloseCheck[],
  nowIso: string,
): AutoClosePatch[] {
  const byId = new Map(rows.map((row) => [row.id, row]));
  const out: AutoClosePatch[] = [];
  for (const check of checks) {
    const row = byId.get(check.id);
    if (!row || !row.placed_at || row.outcome !== "OPEN") continue;
    if (check.status !== "WIN" && check.status !== "LOSS" && check.status !== "MISSED") continue;
    // A win or a loss without a measured result is not recorded: the trader settles it.
    if (check.status !== "MISSED" && typeof check.r !== "number") continue;
    const kept = (row.notes ?? "").trim();
    out.push({
      id: row.id,
      patch: {
        outcome: check.status,
        r_result: check.status === "MISSED" ? null : check.r,
        closed_at: check.at ?? nowIso,
        notes: kept.includes(AUTO_CLOSE_NOTE)
          ? kept
          : kept
            ? `${kept}\n${AUTO_CLOSE_NOTE}`
            : AUTO_CLOSE_NOTE,
      },
    });
  }
  return out;
}
