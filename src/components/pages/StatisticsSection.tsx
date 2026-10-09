import { BarChart3 } from "lucide-react";

import { EdgeBoard } from "@/components/EdgeBoard";
import { EquityChart, MonthlyChart } from "@/components/journal/charts";
import { EmptyState, JSection, Notice } from "@/components/journal/parts";
import { ComponentList, StatsOverview } from "@/components/journal/StatsOverview";
import { SignInPrompt } from "@/components/SignInPrompt";
import { TermTooltip } from "@/components/TermTooltip";
import { CHECKLIST_SPEC, SAMPLE_TIER_LABEL } from "@/lib/analysis-types";
import { DEFAULT_SETTINGS, LOCAL_USER, useAnalyses, useSettings } from "@/lib/data";
import {
  componentPerformance,
  computeStats,
  cumulativeRSeries,
  isCompleted,
  monthlySeries,
} from "@/lib/stats";

function Statistics() {
  const analysesQuery = useAnalyses();
  const settingsQuery = useSettings();
  const rows = analysesQuery.data ?? [];
  const settings = settingsQuery.data ?? { user_id: LOCAL_USER, ...DEFAULT_SETTINGS };

  const stats = computeStats(rows);
  const completed = rows.filter(isCompleted);
  const equity = cumulativeRSeries(rows);
  const monthly = monthlySeries(rows);
  const components = componentPerformance(rows, CHECKLIST_SPEC).filter((c) => c.withCount > 0);
  const openCount = rows.filter((row) => row.outcome === "OPEN").length;

  return (
    <div>
      <JSection
        className="pt-6"
        title={<TermTooltip term="Performance statistics" label="Your results" />}
        hint={
          <>
            Every figure comes from your {completed.length} finished{" "}
            {completed.length === 1 ? "trade" : "trades"}. Open trades are not counted, and the AI
            never invents these numbers.
          </>
        }
      >
        <p className="text-[15px]">
          Sample size: <span className="font-semibold">{SAMPLE_TIER_LABEL[stats.sampleTier]}</span>
          <span className="text-muted-foreground"> · {openCount} still open</span>
        </p>
      </JSection>

      {completed.length === 0 ? (
        <EmptyState icon={BarChart3} title="No finished trades yet">
          Record a win, loss or breakeven with a result in R on any read and your statistics will
          appear here. Until then, no win rate can honestly be shown.
        </EmptyState>
      ) : (
        <>
          <JSection title="The numbers" className="pt-7">
            <StatsOverview stats={stats} expectancyHint="Average R per trade" />
            {stats.total < settings.min_sample_size && (
              <div className="mt-5">
                <Notice>
                  This sample is below your {settings.min_sample_size}-trade threshold. Treat these
                  figures as a description of the past, not a win probability.
                </Notice>
              </div>
            )}
          </JSection>

          <JSection
            title={
              <>
                Running total in <TermTooltip term="R" label="R" />
              </>
            }
            hint="Up means your results are growing. Down means a losing stretch."
          >
            <EquityChart data={equity} title="Running total in R" />
          </JSection>

          {monthly.length > 0 && (
            <JSection
              title="Result by month"
              hint="Above the line made money, below it lost money."
            >
              <MonthlyChart data={monthly} />
            </JSection>
          )}

          <EdgeBoard
            rows={rows}
            minSample={Math.max(10, Math.min(30, settings.min_sample_size || 15))}
          />

          {components.length > 0 && (
            <JSection
              title="Which checklist items help you"
              hint="Results of finished trades where each item was present. They happened together; that does not prove it caused the result."
            >
              <ComponentList items={components} />
            </JSection>
          )}
        </>
      )}
    </div>
  );
}

export function StatisticsSection() {
  return (
    <SignInPrompt feature="statistics">
      <Statistics />
    </SignInPrompt>
  );
}
