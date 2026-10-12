import { useEffect, useMemo, useRef, useState } from "react";
import { Maximize, Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ChecklistMarker, MarketAnalysis, MarketSeries } from "@/lib/market-types";
import { timeframeMinutes } from "@/lib/freshness";
import { cn } from "@/lib/utils";

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

const tint = (token: string, pct: number) =>
  `color-mix(in oklch, var(${token}) ${pct}%, transparent)`;

/**
 * Concept colours. Green and red are kept for candles and for the plan's reward
 * and risk, so a coloured shape never reads as a win or a loss.
 */
const CONCEPT: Record<string, string> = {
  liquidity: "--chart-4",
  liquidity_sweep: "--warn",
  mss_bos: "--foreground",
  choch: "--foreground",
  fvg: "--chart-5",
  order_block: "--chart-4",
  breaker_block: "--neutralstate",
  displacement: "--foreground",
  amd: "--neutralstate",
  fibonacci: "--neutralstate",
  support_resistance: "--muted-foreground",
  htf_structure: "--neutralstate",
};
const conceptToken = (key: string) => CONCEPT[key] ?? "--neutralstate";

/** How each concept is drawn. */
type Shape = "zone" | "range" | "level" | "sweep" | "break" | "candle" | "dealing";
const SHAPE: Record<string, Shape> = {
  fvg: "zone",
  order_block: "zone",
  breaker_block: "zone",
  amd: "range",
  fibonacci: "dealing",
  liquidity: "level",
  support_resistance: "level",
  liquidity_sweep: "sweep",
  mss_bos: "break",
  choch: "break",
  displacement: "candle",
};

/** Levels that frame the setup rather than events in its sequence (drawn without a number). */
const CONTEXT = new Set(["liquidity", "fibonacci", "htf_structure", "volume", "risk_reward"]);

type Step = ChecklistMarker & { id: string; n: number | null };

const MIN_ZOOM = 1;
const MAX_ZOOM = 6;
const FONT = 11;

export function MarketChart({ result }: { result: MarketAnalysis }) {
  const series: MarketSeries[] = result.series ?? [];

  // Every located concept, numbered in the order it happened on the chart.
  // Events (sweep, break, gap…) are numbered in the order they happened; levels
  // that frame them (liquidity, equilibrium) are drawn without a number.
  // Support and resistance have their own toggle, so they are not repeated here.
  const steps = useMemo<Step[]>(() => {
    const list = (result.markers ?? [])
      .map((m, i) => ({ ...m, id: `${m.key}-${i}` }))
      .filter((m) => m.key !== "support_resistance")
      .filter((m) => m.price_high !== null || m.price_low !== null);
    const isEvent = (m: ChecklistMarker) =>
      !CONTEXT.has(m.key) && (m.time_from !== null || m.time_to !== null);
    const when = (m: ChecklistMarker) => m.time_from ?? m.time_to ?? "";
    const events = list
      .filter(isEvent)
      .sort((a, b) => (when(a) < when(b) ? -1 : when(a) > when(b) ? 1 : 0))
      .map((m, i) => ({ ...m, n: i + 1 }));
    return [...events, ...list.filter((m) => !isEvent(m)).map((m) => ({ ...m, n: null }))];
  }, [result.markers]);

  const defaultTf =
    series.find((s) => s.timeframe === result.primary_timeframe)?.timeframe ??
    series[series.length - 1]?.timeframe ??
    "";
  const [tf, setTf] = useState(defaultTf);
  const [focus, setFocus] = useState<string | null>(null);
  const [showPlan, setShowPlan] = useState(true);
  const [showSteps, setShowSteps] = useState(true);
  const [showLevels, setShowLevels] = useState(false);
  const [allCandles, setAllCandles] = useState(false);
  const active = series.find((s) => s.timeframe === tf) ?? series[series.length - 1];

  // Draw at the real on-screen width so text stays readable on a phone.
  const viewportRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  useEffect(() => {
    const el = viewportRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(Math.round(entry.contentRect.width));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const W = Math.max(300, width);
  const H = W < 480 ? 320 : 400;

  // Zoom / pan: the whole drawing scales together.
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const viewRef = useRef({ zoom: 1, offset: { x: 0, y: 0 } });
  viewRef.current = { zoom, offset };
  const applyZoomAt = (nextZoomRaw: number, px: number, py: number) => {
    const { zoom: z, offset: off } = viewRef.current;
    const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, nextZoomRaw));
    const k = next / z;
    setZoom(next);
    setOffset(
      next <= MIN_ZOOM ? { x: 0, y: 0 } : { x: px - (px - off.x) * k, y: py - (py - off.y) * k },
    );
  };
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
      applyZoomAt(
        viewRef.current.zoom * Math.exp(-dy * 0.0015),
        e.clientX - rect.left,
        e.clientY - rect.top,
      );
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);
  const dragRef = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const pinchRef = useRef<number | null>(null);
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointersRef.current.size === 2) {
      const [a, b] = [...pointersRef.current.values()];
      pinchRef.current = Math.hypot(a!.x - b!.x, a!.y - b!.y) || 1;
      dragRef.current = null;
      return;
    }
    dragRef.current = { x: e.clientX, y: e.clientY, moved: false };
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointersRef.current.has(e.pointerId)) return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointersRef.current.size === 2 && pinchRef.current !== null) {
      const el = viewportRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const [a, b] = [...pointersRef.current.values()];
      const dist = Math.hypot(a!.x - b!.x, a!.y - b!.y) || 1;
      applyZoomAt(
        viewRef.current.zoom * (dist / pinchRef.current),
        (a!.x + b!.x) / 2 - rect.left,
        (a!.y + b!.y) / 2 - rect.top,
      );
      pinchRef.current = dist;
      return;
    }
    const drag = dragRef.current;
    if (!drag || viewRef.current.zoom <= MIN_ZOOM) return;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    if (!drag.moved && Math.abs(dx) + Math.abs(dy) < 3) return;
    drag.moved = true;
    drag.x = e.clientX;
    drag.y = e.clientY;
    setOffset((o) => ({ x: o.x + dx, y: o.y + dy }));
  };
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size < 2) pinchRef.current = null;
    if (pointersRef.current.size === 0) dragRef.current = null;
  };
  const zoomButton = (factor: number) => {
    const rect = viewportRef.current?.getBoundingClientRect();
    applyZoomAt(viewRef.current.zoom * factor, (rect?.width ?? 0) / 2, (rect?.height ?? 0) / 2);
  };
  const resetView = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };
  useEffect(resetView, [tf, allCandles]);

  const directional =
    result.direction === "POTENTIAL LONG" || result.direction === "POTENTIAL SHORT";
  const long = result.direction === "POTENTIAL LONG";

  const geometry = useMemo(() => {
    const all = active?.candles ?? [];
    if (!all.length) return null;

    const tfSteps = steps.filter(
      (m) => m.timeframe.toUpperCase() === (active?.timeframe ?? "").toUpperCase(),
    );
    const indexForTime = (time: string | null): number | null => {
      if (!time) return null;
      const stamp = time.slice(0, 16);
      const exact = all.findIndex((c) => c.time.slice(0, 16) === stamp);
      if (exact >= 0) return exact;
      const t = new Date(time).getTime();
      const after = all.findIndex((c) => new Date(c.time).getTime() >= t);
      return after >= 0 ? after : null;
    };

    // Recent candles by default; reach back far enough to include every located concept.
    let start = allCandles ? 0 : Math.max(0, all.length - (W < 480 ? 64 : 110));
    if (showSteps) {
      for (const m of tfSteps) {
        const i = indexForTime(m.time_from);
        if (i !== null) start = Math.min(start, Math.max(0, i - 4));
      }
    }
    const candles = all.slice(start);
    const last = candles[candles.length - 1]!;

    const plan = (() => {
      if (!directional || !showPlan) return null;
      const entry = pricesIn(result.entry_zone);
      const stop = pricesIn(result.stop_loss)[0];
      const tp1 = pricesIn(result.tp1)[0];
      const tp2 = pricesIn(result.tp2)[0] ?? null;
      if (!entry.length || stop === undefined || tp1 === undefined) return null;
      const mid = (Math.max(...entry) + Math.min(...entry)) / 2;
      const risk = Math.abs(mid - stop);
      return {
        entryTop: Math.max(...entry),
        entryBottom: Math.min(...entry),
        entry: mid,
        stop,
        tp1,
        tp2,
        r1: risk > 0 ? Math.abs(tp1 - mid) / risk : null,
        r2: risk > 0 && tp2 !== null ? Math.abs(tp2 - mid) / risk : null,
      };
    })();

    const levelLines = showLevels
      ? [
          ...result.resistance_levels
            .slice(0, 3)
            .map((l, i) => ({ label: `R${i + 1}`, price: pricesIn(l)[0] })),
          ...result.support_levels
            .slice(0, 3)
            .map((l, i) => ({ label: `S${i + 1}`, price: pricesIn(l)[0] })),
        ].filter((l): l is { label: string; price: number } => typeof l.price === "number")
      : [];

    // Price scale: candles, plus anything drawn that plausibly belongs on this chart.
    const lows = candles.map((c) => c.low);
    const highs = candles.map((c) => c.high);
    const cMin = Math.min(...lows);
    const cMax = Math.max(...highs);
    const cSpan = cMax - cMin || Math.abs(cMax) * 0.01 || 1;
    const inRange = (p: number) => p >= cMin - cSpan * 1.5 && p <= cMax + cSpan * 1.5;
    const extra = [
      ...(plan ? [plan.entryTop, plan.entryBottom, plan.stop, plan.tp1, plan.tp2 ?? plan.tp1] : []),
      ...levelLines.map((l) => l.price),
      ...(showSteps
        ? tfSteps.flatMap((m) => [m.price_high, m.price_low]).filter((p): p is number => p !== null)
        : []),
    ].filter(inRange);
    let min = Math.min(cMin, ...extra);
    let max = Math.max(cMax, ...extra);
    const pad = (max - min || cSpan) * 0.06;
    min -= pad;
    max += pad;

    const AXIS = W < 480 ? 58 : 66;
    const PAD_T = 10;
    const PAD_B = 22;
    const plotRight = W - AXIS;
    // Space to the right of the last candle for the plan, like a position tool.
    const future = plan ? Math.round((plotRight - 4) * 0.2) : 8;
    const step = (plotRight - 4 - future) / candles.length;
    const body = Math.max(1.4, step * 0.62);
    const y = (price: number) => PAD_T + ((max - price) / (max - min)) * (H - PAD_T - PAD_B);
    const xAt = (i: number) => 4 + i * step + step / 2;
    const local = (time: string | null) => {
      const i = indexForTime(time);
      return i === null ? null : i - start;
    };

    return {
      candles,
      last,
      plan,
      levelLines,
      tfSteps,
      y,
      xAt,
      step,
      body,
      min,
      max,
      AXIS,
      PAD_B,
      plotRight,
      future,
      local,
      inRange,
    };
  }, [active, steps, allCandles, showSteps, showPlan, showLevels, directional, result, W, H]);

  if (!active || !geometry) return null;
  const g = geometry;
  const offTf = steps.filter((m) => !g.tfSteps.includes(m));
  const focused = focus ? steps.find((m) => m.id === focus) : null;

  // Time ticks: a handful of evenly spaced candle times along the bottom.
  const intraday = timeframeMinutes(active.timeframe) < 1440;
  const ticks = (W < 480 ? [0.15, 0.5, 0.85] : [0.1, 0.35, 0.6, 0.85])
    .map((t) => Math.min(g.candles.length - 1, Math.round(t * (g.candles.length - 1))))
    .filter((i, idx, arr) => arr.indexOf(i) === idx);

  /** A price pill in the right-hand axis column. */
  const pill = (price: number, fill: string, text: string, key: string) => (
    <g key={key}>
      <rect
        x={g.plotRight + 2}
        y={g.y(price) - 8}
        width={g.AXIS - 4}
        height={16}
        rx={4}
        fill={fill}
      />
      <text
        x={g.plotRight + g.AXIS / 2}
        y={g.y(price) + 4}
        textAnchor="middle"
        fontSize={FONT - 0.5}
        fontWeight={600}
        fill={text}
      >
        {fmt(price)}
      </text>
    </g>
  );

  // Pins already placed this render, so two numbers never sit on top of each other.
  const placed: { x: number; y: number }[] = [];

  /** Draws one located concept in its own shape, with its step number. */
  const drawStep = (m: Step) => {
    const shape = SHAPE[m.key] ?? "level";
    const token = conceptToken(m.key);
    const stroke = `var(${token})`;
    const dim = focus !== null && focus !== m.id;
    const width = focus === m.id ? 2 : 1.2;
    const high = m.price_high ?? m.price_low!;
    const low = m.price_low ?? m.price_high!;
    if (!g.inRange(high) && !g.inRange(low)) return null;
    const top = g.y(Math.max(high, low));
    const bottom = g.y(Math.min(high, low));
    const from = g.local(m.time_from);
    const to = g.local(m.time_to);
    const right = g.plotRight - 2;
    let pinX = 10;
    let pinY = top;
    let body: React.ReactNode = null;

    if (shape === "zone") {
      // Gaps and blocks stay live until filled, so they extend to the right edge.
      const x0 = from !== null ? g.xAt(from) - g.step / 2 : 4;
      body = (
        <rect
          x={x0}
          y={top}
          width={Math.max(4, right - x0)}
          height={Math.max(3, bottom - top)}
          fill={tint(token, 16)}
          stroke={stroke}
          strokeWidth={width}
          rx={2}
        />
      );
      pinX = x0 + 9;
      pinY = top;
    } else if (shape === "range") {
      const x0 = from !== null ? g.xAt(from) - g.step / 2 : 4;
      const x1 = to !== null ? g.xAt(to) + g.step / 2 : x0 + g.step * 8;
      body = (
        <rect
          x={x0}
          y={top}
          width={Math.max(4, x1 - x0)}
          height={Math.max(3, bottom - top)}
          fill={tint(token, 10)}
          stroke={stroke}
          strokeWidth={width}
          strokeDasharray="5 4"
          rx={2}
        />
      );
      pinX = x0 + 9;
    } else if (shape === "dealing") {
      // Dealing range: equilibrium line with premium above and discount below.
      const eq = g.y((high + low) / 2);
      body = (
        <g>
          <line
            x1={4}
            x2={right}
            y1={eq}
            y2={eq}
            stroke={stroke}
            strokeWidth={width}
            strokeDasharray="2 4"
          />
          <text x={right - 4} y={eq - 5} textAnchor="end" fontSize={FONT - 1} fill={stroke}>
            Premium
          </text>
          <text x={right - 4} y={eq + 13} textAnchor="end" fontSize={FONT - 1} fill={stroke}>
            Discount
          </text>
        </g>
      );
      pinX = 14;
      pinY = eq;
    } else if (shape === "sweep" && from !== null) {
      // The swept level, ending at the candle whose wick took it, with an arrow at that wick.
      const c = g.candles[from]!;
      const level = g.y(high);
      const x = g.xAt(from);
      const tookHigh = c.high > high && c.close < high;
      const tip = g.y(tookHigh ? c.high : c.low);
      // Outward from the wick: up for a swept high, down for a swept low.
      const out = tookHigh ? -1 : 1;
      body = (
        <g>
          <line
            x1={g.xAt(Math.max(0, from - 10))}
            x2={x + g.step}
            y1={level}
            y2={level}
            stroke={stroke}
            strokeWidth={width}
            strokeDasharray="4 3"
          />
          <path d={`M ${x} ${tip + out * 3} l -5 ${out * 8} l 10 0 z`} fill={stroke} />
        </g>
      );
      pinX = g.xAt(Math.max(0, from - 10));
      pinY = level;
    } else if (shape === "break" && from !== null) {
      // The broken swing level, drawn up to the candle that broke it.
      const level = g.y(high);
      const x0 = g.xAt(Math.max(0, from - 12));
      const x1 = g.xAt(from);
      body = (
        <g>
          <line x1={x0} x2={x1} y1={level} y2={level} stroke={stroke} strokeWidth={width + 0.4} />
          <text
            x={(x0 + x1) / 2}
            y={level - 5}
            textAnchor="middle"
            fontSize={FONT}
            fontWeight={700}
            fill={stroke}
          >
            {m.label}
          </text>
        </g>
      );
      pinX = x0;
      pinY = level;
    } else if (shape === "candle" && from !== null) {
      const x = g.xAt(from);
      body = (
        <rect
          x={x - g.step * 0.9}
          y={top - 3}
          width={g.step * 1.8}
          height={Math.max(6, bottom - top + 6)}
          fill="none"
          stroke={stroke}
          strokeWidth={width + 0.3}
          rx={3}
        />
      );
      pinX = x - g.step * 0.9;
      pinY = top - 3;
    } else {
      // Levels (liquidity, support/resistance): a dashed line across the chart.
      const level = g.y(high);
      body = (
        <g>
          <line
            x1={4}
            x2={right}
            y1={level}
            y2={level}
            stroke={stroke}
            strokeWidth={width}
            strokeDasharray="6 4"
          />
          <text x={m.n === null ? 8 : 24} y={level - 5} fontSize={FONT - 1} fill={stroke}>
            {m.label}
          </text>
        </g>
      );
      pinX = 12;
      pinY = level;
    }

    const anchorY = Math.max(10, pinY);
    let py = anchorY;
    if (m.n !== null) {
      for (let tries = 0; tries < 6; tries += 1) {
        if (!placed.some((p) => Math.abs(p.x - pinX) < 18 && Math.abs(p.y - py) < 18)) break;
        py += 19;
      }
      placed.push({ x: pinX, y: py });
    }

    return (
      <g
        key={m.id}
        opacity={dim ? 0.22 : 1}
        style={{ cursor: "pointer" }}
        onClick={() => setFocus((cur) => (cur === m.id ? null : m.id))}
      >
        {body}
        {m.n !== null && (
          <>
            {py !== anchorY && (
              <line x1={pinX} x2={pinX} y1={anchorY} y2={py} stroke={stroke} strokeWidth={1} />
            )}
            <circle cx={pinX} cy={py} r={8.5} fill={stroke} />
            <text
              x={pinX}
              y={py + 3.8}
              textAnchor="middle"
              fontSize={FONT - 1}
              fontWeight={700}
              fill="var(--background)"
            >
              {m.n}
            </text>
          </>
        )}
      </g>
    );
  };

  const plan = g.plan;
  const lastX = g.xAt(g.candles.length - 1) + g.step / 2 + 2;
  const planRight = g.plotRight - 2;

  return (
    <section className="card-soft">
      <div className="card-band justify-between">
        <h2 className="tracking-[inherit]">Chart</h2>
        <span className="flex gap-1">
          {series.map((s) => (
            <button
              key={s.timeframe}
              type="button"
              aria-pressed={s.timeframe === active.timeframe}
              onClick={() => setTf(s.timeframe)}
              className={cn(
                "h-8 rounded-lg px-2.5 text-xs font-semibold normal-case tracking-normal transition-colors",
                s.timeframe === active.timeframe
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {s.timeframe}
            </button>
          ))}
        </span>
      </div>

      <div className="space-y-3 p-3">
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              ["Trade plan", showPlan, setShowPlan, directional],
              ["Setup steps", showSteps, setShowSteps, steps.length > 0],
              ["Support & resistance", showLevels, setShowLevels, true],
              ["All candles", allCandles, setAllCandles, true],
            ] as const
          )
            .filter(([, , , available]) => available)
            .map(([label, on, set]) => (
              <Button
                key={label}
                type="button"
                size="sm"
                aria-pressed={on}
                variant={on ? "selected" : "secondary"}
                className="h-9 rounded-lg px-3"
                onClick={() => set(!on)}
              >
                {label}
              </Button>
            ))}
        </div>

        <div
          ref={viewportRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className={cn(
            "relative touch-pan-y select-none overflow-hidden rounded-xl border border-border bg-background",
            zoom > 1 && "cursor-grab touch-none active:cursor-grabbing",
          )}
        >
          <div
            className="absolute left-2 top-2 z-10 flex gap-1"
            onPointerDown={(e) => e.stopPropagation()}
          >
            {[
              { label: "Zoom in", icon: Plus, run: () => zoomButton(1.4), off: false },
              {
                label: "Zoom out",
                icon: Minus,
                run: () => zoomButton(1 / 1.4),
                off: zoom <= MIN_ZOOM,
              },
              { label: "Reset zoom", icon: Maximize, run: resetView, off: zoom <= MIN_ZOOM },
            ].map(({ label, icon: Icon, run, off }) => (
              <button
                key={label}
                type="button"
                onClick={run}
                disabled={off}
                aria-label={label}
                className="grid size-9 place-items-center rounded-lg border border-border bg-card/95 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
              >
                <Icon className="size-4" />
              </button>
            ))}
          </div>

          <div
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
              transformOrigin: "0 0",
            }}
          >
            <svg
              width={W}
              height={H}
              viewBox={`0 0 ${W} ${H}`}
              className="block"
              role="img"
              aria-label={`${result.symbol} ${active.timeframe}: ${g.candles.length} candles${plan ? `, ${long ? "long" : "short"} plan from ${fmt(plan.entry)} with stop ${fmt(plan.stop)} and first target ${fmt(plan.tp1)}` : ""}`}
            >
              {/* Price grid */}
              {[0.1, 0.3, 0.5, 0.7, 0.9].map((t) => {
                const price = g.min + (g.max - g.min) * t;
                const pills = [g.last.close, ...(plan ? [plan.stop, plan.tp1, plan.entry] : [])];
                const hidden = pills.some((p) => Math.abs(g.y(p) - g.y(price)) < 13);
                if (hidden) {
                  return (
                    <line
                      key={`grid-${t}`}
                      x1={4}
                      x2={g.plotRight}
                      y1={g.y(price)}
                      y2={g.y(price)}
                      stroke="var(--border)"
                      strokeWidth={0.7}
                    />
                  );
                }
                return (
                  <g key={`grid-${t}`}>
                    <line
                      x1={4}
                      x2={g.plotRight}
                      y1={g.y(price)}
                      y2={g.y(price)}
                      stroke="var(--border)"
                      strokeWidth={0.7}
                    />
                    <text
                      x={g.plotRight + g.AXIS / 2}
                      y={g.y(price) + 4}
                      textAnchor="middle"
                      fontSize={FONT - 1}
                      fill="var(--muted-foreground)"
                    >
                      {fmt(price)}
                    </text>
                  </g>
                );
              })}

              {/* Time ticks */}
              {ticks.map((i) => {
                const t = g.candles[i]!.time;
                return (
                  <text
                    key={`t-${i}`}
                    x={g.xAt(i)}
                    y={H - 7}
                    textAnchor="middle"
                    fontSize={FONT - 1}
                    fill="var(--muted-foreground)"
                  >
                    {intraday ? `${t.slice(5, 10)} ${t.slice(11, 16)}` : t.slice(0, 10)}
                  </text>
                );
              })}

              {/* Plan: risk and reward boxes projected forward, like a position tool */}
              {plan && (
                <g>
                  <rect
                    x={lastX}
                    y={Math.min(g.y(plan.entry), g.y(plan.stop))}
                    width={planRight - lastX}
                    height={Math.abs(g.y(plan.entry) - g.y(plan.stop))}
                    fill={tint("--bear", 22)}
                  />
                  <rect
                    x={lastX}
                    y={Math.min(g.y(plan.entry), g.y(plan.tp1))}
                    width={planRight - lastX}
                    height={Math.abs(g.y(plan.entry) - g.y(plan.tp1))}
                    fill={tint("--bull", 22)}
                  />
                  {plan.tp2 !== null && g.inRange(plan.tp2) && (
                    <rect
                      x={lastX}
                      y={Math.min(g.y(plan.tp1), g.y(plan.tp2))}
                      width={planRight - lastX}
                      height={Math.abs(g.y(plan.tp1) - g.y(plan.tp2))}
                      fill={tint("--bull", 10)}
                    />
                  )}
                  {plan.entryTop !== plan.entryBottom && (
                    <rect
                      x={4}
                      y={g.y(plan.entryTop)}
                      width={planRight - 4}
                      height={Math.max(2, g.y(plan.entryBottom) - g.y(plan.entryTop))}
                      fill={tint("--foreground", 8)}
                    />
                  )}
                  <line
                    x1={4}
                    x2={planRight}
                    y1={g.y(plan.entry)}
                    y2={g.y(plan.entry)}
                    stroke="var(--foreground)"
                    strokeWidth={1.2}
                    strokeDasharray="6 3"
                  />
                  <line
                    x1={lastX}
                    x2={planRight}
                    y1={g.y(plan.stop)}
                    y2={g.y(plan.stop)}
                    stroke="var(--bear)"
                    strokeWidth={1.4}
                  />
                  <line
                    x1={lastX}
                    x2={planRight}
                    y1={g.y(plan.tp1)}
                    y2={g.y(plan.tp1)}
                    stroke="var(--bull)"
                    strokeWidth={1.4}
                  />
                  {[
                    {
                      y: plan.tp1,
                      text: `TP1${plan.r1 ? ` · ${plan.r1.toFixed(1)}R` : ""}`,
                      fill: "var(--bull)",
                      below: !long,
                    },
                    ...(plan.tp2 !== null && g.inRange(plan.tp2)
                      ? [
                          {
                            y: plan.tp2,
                            text: `TP2${plan.r2 ? ` · ${plan.r2.toFixed(1)}R` : ""}`,
                            fill: "var(--bull)",
                            below: !long,
                          },
                        ]
                      : []),
                    { y: plan.entry, text: "Entry", fill: "var(--foreground)", below: long },
                    { y: plan.stop, text: "Stop · −1R", fill: "var(--bear)", below: long },
                  ].map((l) => (
                    <text
                      key={l.text}
                      x={lastX + 6}
                      y={g.y(l.y) + (l.below ? 14 : -5)}
                      fontSize={FONT}
                      fontWeight={700}
                      fill={l.fill}
                    >
                      {l.text}
                    </text>
                  ))}
                </g>
              )}

              {/* Support / resistance */}
              {g.levelLines
                .filter((l) => g.inRange(l.price))
                .map((l) => (
                  <g key={l.label}>
                    <line
                      x1={4}
                      x2={g.plotRight}
                      y1={g.y(l.price)}
                      y2={g.y(l.price)}
                      stroke="var(--muted-foreground)"
                      strokeWidth={1}
                      strokeDasharray={l.label.startsWith("R") ? "8 4" : "2 4"}
                    />
                    <text
                      x={g.plotRight - 4}
                      y={g.y(l.price) - 4}
                      textAnchor="end"
                      fontSize={FONT - 1}
                      fill="var(--muted-foreground)"
                    >
                      {l.label}
                    </text>
                  </g>
                ))}

              {/* Candles */}
              {g.candles.map((c, i) => {
                const x = g.xAt(i);
                const color = c.close >= c.open ? "var(--bull)" : "var(--bear)";
                const top = g.y(Math.max(c.open, c.close));
                const bottom = g.y(Math.min(c.open, c.close));
                return (
                  <g key={c.time + i}>
                    <line
                      x1={x}
                      x2={x}
                      y1={g.y(c.high)}
                      y2={g.y(c.low)}
                      stroke={color}
                      strokeWidth={1}
                    />
                    <rect
                      x={x - g.body / 2}
                      y={top}
                      width={g.body}
                      height={Math.max(1, bottom - top)}
                      fill={color}
                    />
                  </g>
                );
              })}

              {/* Setup steps */}
              {showSteps && g.tfSteps.map(drawStep)}

              {/* Current price */}
              <line
                x1={4}
                x2={g.plotRight}
                y1={g.y(g.last.close)}
                y2={g.y(g.last.close)}
                stroke="var(--foreground)"
                strokeWidth={0.8}
                strokeDasharray="1 3"
              />
              {plan && pill(plan.stop, "var(--bear)", "var(--bear-foreground)", "p-stop")}
              {plan && pill(plan.tp1, "var(--bull)", "var(--bull-foreground)", "p-tp1")}
              {plan && pill(plan.entry, "var(--secondary)", "var(--foreground)", "p-entry")}
              {pill(g.last.close, "var(--foreground)", "var(--background)", "p-now")}
            </svg>
          </div>
          {zoom > 1 && (
            <p className="pointer-events-none absolute bottom-7 left-2 z-10 rounded-md bg-card/95 px-2 py-0.5 text-xs text-muted-foreground">
              {zoom.toFixed(1)}×: drag to move, pinch or scroll to zoom
            </p>
          )}
        </div>

        {showSteps && steps.length > 0 && (
          <div className="space-y-3">
            {(
              [
                ["How the setup built up", steps.filter((m) => m.n !== null)],
                ["Levels to watch", steps.filter((m) => m.n === null)],
              ] as const
            )
              .filter(([, list]) => list.length > 0)
              .map(([title, list]) => (
                <div key={title}>
                  <p className="text-sm font-semibold">{title}</p>
                  <ol className="mt-1 divide-y divide-border">
                    {list.map((m) => {
                      const here = g.tfSteps.includes(m);
                      const price =
                        m.price_low !== null &&
                        m.price_high !== null &&
                        m.price_low !== m.price_high
                          ? `${fmt(m.price_low)}–${fmt(m.price_high)}`
                          : fmt((m.price_high ?? m.price_low) as number);
                      return (
                        <li key={m.id}>
                          <button
                            type="button"
                            aria-pressed={focus === m.id}
                            onClick={() => {
                              if (!here) setTf(m.timeframe);
                              setFocus((cur) => (cur === m.id ? null : m.id));
                            }}
                            className={cn(
                              "flex min-h-11 w-full items-start gap-3 rounded-lg px-1.5 py-2 text-left text-sm transition-colors",
                              focus === m.id ? "bg-elevated" : "hover:bg-elevated/60",
                            )}
                          >
                            {m.n !== null ? (
                              <span
                                className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-[11px] font-bold text-background"
                                style={{ background: `var(${conceptToken(m.key)})` }}
                              >
                                {m.n}
                              </span>
                            ) : (
                              <span
                                aria-hidden
                                className="mt-2.5 h-0 w-5 shrink-0 border-t-2 border-dashed"
                                style={{ borderColor: `var(${conceptToken(m.key)})` }}
                              />
                            )}
                            <span className="min-w-0">
                              <span className="font-semibold">{m.label || m.key}</span>{" "}
                              <span className="text-muted-foreground">
                                · {m.timeframe} · {price}
                                {here ? "" : " · tap to switch timeframe"}
                              </span>
                              {m.note && (
                                <span className="block text-xs text-muted-foreground">
                                  {m.note}
                                </span>
                              )}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              ))}
            {offTf.length > 0 && !focused && (
              <p className="text-xs text-muted-foreground">
                {offTf.length} item{offTf.length === 1 ? " is" : "s are"} on another timeframe: tap
                it to switch.
              </p>
            )}
          </div>
        )}

        {showLevels && (
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            {(
              [
                ["Resistance (above price)", result.resistance_levels, "R"],
                ["Support (below price)", result.support_levels, "S"],
              ] as const
            ).map(([title, list, prefix]) => (
              <div key={title}>
                <dt className="font-semibold">{title}</dt>
                {list.length ? (
                  list.slice(0, 6).map((level, i) => (
                    <dd key={level} className="text-muted-foreground">
                      <span className="font-semibold text-foreground">
                        {prefix}
                        {i + 1}
                      </span>{" "}
                      {level}
                    </dd>
                  ))
                ) : (
                  <dd className="text-muted-foreground">None identifiable.</dd>
                )}
              </div>
            ))}
          </dl>
        )}

        <p className="text-xs text-muted-foreground">
          Drawn from the candles in your market-data table, not a live feed or a prediction. The
          plan box shows risk (red) and reward to each target (green) from the last candle.
        </p>
      </div>
    </section>
  );
}
