/**
 * Auto Optimize – tests multiple rule combinations and ranks them.
 * Only combinations with enough resolved setups are treated as reliable.
 */
import type { DenComponents } from "./den-rules";
import type { BacktestResult } from "./backtest-shared.server";
import { RULE_COMBINATIONS, type RuleCombination } from "./rule-combinations";

/** Minimum resolved setups before we treat a result as reliable. */
export const MIN_RELIABLE_SETUPS = 80;

/**
 * The only components that actually vote on direction (see den-analyzer.server.ts).
 * Everything else (S/R, liquidity, AMD, FVG, volume, breaker block, risk/reward)
 * only affects score/labels, never the entry/stop/target the backtest resolves —
 * so two combinations that agree on just these 7 will always produce identical trades.
 */
const VOTING_KEYS: (keyof DenComponents)[] = [
  "htf_structure",
  "liquidity_sweep",
  "mss_bos",
  "displacement",
  "choch",
  "order_block",
  "fibonacci",
];

function votingSignature(components: DenComponents): string {
  return VOTING_KEYS.filter((key) => components[key]).sort().join("|") || "(no voters)";
}

export interface OptimizeResult {
  combination: RuleCombination;
  backtest: BacktestResult;
  /** Simple ranking score: prioritizes Average R, then win rate, then sample size */
  rankScore: number;
  /** True when resolved setups >= MIN_RELIABLE_SETUPS */
  isReliable: boolean;
  /**
   * Name of an earlier-tested combination sharing the exact same voting
   * components — meaning this one necessarily produced identical trades,
   * even if its non-voting toggles differ. Only set on the later duplicate.
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

  // Tag any combination whose *voting* components exactly match an earlier
  // one — those pairs are guaranteed to have produced identical trades,
  // regardless of what their backtest numbers happen to say separately.
  // Runs in original (untested-order) sequence, before ranking, so "earlier"
  // is stable and matches the order they're defined in.
  const seenSignatures = new Map<string, string>();
  for (const r of results) {
    const sig = votingSignature(r.combination.components);
    const first = seenSignatures.get(sig);
    if (first) {
      r.sameVotersAs = first;
    } else {
      seenSignatures.set(sig, r.combination.name);
    }
  }

  return results.sort((a, b) => b.rankScore - a.rankScore);
}
