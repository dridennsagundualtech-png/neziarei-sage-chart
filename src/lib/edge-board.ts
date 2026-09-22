/**
 * Personal edge board — statistics only.
 * Does NOT change Den Analyzer math. Reads completed journal trades.
 */
import { sampleTier, type SampleTier } from "./analysis-types";
import {
  computeStats,
  isCompleted,
  type JournalRow,
  type Stats,
} from "./stats";

export interface EdgeBucket {
  key: string;
  label: string;
  stats: Stats;
  /** Enough sample to treat as a soft signal. */
  reliable: boolean;
}

export interface EdgeBoard {
  totalCompleted: number;
  sampleTier: SampleTier;
  minSample: number;
  bySymbol: EdgeBucket[];
  byGrade: EdgeBucket[];
  byDirection: EdgeBucket[];
  byTimeframe: EdgeBucket[];
  /** Plain-English coaching lines (empty if not enough data). */
  coaching: string[];
  /** Best symbol by Avg R among reliable buckets (if any). */
  preferredSymbol: string | null;
  preferredSessionHint: string | null;
  preferredGrade: string | null;
}

function bucketStats(
  key: string,
  label: string,
  rows: JournalRow[],
  minSample: number,
): EdgeBucket {
  const stats = computeStats(rows);
  return {
    key,
    label,
    stats,
    reliable: stats.total >= minSample,
  };
}

function sortBuckets(list: EdgeBucket[]): EdgeBucket[] {
  return list.slice().sort((a, b) => {
    // Reliable first, then higher avg R, then more trades
    if (a.reliable !== b.reliable) return a.reliable ? -1 : 1;
    const ar = a.stats.avgR ?? -999;
    const br = b.stats.avgR ?? -999;
    if (br !== ar) return br - ar;
    return b.stats.total - a.stats.total;
  });
}

function group(
  rows: JournalRow[],
  keyOf: (row: JournalRow) => string,
  labelOf: (key: string) => string,
  minSample: number,
): EdgeBucket[] {
  const map = new Map<string, JournalRow[]>();
  for (const row of rows) {
    const key = keyOf(row) || "Unknown";
    const list = map.get(key) ?? [];
    list.push(row);
    map.set(key, list);
  }
  return sortBuckets(
    [...map.entries()].map(([key, list]) => bucketStats(key, labelOf(key), list, minSample)),
  );
}

/**
 * Build the personal edge board from journal rows.
 * @param minSample default 15 — below this, bucket is shown but not "preferred"
 */
export function buildEdgeBoard(
  rows: JournalRow[],
  minSample = 15,
): EdgeBoard {
  const completed = rows.filter(isCompleted);
  const overall = computeStats(completed);

  const bySymbol = group(
    completed,
    (r) => r.asset.trim().toUpperCase() || "UNKNOWN",
    (k) => k,
    minSample,
  );

  const byGrade = group(
    completed,
    (r) => (r.grade || "?").toUpperCase(),
    (k) => `Grade ${k}`,
    minSample,
  );

  const byDirection = group(
    completed,
    (r) => {
      const d = (r.direction || "").toUpperCase();
      if (d.includes("LONG")) return "LONG";
      if (d.includes("SHORT")) return "SHORT";
      return "OTHER";
    },
    (k) => k,
    minSample,
  );

  const byTimeframe = group(
    completed,
    (r) => (r.primary_timeframe || "n/a").toUpperCase(),
    (k) => k,
    minSample,
  );

  const coaching: string[] = [];

  if (completed.length < minSample) {
    coaching.push(
      `You need about ${minSample} finished trades (with a result in R) before personal preferences are trustworthy. Right now you have ${completed.length}.`,
    );
  } else {
    const bestSym = bySymbol.find((b) => b.reliable && (b.stats.avgR ?? 0) > 0);
    const weakSym = bySymbol.filter((b) => b.reliable && (b.stats.avgR ?? 0) < 0);
    const bestGrade = byGrade.find((b) => b.reliable && (b.stats.avgR ?? 0) > 0);
    const bestDir = byDirection.find((b) => b.reliable && (b.stats.avgR ?? 0) > 0);

    if (bestSym) {
      coaching.push(
        `${bestSym.label} is your strongest symbol so far (Avg R ${fmtR(bestSym.stats.avgR)} over ${bestSym.stats.total} trades).`,
      );
    }
    if (weakSym.length) {
      coaching.push(
        `Be careful with: ${weakSym.map((b) => b.label).join(", ")} — average R is negative with enough trades to notice.`,
      );
    }
    if (bestGrade) {
      coaching.push(
        `${bestGrade.label} ideas have paid better for you (Avg R ${fmtR(bestGrade.stats.avgR)}). Weaker grades need more caution.`,
      );
    }
    if (bestDir && bestDir.key !== "OTHER") {
      coaching.push(
        `Your ${bestDir.label} trades average ${fmtR(bestDir.stats.avgR)} over ${bestDir.stats.total} finishes.`,
      );
    }
    if (overall.avgR != null && overall.avgR < 0) {
      coaching.push(
        "Overall Avg R is still negative. Focus on fewer, clearer setups (higher grade) and fixed risk — not more trades.",
      );
    } else if (overall.avgR != null && overall.avgR > 0) {
      coaching.push(
        `Overall you are positive at ${fmtR(overall.avgR)} average R across ${overall.total} finished trades — keep risk steady.`,
      );
    }
  }

  const preferredSymbol =
    bySymbol.find((b) => b.reliable && (b.stats.avgR ?? 0) > 0)?.label ?? null;
  const preferredGrade =
    byGrade.find((b) => b.reliable && (b.stats.avgR ?? 0) > 0)?.label ?? null;

  return {
    totalCompleted: completed.length,
    sampleTier: overall.sampleTier,
    minSample,
    bySymbol,
    byGrade,
    byDirection,
    byTimeframe,
    coaching,
    preferredSymbol,
    preferredSessionHint: null, // session not stored on journal rows yet
    preferredGrade,
  };
}

function fmtR(value: number | null): string {
  if (value === null) return "–";
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}R`;
}

/** Kid-simple one-liner for a bucket. */
export function bucketBlurb(bucket: EdgeBucket): string {
  const { stats, reliable } = bucket;
  if (stats.total === 0) return "No finished trades here yet.";
  if (!reliable) {
    return `Only ${stats.total} trades — too few to trust. Need about more finishes.`;
  }
  const avg = stats.avgR;
  if (avg === null) return `${stats.total} trades, average R not available.`;
  if (avg > 0.3) return `Looks helpful for you so far (${stats.total} trades).`;
  if (avg > 0) return `Slightly positive — still watch carefully.`;
  if (avg > -0.3) return `About flat — not a clear edge.`;
  return `Has been costly on average — be stricter here.`;
}

// ---------------------------------------------------------------------------
// Saved backtests (practice) — kept separate from live journal edge
// ---------------------------------------------------------------------------

export interface BacktestRunSummary {
  id: string;
  created_at: string;
  symbol: string;
  label: string | null;
  engine: string;
  /** Prefer holdout when present and > 0. */
  avgR: number | null;
  winRate: number | null;
  resolved: number;
  source: "holdout" | "full";
  holdoutPct: number | null;
}

/** Minimal shape we need from a saved backtest_runs row. */
export interface BacktestRunLike {
  id: string;
  created_at: string;
  symbol: string;
  label: string | null;
  engine: string;
  result: {
    avgR?: number | null;
    winRate?: number | null;
    resolved?: number;
    holdoutPct?: number;
    holdoutAvgR?: number | null;
    holdoutWinRate?: number | null;
    holdoutResolved?: number;
  };
}

export function summarizeBacktestRuns(runs: BacktestRunLike[]): BacktestRunSummary[] {
  return runs.map((run) => {
    const r = run.result ?? {};
    const holdoutOn = typeof r.holdoutPct === "number" && r.holdoutPct > 0;
    const useHoldout = holdoutOn && r.holdoutResolved != null && r.holdoutResolved > 0;
    return {
      id: run.id,
      created_at: run.created_at,
      symbol: run.symbol,
      label: run.label,
      engine: run.engine,
      avgR: useHoldout ? (r.holdoutAvgR ?? null) : (r.avgR ?? null),
      winRate: useHoldout ? (r.holdoutWinRate ?? null) : (r.winRate ?? null),
      resolved: useHoldout ? (r.holdoutResolved ?? 0) : (r.resolved ?? 0),
      source: useHoldout ? "holdout" : "full",
      holdoutPct: holdoutOn ? (r.holdoutPct as number) : null,
    };
  });
}

/** Latest run per symbol (by created_at), for a compact board. */
export function latestBacktestBySymbol(runs: BacktestRunLike[]): BacktestRunSummary[] {
  const sorted = summarizeBacktestRuns(runs).sort((a, b) =>
    a.created_at < b.created_at ? 1 : -1,
  );
  const seen = new Set<string>();
  const out: BacktestRunSummary[] = [];
  for (const row of sorted) {
    const key = row.symbol.toUpperCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  return out;
}

export function backtestCoaching(summaries: BacktestRunSummary[]): string[] {
  const lines: string[] = [];
  if (!summaries.length) {
    lines.push(
      "No saved backtests yet. Run a Den backtest and tap “Save this run to history” to feed this section.",
    );
    return lines;
  }
  const positive = summaries.filter((s) => (s.avgR ?? 0) > 0 && s.resolved >= 20);
  const weak = summaries.filter((s) => (s.avgR ?? 0) < 0 && s.resolved >= 20);
  if (positive.length) {
    lines.push(
      `Practice (backtest) looks better on: ${positive.map((s) => s.symbol).join(", ")}. Confirm with real journal trades before sizing up.`,
    );
  }
  if (weak.length) {
    lines.push(
      `Practice looks weak on: ${weak.map((s) => s.symbol).join(", ")}. Do not treat those as live edges yet.`,
    );
  }
  lines.push(
    "Backtests are practice on history. Journal trades are what actually happened for you — trust journal more when they disagree.",
  );
  return lines;
}
