import type { BacktestResult } from "@/lib/backtest-shared.server";

function pct(value: number | null | undefined): string {
  return value === null || value === undefined ? "–" : `${value.toFixed(1)}%`;
}

function rr(value: number | null | undefined): string {
  return value === null || value === undefined
    ? "–"
    : `${value >= 0 ? "+" : ""}${value.toFixed(2)}R`;
}

export function BacktestResultView({ result }: { result: BacktestResult }) {
  const holdoutOn = typeof result.holdoutPct === "number" && result.holdoutPct > 0;

  return (
    <div className="space-y-4">
      {holdoutOn && (
        <div className="panel space-y-2 border border-primary/30 p-3">
          <p className="text-xs font-semibold text-primary">
            Holdout test — last {result.holdoutPct}% unseen
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="text-center">
              <p className="text-lg font-semibold">{result.holdoutResolved ?? 0}</p>
              <p className="text-[10px] text-muted-foreground">Holdout resolved</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold">{pct(result.holdoutWinRate)}</p>
              <p className="text-[10px] text-muted-foreground">Holdout win rate</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-primary">{rr(result.holdoutAvgR)}</p>
              <p className="text-[10px] text-muted-foreground">Holdout Avg R</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold">{rr(result.trainAvgR)}</p>
              <p className="text-[10px] text-muted-foreground">Train Avg R</p>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Judge the strategy by <span className="font-medium text-foreground">Holdout Avg R</span>,
            not the full-sample Average R below. Train is only for comparison.
            {result.holdoutFrom
              ? ` Window: ${result.holdoutFrom.slice(0, 16)} → ${result.holdoutTo?.slice(0, 16) ?? ""}.`
              : ""}
          </p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Setups found", value: String(result.totalSetups) },
          { label: "Win rate (full)", value: pct(result.winRate) },
          { label: "Average R (full)", value: rr(result.avgR) },
        ].map((item) => (
          <div key={item.label} className="panel p-3 text-center">
            <p className="text-lg font-semibold text-primary">{item.value}</p>
            <p className="text-[11px] text-muted-foreground">{item.label}</p>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground">
        {result.engine === "ai"
          ? `${result.modelCallsMade ?? result.steps} sampled AI calls`
          : `${result.steps} simulated steps`}{" "}
        on {result.stepTimeframe} ({result.from?.slice(0, 16)} → {result.to?.slice(0, 16)}).{" "}
        {result.wins} wins, {result.losses} losses, {result.unresolved} unresolved. Total{" "}
        {rr(result.totalR)}.
        {holdoutOn ? " Full-sample numbers include train + holdout." : ""}
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="text-muted-foreground">
            <tr>
              <th className="py-1 pr-3">Group</th>
              <th className="py-1 pr-3">Setups</th>
              <th className="py-1 pr-3">Resolved</th>
              <th className="py-1 pr-3">Win rate</th>
              <th className="py-1">Avg R</th>
            </tr>
          </thead>
          <tbody>
            {[...result.byDirection, ...result.byScore].map((row) => (
              <tr key={row.label} className="border-t border-border/60">
                <td className="py-1.5 pr-3 font-medium">{row.label}</td>
                <td className="py-1.5 pr-3">{row.setups}</td>
                <td className="py-1.5 pr-3">{row.resolved}</td>
                <td className="py-1.5 pr-3">{pct(row.winRate)}</td>
                <td className="py-1.5">{rr(row.avgR)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
