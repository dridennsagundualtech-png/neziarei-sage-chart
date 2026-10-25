/**
 * The conditional trade plan as steps you can follow. They are the same order,
 * cancel and exit rules the backtests measure (resolveOutcome in
 * backtest-shared.server.ts), so a track record describes the trades you take.
 * Anything else you add makes your trades different from the measured ones.
 */
import { TRACK_RECORD, type EdgeVerdict } from "./edge-verdict";
import { timeframeMinutes } from "./freshness";

/** Bars a pending entry stays live in the backtests (DEFAULT_FILL_WITHIN_BARS). */
export const FILL_WITHIN_BARS = 30;
/** An entry within this share of the risk from price is a market entry in the backtests. */
export const MARKET_ENTRY_SHARE = 0.05;

/** ok: true passes, false fails (skip or demo only), null: you have to check it yourself. */
export interface PlanCheck {
  ok: boolean | null;
  text: string;
}

export interface PlanSteps {
  checks: PlanCheck[];
  /** "Buy limit", "Sell stop", "Buy at market"… */
  order: string;
  place: string[];
  /** Empty for a market entry: there is nothing to cancel. */
  cancel: string[];
  manage: string[];
}

export interface PlanStepsInput {
  long: boolean;
  entry: number;
  stop: number;
  tp1: number;
  /** The latest closed price. */
  price: number;
  /** The timeframe the backtests step on: the lowest one analysed. */
  stepTimeframe: string;
  fmt: (price: number) => string;
  /** Den track record of these trades: undefined when none is kept, null while loading. */
  verdict?: EdgeVerdict | null;
  tradable?: boolean;
  minRR: number;
  dailyLossR: number;
  moveToBreakEvenR: number;
  /** "0.05 lots", when the size can be worked out. */
  size: string | null;
}

/** "about 30 hours of trading", "about 8 trading days". */
function tradingTime(bars: number, timeframe: string): string {
  const hours = (bars * timeframeMinutes(timeframe)) / 60;
  return hours < 48
    ? `about ${Math.round(hours)} hours of trading`
    : `about ${Math.round(hours / 24)} trading days`;
}

export function planSteps(p: PlanStepsInput): PlanSteps {
  const { long, entry, stop, tp1, price, fmt } = p;
  const risk = Math.abs(entry - stop);
  const rr = Math.abs(tp1 - entry) / risk;
  const tf = p.stepTimeframe;

  const checks: PlanCheck[] = [];
  if (p.verdict === undefined) {
    checks.push({ ok: false, text: "No track record for this kind of read: demo account only." });
  } else if (p.verdict === null) {
    checks.push({
      ok: false,
      text: "The track record is still being worked out: demo only until it shows an edge.",
    });
  } else if (p.verdict.level === "edge") {
    checks.push({ ok: true, text: "Trades like this have shown an edge on this history." });
  } else {
    checks.push({
      ok: false,
      text: "Trades like this haven't shown an edge: demo account only.",
    });
  }
  if (p.tradable !== undefined) {
    checks.push(
      p.tradable
        ? { ok: true, text: "It passes your quality gate." }
        : { ok: false, text: "It doesn't pass your quality gate: by your rules, skip it." },
    );
  }
  checks.push(
    rr >= p.minRR
      ? { ok: true, text: `R:R ${rr.toFixed(1)} meets your minimum of ${p.minRR}.` }
      : { ok: false, text: `R:R ${rr.toFixed(1)} is below your minimum of ${p.minRR}: skip it.` },
  );
  if (p.dailyLossR > 0) {
    checks.push({
      ok: null,
      text: `You're not already down ${p.dailyLossR}R today. If you are, stop for the day.`,
    });
  }

  const market = Math.abs(entry - price) <= risk * MARKET_ENTRY_SHARE;
  const below = entry < price;
  const order = market
    ? `${long ? "Buy" : "Sell"} at market`
    : `${long ? "Buy" : "Sell"} ${long === below ? "limit" : "stop"}`;

  const place = [
    market
      ? `${order} now: price is already at the entry, ${fmt(entry)}.`
      : `${order} at ${fmt(entry)}.`,
    `Stop loss ${fmt(stop)} and take profit ${fmt(tp1)} (TP1), in the same order.`,
  ];
  if (p.size) place.push(`Size: ${p.size}.`);

  const cancel: string[] = [];
  if (!market) {
    cancel.push(`Price reaches ${fmt(tp1)} (TP1) first: the move happened without you.`);
    // Only a stop order can see the stop before the entry; a limit order fills on the way.
    if (long !== below) {
      cancel.push(`Price reaches ${fmt(stop)} (the stop) first: the idea is broken.`);
    }
    cancel.push(
      `${FILL_WITHIN_BARS} ${tf} bars close without a fill (${tradingTime(FILL_WITHIN_BARS, tf)}).`,
    );
  }

  const manage = [
    `It ends at the stop (−1R plus the spread, more if price gaps past it) or at TP1 (+${rr.toFixed(1)}R, minus the spread). Leave it until one of them.`,
    `If neither is hit after ${TRACK_RECORD.maxLookout} ${tf} bars (${tradingTime(TRACK_RECORD.maxLookout, tf)}), close it: the track record stops following trades there.`,
    p.moveToBreakEvenR > 0
      ? `Moving the stop, closing early or holding for TP2 aren't part of the tested plan. That includes your break-even move at +${p.moveToBreakEvenR}R: only your journal can tell you whether it helps.`
      : "Moving the stop, closing early or holding for TP2 aren't part of the tested plan: only your journal can tell you whether they help.",
  ];

  return { checks, order, place, cancel, manage };
}
