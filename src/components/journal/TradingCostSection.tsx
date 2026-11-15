import { JSection, StatRows } from "@/components/journal/parts";
import type { SettingsRow } from "@/lib/data";
import { normalizeCurrency } from "@/lib/instruments";
import { tradingCost, type TradingCostRow } from "@/lib/trading-cost";

const money = (value: number) =>
  value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * Journal › Stats: what spread and commission cost on the trades finished in
 * the last 7 days (src/lib/trading-cost.ts). An estimate from the app's typical
 * costs, shown in R and, when a balance is set, in the account currency at the
 * current risk per trade.
 */
export function TradingCostSection({
  rows,
  settings,
}: {
  rows: TradingCostRow[];
  settings: SettingsRow;
}) {
  const cost = tradingCost(rows);
  const account = normalizeCurrency(settings.currency);
  const balance = Number(settings.account_balance);
  const riskPct = Number(settings.risk_pct);
  const risk = balance > 0 && riskPct > 0 ? (balance * riskPct) / 100 : null;
  const unknown = cost.trades - cost.counted;

  return (
    <JSection
      title="What trading cost this week"
      hint="Spread and commission on the trades you finished in the last 7 days. With no edge, this is what a trade loses on average, so fewer trades cost less."
    >
      {cost.trades === 0 ? (
        <p className="text-[15px] text-muted-foreground">
          No trades finished in the last 7 days, so nothing was spent on spread.
        </p>
      ) : (
        <>
          <StatRows
            rows={[
              {
                label: "Finished trades",
                value: String(cost.trades),
                hint:
                  unknown > 0
                    ? `${unknown} left out of the cost: no typical spread is known for the symbol, or the levels aren't prices.`
                    : undefined,
              },
              {
                label: "Estimated cost",
                value: cost.counted ? `${cost.costR.toFixed(2)}R` : "–",
                hint:
                  cost.counted && risk !== null
                    ? `About ${money(cost.costR * risk)} ${account} at your current risk of ${money(risk)} ${account} a trade.`
                    : undefined,
              },
              {
                label: "Per trade",
                value: cost.avgCostR === null ? "–" : `${cost.avgCostR.toFixed(2)}R`,
                hint:
                  cost.avgCostR === null
                    ? undefined
                    : `At this rate 100 trades would cost about ${(cost.avgCostR * 100).toFixed(0)}R.`,
              },
            ]}
          />
          <p className="mt-3 text-[13px] leading-[18px] text-muted-foreground">
            An estimate: the app&rsquo;s typical spread and commission for each symbol, against each
            trade&rsquo;s own stop distance. Your broker&rsquo;s real costs can differ.
          </p>
        </>
      )}
    </JSection>
  );
}
