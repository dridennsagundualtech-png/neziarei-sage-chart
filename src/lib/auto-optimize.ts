/**
 * Auto Optimize – tests multiple rule combinations and ranks them.
 * Only combinations with enough resolved setups are treated as reliable.
 */
import type { BacktestResult } from "./backtest-shared.server";
import { RULE_COMBINATIONS, type RuleCombination } from "./rule-combinations";

/** Minimum resolved setups before we treat a result as reliable. */
export const MIN_RELIABLE_SETUPS = 80;

export interface OptimizeResult {
  combination: RuleCombination;
  backtest: BacktestResult;
  /** Simple ranking score: prioritizes Average R, then win rate, then sample size */
  rankScore: number;
  /** True when resolved setups >= MIN_RELIABLE_SETUPS */
  isReliable: boolean;
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

      results.push({
        combination: combo,
        backtest,
        rankScore: rankScore(backtest),
        isReliable: resolved >= MIN_RELIABLE_SETUPS,
      });
    } catch {
      // Skip failed combinations instead of aborting everything
      continue;
    }
  }

  return results.sort((a, b) => b.rankScore - a.rankScore);
}
