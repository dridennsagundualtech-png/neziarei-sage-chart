import { ChartArea, Map as MapIcon } from "lucide-react";
import { useState } from "react";

import { PriceMapChart } from "@/components/PriceMapChart";
import { TermTooltip } from "@/components/TermTooltip";
import { Button } from "@/components/ui/button";
import { oddsText, priceText, touchWithin, type PriceBand, type PriceMap } from "@/lib/price-map";
import type { TypicalMove } from "@/lib/typical-move";
import { cn } from "@/lib/utils";

function Row({ label, value, tone }: { label: string; value: string | null; tone?: string }) {
  if (!value) return null;
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className={cn("whitespace-nowrap text-right text-sm font-semibold", tone)}>{value}</dd>
    </div>
  );
}

export interface PlanLevels {
  /** Only a potential long or short with valid levels gets odds. */
  valid: boolean;
  entry: number | null;
  stop: number | null;
  tp1: number | null;
}

/**
 * Where price can realistically go, and how the plan's levels fare against it.
 * Every figure treats up and down as equally likely; the odds come from how far
 * price moves, checked against 20 years of 50 markets
 * (docs/research/price-map.md).
 */
export function PriceMapCard({
  map,
  typical,
  plan,
}: {
  map: PriceMap | null | undefined;
  typical: TypicalMove | null | undefined;
  plan: PlanLevels;
}) {
  const [chartOpen, setChartOpen] = useState(false);
  // The map needs fewer bars than the typical day, so without a map there's nothing to show.
  if (!map) return null;
  const reference = map.price;
  const band = (b: PriceBand) => `${priceText(b.low, reference)} – ${priceText(b.high, reference)}`;
  const [tomorrow, week] = map.horizons;

  const { entry, stop, tp1 } = plan;
  const levels = plan.valid && entry !== null && stop !== null && tp1 !== null;
  const stopTomorrow = levels ? touchWithin(entry, stop, map.sigma, 1) : null;
  const tp1InWeek = levels ? touchWithin(entry, tp1, map.sigma, 5) : null;

  return (
    <section className="animate-float-in card-soft">
      <h2 className="card-band">
        <MapIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <TermTooltip term="Price map" label="Price map" />
      </h2>
      <div className="p-4">
        <p className="mb-3 text-sm text-muted-foreground">
          Where price can realistically go. It doesn&rsquo;t pick a direction: up and down count as
          even, because no test found a way to tilt them.
        </p>
        {typical && (
          <dl className="divide-y divide-border">
            <Row label="Typical day, high to low" value={priceText(typical.median, reference)} />
            <Row label="8 in 10 days move" value={band(typical)} />
          </dl>
        )}
        {tomorrow && week && (
          <>
            <p className="mt-3 text-sm font-semibold">Where the close could be</p>
            <dl className="divide-y divide-border">
              <Row label="Tomorrow, half the time" value={band(tomorrow.half)} />
              <Row label="Tomorrow, 8 in 10" value={band(tomorrow.most)} />
              <Row label="In 5 days, half the time" value={band(week.half)} />
              <Row label="In 5 days, 8 in 10" value={band(week.most)} />
            </dl>
          </>
        )}

        <Button
          type="button"
          variant="secondary"
          className="mt-3 w-full"
          aria-expanded={chartOpen}
          onClick={() => setChartOpen((open) => !open)}
        >
          <ChartArea aria-hidden />
          {chartOpen ? "Hide the chart" : "Show on a chart"}
        </Button>
        {chartOpen && <PriceMapChart map={map} plan={plan} />}

        {levels && (
          <div className="mt-4 border-t border-border pt-3">
            <p className="text-sm font-semibold">Your plan against the map</p>
            <dl className="divide-y divide-border">
              <Row label="Stop touched tomorrow" value={oddsText(stopTomorrow)} tone="text-bear" />
              <Row label="TP1 reached within 5 days" value={oddsText(tp1InWeek)} />
            </dl>
            <p className="mt-3 text-xs text-muted-foreground">
              These odds assume no edge. The trade plan shows the chance TP1 comes first, the
              average result, and a probability check that flags a stop inside the noise.
            </p>
          </div>
        )}

        <p className="mt-3 text-xs text-muted-foreground">
          From daily bars of {map.symbol} up to {map.asOf}. Checked on 50 markets over 20 years:
          these figures came true within about 2 points of what they say.
        </p>
      </div>
    </section>
  );
}
