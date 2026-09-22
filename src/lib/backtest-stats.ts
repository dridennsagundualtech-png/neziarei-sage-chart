/**
 * Full statistics for saved backtests — same style of numbers as live journal
 * stats, built only from backtest setup outcomes (practice).
 */
import { sampleTier, type SampleTier } from "./analysis-types";
import type { BacktestRunLike } from "./edge-board";
import { summarizeBacktestRuns } from "./edge-board";
import {
  computeStats,
  type JournalRow,
  type Stats,
  EMPTY_STATS,
  groupBy,
  cumulativeRSeries,
  monthlySeries,
} from "./stats";

export interface BacktestTradeRow {
  id: string;
  created_at: string;
  asset: string;
  direction: string;
  grade: string;
  score: number;
  outcome: "WIN" | "LOSS" | "BREAKEVEN" | "OPEN";
  r_result: number | null;
  primary_timeframe: string | null;
  run_id: string;
  run_label: string | null;
  setup_time: string;
  raw_outcome: string;
}

function mapOutcome(
  outcome: string,
  realizedR: number | null,
): { outcome: BacktestTradeRow["outcome"]; r_result: number | null } {
  if (outcome === "STOP") return { outcome: "LOSS", r_result: realizedR ?? -1 };
  if (outcome === "TP1" || outcome === "TP2") {
    const r = realizedR ?? 0;
    if (Math.abs(r) < 0.05) return { outcome: "BREAKEVEN", r_result: r };
    return { outcome: "WIN", r_result: r };
  }
  return { outcome: "OPEN", r_result: null };
}

export function flattenBacktestSetups(runs: BacktestRunLike[]): BacktestTradeRow[] {
  const out: BacktestTradeRow[] = [];
  for (const run of runs) {
    const setups = (run.result as { setups?: Array<Record<string, unknown>> })?.setups;
    if (!Array.isArray(setups) || !setups.length) continue;

    for (let i = 0; i < setups.length; i++) {
      const s = setups[i]!;
      const raw = String(s.outcome ?? "UNRESOLVED");
      const realized =
        typeof s.realizedR === "number"
          ? s.realizedR
          : s.realizedR == null
            ? null
            : Number(s.realizedR);
      const mapped = mapOutcome(
        raw,
        Number.isFinite(realized as number) ? (realized as number) : null,
      );
      const time = String(s.time ?? run.created_at);
      out.push({
        id: `${run.id}-${i}`,
        created_at: time,
        asset: run.symbol,
        direction: String(s.direction ?? ""),
        grade: String(s.grade ?? "?"),
        score: Number(s.score ?? 0),
        outcome: mapped.outcome,
        r_result: mapped.r_result,
        primary_timeframe: null,
        run_id: run.id,
        run_label: run.label,
        setup_time: time,
        raw_outcome: raw,
      });
    }
  }
  return out.sort((a, b) => (a.created_at < b.created_at ? -1 : 1));
}

export function toJournalShape(rows: BacktestTradeRow[]): JournalRow[] {
  return rows.map((r) => ({
    id: r.id,
    created_at: r.created_at,
    asset: r.asset,
    market_type: "backtest",
    timeframes: [],
    primary_timeframe: r.primary_timeframe,
    direction: r.direction,
    setup_stage: "backtest",
    score: r.score,
    max_score: 16,
    grade: r.grade,
    outcome: r.outcome as JournalRow["outcome"],
    r_result: r.r_result,
    risk_reward: null,
    checklist: [],
  }));
}

export interface FullBacktestStats {
  runsUsed: number;
  totalSetups: number;
  resolved: number;
  unresolved: number;
  stats: Stats;
  sampleTier: SampleTier;
  equity: { i: number; date: string; r: number }[];
  monthly: { month: string; r: number; trades: number }[];
  bySymbol: { label: string; stats: Stats }[];
  byGrade: { label: string; stats: Stats }[];
  byDirection: { label: string; stats: Stats }[];
  coaching: string[];
  missingSetupDetail: boolean;
  runSummaries: ReturnType<typeof summarizeBacktestRuns>;
}

export function buildFullBacktestStats(runs: BacktestRunLike[]): FullBacktestStats {
  const flat = flattenBacktestSetups(runs);
  const journalLike = toJournalShape(flat);
  const completed = journalLike.filter(
    (r) => r.outcome === "WIN" || r.outcome === "LOSS" || r.outcome === "BREAKEVEN",
  );
  const stats = computeStats(journalLike);
  const unresolved = flat.filter((r) => r.outcome === "OPEN").length;
  const runsWithSetups = new Set(flat.map((r) => r.run_id)).size;
  const missingSetupDetail = runs.length > 0 && flat.length === 0;

  const bySymbol = groupBy(completed, (r) => r.asset.toUpperCase());
  const byGrade = groupBy(completed, (r) => `Grade ${(r.grade || "?").toUpperCase()}`);
  const byDirection = groupBy(completed, (r) => {
    const d = (r.direction || "").toUpperCase();
    if (d.includes("LONG")) return "LONG";
    if (d.includes("SHORT")) return "SHORT";
    return "OTHER";
  });

  const coaching: string[] = [];
  if (missingSetupDetail) {
    coaching.push(
      "Saved runs have no per-setup detail stored. Re-run and save a new backtest so each TP/SL result is kept.",
    );
  } else if (completed.length === 0) {
    coaching.push(
      "No finished practice trades yet. Save a Den backtest that found setups which hit TP or stop.",
    );
  } else {
    coaching.push(
      `Practice scoreboard from ${completed.length} finished backtest setups across ${runsWithSetups} saved run(s). This is not live trading.`,
    );
    if (stats.avgR != null && stats.avgR > 0) {
      coaching.push(
        `Practice Avg R is +${stats.avgR.toFixed(2)}R. Confirm with real journal trades before trusting it live.`,
      );
    } else if (stats.avgR != null) {
      coaching.push(
        `Practice Avg R is still negative (${stats.avgR.toFixed(2)}R). Tighten rules before going live.`,
      );
    }
    const best = bySymbol
      .filter((s) => s.stats.total >= 15)
      .sort((a, b) => (b.stats.avgR ?? -999) - (a.stats.avgR ?? -999))[0];
    if (best && (best.stats.avgR ?? 0) > 0) {
      coaching.push(
        `Strongest practice symbol so far: ${best.label} (${best.stats.total} finishes, Avg R ${best.stats.avgR?.toFixed(2)}R).`,
      );
    }
  }

  return {
    runsUsed: runsWithSetups,
    totalSetups: flat.length,
    resolved: completed.length,
    unresolved,
    stats: completed.length ? stats : { ...EMPTY_STATS },
    sampleTier: sampleTier(completed.length),
    equity: cumulativeRSeries(journalLike),
    monthly: monthlySeries(journalLike),
    bySymbol,
    byGrade,
    byDirection,
    coaching,
    missingSetupDetail,
    runSummaries: summarizeBacktestRuns(runs),
  };
}
