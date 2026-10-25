import type { PlanLevels } from "@/components/PriceMapCard";
import {
  oddsText as odds,
  priceText as formatPrice,
  touchBefore,
  touchWithin,
  type PriceMap,
} from "@/lib/price-map";

const W = 360;
const H = 220;
const PAD = { top: 14, right: 40, bottom: 28, left: 6 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;
/** Recent closes take the left half; the next 5 trading days the right half. */
const RECENT_W = PLOT_W * 0.5;
const FUTURE_W = PLOT_W - RECENT_W;
const DAYS = 5;

/**
 * The price map drawn: the last closes, then the cone price usually closes in
 * over the next 5 trading days (half the time, 8 in 10), with the plan's
 * levels across it. Only day 1 and day 5 were checked against history; the
 * days between follow the √time spread between them.
 */
export function PriceMapChart({ map, plan }: { map: PriceMap; plan: PlanLevels }) {
  const { price, sigma } = map;
  const [day1, day5] = map.horizons;
  if (!day1 || !day5) return null;
  const recent = map.recent?.length ? map.recent : [price];

  // Band edges in volatility units at day 1 and day 5, eased linearly between.
  const unit = (level: number, days: number) => Math.log(level / price) / (sigma * Math.sqrt(days));
  const edges = {
    outerLow: [unit(day1.most.low, 1), unit(day5.most.low, DAYS)],
    innerLow: [unit(day1.half.low, 1), unit(day5.half.low, DAYS)],
    innerHigh: [unit(day1.half.high, 1), unit(day5.half.high, DAYS)],
    outerHigh: [unit(day1.most.high, 1), unit(day5.most.high, DAYS)],
  } as const;
  const at = (edge: readonly [number, number], t: number) => {
    const z = t <= 1 ? edge[0] : edge[0] + ((edge[1] - edge[0]) * (t - 1)) / (DAYS - 1);
    return price * Math.exp(z * sigma * Math.sqrt(t));
  };
  const steps = Array.from({ length: DAYS * 4 + 1 }, (_, i) => i / 4);

  const { entry, stop, tp1 } = plan;
  const levels =
    plan.valid && entry !== null && stop !== null && tp1 !== null
      ? [
          { key: "tp1", label: "TP1", value: tp1, className: "stroke-bull", dash: undefined },
          {
            key: "entry",
            label: "Entry",
            value: entry,
            className: "stroke-foreground",
            dash: "4 3",
          },
          { key: "stop", label: "Stop", value: stop, className: "stroke-bear", dash: "2 3" },
        ]
      : [];

  const values = [...recent, day5.most.low, day5.most.high, ...levels.map((l) => l.value)];
  const top = Math.max(...values);
  const bottom = Math.min(...values);
  const span = top - bottom || price * 0.01;
  const yMax = top + span * 0.06;
  const yMin = bottom - span * 0.06;
  const y = (v: number) => PAD.top + ((yMax - v) / (yMax - yMin)) * PLOT_H;
  const xNow = PAD.left + RECENT_W;
  const xDay = (t: number) => xNow + (t / DAYS) * FUTURE_W;
  const xRecent = (i: number) =>
    recent.length > 1 ? PAD.left + (i / (recent.length - 1)) * RECENT_W : xNow;

  const band = (low: readonly [number, number], high: readonly [number, number]) =>
    [
      ...steps.map((t) => `${xDay(t).toFixed(1)},${y(at(high, t)).toFixed(1)}`),
      ...[...steps].reverse().map((t) => `${xDay(t).toFixed(1)},${y(at(low, t)).toFixed(1)}`),
    ].join(" ");

  // Level labels sit at the right edge; nudge them apart so they never overlap.
  const labels = levels
    .map((l) => ({ ...l, y: y(l.value) }))
    .sort((a, b) => a.y - b.y)
    .reduce<{ key: string; label: string; y: number }[]>((placed, l) => {
      const prev = placed[placed.length - 1];
      placed.push({ key: l.key, label: l.label, y: prev && l.y - prev.y < 12 ? prev.y + 12 : l.y });
      return placed;
    }, []);

  const firstToTp1 = levels.length ? touchBefore(entry!, stop!, tp1!) : null;
  const stopTomorrow = levels.length ? touchWithin(entry!, stop!, sigma, 1) : null;
  const priceText = (v: number) => formatPrice(v, price);

  return (
    <figure className="mt-3">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-label={`Price map chart for ${map.symbol}: the last ${recent.length} closes, then where price usually closes over the next 5 trading days. Tomorrow, half the time between ${priceText(day1.half.low)} and ${priceText(day1.half.high)}; in 5 days, 8 in 10 between ${priceText(day5.most.low)} and ${priceText(day5.most.high)}.`}
      >
        {[0, 1, DAYS].map((t) => (
          <line
            key={t}
            x1={xDay(t)}
            x2={xDay(t)}
            y1={PAD.top}
            y2={PAD.top + PLOT_H}
            className="stroke-border"
            strokeWidth={1}
            strokeDasharray={t === 0 ? undefined : "3 3"}
          />
        ))}

        <polygon
          points={band(edges.outerLow, edges.outerHigh)}
          className="fill-chart-4"
          fillOpacity={0.2}
        />
        <polygon
          points={band(edges.innerLow, edges.innerHigh)}
          className="fill-chart-4"
          fillOpacity={0.45}
        />

        {levels.map((l) => (
          <line
            key={l.key}
            x1={xNow}
            x2={xDay(DAYS)}
            y1={y(l.value)}
            y2={y(l.value)}
            className={l.className}
            strokeWidth={2}
            strokeDasharray={l.dash}
            strokeLinecap="round"
          />
        ))}
        {labels.map((l) => (
          <text
            key={l.key}
            x={xDay(DAYS) + 4}
            y={l.y + 3.5}
            className="fill-foreground"
            fontSize={10}
          >
            {l.label}
          </text>
        ))}

        <polyline
          points={recent.map((v, i) => `${xRecent(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ")}
          className="stroke-foreground"
          fill="none"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <circle
          cx={xNow}
          cy={y(price)}
          r={4}
          className="fill-foreground stroke-card"
          strokeWidth={2}
        />

        <text
          x={PAD.left + RECENT_W / 2}
          y={H - 9}
          textAnchor="middle"
          className="fill-muted-foreground"
          fontSize={10}
        >
          Last {recent.length} days
        </text>
        <text
          x={xNow + 2}
          y={H - 9}
          textAnchor="end"
          className="fill-muted-foreground"
          fontSize={10}
        >
          Now
        </text>
        <text
          x={xDay(1)}
          y={H - 9}
          textAnchor="middle"
          className="fill-muted-foreground"
          fontSize={10}
        >
          Tomorrow
        </text>
        <text
          x={xDay(DAYS)}
          y={H - 9}
          textAnchor="end"
          className="fill-muted-foreground"
          fontSize={10}
        >
          5 days
        </text>
      </svg>

      <figcaption className="mt-2 space-y-2 text-xs text-muted-foreground">
        <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
          <li className="flex items-center gap-1.5">
            <span aria-hidden className="inline-block h-3 w-4 rounded-sm bg-chart-4/45" />
            Close lands here half the time
          </li>
          <li className="flex items-center gap-1.5">
            <span aria-hidden className="inline-block h-3 w-4 rounded-sm bg-chart-4/20" />8 in 10
          </li>
          {levels.length > 0 && (
            <>
              <li className="flex items-center gap-1.5">
                <span aria-hidden className="inline-block h-0.5 w-4 bg-bull" />
                TP1: {odds(firstToTp1)} touched first
              </li>
              <li className="flex items-center gap-1.5">
                <span
                  aria-hidden
                  className="inline-block h-0 w-4 border-t-2 border-dashed border-bear"
                />
                Stop: {odds(stopTomorrow)} touched by tomorrow
              </li>
            </>
          )}
        </ul>
        <p>
          The cone is where price usually closes. It widens because the further ahead you look, the
          further price can wander, and it&rsquo;s the same up and down because the map
          doesn&rsquo;t know the direction. Tomorrow and day 5 were checked against 20 years of
          data; the days between are drawn smoothly between them.
        </p>
      </figcaption>
    </figure>
  );
}
