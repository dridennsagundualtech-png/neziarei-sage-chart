/**
 * Full practice stats — same kind of numbers as live Journal stats,
 * built only from saved backtest setups (TP/SL outcomes).
 */
import { FlaskConical } from "lucide-react";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { EdgeBoard } from "@/components/EdgeBoard";
import { EquityChart } from "@/components/journal/charts";
import { ChoiceChips, EmptyState, JSection } from "@/components/journal/parts";
import { ComponentList, StatsOverview } from "@/components/journal/StatsOverview";
import { TermTooltip } from "@/components/TermTooltip";
import { CHECKLIST_SPEC, SAMPLE_TIER_LABEL } from "@/lib/analysis-types";
import { listBacktestRuns } from "@/lib/backtest-history.functions";
import { buildFullBacktestStats, journalRowsFromBacktests } from "@/lib/backtest-stats";
import { componentPerformance } from "@/lib/stats";

export function BacktestStatsPanel() {
  const listFn = useServerFn(listBacktestRuns);
  const query = useQuery({
    queryKey: ["backtest-runs"],
    queryFn: () => listFn({}),
  });
  const [symbolFilter, setSymbolFilter] = useState<string>("ALL");

  const runs = useMemo(() => query.data ?? [], [query.data]);
  const symbols = useMemo(
    () => ["ALL", ...Array.from(new Set(runs.map((r) => r.symbol.toUpperCase()))).sort()],
    [runs],
  );
  const filtered = useMemo(
    () =>
      symbolFilter === "ALL" ? runs : runs.filter((r) => r.symbol.toUpperCase() === symbolFilter),
    [runs, symbolFilter],
  );
  const full = useMemo(() => buildFullBacktestStats(filtered as never), [filtered]);
  const journalRows = useMemo(() => journalRowsFromBacktests(filtered as never), [filtered]);
  const components = useMemo(
    () => componentPerformance(journalRows, CHECKLIST_SPEC).filter((c) => c.withCount > 0),
    [journalRows],
  );
  const { stats } = full;

  if (query.isLoading) {
    return (
      <p className="py-10 text-center text-[15px] text-muted-foreground">
        Loading backtest statistics…
      </p>
    );
  }

  return (
    <div>
      <JSection
        className="pt-6"
        title={<TermTooltip term="Backtest statistics" label="Backtest statistics" />}
        hint="The same kind of numbers as your live stats, but only from saved backtest setups that hit take-profit or stop. Practice only, not real trades."
      >
        <p className="text-[15px]">
          {full.runsUsed} {full.runsUsed === 1 ? "run" : "runs"} with setups ·{" "}
          <span className="font-semibold">{full.resolved} finished</span>, {full.unresolved}{" "}
          unresolved
          <span className="text-muted-foreground">
            {" "}
            · sample size: {SAMPLE_TIER_LABEL[full.sampleTier]}
          </span>
        </p>

        {symbols.length > 2 && (
          <div className="mt-4">
            <ChoiceChips
              scroll
              label="Show one symbol"
              value={symbolFilter}
              onChange={setSymbolFilter}
              options={symbols.map((symbol) => ({
                value: symbol,
                label: symbol === "ALL" ? "All symbols" : symbol,
              }))}
            />
          </div>
        )}

        {full.coaching.length > 0 && (
          <ul className="mt-5 space-y-2.5 text-[15px] leading-snug">
            {full.coaching.map((line, index) => (
              <li key={index} className="flex gap-3">
                <span
                  aria-hidden
                  className="mt-2 size-1.5 shrink-0 rounded-full bg-muted-foreground"
                />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        )}
      </JSection>

      {full.missingSetupDetail ? (
        <EmptyState icon={FlaskConical} title="Older runs only keep totals">
          Run a new backtest and save it so every take-profit and stop result is stored. Then this
          page fills in like your live stats.
        </EmptyState>
      ) : full.resolved === 0 ? (
        <EmptyState icon={FlaskConical} title="No finished practice trades yet">
          Save a Den backtest that produced setups which hit take-profit or stop.
        </EmptyState>
      ) : (
        <>
          <JSection title="The numbers" className="pt-7">
            <StatsOverview stats={stats} expectancyHint="Average R per practice trade" />
          </JSection>

          {full.equity.length > 1 && (
            <JSection
              title="Practice equity"
              hint="Running total of practice wins and losses in R. Up means a growing edge, down means a losing stretch."
            >
              <EquityChart windowed data={full.equity} title="Practice equity in R" />
            </JSection>
          )}

          <EdgeBoard rows={journalRows} minSample={15} />

          {components.length > 0 && (
            <JSection
              title="Which checklist items help you"
              hint="Results of finished practice setups where each item was present. They happened together; that does not prove it caused the result."
            >
              <ComponentList items={components} />
            </JSection>
          )}
        </>
      )}

      <p className="mt-10 text-[13px] leading-[18px] text-muted-foreground">
        Source: saved backtest history only (you must tap Save on a run). Your live journal stats
        stay under the Stats tab and are never mixed in here.
      </p>
    </div>
  );
}
