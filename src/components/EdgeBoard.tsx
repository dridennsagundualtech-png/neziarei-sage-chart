/**
 * Personal edge board UI — Journal → Stats.
 * Coaching from YOUR finished trades only. Never changes Den math.
 */
import { Lightbulb, Sparkles } from "lucide-react";

import { TermTooltip } from "@/components/TermTooltip";
import { Badge } from "@/components/ui/badge";
import { SAMPLE_TIER_LABEL } from "@/lib/analysis-types";
import {
  backtestCoaching,
  bucketBlurb,
  buildEdgeBoard,
  latestBacktestBySymbol,
  type BacktestRunLike,
  type EdgeBucket,
} from "@/lib/edge-board";
import type { JournalRow } from "@/lib/stats";
import { cn } from "@/lib/utils";

function fmtR(value: number | null): string {
  if (value === null) return "–";
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}R`;
}

function fmtPct(value: number | null): string {
  if (value === null) return "–";
  return `${value.toFixed(0)}%`;
}

function BucketTable({
  title,
  term,
  buckets,
}: {
  title: string;
  term: string;
  buckets: EdgeBucket[];
}) {
  if (!buckets.length) {
    return (
      <div className="panel p-3">
        <p className="text-xs font-semibold">
          <TermTooltip term={term} label={title} />
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">No data in this group yet.</p>
      </div>
    );
  }

  return (
    <div className="panel space-y-2 p-3">
      <p className="text-xs font-semibold">
        <TermTooltip term={term} label={title} />
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[11px]">
          <thead className="text-muted-foreground">
            <tr>
              <th className="py-1 pr-2">Group</th>
              <th className="py-1 pr-2">Trades</th>
              <th className="py-1 pr-2">Win %</th>
              <th className="py-1 pr-2">Avg R</th>
              <th className="py-1">Note</th>
            </tr>
          </thead>
          <tbody>
            {buckets.map((b) => (
              <tr
                key={b.key}
                className={cn(
                  "border-t border-border/50",
                  b.reliable && (b.stats.avgR ?? 0) > 0 && "bg-bull/5",
                  b.reliable && (b.stats.avgR ?? 0) < 0 && "bg-bear/5",
                )}
              >
                <td className="py-1.5 pr-2 font-medium">
                  {b.label}
                  {b.reliable && (
                    <Badge variant="outline" className="ml-1 rounded-full px-1.5 py-0 text-[9px]">
                      enough data
                    </Badge>
                  )}
                </td>
                <td className="py-1.5 pr-2">{b.stats.total}</td>
                <td className="py-1.5 pr-2">{fmtPct(b.stats.winRate)}</td>
                <td className="py-1.5 pr-2 font-medium">{fmtR(b.stats.avgR)}</td>
                <td className="py-1.5 text-muted-foreground">{bucketBlurb(b)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function EdgeBoard({
  rows,
  backtestRuns = [],
  minSample = 15,
}: {
  rows: JournalRow[];
  /** Saved backtest_runs rows (optional). Shown separately from live journal. */
  backtestRuns?: BacktestRunLike[];
  minSample?: number;
}) {
  const board = buildEdgeBoard(rows, minSample);
  const btSummaries = latestBacktestBySymbol(backtestRuns);
  const btLines = backtestCoaching(btSummaries);

  return (
    <section className="card-soft space-y-3 p-4">
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary">
          <Sparkles className="size-4" />
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-base font-semibold">
            <TermTooltip term="My edge board" label="My edge board" />
          </h2>
          <p className="text-xs text-muted-foreground">
            Simple meaning: a report of what has actually worked <span className="font-medium text-foreground">for you</span>,
            from finished journal trades only. It does not change the Den Analyzer rules.
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {board.totalCompleted} finished trades · sample:{" "}
            {SAMPLE_TIER_LABEL[board.sampleTier]} · need ~{board.minSample}+ in a group to mark
            “enough data”
          </p>
        </div>
      </div>

      {board.coaching.length > 0 && (
        <div className="space-y-1.5 rounded-xl border border-primary/25 bg-primary/5 p-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-primary">
            <Lightbulb className="size-3.5" /> Coaching from your scoreboard
          </p>
          <ul className="space-y-1 text-xs text-muted-foreground">
            {board.coaching.map((line, i) => (
              <li key={i}>• {line}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-3 lg:grid-cols-2">
        <BucketTable title="By symbol" term="By symbol" buckets={board.bySymbol} />
        <BucketTable title="By grade" term="By grade" buckets={board.byGrade} />
        <BucketTable title="By direction" term="By direction" buckets={board.byDirection} />
        <BucketTable title="By timeframe" term="By timeframe" buckets={board.byTimeframe} />
      </div>

      <div className="panel space-y-2 p-3">
        <p className="text-xs font-semibold">
          <TermTooltip term="From saved backtests" label="From saved backtests (practice)" />
        </p>
        <p className="text-[11px] text-muted-foreground">
          Uses runs you saved under Backtest history. Prefers <span className="font-medium text-foreground">holdout Avg R</span> when that run used holdout.
        </p>
        {btSummaries.length === 0 ? (
          <p className="text-[11px] text-muted-foreground">
            No saved backtests yet. Run a backtest → Save this run to history.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="py-1 pr-2">Symbol</th>
                  <th className="py-1 pr-2">Label</th>
                  <th className="py-1 pr-2">Resolved</th>
                  <th className="py-1 pr-2">Win %</th>
                  <th className="py-1 pr-2">Avg R</th>
                  <th className="py-1">Source</th>
                </tr>
              </thead>
              <tbody>
                {btSummaries.map((s) => (
                  <tr key={s.id} className="border-t border-border/50">
                    <td className="py-1.5 pr-2 font-medium">{s.symbol}</td>
                    <td className="py-1.5 pr-2 text-muted-foreground">{s.label ?? s.engine}</td>
                    <td className="py-1.5 pr-2">{s.resolved}</td>
                    <td className="py-1.5 pr-2">{fmtPct(s.winRate)}</td>
                    <td className="py-1.5 pr-2 font-medium">{fmtR(s.avgR)}</td>
                    <td className="py-1.5 text-muted-foreground">
                      {s.source === "holdout" ? `Holdout ${s.holdoutPct}%` : "Full sample"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <ul className="space-y-1 text-[11px] text-muted-foreground">
          {btLines.map((line, i) => (
            <li key={i}>• {line}</li>
          ))}
        </ul>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Journal = your real marked results. Backtests = practice on history. MT5 trades outside the
        app count only if you journal them. When journal and backtest disagree, trust the journal more.
      </p>
    </section>
  );
}
