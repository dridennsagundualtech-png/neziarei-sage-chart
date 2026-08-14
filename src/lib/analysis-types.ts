/**
 * ChartPilot analysis contract.
 *
 * ONE scoring system, used by the AI layer, the UI, the database and the
 * statistics engine. Maximum total = 16. Scores are always clamped, so an
 * impossible score such as "16/10" can never be produced or displayed.
 */

export type ChecklistKey =
  | "htf_structure"
  | "support_resistance"
  | "liquidity"
  | "amd"
  | "liquidity_sweep"
  | "mss_bos"
  | "displacement"
  | "fvg"
  | "volume"
  | "risk_reward";

export interface ChecklistSpec {
  key: ChecklistKey;
  label: string;
  max: number;
  /** Plain-English explanation shown in a tooltip. */
  help: string;
  /** Rule the AI must follow to award points. */
  rule: string;
}

export const CHECKLIST_SPEC: ChecklistSpec[] = [
  {
    key: "htf_structure",
    label: "HTF Structure",
    max: 2,
    help: "HTF = higher timeframe. The bigger-picture trend read from meaningful swing highs and lows — not from the colour of the last candle.",
    rule: "2 = clear bullish or bearish sequence of swings visible on the highest uploaded timeframe. 1 = structure visible but mixed/ranging. 0 = unclear or not visible.",
  },
  {
    key: "support_resistance",
    label: "Support / Resistance",
    max: 1,
    help: "Zones (not exact prices) where price has repeatedly reacted: prior swings, breakout retests, range boundaries.",
    rule: "1 = the potential entry sits at a visible, previously respected zone. 0 = no meaningful level visible or entry is mid-range.",
  },
  {
    key: "liquidity",
    label: "Liquidity",
    max: 2,
    help: "Areas where resting orders/stops likely sit: previous highs and lows, equal highs/lows, range extremes. Location is inferred, never known.",
    rule: "2 = obvious liquidity both behind the entry and at the target. 1 = only one side visible. 0 = not identifiable from the screenshots.",
  },
  {
    key: "amd",
    label: "AMD Model",
    max: 2,
    help: "Accumulation → Manipulation → Distribution: a range, then a false break that takes liquidity, then a directional expansion.",
    rule: "2 = all three phases visible in sequence. 1 = partial (e.g. accumulation + manipulation only). 0 = not confirmed. Never force AMD onto a chart.",
  },
  {
    key: "liquidity_sweep",
    label: "Liquidity Sweep",
    max: 2,
    help: "Price trades through a prior high/low, then rejects or reclaims it. A wick alone is not a sweep.",
    rule: "2 = sweep plus visible rejection/reclaim. 1 = possible sweep, confirmation unclear. 0 = no sweep visible.",
  },
  {
    key: "mss_bos",
    label: "MSS / BOS",
    max: 2,
    help: "BOS = break of structure (trend continues). MSS = market structure shift (trend character changes).",
    rule: "2 = a named swing level was clearly broken and closed beyond. 1 = break in progress / unconfirmed. 0 = no structural break.",
  },
  {
    key: "displacement",
    label: "Displacement",
    max: 1,
    help: "A decisive, large-bodied move that is clearly bigger than surrounding candles and breaks structure.",
    rule: "1 = decisive expansion with follow-through. 0 = ordinary or unclear candles.",
  },
  {
    key: "fvg",
    label: "FVG / Imbalance",
    max: 1,
    help: "Fair Value Gap: an inefficiency left by a fast move that price often revisits.",
    rule: "1 = a clear unfilled or partially filled gap usable as an entry zone. 0 = none visible or candle detail insufficient.",
  },
  {
    key: "volume",
    label: "Volume",
    max: 1,
    help: "Relative volume: expansion on the break, contraction in the range. Never assume green volume means buyers won.",
    rule: "1 = volume visible AND supports the read. 0 = volume not visible, or visible but not supportive. If not visible, status must be 'Volume context unavailable'.",
  },
  {
    key: "risk_reward",
    label: "Risk / Reward",
    max: 2,
    help: "R:R compares potential reward with defined risk. It does NOT predict how often a trade wins.",
    rule: "2 = measurable R:R at or above the user's minimum. 1 = measurable but below minimum. 0 = cannot be measured from the screenshots.",
  },
];

export const MAX_SCORE = CHECKLIST_SPEC.reduce((sum, item) => sum + item.max, 0); // 16

export const CHECKLIST_BY_KEY: Record<ChecklistKey, ChecklistSpec> = Object.fromEntries(
  CHECKLIST_SPEC.map((item) => [item.key, item]),
) as Record<ChecklistKey, ChecklistSpec>;

export type Direction =
  | "POTENTIAL LONG"
  | "POTENTIAL SHORT"
  | "WAIT"
  | "NO TRADE"
  | "INSUFFICIENT DATA";

export type SetupStage =
  | "SETUP FORMING"
  | "SETUP CONFIRMED"
  | "ENTRY AVAILABLE"
  | "ENTRY MISSED"
  | "SETUP INVALIDATED"
  | "NO TRADE";

export type Outcome = "OPEN" | "WIN" | "LOSS" | "BREAKEVEN" | "INVALIDATED" | "MISSED" | "NO TRADE";

export const OUTCOMES: Outcome[] = [
  "OPEN",
  "WIN",
  "LOSS",
  "BREAKEVEN",
  "INVALIDATED",
  "MISSED",
  "NO TRADE",
];

export type Grade = "A" | "B" | "C" | "D";

export interface ChecklistItem {
  key: ChecklistKey;
  status: string;
  score: number;
  max: number;
  evidence: string;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  missing?: string | null;
}

export interface AnalysisResult {
  asset: string;
  market_type: string;
  timeframes: string[];
  primary_timeframe: string | null;
  sufficient_information: boolean;
  requested_additional_images: string[];
  missing_information: string[];
  htf_bias: string;
  direction: Direction;
  setup_stage: SetupStage;
  checklist: ChecklistItem[];
  score: number;
  max_score: number;
  grade: Grade;
  visual_evidence: "HIGH" | "MEDIUM" | "LOW";
  summary: string;
  entry_zone: string | null;
  stop_loss: string | null;
  tp1: string | null;
  tp2: string | null;
  risk_reward: number | null;
  required_confirmation: string[];
  invalidation: string[];
  reasoning: string[];
}

/** Grade bands. The grade describes setup quality — never a probability. */
export function gradeFor(score: number): Grade {
  if (score >= 13) return "A";
  if (score >= 10) return "B";
  if (score >= 7) return "C";
  return "D";
}

export const GRADE_LABEL: Record<Grade, string> = {
  A: "A — Strong setup",
  B: "B — Good setup",
  C: "C — Weak / mixed",
  D: "D — Poor / insufficient",
};

function clampInt(value: unknown, max: number): number {
  const n = typeof value === "number" ? Math.round(value) : Number.parseInt(String(value ?? 0), 10);
  if (!Number.isFinite(n)) return 0;
  return Math.min(Math.max(n, 0), max);
}

/**
 * Rebuilds the checklist from the spec so that:
 * - every component exists exactly once,
 * - no component can exceed its maximum,
 * - the total is derived, never taken from the model.
 */
export function normalizeChecklist(raw: unknown): ChecklistItem[] {
  const list = Array.isArray(raw) ? raw : [];
  return CHECKLIST_SPEC.map((spec) => {
    const found = list.find(
      (item) => item && typeof item === "object" && (item as { key?: string }).key === spec.key,
    ) as Partial<ChecklistItem> | undefined;

    const confidence =
      found?.confidence === "HIGH" || found?.confidence === "MEDIUM" ? found.confidence : "LOW";

    return {
      key: spec.key,
      max: spec.max,
      score: clampInt(found?.score, spec.max),
      status: (found?.status ?? "Not visible").toString().slice(0, 160),
      evidence: (found?.evidence ?? "No observable evidence in the uploaded screenshots.")
        .toString()
        .slice(0, 600),
      confidence,
      missing: found?.missing ? String(found.missing).slice(0, 300) : null,
    };
  });
}

export function totalScore(checklist: ChecklistItem[]): number {
  return Math.min(
    checklist.reduce((sum, item) => sum + clampInt(item.score, item.max), 0),
    MAX_SCORE,
  );
}

/** Sample-size language. Never present a rate without this context. */
export type SampleTier = "insufficient" | "early" | "developing" | "meaningful";

export function sampleTier(n: number): SampleTier {
  if (n < 20) return "insufficient";
  if (n < 50) return "early";
  if (n < 100) return "developing";
  return "meaningful";
}

export const SAMPLE_TIER_LABEL: Record<SampleTier, string> = {
  insufficient: "Insufficient evidence",
  early: "Early sample — highly uncertain",
  developing: "Developing evidence",
  meaningful: "More meaningful historical sample",
};

export const GLOSSARY: Record<string, string> = {
  HTF: "Higher timeframe — the bigger-picture chart (1D/4H) used for directional context.",
  MTF: "Middle timeframe (usually 1H) — bridges bias and entry.",
  LTF: "Lower timeframe (15M/5M) — used only for entry confirmation.",
  Liquidity:
    "Areas where resting orders and stops likely sit — previous highs/lows, equal highs/lows, range extremes. Inferred from the chart, never known for certain.",
  "Liquidity Sweep":
    "Price trades through a prior high or low and then rejects or reclaims it. A wick on its own is not a sweep.",
  AMD: "Accumulation → Manipulation → Distribution. A range, then a false break taking liquidity, then a directional expansion.",
  MSS: "Market Structure Shift — the trend's character changes (e.g. a lower high breaks in a downtrend).",
  BOS: "Break of Structure — an existing trend continues by breaking its last swing point.",
  Displacement:
    "A decisive, large-bodied move clearly bigger than surrounding candles, usually breaking structure.",
  FVG: "Fair Value Gap — an inefficiency left behind by a fast move that price often revisits.",
  R: "One unit of risk: the distance between entry and stop. +2R means twice the risked amount.",
  "R:R": "Reward-to-risk ratio. It measures potential payoff, not the probability of winning.",
};

export const DISCLAIMER =
  "ChartPilot is an educational analysis assistant, not financial advice. Every trade plan is conditional, not a prediction or an instruction to trade. Nothing here guarantees any result.";
