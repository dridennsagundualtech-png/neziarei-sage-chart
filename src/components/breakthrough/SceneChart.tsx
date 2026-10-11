import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";

import { buildScene, type LineSpec, type SceneSpec } from "@/lib/breakthrough/scene";
import { TONE } from "./tone";

const W = 320;
const MAIN_H = 200;
const PANEL_H = 64;
const PAD = { top: 26, right: 8, bottom: 30, left: 8 };
const PROFILE_W = 64;
const FONT = 12.5;

const INK = "var(--color-foreground)";
/** Outline drawn behind label text so it stays readable over candles. */
const HALO = {
  stroke: "var(--color-elevated)",
  strokeWidth: 4,
  paintOrder: "stroke" as const,
  strokeLinejoin: "round" as const,
};
const SOFT = "var(--color-muted-foreground)";

function path(points: ([number, number] | null)[]) {
  let d = "";
  let pen = false;
  for (const p of points) {
    if (!p) {
      pen = false;
      continue;
    }
    d += `${pen ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`;
    pen = true;
  }
  return d;
}

/** Step-through candle illustration. */
export function SceneChart({ spec }: { spec: SceneSpec }) {
  const built = useMemo(() => buildScene(spec), [spec]);
  const { candles, index, series, panel } = built;
  const steps = spec.steps.length ? spec.steps : [{ upTo: candles.length - 1, text: "" }];
  const [step, setStep] = useState(0);
  const current = steps[Math.min(step, steps.length - 1)] ?? steps[0];
  const shown = index(current?.upTo, candles.length - 1);
  const last = step >= steps.length - 1;

  const n = candles.length;
  const plotRight = W - PAD.right - (spec.profile ? PROFILE_W + 6 : 0);
  const plotW = plotRight - PAD.left;
  const slot = plotW / Math.max(n, 1);
  const cx = (i: number) => PAD.left + slot * (i + 0.5);
  const totalH = MAIN_H + (panel ? PANEL_H : 0);

  // price domain: everything that can appear, so the scale never jumps between steps
  const ys: number[] = [];
  candles.forEach((c) => ys.push(c.h, c.l));
  spec.zones?.forEach((z) => ys.push(z.top, z.bottom));
  spec.lines?.forEach((l) => ys.push(l.y, l.y2 ?? l.y));
  spec.marks?.forEach((m) => ys.push(m.y));
  series.forEach((s) => s.values.forEach((v) => v !== null && ys.push(v)));
  spec.profile?.bins.forEach((b) => ys.push(b.top, b.bottom));
  const lo = Math.min(...ys);
  const hi = Math.max(...ys);
  const span = hi - lo || 1;
  const yMin = lo - span * 0.1;
  const yMax = hi + span * 0.12;
  const y = (v: number) => PAD.top + ((yMax - v) / (yMax - yMin)) * (MAIN_H - PAD.top - PAD.bottom);

  const visible = (ref: number | string | undefined, fallback: number) =>
    index(ref, fallback) <= shown;
  const rightEdge = (to: number | string | undefined) => {
    if (to === undefined) return shown === n - 1 ? plotRight : cx(shown) + slot / 2;
    return cx(Math.min(index(to, n - 1), shown)) + slot / 2;
  };

  const lineGeom = (l: LineSpec) => {
    if (l.y2 === undefined) {
      const x1 = l.from === undefined ? PAD.left : cx(index(l.from, 0)) - slot / 2;
      return { x1, x2: rightEdge(l.to), y1: y(l.y), y2: y(l.y) };
    }
    const a = index(l.from, 0);
    const b = index(l.to, n - 1);
    const end = Math.min(b, shown);
    const t = b === a ? 1 : (end - a) / (b - a);
    return { x1: cx(a), x2: cx(end), y1: y(l.y), y2: y(l.y + (l.y2 - l.y) * t) };
  };

  const anchor = (x: number): "start" | "middle" | "end" =>
    x < PAD.left + 34 ? "start" : x > plotRight - 34 ? "end" : "middle";

  return (
    <figure className="space-y-3">
      <svg
        viewBox={`0 0 ${W} ${totalH}`}
        className="block h-auto w-full"
        role="img"
        aria-label={current?.text || "Chart illustration"}
      >
        {/* zones */}
        {spec.zones?.map((z, i) => {
          const from = index(z.from, 0);
          if (!visible(z.appear ?? z.from, 0)) return null;
          const x1 = cx(from) - slot / 2;
          const x2 = rightEdge(z.to);
          const top = y(Math.max(z.top, z.bottom));
          const bottom = y(Math.min(z.top, z.bottom));
          const h = Math.max(bottom - top, 2);
          return (
            <g key={`z${i}`}>
              <rect
                x={x1}
                y={top}
                width={Math.max(x2 - x1, 2)}
                height={h}
                fill={TONE[z.tone]}
                fillOpacity={0.16}
                stroke={TONE[z.tone]}
                strokeOpacity={0.55}
                strokeDasharray="3 3"
                rx={3}
              />
            </g>
          );
        })}

        {/* lines */}
        {spec.lines?.map((l, i) => {
          if (!visible(l.appear ?? l.from, 0)) return null;
          const { x1, x2, y1, y2 } = lineGeom(l);
          const tone = TONE[l.tone ?? "muted"];
          return (
            <g key={`l${i}`}>
              <line
                x1={x1}
                x2={x2}
                y1={y1}
                y2={y2}
                stroke={tone}
                strokeWidth={1.4}
                strokeDasharray={l.dashed === false ? undefined : "4 3"}
              />
            </g>
          );
        })}

        {/* overlay series */}
        {series.map((s, i) => (
          <path
            key={`s${i}`}
            d={path(s.values.map((v, j) => (v === null || j > shown ? null : [cx(j), y(v)])))}
            fill="none"
            stroke={TONE[s.tone ?? "primary"]}
            strokeWidth={2}
            strokeDasharray={s.dashed ? "4 3" : undefined}
            strokeLinejoin="round"
          />
        ))}

        {/* candles */}
        {candles.map((c, i) => {
          if (i > shown) return null;
          const up = c.c >= c.o;
          const color = up ? TONE.bull : TONE.bear;
          const bw = Math.max(slot * 0.62, 2);
          const top = y(Math.max(c.o, c.c));
          const bh = Math.max(y(Math.min(c.o, c.c)) - top, 1.2);
          return (
            <g key={`c${i}`}>
              <line
                x1={cx(i)}
                x2={cx(i)}
                y1={y(c.h)}
                y2={y(c.l)}
                stroke={color}
                strokeWidth={1.3}
              />
              <rect x={cx(i) - bw / 2} y={top} width={bw} height={bh} fill={color} rx={1} />
            </g>
          );
        })}

        {/* volume profile */}
        {spec.profile &&
          (() => {
            const max = Math.max(...spec.profile.bins.map((b) => b.w), 1);
            const x0 = W - PAD.right;
            return spec.profile.bins.map((b, i) => {
              const top = y(Math.max(b.top, b.bottom));
              const h = Math.max(y(Math.min(b.top, b.bottom)) - top - 1, 1);
              const w = (b.w / max) * PROFILE_W;
              const poc = b.w === max;
              return (
                <rect
                  key={`p${i}`}
                  x={x0 - w}
                  y={top}
                  width={w}
                  height={h}
                  fill={poc ? TONE.primary : TONE.muted}
                  fillOpacity={poc ? 0.85 : 0.4}
                  rx={1}
                />
              );
            });
          })()}

        {/* zone and line labels sit above the candles */}
        {spec.zones?.map((z, i) => {
          if (!z.label || !visible(z.appear ?? z.from, 0)) return null;
          const x1 = cx(index(z.from, 0)) - slot / 2;
          const top = y(Math.max(z.top, z.bottom));
          const h = y(Math.min(z.top, z.bottom)) - top;
          return (
            <text
              key={`zl${i}`}
              x={x1 + Math.min(slot, 14) + 3}
              y={h >= 16 ? top + 13 : top - 4}
              fontSize={FONT}
              fontWeight={600}
              fill={INK}
              {...HALO}
            >
              {z.label}
            </text>
          );
        })}
        {spec.lines?.map((l, i) => {
          if (!l.label || !visible(l.appear ?? l.from, 0)) return null;
          const { x1, x2, y1, y2 } = lineGeom(l);
          const atStart = l.labelAt === "start";
          return (
            <text
              key={`ll${i}`}
              x={atStart ? x1 + 2 : x2 - 2}
              y={(atStart ? y1 : y2) - 5}
              fontSize={FONT}
              textAnchor={atStart ? "start" : "end"}
              fill={SOFT}
              {...HALO}
            >
              {l.label}
            </text>
          );
        })}

        {/* marks */}
        {spec.marks?.map((m, i) => {
          const at = index(m.at, 0);
          if (!visible(m.appear ?? m.at, 0)) return null;
          const x = cx(at);
          const yy = y(m.y);
          const tone = TONE[m.tone ?? "primary"];
          const a = anchor(x);
          if (m.dir === "up") {
            return (
              <g key={`m${i}`}>
                <path d={`M${x},${yy + 3} l-5,8 h10 z`} fill={tone} />
                <text
                  x={x}
                  y={yy + 25}
                  fontSize={FONT}
                  fontWeight={600}
                  textAnchor={a}
                  fill={INK}
                  {...HALO}
                >
                  {m.text}
                </text>
              </g>
            );
          }
          if (m.dir === "down") {
            return (
              <g key={`m${i}`}>
                <path d={`M${x},${yy - 3} l-5,-8 h10 z`} fill={tone} />
                <text
                  x={x}
                  y={yy - 15}
                  fontSize={FONT}
                  fontWeight={600}
                  textAnchor={a}
                  fill={INK}
                  {...HALO}
                >
                  {m.text}
                </text>
              </g>
            );
          }
          return (
            <g key={`m${i}`}>
              <circle cx={x} cy={yy} r={3.5} fill={tone} />
              <text
                x={x}
                y={yy - 8}
                fontSize={FONT}
                fontWeight={600}
                textAnchor={a}
                fill={INK}
                {...HALO}
              >
                {m.text}
              </text>
            </g>
          );
        })}

        {/* lower panel */}
        {panel &&
          (() => {
            const top = MAIN_H + 4;
            const bottom = totalH - 4;
            const vals: number[] = [];
            panel.series.forEach((s) => s.values.forEach((v) => v !== null && vals.push(v)));
            panel.levels?.forEach((v) => vals.push(v));
            if (panel.kind !== "line") vals.push(0);
            const [pMin, pMax] = panel.domain ?? [Math.min(...vals), Math.max(...vals)];
            const py = (v: number) => bottom - ((v - pMin) / (pMax - pMin || 1)) * (bottom - top);
            return (
              <g>
                <line
                  x1={PAD.left}
                  x2={plotRight}
                  y1={MAIN_H}
                  y2={MAIN_H}
                  stroke="var(--color-border)"
                />
                <text x={PAD.left} y={top + 12} fontSize={FONT} fill={SOFT}>
                  {panel.name}
                </text>
                {panel.levels?.map((lv) => (
                  <g key={`lv${lv}`}>
                    <line
                      x1={PAD.left}
                      x2={plotRight}
                      y1={py(lv)}
                      y2={py(lv)}
                      stroke="var(--color-border)"
                      strokeDasharray="3 3"
                    />
                    <text
                      x={plotRight - 2}
                      y={py(lv) - 3}
                      fontSize={FONT}
                      textAnchor="end"
                      fill={SOFT}
                    >
                      {lv}
                    </text>
                  </g>
                ))}
                {panel.series.map((s, si) =>
                  panel.kind !== "line" && si === 0 ? null : (
                    <path
                      key={`ps${si}`}
                      d={path(
                        s.values.map((v, j) => (v === null || j > shown ? null : [cx(j), py(v)])),
                      )}
                      fill="none"
                      stroke={TONE[s.tone ?? "primary"]}
                      strokeWidth={2}
                      strokeDasharray={s.dashed ? "4 3" : undefined}
                    />
                  ),
                )}
                {panel.kind !== "line" &&
                  panel.series[0]?.values.map((v, j) => {
                    if (v === null || j > shown) return null;
                    const c = candles[j];
                    const tone =
                      panel.kind === "hist"
                        ? v >= 0
                          ? TONE.bull
                          : TONE.bear
                        : c && c.c >= c.o
                          ? TONE.bull
                          : TONE.bear;
                    const y0 = py(Math.max(0, pMin));
                    const y1 = py(v);
                    return (
                      <rect
                        key={`pb${j}`}
                        x={cx(j) - Math.max(slot * 0.31, 1)}
                        y={Math.min(y0, y1)}
                        width={Math.max(slot * 0.62, 2)}
                        height={Math.max(Math.abs(y1 - y0), 1)}
                        fill={tone}
                        fillOpacity={0.6}
                      />
                    );
                  })}
              </g>
            );
          })()}
      </svg>

      {(series.some((s) => s.name) || (panel && panel.series.some((s) => s.name))) && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted-foreground">
          {[...series, ...(panel?.series ?? [])]
            .filter((s) => s.name)
            .map((s) => (
              <span key={s.name} className="inline-flex items-center gap-1.5">
                <span
                  className="inline-block h-0.5 w-4 rounded-full"
                  style={{ background: TONE[s.tone ?? "primary"] }}
                  aria-hidden
                />
                {s.name}
              </span>
            ))}
        </div>
      )}

      {current?.text && (
        <figcaption aria-live="polite" className="text-[15px] leading-relaxed text-foreground">
          {current.text}
        </figcaption>
      )}

      {steps.length > 1 && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            aria-label="Previous step"
            className="grid size-11 shrink-0 place-items-center rounded-xl border border-border text-foreground disabled:opacity-40"
          >
            <ChevronLeft className="size-5" />
          </button>
          <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
            <span className="text-[13px] tabular-nums text-muted-foreground">
              Step {step + 1} of {steps.length}
            </span>
            <span className="flex gap-1.5" aria-hidden>
              {steps.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${i === step ? "w-5 bg-foreground" : "w-1.5 bg-border"}`}
                />
              ))}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setStep((s) => (last ? 0 : s + 1))}
            className="flex h-11 shrink-0 items-center gap-1 rounded-xl border border-border px-4 text-[15px] font-semibold text-foreground"
          >
            {last ? (
              <>
                <RotateCcw className="size-4" /> Replay
              </>
            ) : (
              <>
                Next <ChevronRight className="size-4" />
              </>
            )}
          </button>
        </div>
      )}
    </figure>
  );
}
