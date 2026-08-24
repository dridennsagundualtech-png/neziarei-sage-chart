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

type PlacedLabel = {
  key: string;
  levelY: number;
  labelY: number;
  tone: { stroke: string; fill: string };
  dashed: boolean;
  text: string;
  zoneTop: number;
  zoneBottom: number;
  zoneFill: string;
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
    const candleMin = Math.min(...lows);
    const candleMax = Math.max(...highs);
    const candleSpan = candleMax - candleMin || Math.abs(candleMax) * 0.01 || 1;

    // The AI returns level strings that can contain non-price numbers (R:R, percentages,
    // timeframe labels). Anything far outside the candle range would squash the candles
    // into a single line, so only keep numbers that plausibly sit on this chart.
    const lo = candleMin - candleSpan * 1.5;
    const hi = candleMax + candleSpan * 1.5;
    const inRange = (p: number) => p >= lo && p <= hi;

    const visible = overlays
      .map((o) => ({ ...o, prices: o.prices.filter(inRange) }))
      .filter((o) => o.prices.length > 0);

    const levelPrices = visible.flatMap((o) => o.prices);
    let min = Math.min(candleMin, ...levelPrices);
    let max = Math.max(candleMax, ...levelPrices);
    const span = max - min || candleSpan;
    min -= span * 0.06;
    max += span * 0.06;
    const y = (price: number) =>
      PAD_T + ((max - price) / (max - min)) * (H - PAD_T - PAD_B);
    const step = (W - PAD_L - PAD_R) / candles.length;
    const body = Math.max(1.2, step * 0.6);

    // Layout labels on the right so no two overlap, then draw leader lines back to their levels.
    const LABEL_H = 12;
    const LABEL_SPACING = 14;
    const labels: PlacedLabel[] = visible
      .map((o, idx) => {
        const tone = TONE[o.tone];
        const levelY = y((Math.max(...o.prices) + Math.min(...o.prices)) / 2);
        const value = fmt(
          o.prices.length > 1
            ? (Math.max(...o.prices) + Math.min(...o.prices)) / 2
            : o.prices[0]!,
        );
        return {
          key: `${o.label}-${idx}`,
          levelY,
          labelY: levelY,
          tone,
          dashed: o.tone === "support" || o.tone === "resistance",
          text: `${o.label} ${value}`,
          zoneTop: y(Math.max(...o.prices)),
          zoneBottom: y(Math.min(...o.prices)),
          zoneFill: tone.fill,
        };
      })
      .sort((a, b) => a.levelY - b.levelY);

    for (let i = 1; i < labels.length; i++) {
      const prev = labels[i - 1]!;
      const curr = labels[i]!;
      if (curr.labelY < prev.labelY + LABEL_SPACING) {
        curr.labelY = prev.labelY + LABEL_SPACING;
      }
    }
    labels.forEach((l) => {
      l.labelY = Math.max(
        PAD_T + LABEL_H / 2,
        Math.min(H - PAD_B - LABEL_H / 2, l.labelY),
      );
    });

    return { candles, y, step, body, min, max, visible, labels };

  }, [active, overlays]);

  if (!active || !geometry) return null;

  const { candles, y, step, body, visible } = geometry;


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
          {[0, 0.25, 0.5, 0.75, 1].map((t) => {
            const price = geometry.min + (geometry.max - geometry.min) * t;
            const gy = y(price);
            return (
              <g key={`grid-${t}`}>
                <line
                  x1={PAD_L}
                  x2={W - PAD_R}
                  y1={gy}
                  y2={gy}
                  stroke="var(--border)"
                  strokeWidth={0.6}
                />
                <text x={W - PAD_R + 5} y={gy - 3} fontSize={8.5} fill="var(--muted-foreground)">
                  {fmt(price)}
                </text>
              </g>
            );
          })}

          {visible.map((o, idx) => {
            const tone = TONE[o.tone];
            const top = y(Math.max(...o.prices));
            const bottom = y(Math.min(...o.prices));
            const height = Math.max(1, bottom - top);
            return (
              <g key={`zone-${o.label}-${idx}`}>
                {o.prices.length > 1 ? (
                  <rect
                    x={PAD_L}
                    y={top}
                    width={W - PAD_L - PAD_R}
                    height={height}
                    fill={tone.fill}
                  />
                ) : null}
              </g>
            );
          })}

          {
            // Layout labels on the right so no two overlap, then draw leader lines back to their levels.
            const LABEL_H = 12;
            const LABEL_SPACING = 14;
            const labels = visible
              .map((o, idx) => {
                const tone = TONE[o.tone];
                const levelY = y((Math.max(...o.prices) + Math.min(...o.prices)) / 2);
                const value = fmt(
                  o.prices.length > 1
                    ? (Math.max(...o.prices) + Math.min(...o.prices)) / 2
                    : o.prices[0]!,
                );
                return {
                  key: `${o.label}-${idx}`,
                  levelY,
                  labelY: levelY,
                  tone,
                  dashed: o.tone === "support" || o.tone === "resistance",
                  text: `${o.label} ${value}`,
                };
              })
              .sort((a, b) => a.levelY - b.levelY);

            // Push labels apart vertically so every one is readable.
            for (let i = 1; i < labels.length; i++) {
              const prev = labels[i - 1]!;
              const curr = labels[i]!;
              if (curr.labelY < prev.labelY + LABEL_SPACING) {
                curr.labelY = prev.labelY + LABEL_SPACING;
              }
            }
            // Clamp inside the chart area.
            labels.forEach((l) => {
              l.labelY = Math.max(
                PAD_T + LABEL_H / 2,
                Math.min(H - PAD_B - LABEL_H / 2, l.labelY),
              );
            });

            return labels.map((l) => (
              <g key={l.key}>
                <line
                  x1={PAD_L}
                  x2={W - PAD_R}
                  y1={l.levelY}
                  y2={l.levelY}
                  stroke={l.tone.stroke}
                  strokeWidth={1.2}
                  strokeDasharray={l.dashed ? "5 5" : "0"}
                />
                <line
                  x1={W - PAD_R}
                  x2={W - PAD_R + 3}
                  y1={l.levelY}
                  y2={l.labelY}
                  stroke={l.tone.stroke}
                  strokeWidth={0.8}
                />
                <text
                  x={W - PAD_R + 5}
                  y={l.labelY + 3.5}
                  fontSize={10}
                  fill={l.tone.stroke}
                >
                  {l.text}
                </text>
              </g>
            ));
          }



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
