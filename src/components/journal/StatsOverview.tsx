/**
 * The numbers block shared by the Stats tab and the Backtest stats tab, so both read the same way.
 */
import { TermTooltip } from "@/components/TermTooltip";
import {
  Headline,
  RowList,
  StatRows,
  fmtNum,
  fmtPct,
  fmtR,
  signTone,
} from "@/components/journal/parts";
import type { ComponentPerformance, Stats } from "@/lib/stats";
import { cn } from "@/lib/utils";

const term = (label: string) => <TermTooltip term={label} label={label} />;

export function StatsOverview({ stats, expectancyHint }: { stats: Stats; expectancyHint: string }) {
  return (
    <div className="space-y-6">
      <Headline
        items={[
          { label: term("Win rate"), value: fmtPct(stats.winRate) },
          {
            label: term("Expectancy"),
            value: fmtR(stats.expectancy),
            tone: signTone(stats.expectancy),
            hint: expectancyHint,
          },
          { label: term("Profit factor"), value: fmtNum(stats.profitFactor) },
          {
            label: term("Cumulative R"),
            value: fmtR(stats.cumulativeR),
            tone: signTone(stats.cumulativeR),
          },
        ]}
      />
      <StatRows
        rows={[
          { label: term("Trades"), value: String(stats.total) },
          {
            label: term("Avg winner"),
            value: fmtR(stats.avgWinner),
            tone: signTone(stats.avgWinner),
          },
          { label: term("Avg loser"), value: fmtR(stats.avgLoser), tone: signTone(stats.avgLoser) },
          { label: term("Max drawdown"), value: `${fmtNum(stats.maxDrawdown)}R` },
          { label: term("Breakeven"), value: String(stats.breakevens) },
        ]}
      />
    </div>
  );
}

/** Checklist items and how trades did when each one was present. */
export function ComponentList({ items }: { items: ComponentPerformance[] }) {
  return (
    <RowList>
      {items.map((item) => (
        <li key={item.key} className="py-3">
          <p className="text-base font-semibold leading-snug">{item.label}</p>
          <p className="mt-0.5 text-[14px] text-muted-foreground">
            {item.withCount} {item.withCount === 1 ? "trade" : "trades"} ·{" "}
            {fmtPct(item.withWinRate, 0)} wins ·{" "}
            <span className={cn("font-semibold", signTone(item.withAvgR))}>
              {fmtR(item.withAvgR)}
            </span>{" "}
            avg
          </p>
        </li>
      ))}
    </RowList>
  );
}
