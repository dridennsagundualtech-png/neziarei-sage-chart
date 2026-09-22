/**
 * Separate statistics for saved backtests only (practice scoreboard).
 */
import { FlaskConical } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { TermTooltip } from "@/components/TermTooltip";
import { listBacktestRuns } from "@/lib/backtest-history.functions";
import { buildBacktestStats } from "@/lib/backtest-stats";

function fmtR(value: number | null | undefined): string {
  if (value === null || value === undefined) return "–";
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}R`;
}

function fmtPct(value: number | null | undefined): string {
  if (value === null || value === undefined) return "–";
  return `${value.toFixed(1)}%`;
}

export function BacktestStatsPanel() {
  const listFn = useServerFn(listBacktestRuns);
  const query = useQuery({
    queryKey: ["backtest-runs"],
    queryFn: () => listFn({}),
  });

  const runs = query.data ?? [];
  const stats = buildBacktestStats(runs);

  if (query.isLoading) {
    return (
      <section className="card-soft p-4 text-sm text-muted-foreground">Loading backtest stats…</section>
    );
  }

  return (
    <section className="card-soft space-y-3 p-4">
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary">
          <FlaskConical className="size-4" />
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-base font-semibold">
            <TermTooltip term="Backtest statistics" label="Backtest statistics (practice only)" />
          </h2>
          <p className="text-xs text-muted-foreground">
            Simple meaning: a scoreboard for saved practice runs. Not mixed with real journal trades.
            Prefers holdout Avg R when a run used holdout.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { label: "Saved runs", value: String(stats.totalRuns) },
          { label: "Symbols", value: String(stats.symbols) },
          { label: "With holdout", value: String(stats.withHoldout) },
          { label: "Mean Avg R", value: fmtR(stats.meanAvgR) },
        ].map((item) => (
          <div key={item.label} className="panel p-3 text-center">
            <p className="font-display text-lg font-semibold text-primary">{item.value}</p>
            <p className="text-[10px] text-muted-foreground">{item.label}</p>
          </div>
        ))}
      </div>

      {stats.coaching.length > 0 && (
        <ul className="space-y-1 rounded-xl border border-border bg-elevated p-3 text-xs text-muted-foreground">
          {stats.coaching.map((line, i) => (
            <li key={i}>• {line}</li>
          ))}
        </ul>
      )}

      <div className="panel space-y-2 p-3">
        <p className="text-xs font-semibold">By symbol (latest run)</p>
        {stats.bySymbol.length === 0 ? (
          <p className="text-[11px] text-muted-foreground">
            Save a backtest from the Backtest page to see numbers here.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="py-1 pr-2">Symbol</th>
                  <th className="py-1 pr-2">Runs</th>
                  <th className="py-1 pr-2">Latest resolved</th>
                  <th className="py-1 pr-2">Latest win %</th>
                  <th className="py-1 pr-2">Latest Avg R</th>
                  <th className="py-1">Source</th>
                </tr>
              </thead>
              <tbody>
                {stats.bySymbol.map((row) => (
                  <tr key={row.symbol} className="border-t border-border/50">
                    <td className="py-1.5 pr-2 font-medium">{row.symbol}</td>
                    <td className="py-1.5 pr-2">{row.runs}</td>
                    <td className="py-1.5 pr-2">{row.latestResolved}</td>
                    <td className="py-1.5 pr-2">{fmtPct(row.latestWinRate)}</td>
                    <td className="py-1.5 pr-2 font-medium">{fmtR(row.latestAvgR)}</td>
                    <td className="py-1.5 text-muted-foreground">
                      {row.latestSource === "holdout" ? "Holdout" : "Full"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="panel space-y-2 p-3">
        <p className="text-xs font-semibold">Recent saved runs</p>
        {stats.recent.length === 0 ? (
          <p className="text-[11px] text-muted-foreground">None yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="py-1 pr-2">When</th>
                  <th className="py-1 pr-2">Symbol</th>
                  <th className="py-1 pr-2">Label</th>
                  <th className="py-1 pr-2">Resolved</th>
                  <th className="py-1 pr-2">Avg R</th>
                  <th className="py-1">Source</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent.map((s) => (
                  <tr key={s.id} className="border-t border-border/50">
                    <td className="py-1.5 pr-2 text-muted-foreground">
                      {s.created_at.slice(0, 16).replace("T", " ")}
                    </td>
                    <td className="py-1.5 pr-2 font-medium">{s.symbol}</td>
                    <td className="py-1.5 pr-2 text-muted-foreground">{s.label ?? s.engine}</td>
                    <td className="py-1.5 pr-2">{s.resolved}</td>
                    <td className="py-1.5 pr-2 font-medium">{fmtR(s.avgR)}</td>
                    <td className="py-1.5 text-muted-foreground">
                      {s.source === "holdout" ? `Holdout ${s.holdoutPct}%` : "Full"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
