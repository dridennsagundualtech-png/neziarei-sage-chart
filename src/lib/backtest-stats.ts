/**
 * Statistics for saved backtest runs only (practice).
 * Never mixed with live journal trade stats.
 */
import type { BacktestRunLike, BacktestRunSummary } from "./edge-board";
import { summarizeBacktestRuns } from "./edge-board";

export interface BacktestSymbolStat {
  symbol: string;
  runs: number;
  /** From the latest run for this symbol. */
  latestAvgR: number | null;
  latestWinRate: number | null;
  latestResolved: number;
  latestSource: "holdout" | "full";
  /** Simple mean of latest-per-label avg R values for this symbol (all saved runs). */
  meanAvgR: number | null;
  bestAvgR: number | null;
  worstAvgR: number | null;
}

export interface BacktestStatsOverview {
  totalRuns: number;
  symbols: number;
  withHoldout: number;
  /** Mean of per-run avg R (prefer holdout when present). */
  meanAvgR: number | null;
  /** Latest run overall. */
  latest: BacktestRunSummary | null;
  bySymbol: BacktestSymbolStat[];
  recent: BacktestRunSummary[];
  coaching: string[];
}

function mean(values: number[]): number | null {
  if (!values.length) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function buildBacktestStats(runs: BacktestRunLike[]): BacktestStatsOverview {
  const summaries = summarizeBacktestRuns(runs).sort((a, b) =>
    a.created_at < b.created_at ? 1 : -1,
  );

  const bySym = new Map<string, BacktestRunSummary[]>();
  for (const s of summaries) {
    const key = s.symbol.toUpperCase();
    const list = bySym.get(key) ?? [];
    list.push(s);
    bySym.set(key, list);
  }

  const bySymbol: BacktestSymbolStat[] = [...bySym.entries()].map(([symbol, list]) => {
    const sorted = list.slice().sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    const latest = sorted[0]!;
    const avgRs = sorted.map((x) => x.avgR).filter((x): x is number => x != null);
    return {
      symbol,
      runs: sorted.length,
      latestAvgR: latest.avgR,
      latestWinRate: latest.winRate,
      latestResolved: latest.resolved,
      latestSource: latest.source,
      meanAvgR: mean(avgRs),
      bestAvgR: avgRs.length ? Math.max(...avgRs) : null,
      worstAvgR: avgRs.length ? Math.min(...avgRs) : null,
    };
  });

  bySymbol.sort((a, b) => (b.latestAvgR ?? -999) - (a.latestAvgR ?? -999));

  const allAvg = summaries.map((s) => s.avgR).filter((x): x is number => x != null);
  const withHoldout = summaries.filter((s) => s.source === "holdout").length;

  const coaching: string[] = [];
  if (!summaries.length) {
    coaching.push(
      "No saved backtests yet. Run a Den backtest, then tap “Save this run to history”.",
    );
  } else {
    coaching.push(
      "This page is practice-only. It does not change your live journal win rate or expectancy.",
    );
    const strong = bySymbol.filter((s) => (s.latestAvgR ?? 0) > 0 && s.latestResolved >= 20);
    const weak = bySymbol.filter((s) => (s.latestAvgR ?? 0) < 0 && s.latestResolved >= 20);
    if (strong.length) {
      coaching.push(
        `Latest practice looks better on: ${strong.map((s) => s.symbol).join(", ")}.`,
      );
    }
    if (weak.length) {
      coaching.push(
        `Latest practice looks weak on: ${weak.map((s) => s.symbol).join(", ")}.`,
      );
    }
    if (withHoldout === 0) {
      coaching.push(
        "None of these runs used holdout. Re-run with holdout ~30% for a stricter practice grade.",
      );
    }
  }

  return {
    totalRuns: summaries.length,
    symbols: bySymbol.length,
    withHoldout,
    meanAvgR: mean(allAvg),
    latest: summaries[0] ?? null,
    bySymbol,
    recent: summaries.slice(0, 12),
    coaching,
  };
}
