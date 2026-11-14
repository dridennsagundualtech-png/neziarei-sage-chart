/**
 * "Check my trade": the trader brings the idea (symbol, side, entry, stop,
 * target) and the app checks only what it can honestly check. It reuses the
 * same pieces as an analysis result (checkPlan, the probability check,
 * sizePosition, planOdds), so a typed trade and an app read are judged alike.
 * It never has a view on direction.
 */
import { glanceRows, type GlanceRow } from "./glance";
import { roundUpDistance, sizePosition, typicalCost, levelText, distanceText } from "./instruments";
import { planOdds, probabilityCheck, type PlanOdds, type ProbabilityCheck } from "./price-map";
import { checkPlan, type PlanCheck } from "./stats";

export interface OwnTrade {
  symbol: string;
  long: boolean;
  entry: number;
  stop: number;
  target: number;
}

export interface OwnTradeContext {
  balance: number;
  riskPct: number;
  /** Account currency as typed in Settings ("PHP", "$"…). */
  currency: string;
  minRR: number;
  /** 1 unit of the quote currency in the account currency; null when not known. */
  quoteToAccount: number | null;
  rateLoading: boolean;
  /** Daily volatility from the price map; null when the symbol has no stored daily bars. */
  sigma: number | null;
  /** The trader's own journal already beats the odds (oddsEdge). */
  journalEdge: boolean;
}

export interface OwnTradeCheck {
  plan: PlanCheck;
  odds: PlanOdds | null;
  check: ProbabilityCheck | null;
  rows: GlanceRow[];
  /** Lines that fail: plan, stop or size. */
  fails: number;
  headline: string;
}

/** "1.0850", "1,0850", " 2650 " → a positive number, else null. */
export function parsePrice(text: string): number | null {
  const value = Number(text.trim().replace(",", "."));
  return Number.isFinite(value) && value > 0 ? value : null;
}

export function checkOwnTrade(trade: OwnTrade, ctx: OwnTradeContext): OwnTradeCheck {
  const { symbol, entry, stop, target } = trade;
  const direction = trade.long ? "POTENTIAL LONG" : "POTENTIAL SHORT";
  const plan = checkPlan(direction, String(entry), String(stop), String(target));
  const valid = plan.ok && plan.rr !== null;
  const cost = typicalCost(symbol);

  const odds = valid ? planOdds(entry, stop, target, cost) : null;
  const check = valid ? probabilityCheck(entry, stop, cost, ctx.sigma) : null;
  const sizing = sizePosition({
    symbol,
    balance: ctx.balance,
    riskPct: ctx.riskPct,
    accountCurrency: ctx.currency,
    entry,
    stop,
    quoteToAccount: ctx.quoteToAccount,
  });
  // What the trade risks at the size you can send: lots go in 0.01 steps.
  const risk =
    sizing.contractSize > 1 ? sizing.tradeRisk : sizing.units !== null ? sizing.riskAmount : null;
  const riskPct = risk !== null && ctx.balance > 0 ? (risk / ctx.balance) * 100 : null;

  // When the stop fails, the closest one that passes, in whole pips or cents.
  const distance =
    check && (check.costOk === false || check.noiseOk === false) && check.minStopDistance !== null
      ? roundUpDistance(symbol, check.minStopDistance)
      : null;
  const closest = distance !== null ? (stop > entry ? entry + distance : entry - distance) : null;

  const rows = glanceRows({
    mode: "own",
    // No checklist for a typed trade; these four fields are unused in "own" mode.
    checklist: "READY",
    score: 0,
    maxScore: 0,
    invalidated: false,
    hasPlan: true,
    plan,
    minRR: ctx.minRR,
    symbol,
    check,
    closestStop:
      distance !== null && closest !== null
        ? `${distanceText(symbol, distance)} from the entry, at ${levelText(symbol, closest)}`
        : null,
    sizing,
    risk,
    riskPct,
    balance: ctx.balance,
    rateLoading: ctx.rateLoading,
    odds,
    edge: ctx.journalEdge ? "proven" : "own",
  });

  const fails = rows.filter((row) => row.ok === false).length;
  // "Checks out" is only said when the stop and the size really were checked.
  const complete =
    risk !== null && check !== null && check.costOk !== null && check.noiseOk !== null;
  const headline = !plan.ok
    ? "These levels don't form a trade."
    : fails === 0
      ? complete
        ? "The plan, the stop and the size check out."
        : "Nothing fails, but not everything could be checked."
      : fails === 1
        ? "One thing to fix before placing this."
        : `${fails} things to fix before placing this.`;
  return { plan, odds, check, rows, fails, headline };
}
