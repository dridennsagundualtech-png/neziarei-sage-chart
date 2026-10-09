/**
 * Journal charts. Colours come from the theme tokens (`var(--color-*)`), text is 12px or larger,
 * and every chart has a plain-words summary above it so it never depends on the picture alone.
 */
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChoiceChips, fmtR, signTone } from "@/components/journal/parts";
import { cn } from "@/lib/utils";

export interface EquityPoint {
  i: number;
  date: string;
  r: number;
}

const AXIS = { fontSize: 12, fill: "var(--color-muted-foreground)" } as const;

function axisR(value: number): string {
  if (!Number.isFinite(value)) return "–";
  const abs = Math.abs(value);
  if (abs >= 1000) return `${value < 0 ? "-" : ""}${(abs / 1000).toFixed(1)}k`;
  if (abs >= 100) return value.toFixed(0);
  return value.toFixed(1);
}

function TipBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2 text-[13px] shadow-lg">
      {children}
    </div>
  );
}

function EquityTip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: EquityPoint }>;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0]!.payload;
  return (
    <TipBox>
      <p className="font-semibold">Trade {row.i}</p>
      {row.date && <p className="text-muted-foreground">{row.date}</p>}
      <p className={cn("mt-1 font-semibold", signTone(row.r))}>{fmtR(row.r)} so far</p>
    </TipBox>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[13px] text-muted-foreground">{label}</dt>
      <dd className={cn("font-display text-xl font-semibold tabular-nums", tone)}>{value}</dd>
    </div>
  );
}

/**
 * Running total of results in R. Up means the account is growing, down means a losing stretch.
 * With `windowed` you can look at the last 100 / 250 trades or all of them.
 */
export function EquityChart({
  data,
  windowed = false,
  title,
}: {
  data: EquityPoint[];
  windowed?: boolean;
  title: string;
}) {
  const [span, setSpan] = useState<"100" | "250" | "all">(windowed ? "250" : "all");
  const shown = useMemo(() => {
    if (span === "all") return data;
    return data.slice(-(span === "100" ? 100 : 250));
  }, [data, span]);

  const first = shown[0]?.r ?? 0;
  const last = shown[shown.length - 1]?.r ?? 0;
  const change = last - first;

  return (
    <div className="space-y-4">
      {windowed && (
        <ChoiceChips
          label="How many trades to show"
          options={[
            { value: "100", label: "Last 100" },
            { value: "250", label: "Last 250" },
            { value: "all", label: "All" },
          ]}
          value={span}
          onChange={setSpan}
        />
      )}

      <dl className="grid grid-cols-3 gap-4">
        <MiniStat label="Ends at" value={fmtR(last)} tone={signTone(last)} />
        {windowed ? (
          <MiniStat label="Change" value={fmtR(change)} tone={signTone(change)} />
        ) : (
          <MiniStat label="Best point" value={fmtR(Math.max(...shown.map((p) => p.r), 0))} />
        )}
        <MiniStat label="Trades" value={String(shown.length)} />
      </dl>

      {Math.abs(last) > 500 && (
        <p className="text-[15px] leading-snug text-warn">
          This total looks unusually large. Older backtests may have used broken R math. Prefer runs
          saved after the R-calc fix.
        </p>
      )}

      <div
        role="img"
        aria-label={`${title}: ${shown.length} trades, ending at ${fmtR(last)}.`}
        className="h-60 w-full"
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={shown} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="journalEquity" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-foreground)" stopOpacity={0.22} />
                <stop offset="100%" stopColor="var(--color-foreground)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--color-border)" strokeOpacity={0.6} vertical={false} />
            <XAxis
              dataKey="i"
              tick={AXIS}
              tickLine={false}
              axisLine={false}
              minTickGap={32}
              height={28}
            />
            <YAxis tickFormatter={axisR} tick={AXIS} tickLine={false} axisLine={false} width={44} />
            <ReferenceLine y={0} stroke="var(--color-muted-foreground)" strokeDasharray="4 4" />
            <Tooltip content={<EquityTip />} cursor={{ stroke: "var(--color-muted-foreground)" }} />
            <Area
              isAnimationActive={false}
              type="monotone"
              dataKey="r"
              stroke="var(--color-foreground)"
              strokeWidth={2}
              fill="url(#journalEquity)"
              dot={false}
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function MonthTip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: { month: string; r: number; trades: number } }>;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0]!.payload;
  return (
    <TipBox>
      <p className="font-semibold">{row.month}</p>
      <p className={cn("font-semibold", signTone(row.r))}>{fmtR(row.r)}</p>
      <p className="text-muted-foreground">
        {row.trades} {row.trades === 1 ? "trade" : "trades"}
      </p>
    </TipBox>
  );
}

/** Result in R for each calendar month. Bars above the line made money, bars below lost it. */
export function MonthlyChart({ data }: { data: { month: string; r: number; trades: number }[] }) {
  const best = data.reduce((a, b) => (b.r > a.r ? b : a), data[0]!);
  const worst = data.reduce((a, b) => (b.r < a.r ? b : a), data[0]!);
  return (
    <div
      role="img"
      aria-label={`Result by month. Best ${best.month} at ${fmtR(best.r)}, weakest ${worst.month} at ${fmtR(worst.r)}.`}
      className="h-52 w-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--color-border)" strokeOpacity={0.6} vertical={false} />
          <XAxis
            dataKey="month"
            tick={AXIS}
            tickLine={false}
            axisLine={false}
            minTickGap={16}
            tickFormatter={(value: string) => value.slice(2)}
            height={28}
          />
          <YAxis tickFormatter={axisR} tick={AXIS} tickLine={false} axisLine={false} width={44} />
          <ReferenceLine y={0} stroke="var(--color-muted-foreground)" />
          <Tooltip content={<MonthTip />} cursor={{ fill: "var(--color-elevated)" }} />
          <Bar dataKey="r" radius={[4, 4, 0, 0]} isAnimationActive={false}>
            {data.map((row) => (
              <Cell key={row.month} fill={row.r >= 0 ? "var(--color-bull)" : "var(--color-bear)"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
