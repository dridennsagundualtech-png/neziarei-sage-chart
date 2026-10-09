import { DataTable, Headline, StatRows, fmtPct, fmtR, signTone } from "@/components/journal/parts";
import { TermTooltip } from "@/components/TermTooltip";
import type { BacktestResult } from "@/lib/backtest-shared.server";
import { cn } from "@/lib/utils";

function streak(value: number | null | undefined): string {
  if (value === null || value === undefined) return "–";
  return `${value} loss${value === 1 ? "" : "es"} in a row`;
}

function Heading({ children }: { children: React.ReactNode }) {
  return <h3 className="font-display text-lg font-semibold">{children}</h3>;
}

export function BacktestResultView({ result }: { result: BacktestResult }) {
  const holdoutOn = typeof result.holdoutPct === "number" && result.holdoutPct > 0;

  return (
    <div className="space-y-8">
      {holdoutOn && (
        <section className="space-y-4">
          <Heading>
            <TermTooltip
              term="Holdout"
              label={`Holdout test: last ${result.holdoutPct}% of history`}
            />
          </Heading>
          <Headline
            items={[
              { label: "Holdout resolved", value: String(result.holdoutResolved ?? 0) },
              { label: "Holdout win rate", value: fmtPct(result.holdoutWinRate) },
              {
                label: <TermTooltip term="Holdout Avg R" label="Holdout Avg R" />,
                value: fmtR(result.holdoutAvgR),
                tone: signTone(result.holdoutAvgR),
              },
              {
                label: <TermTooltip term="Train Avg R" label="Train Avg R" />,
                value: fmtR(result.trainAvgR),
                tone: signTone(result.trainAvgR),
              },
            ]}
          />
          <div className="space-y-2 text-[14px] leading-snug text-muted-foreground">
            <p>
              Holdout median {fmtR(result.holdoutMedianR)} · without the best trade{" "}
              {fmtR(result.holdoutAvgRExcludingBest)} · worst streak{" "}
              {streak(result.holdoutMaxConsecutiveLosses)}. A big gap between Holdout Avg R and
              these two means one lucky trade may be carrying the number.
            </p>
            <p>
              Judge the strategy by{" "}
              <span className="font-semibold text-foreground">Holdout Avg R</span>, not the
              full-sample average below. Train is only for comparison.
              {result.holdoutFrom
                ? ` Window: ${result.holdoutFrom.slice(0, 16)} to ${result.holdoutTo?.slice(0, 16) ?? ""}.`
                : ""}
            </p>
          </div>
        </section>
      )}

      <section className="space-y-4">
        <Heading>Whole test</Heading>
        <Headline
          items={[
            { label: "Setups found", value: String(result.totalSetups) },
            { label: "Win rate (full)", value: fmtPct(result.winRate) },
            {
              label: "Average R (full sample)",
              value: fmtR(result.avgR),
              tone: signTone(result.avgR),
            },
            {
              label: "Total R",
              value: fmtR(result.totalR),
              tone: signTone(result.totalR),
            },
          ]}
        />
        <StatRows
          rows={[
            { label: "Median R", value: fmtR(result.medianR), tone: signTone(result.medianR) },
            {
              label: "Avg R without best trade",
              value: fmtR(result.avgRExcludingBest),
              tone: signTone(result.avgRExcludingBest),
            },
            { label: "Worst losing streak", value: streak(result.maxConsecutiveLosses) },
            { label: "Max drawdown (R)", value: fmtR(result.maxDrawdownR) },
            {
              label: "Profit factor",
              value: result.profitFactor == null ? "–" : result.profitFactor.toFixed(2),
            },
          ]}
        />
        <div className="space-y-2 text-[14px] leading-snug text-muted-foreground">
          <p>
            If Median R or Avg R without the best trade is much lower than Average R, one outlier
            trade is doing most of the work. Treat the headline number with caution until more
            history builds up.
          </p>
          <p>
            {result.engine === "ai"
              ? `${result.modelCallsMade ?? result.steps} sampled AI calls`
              : `${result.steps} simulated steps`}{" "}
            on {result.stepTimeframe} ({result.from?.slice(0, 16)} to {result.to?.slice(0, 16)}).{" "}
            {result.wins} wins, {result.losses} losses, {result.unresolved} unresolved.
            {holdoutOn ? " Full-sample numbers include train and holdout." : ""}
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <Heading>By direction and score</Heading>
        <DataTable
          label="Results by direction and score"
          columns={[
            { label: "Group" },
            { label: "Setups", align: "right" },
            { label: "Resolved", align: "right" },
            { label: "Win rate", align: "right" },
            { label: "Avg R", align: "right" },
          ]}
          rows={[...result.byDirection, ...result.byScore].map((row) => ({
            key: row.label,
            cells: [
              <span key="l" className="font-semibold">
                {row.label}
              </span>,
              row.setups,
              row.resolved,
              fmtPct(row.winRate, 0),
              <span key="r" className={cn("font-semibold", signTone(row.avgR))}>
                {fmtR(row.avgR)}
              </span>,
            ],
          }))}
        />
      </section>

      {result.byMonth && result.byMonth.length > 0 && (
        <section className="space-y-3">
          <Heading>By calendar month</Heading>
          <p className="-mt-1 text-[14px] text-muted-foreground">Resolved trades only.</p>
          <DataTable
            label="Results by calendar month"
            columns={[
              { label: "Month" },
              { label: "Resolved", align: "right" },
              { label: "Win rate", align: "right" },
              { label: "Avg R", align: "right" },
            ]}
            rows={result.byMonth.map((row) => ({
              key: row.label,
              cells: [
                row.label,
                row.resolved,
                fmtPct(row.winRate, 0),
                <span key="r" className={cn("font-semibold", signTone(row.avgR))}>
                  {fmtR(row.avgR)}
                </span>,
              ],
            }))}
          />
        </section>
      )}
    </div>
  );
}
