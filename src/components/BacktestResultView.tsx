import type { BacktestResult } from "@/lib/backtest-shared.server";

function pct(value: number | null): string {
  return value === null ? "–" : `${value.toFixed(1)}%`;
}

function rr(value: number | null): string {
  return value === null ? "–" : `${value >= 0 ? "+" : ""}${value.toFixed(2)}R`;
}

export function BacktestResultView({ result }: { result: BacktestResult }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Setups found", value: String(result.totalSetups) },
          { label: "Win rate", value: pct(result.winRate) },
          { label: "Average R", value: rr(result.avgR) },
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
