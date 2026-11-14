/**
 * The result screen's "At a glance" card: up to five lines that restate
 * figures the rest of the screen already works out (the checklist verdict,
 * checkPlan, the probability check, the position size and the no-edge odds).
 * Nothing here calculates a new number or predicts anything; it only picks the
 * words, so the card can never disagree with the sections below it.
 */
import { LOT_STEP, formatSize, type Sizing } from "./instruments";
import { MAX_COST_R, oddsText, type PlanOdds, type ProbabilityCheck } from "./price-map";

export interface GlanceRow {
  key: "rules" | "plan" | "stop" | "size" | "odds";
  label: string;
  /** true passes, false fails, null: for information, there is nothing to pass. */
  ok: boolean | null;
  value: string;
  note: string;
}

export interface GlanceInput {
  /** The checklist verdict, before the quality gate and the edge requirement. */
  checklist: "READY" | "DEVELOPING" | "WAIT" | "NO_TRADE";
  score: number;
  maxScore: number;
  invalidated: boolean;
  /** The quality gate, when the read has one, with its first reason and what to wait for. */
  tradable?: boolean;
  gateReason?: string | null;
  waitingFor?: string | null;
  /** The read is a long or a short and had enough information for a plan. */
  hasPlan: boolean;
  /** checkPlan's result: R:R is measured from the levels, never taken from a model. */
  plan: { ok: boolean; rr: number | null; issue: string | null };
  minRR: number;
  symbol: string;
  check: ProbabilityCheck | null;
  /** "20 pips from the entry, at 1.0830": the closest stop that passes, when the check fails. */
  closestStop: string | null;
  sizing: Sizing;
  /** Money at risk at the size you can send, and its share of the account; null when unknown. */
  risk: number | null;
  riskPct: number | null;
  balance: number;
  /** The quote-to-account rate is still loading. */
  rateLoading: boolean;
  odds: PlanOdds | null;
  /** The track record of this kind of read. */
  edge: "proven" | "unproven" | "checking" | "untracked";
}

/** "2", "2.5", "1.96": two decimals at most, so 1.96 never reads as a passing 2.0. */
const trim = (n: number) => n.toFixed(2).replace(/\.?0+$/, "");
const sentence = (text: string) => (/[.!?…]$/.test(text.trim()) ? text.trim() : `${text.trim()}.`);
const capital = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

function rulesRow(g: GlanceInput): GlanceRow {
  const base = { key: "rules" as const, label: "Rules", value: `${g.score}/${g.maxScore}` };
  if (g.invalidated) return { ...base, ok: false, note: "The setup was invalidated." };
  if (g.checklist === "NO_TRADE") {
    return { ...base, ok: false, note: "The evidence doesn't support a trade right now." };
  }
  if (g.checklist !== "READY") {
    return {
      ...base,
      ok: false,
      note: g.waitingFor
        ? `Not met yet. Next: ${sentence(g.waitingFor)}`
        : "Not met yet: confirmation is still missing.",
    };
  }
  if (g.tradable === false) {
    return {
      ...base,
      ok: false,
      note: g.gateReason
        ? `Met, but it doesn't pass your quality gate: ${sentence(g.gateReason)}`
        : "Met, but it doesn't pass your quality gate.",
    };
  }
  return {
    ...base,
    ok: true,
    note: g.tradable
      ? "The checklist is met and it passes your quality gate."
      : "The checklist is met.",
  };
}

function planRow(g: GlanceInput): GlanceRow {
  const base = { key: "plan" as const, label: "Plan" };
  if (!g.hasPlan) {
    return { ...base, ok: null, value: "None", note: "This read has no trade to plan." };
  }
  if (!g.plan.ok) {
    return {
      ...base,
      ok: false,
      value: "Not valid",
      note: `The levels don't form a trade: ${sentence(g.plan.issue ?? "check them")}`,
    };
  }
  if (g.plan.rr === null) {
    return {
      ...base,
      ok: null,
      value: "Not readable",
      note: "The entry, stop or first target couldn't be read as a price.",
    };
  }
  const meets = g.plan.rr >= g.minRR;
  return {
    ...base,
    ok: meets,
    value: `R:R ${trim(g.plan.rr)}`,
    note: meets
      ? `Measured from the levels. Your minimum is ${trim(g.minRR)}.`
      : `Below your minimum of ${trim(g.minRR)}.`,
  };
}

function stopRow(g: GlanceInput): GlanceRow | null {
  const c = g.check;
  if (!c) return null;
  const base = { key: "stop" as const, label: "Stop" };
  if (c.costOk === null && c.noiseOk === null) {
    return {
      ...base,
      ok: null,
      value: "Not checked",
      note: `No typical spread or stored daily data for ${g.symbol}.`,
    };
  }
  const reach =
    c.stopTomorrow !== null
      ? `normal moves reach it by tomorrow ${oddsText(c.stopTomorrow)} of the time`
      : null;
  if (c.costOk === false || c.noiseOk === false) {
    const why = [
      c.costOk === false && c.costR !== null
        ? `the spread costs ${c.costR.toFixed(2)}R a trade, over the ${MAX_COST_R}R limit`
        : null,
      c.noiseOk === false ? reach : null,
    ].filter((part): part is string => Boolean(part));
    return {
      ...base,
      ok: false,
      value: "Too tight",
      note: `${capital(why.join(", and "))}.${g.closestStop ? ` Closest stop that passes: ${g.closestStop}.` : ""}`,
    };
  }
  const parts = [
    c.costR !== null ? `The spread costs ${c.costR.toFixed(2)}R a trade.` : null,
    reach ? `${capital(reach)}.` : null,
  ].filter((part): part is string => Boolean(part));
  return { ...base, ok: true, value: "Wide enough", note: parts.join(" ") };
}

function sizeRow(g: GlanceInput): GlanceRow {
  const s = g.sizing;
  const base = { key: "size" as const, label: "Size" };
  if (s.units !== null && g.risk !== null) {
    const share = g.riskPct !== null ? `, ${g.riskPct.toFixed(2)}% of the account` : "";
    return {
      ...base,
      ok: null,
      value: formatSize(s),
      note: `${g.risk.toFixed(2)} ${s.account} at risk${share}.`,
    };
  }
  // Lot-based and below the smallest lot: the minimum trade breaks the risk rule.
  if (s.units !== null && s.tradeLots === null && s.minLotRisk !== null) {
    const share =
      g.balance > 0 ? ` (${((s.minLotRisk / g.balance) * 100).toFixed(1)}% of the account)` : "";
    return {
      ...base,
      ok: false,
      value: `Under ${LOT_STEP} lots`,
      note: `The smallest trade, ${LOT_STEP} lots, would risk ${s.minLotRisk.toFixed(2)} ${s.account}${share}.`,
    };
  }
  const missing = { ...base, ok: null, value: "Not worked out" };
  if (s.riskPerUnit === null) {
    return { ...missing, note: "The entry and stop prices aren't readable." };
  }
  if (!(g.balance > 0)) return { ...missing, note: "Set your account balance in Settings." };
  if (s.needsRate) {
    return g.rateLoading
      ? {
          ...base,
          ok: null,
          value: "Working…",
          note: `Getting the ${s.quote} to ${s.account} rate.`,
        }
      : {
          ...missing,
          note: `The ${s.quote} to ${s.account} rate couldn't be loaded, and a size without it would be wrong.`,
        };
  }
  if (s.quote === null) {
    return {
      ...missing,
      note: `The app can't tell what currency ${g.symbol} is priced in. Size it in your platform.`,
    };
  }
  return { ...missing, note: "The size couldn't be worked out from these levels." };
}

const EDGE_NOTE: Record<GlanceInput["edge"], string> = {
  proven: "Its record beats these odds on its history. That is not a promise for this trade.",
  unproven: "No edge is proven for this read.",
  checking: "The track record is still being checked.",
  untracked: "No track record is kept for this kind of read, so no edge is proven.",
};

/**
 * The no-edge average in one sentence. With no edge R:R and the odds cancel out,
 * so what is left is the spread (planOdds); the same figures as the plan's
 * "Average with no edge" row.
 */
function averageNote(odds: PlanOdds, risk: number | null, currency: string): string {
  if (odds.costR === 0) return "With no edge the average is about 0R before costs.";
  if (odds.averageR > -0.005) return "With no edge the average is about 0R, spread included.";
  const money =
    risk !== null && risk > 0 ? `, about ${(odds.costR * risk).toFixed(2)} ${currency}` : "";
  return `With no edge the average is about −${Math.abs(odds.averageR).toFixed(2)}R a trade: the spread${money}.`;
}

function oddsRow(g: GlanceInput): GlanceRow | null {
  if (!g.odds) return null;
  return {
    key: "odds",
    label: "Odds with no edge",
    ok: null,
    value: oddsText(g.odds.tp1First) ?? "–",
    note: `How often TP1 comes before the stop. ${averageNote(g.odds, g.risk, g.sizing.account)} ${EDGE_NOTE[g.edge]}`,
  };
}

/** Rules and plan always; stop, size and odds only when there is a priced, valid plan. */
export function glanceRows(g: GlanceInput): GlanceRow[] {
  const rows: GlanceRow[] = [rulesRow(g), planRow(g)];
  if (!g.hasPlan || !g.plan.ok || g.plan.rr === null) return rows;
  const stop = stopRow(g);
  if (stop) rows.push(stop);
  rows.push(sizeRow(g));
  const odds = oddsRow(g);
  if (odds) rows.push(odds);
  return rows;
}
