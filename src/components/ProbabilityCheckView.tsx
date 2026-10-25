import { AlertTriangle, BadgeCheck } from "lucide-react";

import { TermTooltip } from "@/components/TermTooltip";
import { LOT_STEP, distanceText, formatSize, levelText, type Sizing } from "@/lib/instruments";
import { MAX_COST_R, oddsText, type ProbabilityCheck } from "@/lib/price-map";
import { cn } from "@/lib/utils";

const money = (v: number) =>
  v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * The trade plan's probability check (probabilityCheck in src/lib/price-map.ts):
 * the spread against the stop, and the stop against normal daily noise. When
 * either fails it shows the closest stop that passes, sized at the user's risk.
 */
export function ProbabilityCheckView({
  check,
  symbol,
  suggestedStop,
  suggestedDistance,
  sizing,
  account,
  balance,
  riskPct,
}: {
  check: ProbabilityCheck;
  symbol: string;
  /** The closest stop that passes, rounded out to whole pips or cents; null when the plan passes. */
  suggestedStop: number | null;
  suggestedDistance: number | null;
  /** Position size at the suggested stop. */
  sizing: Sizing | null;
  account: string;
  balance: number;
  riskPct: number;
}) {
  const failed = check.costOk === false || check.noiseOk === false;
  const title = (
    <TermTooltip term="Probability check" label="Probability check" className="font-semibold" />
  );

  if (check.costOk === null && check.noiseOk === null) {
    return (
      <p className="mt-3 text-xs text-muted-foreground">
        {title}: can&rsquo;t run for {symbol}, with no typical spread or stored daily data.
      </p>
    );
  }

  const lines = [
    check.costR !== null &&
      `Spread: ${check.costR.toFixed(2)}R a trade, ${check.costOk ? "within" : "over"} the ${MAX_COST_R}R limit.`,
    check.costOk === null && `Spread not checked: no typical spread known for ${symbol}.`,
    check.stopTomorrow !== null &&
      `Normal moves reach the stop by tomorrow ${oddsText(check.stopTomorrow)} of the time${check.noiseOk ? "." : ": it sits inside the noise."}`,
    check.noiseOk === null && `Noise not checked: no daily data stored for ${symbol}.`,
  ].filter((line): line is string => Boolean(line));

  let sizeLine: string | null = null;
  if (sizing && sizing.units !== null) {
    if (sizing.contractSize === 1) {
      sizeLine = `At your ${riskPct}% risk that's ${formatSize(sizing)}.`;
    } else if (sizing.tradeLots !== null && sizing.tradeRisk !== null) {
      sizeLine = `At your ${riskPct}% risk that's ${formatSize(sizing)}, ${money(sizing.tradeRisk)} ${account} at risk.`;
    } else if (sizing.minLotRisk !== null) {
      const pct =
        balance > 0 ? `, ${((sizing.minLotRisk / balance) * 100).toFixed(1)}% of the account` : "";
      sizeLine = `At your ${riskPct}% risk that's under ${LOT_STEP} lots: the smallest trade, ${LOT_STEP} lots, would risk ${money(sizing.minLotRisk)} ${account}${pct}.`;
    }
  }

  return (
    <div
      className={cn(
        "mt-3 rounded-xl border p-3 text-xs",
        failed ? "border-warn/40 bg-warn/10" : "border-border",
      )}
    >
      <p className={cn("flex items-center gap-2 text-sm", failed && "text-warn")}>
        {failed ? (
          <AlertTriangle className="size-4 shrink-0" aria-hidden />
        ) : (
          <BadgeCheck className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        )}
        <span>
          {title}: {failed ? "failed" : "passed"}
        </span>
      </p>
      <ul className="mt-2 space-y-1 leading-snug">
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      {failed && suggestedStop !== null && suggestedDistance !== null && (
        <p className="mt-2 leading-snug">
          <span className="font-semibold">
            Closest stop that passes: {distanceText(symbol, suggestedDistance)} from the entry, at{" "}
            {levelText(symbol, suggestedStop)}.
          </span>
          {sizeLine ? ` ${sizeLine}` : ""} Use the nearest chart level at least that far out, or
          skip the trade.
        </p>
      )}
    </div>
  );
}
