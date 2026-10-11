/**
 * Auto Optimize – tests multiple rule combinations and ranks them.
 * Only combinations with enough resolved setups are treated as reliable.
 */
import type { BacktestResult } from "./backtest-shared.server";
import { RULE_COMBINATIONS, type RuleCombination } from "./rule-combinations";

/** Minimum resolved setups before we treat a result as reliable. */
export const MIN_RELIABLE_SETUPS = 80;

/** The trades a run produced, in order; two runs with the same key traded identically. */
function tradesKey(result: BacktestResult): string {
  return result.setups
    .map((s) => `${s.time}|${s.direction}|${s.outcome}|${s.realizedR ?? ""}`)
    .sort()
    .join(",");
}

export interface OptimizeResult {
  combination: RuleCombination;
  backtest: BacktestResult;
  /** Simple ranking score: prioritizes Average R, then win rate, then sample size */
  rankScore: number;
  /** True when resolved setups >= MIN_RELIABLE_SETUPS */
  isReliable: boolean;
  /**
   * True when holdout was on and holdout Avg R is clearly weak
   * (negative, or much worse than train). Do not treat as a live edge.
   */
  holdoutFailed?: boolean;
  holdoutNote?: string;
  /**
   * Name of an earlier-tested combination that produced exactly the same
   * trades on this data. Only set on the later duplicate.
   */
  sameVotersAs?: string;
}

function rankScore(result: BacktestResult): number {
  const avgR = result.avgR ?? 0;
  const winRate = (result.winRate ?? 0) / 100;
  const resolved = result.resolved ?? 0;

  // Too few trades → heavily penalize
  if (resolved < 5) return -999;

  // Base score
  let score = avgR * 2 + winRate * 1 + Math.min(resolved, 60) * 0.015;

  // Strong bonus when the sample is large enough to be more trustworthy
  if (resolved >= MIN_RELIABLE_SETUPS) {
    score += 3;
  } else if (resolved >= 50) {
    score += 1;
  }

  return score;
}

export interface OptimizeInput {
  runOne: (components: RuleCombination["components"]) => Promise<BacktestResult>;
  onProgress?: (current: number, total: number, name: string) => void;
}

/**
 * Runs all predefined combinations and returns them sorted by rankScore (best first).
 * Combinations with >= MIN_RELIABLE_SETUPS are marked isReliable = true.
 */
export async function runAutoOptimize(input: OptimizeInput): Promise<OptimizeResult[]> {
  const results: OptimizeResult[] = [];
  const total = RULE_COMBINATIONS.length;

  for (let i = 0; i < total; i++) {
    const combo = RULE_COMBINATIONS[i]!;
    input.onProgress?.(i + 1, total, combo.name);

    try {
      const backtest = await input.runOne(combo.components);
      const resolved = backtest.resolved ?? 0;

      const holdPct = backtest.holdoutPct ?? 0;
      const holdR = backtest.holdoutAvgR;
      const trainR = backtest.trainAvgR;
      let holdoutFailed = false;
      let holdoutNote: string | undefined;
      if (holdPct > 0 && typeof holdR === "number") {
        if (holdR < 0) {
          holdoutFailed = true;
          holdoutNote = "Holdout Avg R is negative — failed unseen test.";
        } else if (typeof trainR === "number" && trainR > 0.3 && holdR < trainR * 0.35) {
          holdoutFailed = true;
          holdoutNote = "Holdout much weaker than train — possible overfit on the early period.";
        }
      }
      // Rank penalty when holdout failed
      let score = rankScore(backtest);
      if (holdoutFailed) score -= 4;

      results.push({
        combination: combo,
        backtest,
        rankScore: score,
        isReliable: resolved >= MIN_RELIABLE_SETUPS && !holdoutFailed,
        holdoutFailed,
        holdoutNote,
      });
    } catch {
      // Skip failed combinations instead of aborting everything
      continue;
    }
  }

  // Tag any combination that produced exactly the same trades as an earlier one,
  // so the ranking does not present two names for one result. (Matching voters
  // alone is not enough: strict mode and the score gates can still differ.)
  const seen = new Map<string, string>();
  for (const r of results) {
    const key = tradesKey(r.backtest);
    const first = seen.get(key);
    if (first) {
      r.sameVotersAs = first;
    } else {
      seen.set(key, r.combination.name);
    }
  }

  return results.sort((a, b) => b.rankScore - a.rankScore);
}
