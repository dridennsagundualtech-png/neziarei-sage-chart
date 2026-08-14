import { createFileRoute } from "@tanstack/react-router";
import { BarChart3 } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AppShell } from "@/components/AppShell";
import { TermTooltip } from "@/components/TermTooltip";
import { Badge } from "@/components/ui/badge";
import { CHECKLIST_SPEC, SAMPLE_TIER_LABEL } from "@/lib/analysis-types";
import { DEFAULT_SETTINGS, useAnalyses, useSettings } from "@/lib/data";
import {
  componentPerformance,
  computeStats,
  cumulativeRSeries,
  groupBy,
  isCompleted,
  monthlySeries,
  scoreBandOf,
  type Stats,
} from "@/lib/stats";

export const Route = createFileRoute("/statistics")({
  head: () => ({
    meta: [
      { title: "Trading performance statistics — ChartPilot" },
      {
        name: "description",
        content:
          "Win rate, expectancy in R, profit factor and drawdown calculated only from your own recorded trade outcomes.",
      },
      { property: "og:title", content: "Trading performance statistics — ChartPilot" },
      {
        property: "og:description",
        content: "Deterministic performance math from your journal — never AI-estimated numbers.",
      },
    ],
  }),
  component: StatisticsPage,
});

function StatisticsPage() {
  return (
    <AppShell>
      <Statistics />
    </AppShell>
  );
}

const fmt = (value: number | null, suffix = "") =>
  value === null || Number.isNaN(value) ? "—" : `${value.toFixed(2)}${suffix}`;

function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="panel p-3">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="font-display text-xl font-semibold">{value}</p>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function GroupTable({ title, rows }: { title: string; rows: { label: string; stats: Stats }[] }) {
  if (rows.length === 0) return null;
  return (
    <section className="animate-float-in card-soft p-4">
      <h2 className="font-display text-base font-semibold">{title}</h2>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-[11px] uppercase text-muted-foreground">
            <tr>
              <th className="pb-2 pr-3 font-medium">Group</th>
              <th className="pb-2 pr-3 font-medium">Trades</th>
              <th className="pb-2 pr-3 font-medium">Win rate</th>
              <th className="pb-2 font-medium">Avg R</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-t border-border/60">
                <td className="py-2 pr-3">{row.label}</td>
                <td className="py-2 pr-3 font-mono text-xs">{row.stats.total}</td>
                <td className="py-2 pr-3 font-mono text-xs">
                  {fmt(row.stats.winRate, "%")}
                  {row.stats.total < 20 && (
                    <span className="ml-1 text-[10px] text-warn">small sample</span>
                  )}
                </td>
                <td className="py-2 font-mono text-xs">{fmt(row.stats.avgR, "R")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Statistics({ userId }: { userId: string }) {
  const analysesQuery = useAnalyses(userId);
  const settingsQuery = useSettings(userId);
  const rows = analysesQuery.data ?? [];
  const settings = settingsQuery.data ?? { user_id: userId, ...DEFAULT_SETTINGS };

  const stats = computeStats(rows);
  const completed = rows.filter(isCompleted);
  const equity = cumulativeRSeries(rows);
  const monthly = monthlySeries(rows);
  const components = componentPerformance(rows, CHECKLIST_SPEC).filter((c) => c.withCount > 0);

  const openCount = rows.filter((row) => row.outcome === "OPEN").length;

  return (
    <div className="space-y-4">
      <header className="animate-float-in card-soft p-5">
        <h1 className="font-display text-xl font-semibold">Performance statistics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every figure below is computed from your {completed.length} completed{" "}
          {completed.length === 1 ? "trade" : "trades"}. The AI never supplies these numbers.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge variant="secondary" className="rounded-full">
            Sample: {SAMPLE_TIER_LABEL[stats.sampleTier]}
          </Badge>
          <Badge variant="outline" className="rounded-full">
            {openCount} still open
          </Badge>
        </div>
      </header>

      {completed.length === 0 ? (
        <div className="card-soft grid place-items-center gap-2 p-10 text-center">
          <BarChart3 className="size-8 text-muted-foreground" />
          <p className="font-display text-base font-semibold">No completed trades yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Record a win, loss or breakeven with a result in R on any analysis and your statistics
            will appear here. Until then, no win rate can honestly be shown.
          </p>
        </div>
      ) : (
        <>
          <section className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <StatTile label="Trades" value={String(stats.total)} />
            <StatTile label="Win rate" value={fmt(stats.winRate, "%")} />
            <StatTile
              label="Expectancy"
              value={fmt(stats.expectancy, "R")}
              hint="Average R per trade"
            />
            <StatTile label="Avg winner" value={fmt(stats.avgWinner, "R")} />
            <StatTile label="Avg loser" value={fmt(stats.avgLoser, "R")} />
            <StatTile label="Profit factor" value={fmt(stats.profitFactor)} />
            <StatTile label="Cumulative" value={fmt(stats.cumulativeR, "R")} />
            <StatTile label="Max drawdown" value={fmt(stats.maxDrawdown, "R")} />
            <StatTile label="Breakeven" value={String(stats.breakevens)} />
          </section>

          {stats.total < settings.min_sample_size && (
            <p className="rounded-xl bg-warn/10 p-3 text-xs leading-relaxed text-warn">
              This sample is below your {settings.min_sample_size}-trade threshold, so treat these
              figures as descriptive only — not as a predictive win probability.
            </p>
          )}

          <section className="animate-float-in card-soft p-4">
            <h2 className="font-display text-base font-semibold">
              Cumulative <TermTooltip term="R" label="R" /> curve
            </h2>
            <div className="mt-3 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={equity}>
                  <defs>
                    <linearGradient id="rGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="i" stroke="var(--color-muted-foreground)" fontSize={11} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={11} width={32} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="r"
                    stroke="var(--color-primary)"
                    strokeWidth={2}
                    fill="url(#rGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          {monthly.length > 0 && (
            <section className="animate-float-in card-soft p-4">
              <h2 className="font-display text-base font-semibold">Monthly R</h2>
              <div className="mt-3 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthly}>
                    <CartesianGrid stroke="var(--color-border)" vertical={false} />
                    <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={11} />
                    <YAxis stroke="var(--color-muted-foreground)" fontSize={11} width={32} />
                    <Tooltip
                      contentStyle={{
                        background: "var(--color-card)",
                        border: "1px solid var(--color-border)",
                        borderRadius: 12,
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="r" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}

          <GroupTable title="By asset" rows={groupBy(rows, (row) => row.asset)} />
          <GroupTable title="By direction" rows={groupBy(rows, (row) => row.direction)} />
          <GroupTable
            title="By timeframe"
            rows={groupBy(rows, (row) => row.primary_timeframe ?? "—")}
          />
          <GroupTable title="By setup score band" rows={groupBy(rows, (row) => scoreBandOf(row.score))} />

          {components.length > 0 && (
            <section className="animate-float-in card-soft p-4">
              <h2 className="font-display text-base font-semibold">Which components help you</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Outcomes of completed trades where each checklist component was present. Correlation,
                not causation.
              </p>
              <ul className="mt-3 space-y-2">
                {components.map((item) => (
                  <li key={item.key} className="panel flex items-center justify-between gap-3 p-3">
                    <span className="min-w-0 text-sm">{item.label}</span>
                    <span className="shrink-0 font-mono text-xs text-muted-foreground">
                      {item.withCount} trades · {fmt(item.withWinRate, "%")} ·{" "}
                      {fmt(item.withAvgR, "R")}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
