import { useMemo, useState } from "react";
import { ShieldAlert, Target } from "lucide-react";

import type { MarketAnalysis, MarketSeries } from "@/lib/market-types";
import { cn } from "@/lib/utils";

const W = 720;
const H = 360;
const PAD_L = 8;
const PAD_R = 74;
const PAD_T = 12;
const PAD_B = 18;

/** Pulls every number out of a level string like "3345.20–3348.60" or "1,932.4". */
function pricesIn(value: string | null | undefined): number[] {
  if (!value) return [];
  return (value.replace(/,/g, "").match(/-?\d+(\.\d+)?/g) ?? [])
    .map(Number)
    .filter((n) => Number.isFinite(n) && n !== 0);
}

function fmt(n: number): string {
  const abs = Math.abs(n);
  const d = abs >= 100 ? 2 : abs >= 10 ? 3 : abs >= 1 ? 4 : 6;
  return n.toFixed(d);
}

type Overlay = {
  label: string;
  prices: number[];
  tone: "entry" | "stop" | "target" | "support" | "resistance";
};

const mix = (token: string, pct: number) =>
  `color-mix(in oklch, var(${token}) ${pct}%, transparent)`;

const TONE: Record<Overlay["tone"], { stroke: string; fill: string }> = {
  entry: { stroke: "var(--primary)", fill: mix("--primary", 16) },
  stop: { stroke: "var(--bear)", fill: mix("--bear", 14) },
  target: { stroke: "var(--bull)", fill: mix("--bull", 14) },
  support: { stroke: mix("--bull", 60), fill: "transparent" },
  resistance: { stroke: mix("--bear", 60), fill: "transparent" },
};

export function MarketChart({ result }: { result: MarketAnalysis }) {
  const series: MarketSeries[] = result.series ?? [];
  const [tf, setTf] = useState<string>(series[0]?.timeframe ?? "");
  const active = series.find((s) => s.timeframe === tf) ?? series[0];

  const overlays = useMemo<Overlay[]>(() => {
    const list: Overlay[] = [];
    const push = (label: string, raw: string | null | undefined, tone: Overlay["tone"]) => {
      const prices = pricesIn(raw);
      if (prices.length) list.push({ label, prices, tone });
    };
    push("Entry", result.entry_zone, "entry");
    push("Stop", result.stop_loss, "stop");
    push("TP1", result.tp1, "target");
    push("TP2", result.tp2, "target");
    result.resistance_levels.slice(0, 3).forEach((level, i) => push(`R${i + 1}`, level, "resistance"));
    result.support_levels.slice(0, 3).forEach((level, i) => push(`S${i + 1}`, level, "support"));
    return list;
  }, [result]);

  const geometry = useMemo(() => {
    const candles = active?.candles ?? [];
    if (!candles.length) return null;
    const lows = candles.map((c) => c.low);
    const highs = candles.map((c) => c.high);
    const levelPrices = overlays.flatMap((o) => o.prices);
    let min = Math.min(...lows, ...(levelPrices.length ? levelPrices : lows));
    let max = Math.max(...highs, ...(levelPrices.length ? levelPrices : highs));
    const span = max - min || Math.abs(max) * 0.01 || 1;
    min -= span * 0.06;
    max += span * 0.06;
    const y = (price: number) =>
      PAD_T + ((max - price) / (max - min)) * (H - PAD_T - PAD_B);
    const step = (W - PAD_L - PAD_R) / candles.length;
    const body = Math.max(1.2, step * 0.6);
    return { candles, y, step, body, min, max };
  }, [active, overlays]);

  if (!active || !geometry) return null;

  const { candles, y, step, body } = geometry;

  return (
    <section className="card-soft p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-base font-semibold">Market illustration</h2>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Rebuilt from the stored candles — with the conditional plan and invalidation watch drawn on
            top.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {series.map((s) => (
            <button
              key={s.timeframe}
              type="button"
              onClick={() => setTf(s.timeframe)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[11px] transition-colors",
                s.timeframe === active.timeframe
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-border bg-elevated text-muted-foreground",
              )}
            >
              {s.timeframe}
            </button>
          ))}
        </div>
      </div>

      <div className="relative mt-4 overflow-hidden rounded-2xl border border-border bg-elevated">
        <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img"
          aria-label={`${result.symbol} ${active.timeframe} candles with plan levels`}>
          {overlays.map((o, idx) => {
            const tone = TONE[o.tone];
            const top = y(Math.max(...o.prices));
            const bottom = y(Math.min(...o.prices));
            const height = Math.max(1, bottom - top);
            return (
              <g key={`${o.label}-${idx}`}>
                {o.prices.length > 1 ? (
                  <rect x={PAD_L} y={top} width={W - PAD_L - PAD_R} height={height} fill={tone.fill} />
                ) : null}
                <line
                  x1={PAD_L}
                  x2={W - PAD_R}
                  y1={top + height / 2}
                  y2={top + height / 2}
                  stroke={tone.stroke}
                  strokeWidth={1.2}
                  strokeDasharray={o.tone === "support" || o.tone === "resistance" ? "5 5" : "0"}
                />
                <text
                  x={W - PAD_R + 5}
                  y={top + height / 2 + 3.5}
                  fontSize={10}
                  fill={tone.stroke}
                >
                  {o.label} {fmt(o.prices.length > 1 ? (Math.max(...o.prices) + Math.min(...o.prices)) / 2 : o.prices[0]!)}
                </text>
              </g>
            );
          })}

          {candles.map((c, i) => {
            const x = PAD_L + i * step + step / 2;
            const up = c.close >= c.open;
            const color = up ? "var(--bull)" : "var(--bear)";
            const top = y(Math.max(c.open, c.close));
            const bottom = y(Math.min(c.open, c.close));
            return (
              <g key={c.time + i}>
                <line x1={x} x2={x} y1={y(c.high)} y2={y(c.low)} stroke={color} strokeWidth={0.9} />
                <rect
                  x={x - body / 2}
                  y={top}
                  width={body}
                  height={Math.max(1, bottom - top)}
                  fill={color}
                />
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-elevated p-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-primary">
            <Target className="size-3.5" /> Conditional plan
          </p>
          <ul className="mt-2 space-y-1 text-xs leading-relaxed">
            <li>
              <span className="text-muted-foreground">Direction:</span> {result.direction}
            </li>
            <li>
              <span className="text-muted-foreground">Entry zone:</span> {result.entry_zone ?? "—"}
            </li>
            <li>
              <span className="text-muted-foreground">Stop:</span> {result.stop_loss ?? "—"}
            </li>
            <li>
              <span className="text-muted-foreground">TP1 / TP2:</span> {result.tp1 ?? "—"} /{" "}
              {result.tp2 ?? "—"}
            </li>
            {result.required_confirmation.length > 0 && (
              <li className="pt-1 text-muted-foreground">Only valid once:</li>
            )}
            {result.required_confirmation.map((item) => (
              <li key={item} className="pl-3">• {item}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-border bg-elevated p-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-warn">
            <ShieldAlert className="size-3.5" /> Invalidation watch
          </p>
          <ul className="mt-2 space-y-1 text-xs leading-relaxed">
            {result.invalidation.length ? (
              result.invalidation.map((item) => <li key={item}>• {item}</li>)
            ) : (
              <li className="text-muted-foreground">No invalidation conditions returned.</li>
            )}
          </ul>
        </div>
      </div>

      <p className="mt-3 text-[11px] text-muted-foreground">
        Illustration only — drawn from the candles in your market-data table, not a live feed or a
        prediction.
      </p>
    </section>
  );
}
