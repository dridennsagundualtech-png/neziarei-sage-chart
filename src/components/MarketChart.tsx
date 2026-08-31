import { useEffect, useMemo, useRef, useState } from "react";
import { Maximize, Minus, Plus, ShieldAlert, Target } from "lucide-react";

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
  dash: string;
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

/** Colour per checklist concept so the drawn zone and the legend always match. */
const MARKER_TOKEN: Record<string, string> = {
  htf_structure: "--primary",
  support_resistance: "--bull",
  liquidity: "--warn",
  amd: "--warn",
  liquidity_sweep: "--bear",
  mss_bos: "--primary",
  displacement: "--bull",
  fvg: "--warn",
  volume: "--muted-foreground",
  risk_reward: "--primary",
  choch: "--bear",
  order_block: "--bull",
  breaker_block: "--warn",
  fibonacci: "--muted-foreground",
};

const markerToken = (key: string) => MARKER_TOKEN[key] ?? "--primary";

type MarkerBox = {
  key: string;
  label: string;
  note: string;
  x: number;
  width: number;
  top: number;
  bottom: number;
  token: string;
};


const MIN_ZOOM = 1;
const MAX_ZOOM = 6;

export function MarketChart({ result }: { result: MarketAnalysis }) {
  const series: MarketSeries[] = result.series ?? [];
  const [tf, setTf] = useState<string>(series[0]?.timeframe ?? "");
  const [activeMarker, setActiveMarker] = useState<string>("");
  const [srView, setSrView] = useState<"both" | "support" | "resistance">("both");
  const active = series.find((s) => s.timeframe === tf) ?? series[0];

  // Zoom / pan state: the whole SVG (candles, text, markers) scales together.
  const viewportRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const viewRef = useRef({ zoom: 1, offset: { x: 0, y: 0 } });
  viewRef.current = { zoom, offset };

  const applyZoomAt = (nextZoomRaw: number, px: number, py: number) => {
    const { zoom: z, offset: off } = viewRef.current;
    const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, nextZoomRaw));
    const k = next / z;
    const nextOff =
      next <= MIN_ZOOM
        ? { x: 0, y: 0 }
        : { x: px - (px - off.x) * k, y: py - (py - off.y) * k };
    setZoom(next);
    setOffset(nextOff);
  };

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
      const { zoom: z } = viewRef.current;
      const next = z * Math.exp(-dy * 0.0015);
      applyZoomAt(next, e.clientX - rect.left, e.clientY - rect.top);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dragRef = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = { x: e.clientX, y: e.clientY, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    if (!drag.moved && Math.abs(dx) + Math.abs(dy) < 3) return;
    drag.moved = true;
    drag.x = e.clientX;
    drag.y = e.clientY;
    setOffset((o) => ({ x: o.x + dx, y: o.y + dy }));
  };
  const onPointerUp = () => {
    dragRef.current = null;
  };

  const zoomButton = (factor: number) => {
    const rect = viewportRef.current?.getBoundingClientRect();
    const px = rect ? rect.width / 2 : 0;
    const py = rect ? rect.height / 2 : 0;
    applyZoomAt(viewRef.current.zoom * factor, px, py);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const resetView = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  // Reset the view when switching timeframe tabs.
  useEffect(() => {
    resetView();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tf]);

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
    if (srView !== "support") {
      result.resistance_levels
        .slice(0, 3)
        .forEach((level, i) => push(`R${i + 1}`, level, "resistance"));
    }
    if (srView !== "resistance") {
      result.support_levels.slice(0, 3).forEach((level, i) => push(`S${i + 1}`, level, "support"));
    }
    return list;
  }, [result, srView]);

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
          dash: o.tone === "resistance" ? "8 4" : o.tone === "support" ? "2 4" : "0",
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

    // Checklist concepts (FVG, sweep, AMD…) drawn where the model located them.
    // Only the marker picked in the dropdown is drawn, so nothing overlaps.
    const tfMarkers = (result.markers ?? [])
      .map((m, i) => ({ ...m, id: `${m.key}-${i}` }))
      .filter(
        (m) =>
          m.id === activeMarker &&
          m.timeframe.toUpperCase() === (active?.timeframe ?? "").toUpperCase(),
      );
    const indexForTime = (time: string | null): number | null => {
      if (!time) return null;
      const stamp = time.slice(0, 16);
      const exact = candles.findIndex((c) => c.time.slice(0, 16) === stamp);
      if (exact >= 0) return exact;
      const day = time.slice(0, 10);
      const loose = candles.findIndex((c) => c.time.slice(0, 10) === day);
      return loose >= 0 ? loose : null;
    };
    const markerBoxes: MarkerBox[] = tfMarkers
      .map((m) => {
        const high = m.price_high ?? m.price_low;
        const low = m.price_low ?? m.price_high;
        if (high === null || low === null) return null;
        if (!inRange(high) && !inRange(low)) return null;
        const from = indexForTime(m.time_from);
        const to = indexForTime(m.time_to);
        const startIdx = from ?? (to !== null ? Math.max(0, to - 6) : null);
        const endIdx = to ?? (from !== null ? Math.min(candles.length - 1, from + 6) : null);
        const x =
          startIdx !== null ? PAD_L + Math.min(startIdx, endIdx ?? startIdx) * step : PAD_L;
        const rightIdx = endIdx !== null ? Math.max(endIdx, startIdx ?? endIdx) + 1 : null;
        const width =
          rightIdx !== null
            ? Math.max(step * 1.5, rightIdx * step + PAD_L - x)
            : W - PAD_L - PAD_R;
        const top = y(Math.max(high, low));
        const bottom = y(Math.min(high, low));
        return {
          key: m.id,
          label: m.label || m.key,
          note: m.note,
          x,
          width: Math.min(width, W - PAD_R - x),
          top,
          bottom: Math.max(bottom, top + 2),
          token: markerToken(m.key),
        } satisfies MarkerBox;
      })
      .filter((box): box is MarkerBox => box !== null);

    return { candles, y, step, body, min, max, visible, labels, markerBoxes };

  }, [active, overlays, result.markers, activeMarker]);

  if (!active || !geometry) return null;

  const { candles, y, step, body, visible, labels, markerBoxes } = geometry;
  const legend = (result.markers ?? [])
    .map((m, i) => ({ ...m, id: `${m.key}-${i}` }))
    .filter((m) => m.price_high !== null || m.price_low !== null);




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

          {labels.map((l) => (
            <g key={l.key}>
              <line
                x1={PAD_L}
                x2={W - PAD_R}
                y1={l.levelY}
                y2={l.levelY}
                stroke={l.tone.stroke}
                strokeWidth={1.2}
                strokeDasharray={l.dash}
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
          ))}




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

          {markerBoxes.map((m, idx) => {
              const stroke = `color-mix(in oklch, var(${m.token}) 85%, transparent)`;
              const labelY = Math.max(PAD_T + 9, m.top - 3);
              return (
                <g key={`marker-${m.key}-${idx}`}>
                  <rect
                    x={m.x}
                    y={m.top}
                    width={Math.max(6, m.width)}
                    height={Math.max(3, m.bottom - m.top)}
                    fill={`color-mix(in oklch, var(${m.token}) 18%, transparent)`}
                    stroke={stroke}
                    strokeWidth={0.9}
                    strokeDasharray="4 3"
                    rx={2}
                  />
                  <text x={m.x + 2} y={labelY} fontSize={9} fontWeight={600} fill={stroke}>
                    {m.label}
                  </text>
                </g>
              );
            })}
        </svg>
      </div>

      <div className="mt-3 rounded-2xl border border-border bg-elevated p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold">Support &amp; resistance</p>
          <div className="flex gap-1.5">
            {(["both", "resistance", "support"] as const).map((view) => (
              <button
                key={view}
                type="button"
                onClick={() => setSrView(view)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[11px] capitalize transition-colors",
                  srView === view
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border text-muted-foreground",
                )}
              >
                {view}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <div>
            <p className="flex items-center gap-1.5 text-[11px] font-semibold text-bear">
              <span
                className="inline-block h-0 w-6 border-t-2 border-dashed"
                style={{ borderColor: TONE.resistance.stroke }}
              />
              Resistance (above price)
            </p>
            <ul className="mt-1.5 space-y-1 text-[11px] leading-relaxed">
              {result.resistance_levels.length ? (
                result.resistance_levels.slice(0, 6).map((level, i) => (
                  <li key={`r-${i}`}>
                    <span className="font-semibold">R{i + 1}</span> {level}
                  </li>
                ))
              ) : (
                <li className="text-muted-foreground">None identifiable.</li>
              )}
            </ul>
          </div>
          <div>
            <p className="flex items-center gap-1.5 text-[11px] font-semibold text-bull">
              <span
                className="inline-block h-0 w-6 border-t-2 border-dotted"
                style={{ borderColor: TONE.support.stroke }}
              />
              Support (below price)
            </p>
            <ul className="mt-1.5 space-y-1 text-[11px] leading-relaxed">
              {result.support_levels.length ? (
                result.support_levels.slice(0, 6).map((level, i) => (
                  <li key={`s-${i}`}>
                    <span className="font-semibold">S{i + 1}</span> {level}
                  </li>
                ))
              ) : (
                <li className="text-muted-foreground">None identifiable.</li>
              )}
            </ul>
          </div>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Resistance is drawn as long dashes, support as fine dots — use the toggle to view either
          side on its own.
        </p>
      </div>

      {legend.length > 0 && (
        <div className="mt-3 rounded-2xl border border-border bg-elevated p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold">Where each checklist concept sits</p>
            <select
              value={activeMarker}
              onChange={(e) => setActiveMarker(e.target.value)}
              className="rounded-full border border-border bg-elevated px-2.5 py-1 text-[11px] text-foreground"
              aria-label="Show a single marker on the chart"
            >
              <option value="">No marker</option>
              {legend.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label || m.key} · {m.timeframe}
                </option>
              ))}
            </select>
          </div>
          <ul className="mt-2 space-y-1.5">
            {legend.map((m) => (
              <li key={`legend-${m.id}`}>
                <button
                  type="button"
                  onClick={() => setActiveMarker((cur) => (cur === m.id ? "" : m.id))}
                  className={cn(
                    "flex w-full gap-2 rounded-lg px-1.5 py-1 text-left text-[11px] leading-relaxed transition-colors",
                    activeMarker === m.id ? "bg-primary/10" : "hover:bg-primary/5",
                  )}
                >
                  <span
                    className="mt-1 size-2.5 shrink-0 rounded-sm"
                    style={{
                      backgroundColor: `color-mix(in oklch, var(${markerToken(m.key)}) 70%, transparent)`,
                    }}
                  />
                  <span>
                    <span className="font-semibold">{m.label || m.key}</span>{" "}
                    <span className="text-muted-foreground">
                      · {m.timeframe} ·{" "}
                      {m.price_low !== null && m.price_high !== null && m.price_low !== m.price_high
                        ? `${fmt(m.price_low)}–${fmt(m.price_high)}`
                        : fmt((m.price_high ?? m.price_low) as number)}
                    </span>
                    {m.note ? <span className="text-muted-foreground"> — {m.note}</span> : null}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Pick a concept from the dropdown (or tap a row) to draw just that one on the chart —
            markers only draw on the timeframe they were found on, so switch tabs above if it
            doesn't appear.
          </p>
        </div>
      )}


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
