/**
 * Full practice stats — same kind of numbers as live Journal stats,
 * built only from saved backtest setups (TP/SL outcomes).
 */
import { FlaskConical } from "lucide-react";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { TermTooltip } from "@/components/TermTooltip";
import { Badge } from "@/components/ui/badge";
import { SAMPLE_TIER_LABEL } from "@/lib/analysis-types";
import { listBacktestRuns } from "@/lib/backtest-history.functions";
import { buildFullBacktestStats } from "@/lib/backtest-stats";

function fmt(value: number | null, suffix = ""): string {
  if (value === null || Number.isNaN(value)) return "–";
  return `${value.toFixed(2)}${suffix}`;
}

function formatRAxis(value: number): string {
  if (!Number.isFinite(value)) return "–";
  const abs = Math.abs(value);
  if (abs >= 1000) return `${value >= 0 ? "" : "-"}${(abs / 1000).toFixed(1)}kR`;
  if (abs >= 100) return `${value.toFixed(0)}R`;
  return `${value.toFixed(1)}R`;
}

function EquityTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { i: number; date: string; r: number } }> }) {
  if (!active || !payload?.length) return null;
  const row = payload[0]!.payload;
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-foreground">Trade #{row.i}</p>
      <p className="text-muted-foreground">{row.date || "—"}</p>
      <p className="mt-1 font-semibold text-primary">
        Equity: {row.r >= 0 ? "+" : ""}
        {row.r.toFixed(2)}R
      </p>
    </div>
  );
}

function PracticeEquityChart({
  data,
}: {
  data: { i: number; date: string; r: number }[];
}) {
  const [window, setWindow] = useState<"100" | "250" | "all">("250");
  const sliced = useMemo(() => {
    if (window === "all") return data;
    const n = window === "100" ? 100 : 250;
    return data.slice(-n);
  }, [data, window]);

  const last = sliced[sliced.length - 1]?.r ?? 0;
  const first = sliced[0]?.r ?? 0;
  const delta = last - first;
  const extreme = Math.abs(last) > 500;

  return (
    <div className="card-soft space-y-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold">Practice equity (cumulative R)</p>
          <p className="text-[11px] text-muted-foreground">
            Running total of practice wins and losses in R. Up = growing edge; down = losing stretch.
          </p>
        </div>
        <div className="flex gap-1">
          {([
            ["100", "Last 100"],
            ["250", "Last 250"],
            ["all", "All"],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setWindow(key)}
              className={
                window === key
                  ? "rounded-full border border-primary bg-primary/15 px-2.5 py-1 text-[11px] text-primary"
                  : "rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground"
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-[11px]">
        <span className="rounded-full bg-elevated px-2.5 py-1">
          End:{" "}
          <span className="font-semibold text-foreground">
            {last >= 0 ? "+" : ""}
            {last.toFixed(2)}R
          </span>
        </span>
        <span className="rounded-full bg-elevated px-2.5 py-1">
          Window change:{" "}
          <span className="font-semibold text-foreground">
            {delta >= 0 ? "+" : ""}
            {delta.toFixed(2)}R
          </span>
        </span>
        <span className="rounded-full bg-elevated px-2.5 py-1">{sliced.length} trades shown</span>
      </div>

      {extreme && (
        <p className="rounded-xl bg-warn/10 px-3 py-2 text-[11px] text-warn">
          This total looks unusually large. Older backtests may have used broken R math. Prefer
          runs saved after the R-calc fix, or hide old runs and re-save new ones.
        </p>
      )}

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={sliced} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.6} />
            <XAxis
              dataKey="i"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              minTickGap={40}
              label={{
                value: "Trade #",
                position: "insideBottomRight",
                offset: -2,
                style: { fontSize: 10, fill: "hsl(var(--muted-foreground))" },
              }}
            />
            <YAxis
              tickFormatter={formatRAxis}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              width={52}
              label={{
                value: "R",
                angle: -90,
                position: "insideLeft",
                style: { fontSize: 10, fill: "hsl(var(--muted-foreground))" },
              }}
            />
            <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" />
            <Tooltip content={<EquityTooltip />} />
            <Area
              type="monotone"
              dataKey="r"
              name="Equity R"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="hsl(var(--primary) / 0.2)"
              dot={false}
              activeDot={{ r: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="panel p-3">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
        <TermTooltip term={label} label={label} />
      </p>
      <p className="font-display text-xl font-semibold">{value}</p>
      {hint ? <p className="text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function GroupTable({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; stats: { total: number; winRate: number | null; avgR: number | null } }[];
}) {
  if (!rows.length) return null;
  return (
    <div className="panel space-y-2 p-3">
      <p className="text-xs font-semibold">{title}</p>
      <table className="w-full text-left text-[11px]">
        <thead className="text-muted-foreground">
          <tr>
            <th className="py-1 pr-2">Group</th>
            <th className="py-1 pr-2">Trades</th>
            <th className="py-1 pr-2">Win %</th>
            <th className="py-1">Avg R</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-t border-border/50">
              <td className="py-1.5 pr-2 font-medium">{row.label}</td>
              <td className="py-1.5 pr-2">{row.stats.total}</td>
              <td className="py-1.5 pr-2">
                {row.stats.winRate === null ? "–" : `${row.stats.winRate.toFixed(1)}%`}
              </td>
              <td className="py-1.5">
                {row.stats.avgR === null
                  ? "–"
                  : `${row.stats.avgR >= 0 ? "+" : ""}${row.stats.avgR.toFixed(2)}R`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function BacktestStatsPanel() {
  const listFn = useServerFn(listBacktestRuns);
  const query = useQuery({
    queryKey: ["backtest-runs"],
    queryFn: () => listFn({}),
  });
  const [symbolFilter, setSymbolFilter] = useState<string>("ALL");

  const runs = query.data ?? [];
  const symbols = useMemo(
    () => ["ALL", ...Array.from(new Set(runs.map((r) => r.symbol.toUpperCase()))).sort()],
    [runs],
  );
  const filtered = useMemo(
    () =>
      symbolFilter === "ALL"
        ? runs
        : runs.filter((r) => r.symbol.toUpperCase() === symbolFilter),
    [runs, symbolFilter],
  );
  const full = useMemo(() => buildFullBacktestStats(filtered), [filtered]);
  const { stats } = full;

  if (query.isLoading) {
    return (
      <section className="card-soft p-4 text-sm text-muted-foreground">
        Loading backtest statistics…
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <header className="card-soft space-y-2 p-5">
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary">
            <FlaskConical className="size-4" />
          </span>
          <div>
            <h2 className="font-display text-lg font-semibold">
              <TermTooltip term="Backtest statistics" label="Backtest statistics" />
            </h2>
            <p className="text-sm text-muted-foreground">
              Same kind of numbers as live stats (win rate, Avg R, expectancy, equity curve), but
              only from saved backtest setups that hit TP or stop. Practice only — not real trades.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="rounded-full">
            {full.runsUsed} runs with setups
          </Badge>
          <Badge variant="outline" className="rounded-full">
            {full.resolved} finished · {full.unresolved} unresolved
          </Badge>
          <Badge variant="outline" className="rounded-full">
            Sample: {SAMPLE_TIER_LABEL[full.sampleTier]}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {symbols.map((sym) => (
            <button
              key={sym}
              type="button"
              onClick={() => setSymbolFilter(sym)}
              className={
                symbolFilter === sym
                  ? "rounded-full border border-primary bg-primary/15 px-2.5 py-1 text-[11px] text-primary"
                  : "rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground"
              }
            >
              {sym === "ALL" ? "All symbols" : sym}
            </button>
          ))}
        </div>
      </header>

      {full.coaching.length > 0 && (
        <ul className="card-soft space-y-1 p-4 text-xs text-muted-foreground">
          {full.coaching.map((line, i) => (
            <li key={i}>• {line}</li>
          ))}
        </ul>
      )}

      {full.missingSetupDetail ? (
        <div className="card-soft p-5 text-sm text-muted-foreground">
          Older saved runs may only store summary totals, not each setup. Run a new backtest and
          save it so every TP/SL result is stored — then this page fills like live stats.
        </div>
      ) : full.resolved === 0 ? (
        <div className="card-soft p-5 text-sm text-muted-foreground">
          No finished practice trades yet. Save a Den backtest that produced setups which hit
          take-profit or stop.
        </div>
      ) : (
        <>
          <section className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <StatTile label="Trades" value={String(stats.total)} />
            <StatTile label="Win rate" value={fmt(stats.winRate, "%")} />
            <StatTile
              label="Expectancy"
              value={fmt(stats.expectancy, "R")}
              hint="Average R per practice trade"
            />
            <StatTile label="Avg winner" value={fmt(stats.avgWinner, "R")} />
            <StatTile label="Avg loser" value={fmt(stats.avgLoser, "R")} />
            <StatTile label="Profit factor" value={fmt(stats.profitFactor)} />
            <StatTile label="Cumulative R" value={fmt(stats.cumulativeR, "R")} />
            <StatTile label="Max drawdown" value={fmt(stats.maxDrawdown, "R")} />
            <StatTile label="Breakeven" value={String(stats.breakevens)} />
          </section>

          {full.equity.length > 1 && <PracticeEquityChart data={full.equity} />}

          <div className="grid gap-3 lg:grid-cols-3">
            <GroupTable title="By symbol" rows={full.bySymbol} />
            <GroupTable title="By grade" rows={full.byGrade} />
            <GroupTable title="By direction" rows={full.byDirection} />
          </div>
        </>
      )}

      <p className="text-[11px] text-muted-foreground">
        Source: Backtest history only (must click Save). Live journal stats stay under the Stats
        tab and are never mixed in here.
      </p>
    </section>
  );
}
