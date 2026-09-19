/**
 * Auto Optimize – tests multiple rule combinations and ranks them.
 */
import type { BacktestResult } from "./backtest-shared.server";
import { RULE_COMBINATIONS, type RuleCombination } from "./rule-combinations";

export interface OptimizeResult {
  combination: RuleCombination;
  backtest: BacktestResult;
  /** Simple ranking score: prioritizes Average R, then win rate, then sample size */
  rankScore: number;
}

function rankScore(result: BacktestResult): number {
  const avgR = result.avgR ?? 0;
  const winRate = (result.winRate ?? 0) / 100;
  const resolved = result.resolved ?? 0;

  // Need at least a few resolved trades to be meaningful
  if (resolved < 5) return -999;

  // Weighted score: Average R is most important, then win rate, small bonus for more samples
  return avgR * 2 + winRate * 1 + Math.min(resolved, 40) * 0.01;
}

export interface OptimizeInput {
  runOne: (components: RuleCombination["components"]) => Promise<BacktestResult>;
  onProgress?: (current: number, total: number, name: string) => void;
}

/**
 * Runs all predefined combinations and returns them sorted by rankScore (best first).
 */
export async function runAutoOptimize(input: OptimizeInput): Promise<OptimizeResult[]> {
  const results: OptimizeResult[] = [];
  const total = RULE_COMBINATIONS.length;

  for (let i = 0; i < total; i++) {
    const combo = RULE_COMBINATIONS[i]!;
    input.onProgress?.(i + 1, total, combo.name);

    try {
      const backtest = await input.runOne(combo.components);
      results.push({
        combination: combo,
        backtest,
        rankScore: rankScore(backtest),
      });
    } catch {
      // Skip failed combinations instead of aborting everything
      continue;
    }
  }

  return results.sort((a, b) => b.rankScore - a.rankScore);
}
