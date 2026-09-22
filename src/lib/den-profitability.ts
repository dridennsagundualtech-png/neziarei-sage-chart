/**
 * Den Analyzer profitability layer (Den-only).
 *
 * Pure helpers used to enrich Den Analyzer output:
 * - quality / tradable filter
 * - setup classification
 * - position sizing
 * - session gate
 * - clearer invalidation text
 *
 * Does NOT touch AI analysis paths.
 */
import type { Direction, Grade } from "./analysis-types";
import type { ChecklistKey } from "./analysis-types";
import {
  activeSessions,
  primarySession,
  type SessionFilter,
  type SessionKey,
} from "./sessions";

// ---------------------------------------------------------------------------
// Setup classification
// ---------------------------------------------------------------------------

export type SetupType =
  | "Liquidity Sweep Reversal"
  | "Order Block Continuation"
  | "AMD Distribution"
  | "Break of Structure Continuation"
  | "Fair Value Gap Retracement"
  | "Mixed / Unclassified";

export interface ScoredComponent {
  key: ChecklistKey | string;
  score: number;
}

export function classifySetup(items: ScoredComponent[]): SetupType {
  const score = (key: string) => items.find((i) => i.key === key)?.score ?? 0;

  const sweep = score("liquidity_sweep");
  const choch = score("choch");
  const fvg = score("fvg");
  const ob = score("order_block");
  const bos = score("mss_bos");
  const disp = score("displacement");
  const amd = score("amd");
  const fib = score("fibonacci");

  if (sweep >= 2 && choch > 0 && fvg > 0) return "Liquidity Sweep Reversal";
  if (ob >= 2 && bos >= 2 && disp >= 1) return "Order Block Continuation";
  if (amd >= 2 && disp >= 1 && fib >= 1) return "AMD Distribution";
  if (bos >= 2 && disp >= 1) return "Break of Structure Continuation";
  if (fvg >= 1 && (ob > 0 || sweep > 0)) return "Fair Value Gap Retracement";
  return "Mixed / Unclassified";
}

// ---------------------------------------------------------------------------
// Position sizing
// ---------------------------------------------------------------------------

export interface PositionSizeResult {
  riskAmount: number;
  riskPerUnit: number;
  positionSize: number;
  positionValue: number;
}

export function computePositionSize(
  accountBalance: number,
  riskPct: number,
  entry: number,
  stop: number,
): PositionSizeResult | null {
  if (
    !Number.isFinite(accountBalance) ||
    !Number.isFinite(riskPct) ||
    !Number.isFinite(entry) ||
    !Number.isFinite(stop)
  ) {
    return null;
  }
  if (accountBalance <= 0 || riskPct <= 0 || entry <= 0 || stop <= 0) return null;
  if (entry === stop) return null;

  const riskAmount = accountBalance * (riskPct / 100);
  const riskPerUnit = Math.abs(entry - stop);
  const positionSize = riskAmount / riskPerUnit;
  const positionValue = positionSize * entry;

  return {
    riskAmount: Number(riskAmount.toFixed(2)),
    riskPerUnit: Number(riskPerUnit.toFixed(6)),
    positionSize: Number(positionSize.toFixed(4)),
    positionValue: Number(positionValue.toFixed(2)),
  };
}

// ---------------------------------------------------------------------------
// Structured invalidation
// ---------------------------------------------------------------------------

export function buildInvalidationConditions(params: {
  direction: Direction;
  stop: number | null;
  digits: number;
  primaryTimeframe: string;
  hasFvg: boolean;
  htfBias: string;
}): string[] {
  const { direction, stop, digits, primaryTimeframe, hasFvg, htfBias } = params;
  const conditions: string[] = [];
  const fmt = (n: number) => n.toFixed(digits);

  if (stop != null) {
    const side = direction.includes("LONG") ? "below" : "above";
    conditions.push(
      `A close ${side} ${fmt(stop)} on the ${primaryTimeframe} timeframe.`,
    );
  }
  if (hasFvg) {
    conditions.push("Price returns to the Fair Value Gap and closes through it.");
  }
  if (htfBias === "BULLISH" && direction.includes("LONG")) {
    conditions.push("Higher-timeframe structure flips bearish (lower low forms).");
  }
  if (htfBias === "BEARISH" && direction.includes("SHORT")) {
    conditions.push("Higher-timeframe structure flips bullish (higher high forms).");
  }
  if (conditions.length === 0) {
    conditions.push("No clear invalidation conditions could be derived from the current data.");
  }
  return conditions;
}

// ---------------------------------------------------------------------------
// Quality / tradable filter (profitability gate)
// ---------------------------------------------------------------------------

export interface TradableInput {
  direction: Direction;
  grade: Grade;
  score: number;
  maxScore: number;
  riskReward: number | null;
  minRR: number;
  /** Minimum grade to allow a full trade plan. Default "A". */
  minGrade?: Grade;
  /** Minimum score ratio (score/maxScore). Default 0.7 (~A band). */
  minScoreRatio?: number;
  /** Optional session filter from the user. */
  sessionFilter?: SessionFilter | null;
  now?: Date;
}

export interface TradableResult {
  tradable: boolean;
  reasons: string[];
  sessionKey: SessionKey | null;
  sessionLabel: string | null;
}

const GRADE_RANK: Record<Grade, number> = { A: 4, B: 3, C: 2, D: 1 };

export function evaluateTradable(input: TradableInput): TradableResult {
  const reasons: string[] = [];
  const now = input.now ?? new Date();
  const primary = primarySession(now);
  const sessionKey = primary?.key ?? null;
  const sessionLabel = primary?.label ?? null;

  const isDirectional =
    input.direction === "POTENTIAL LONG" || input.direction === "POTENTIAL SHORT";

  if (!isDirectional) {
    reasons.push("Direction is not a potential long or short.");
  }

  const minGrade = input.minGrade ?? "A";
  if (GRADE_RANK[input.grade] < GRADE_RANK[minGrade]) {
    reasons.push(`Grade ${input.grade} is below the minimum ${minGrade}.`);
  }

  const ratio = input.maxScore > 0 ? input.score / input.maxScore : 0;
  const minRatio = input.minScoreRatio ?? 0.7;
  if (ratio < minRatio) {
    reasons.push(
      `Score ${input.score}/${input.maxScore} is below the ${(minRatio * 100).toFixed(0)}% quality threshold.`,
    );
  }

  if (input.riskReward == null) {
    reasons.push("Risk/reward could not be measured.");
  } else if (input.riskReward < input.minRR) {
    reasons.push(
      `R:R ${input.riskReward}:1 is below your minimum ${input.minRR}:1.`,
    );
  }

  // Session gate — only when the user enabled a session filter
  const filter = input.sessionFilter;
  if (filter?.enabled && filter.sessions.length > 0) {
    const active = new Set(activeSessions(now).map((s) => s.key));
    const ok = filter.sessions.some((key) => active.has(key));
    if (!ok) {
      reasons.push(
        `Current session is outside your allowed sessions (${filter.sessions.join(", ")}).`,
      );
    }
  }

  return {
    tradable: reasons.length === 0 && isDirectional,
    reasons,
    sessionKey,
    sessionLabel,
  };
}

// ---------------------------------------------------------------------------
// Enrichment payload attached only to Den results
// ---------------------------------------------------------------------------

export interface DenProfitabilityFields {
  tradable: boolean;
  tradable_reasons: string[];
  setup_type: SetupType;
  position_size: number | null;
  risk_amount: number | null;
  session_key: SessionKey | null;
  session_label: string | null;
}

export function buildDenProfitability(params: {
  direction: Direction;
  grade: Grade;
  score: number;
  maxScore: number;
  riskReward: number | null;
  minRR: number;
  checklist: ScoredComponent[];
  entry: number | null;
  stop: number | null;
  accountBalance?: number | null;
  riskPct?: number | null;
  sessionFilter?: SessionFilter | null;
  now?: Date;
}): DenProfitabilityFields {
  const gate = evaluateTradable({
    direction: params.direction,
    grade: params.grade,
    score: params.score,
    maxScore: params.maxScore,
    riskReward: params.riskReward,
    minRR: params.minRR,
    sessionFilter: params.sessionFilter ?? null,
    now: params.now,
  });

  const setupType = classifySetup(params.checklist);

  let positionSize: number | null = null;
  let riskAmount: number | null = null;

  // Only size when the setup is tradable and we have numbers
  if (
    gate.tradable &&
    params.entry != null &&
    params.stop != null &&
    params.accountBalance != null &&
    params.riskPct != null
  ) {
    const sized = computePositionSize(
      params.accountBalance,
      params.riskPct,
      params.entry,
      params.stop,
    );
    if (sized) {
      positionSize = sized.positionSize;
      riskAmount = sized.riskAmount;
    }
  }

  return {
    tradable: gate.tradable,
    tradable_reasons: gate.reasons,
    setup_type: setupType,
    position_size: positionSize,
    risk_amount: riskAmount,
    session_key: gate.sessionKey,
    session_label: gate.sessionLabel,
  };
}
