import type { ChecklistKey } from "./analysis-types";

export type SetupType =
  | "Liquidity Sweep Reversal"
  | "Order Block Continuation"
  | "AMD Distribution"
  | "Break of Structure Continuation"
  | "Fair Value Gap Retracement"
  | "Mixed / Unclassified";

interface ScoredItem {
  key: ChecklistKey;
  score: number;
}

/**
 * Classifies the setup based on component scores from the Den Analyzer.
 */
export function classifySetup(items: ScoredItem[]): SetupType {
  const score = (key: ChecklistKey): number =>
    items.find((i) => i.key === key)?.score ?? 0;

  const sweep = score("liquidity_sweep");
  const choch = score("choch");
  const fvg = score("fvg");
  const ob = score("order_block");
  const bos = score("mss_bos");
  const disp = score("displacement");
  const amd = score("amd");
  const fib = score("fibonacci");

  if (sweep >= 2 && choch > 0 && fvg > 0) {
    return "Liquidity Sweep Reversal";
  }

  if (ob >= 2 && bos >= 2 && disp >= 1) {
    return "Order Block Continuation";
  }

  if (amd >= 2 && disp >= 1 && fib >= 1) {
    return "AMD Distribution";
  }

  if (bos >= 2 && disp >= 1) {
    return "Break of Structure Continuation";
  }

  if (fvg >= 1 && (ob > 0 || sweep > 0)) {
    return "Fair Value Gap Retracement";
  }

  return "Mixed / Unclassified";
}
