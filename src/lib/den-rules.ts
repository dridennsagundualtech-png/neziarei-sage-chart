/**
 * Den Analyzer rulebook.
 *
 * Every number the rule-based engine uses lives here, so the whole "rulebook"
 * is one editable object. Settings renders these fields in plain English and
 * saves them on the user's settings row; the engine reads them at run time.
 * No AI is involved — changing a number changes the maths directly.
 */

import type { ChecklistKey } from "./analysis-types";

/** Checklist components the Den Analyzer can switch on or off. */
export const DEN_COMPONENT_KEYS = [
  "htf_structure",
  "support_resistance",
  "liquidity",
  "liquidity_sweep",
  "mss_bos",
  "choch",
  "displacement",
  "amd",
  "order_block",
  "fvg",
  "breaker_block",
  "fibonacci",
  "volume",
  "risk_reward",
] as const satisfies readonly ChecklistKey[];

export type DenComponentKey = (typeof DEN_COMPONENT_KEYS)[number];

export type DenComponents = Record<DenComponentKey, boolean>;

export const DEN_PRESETS: Record<"simple" | "full", DenComponentKey[]> = {
  simple: [
    "htf_structure",
    "liquidity",
    "liquidity_sweep",
    "mss_bos",
    "displacement",
    "fibonacci",
    "risk_reward",
  ],
  full: [...DEN_COMPONENT_KEYS],
};

export function componentsFromPreset(keys: readonly DenComponentKey[]): DenComponents {
  return Object.fromEntries(
    DEN_COMPONENT_KEYS.map((key) => [key, keys.includes(key)]),
  ) as DenComponents;
}

export const DEFAULT_DEN_COMPONENTS: DenComponents = componentsFromPreset(DEN_PRESETS.simple);

/** Which preset a component map matches, or "custom". */
export function presetOf(components: DenComponents): "simple" | "full" | "custom" {
  const on = DEN_COMPONENT_KEYS.filter((key) => components[key]);
  for (const name of ["simple", "full"] as const) {
    const preset = DEN_PRESETS[name];
    if (preset.length === on.length && preset.every((key) => components[key])) return name;
  }
  return "custom";
}

/** Short plain-English note shown next to each toggle. */
export const DEN_COMPONENT_NOTES: Record<DenComponentKey, string> = {
  htf_structure: "Higher-timeframe trend from swing highs and lows.",
  support_resistance: "Zones where price has reacted before.",
  liquidity: "Equal highs and lows where stops are resting.",
  liquidity_sweep: "Price taking a prior high or low, then reversing.",
  mss_bos: "Break of structure / market structure shift.",
  choch: "First break of structure against the current trend.",
  displacement: "One decisive, wide-bodied candle showing intent.",
  amd: "Strict: accumulation + manipulation + distribution, all three.",
  order_block: "Last opposing candle before the move that broke structure.",
  fvg: "Three-candle imbalance left behind by a fast move.",
  breaker_block: "An order block that failed and was later retested.",
  fibonacci: "Dealing range, retracements, extensions, premium vs discount.",
  volume: "Expansion on the move, quiet on the pullback.",
  risk_reward: "Entry, stop and targets against your minimum R:R.",
};

export interface DenRules {
  components: DenComponents;
  pivotWidth: number;
  atrPeriod: number;
  levelToleranceAtr: number;
  levelTolerancePct: number;
  atLevelAtr: number;
  flipZoneAtr: number;
  equalLevelToleranceAtr: number;
  equalLevelTolerancePct: number;
  sweepLookback: number;
  breakLookback: number;
  displacementLookback: number;
  displacementBodyAtr: number;
  displacementBodyRatio: number;
  fvgLookback: number;
  fvgMinAtr: number;
  compressionAtr: number;
  accumulationLookback: number;
  volumeBaseWindow: number;
  volumeImpulseMult: number;
  volumeQuietMult: number;
  directionMinSignals: number;
  strictMinScore: number;
  entryStageScore: number;
  swingWindow: number;
  stopBufferAtr: number;
  tp2ExtensionAtr: number;
  evidenceHighScore: number;
  evidenceMediumScore: number;
  chochLookback: number;
  obLookback: number;
  obProximityAtr: number;
  breakerProximityAtr: number;
  fibSwingWindow: number;
  fibEquilibriumBand: number;
  fibTpExtension: number;
}

export const DEFAULT_DEN_RULES: DenRules = {
  components: DEFAULT_DEN_COMPONENTS,
  pivotWidth: 2,
  atrPeriod: 14,
  levelToleranceAtr: 0.35,
  levelTolerancePct: 0.0005,
  atLevelAtr: 0.8,
  flipZoneAtr: 1.5,
  equalLevelToleranceAtr: 0.2,
  equalLevelTolerancePct: 0.0003,
  sweepLookback: 25,
  breakLookback: 20,
  displacementLookback: 12,
  displacementBodyAtr: 1.3,
  displacementBodyRatio: 0.6,
  fvgLookback: 30,
  fvgMinAtr: 0.15,
  compressionAtr: 3.2,
  accumulationLookback: 25,
  volumeBaseWindow: 20,
  volumeImpulseMult: 1.2,
  volumeQuietMult: 1.1,
  directionMinSignals: 3,
  strictMinScore: 7,
  entryStageScore: 12,
  swingWindow: 20,
  stopBufferAtr: 0.2,
  tp2ExtensionAtr: 1.5,
  evidenceHighScore: 12,
  evidenceMediumScore: 8,
  chochLookback: 30,
  obLookback: 40,
  obProximityAtr: 1.5,
  breakerProximityAtr: 1.5,
  fibSwingWindow: 40,
  fibEquilibriumBand: 0.03,
  fibTpExtension: 1.618,
};

/** Fibonacci levels the engine reports. Fixed ratios, not user-editable. */
export const FIB_RETRACEMENTS = [0.382, 0.5, 0.618, 0.705, 0.786] as const;
export const FIB_EXTENSIONS = [1.272, 1.618, 2.0, 2.618] as const;

export type DenNumericKey = Exclude<keyof DenRules, "components">;

export interface DenRuleField {
  key: DenNumericKey;
  label: string;
  /** Plain-English statement of the rule this number controls. */
  rule: string;
  min: number;
  max: number;
  step: number;
  unit?: string;
}

export interface DenRuleGroup {
  title: string;
  intro: string;
  fields: DenRuleField[];
}

export const DEN_RULE_GROUPS: DenRuleGroup[] = [
  {
    title: "Swings & structure",
    intro:
      "A swing high is a candle whose high is the highest within N candles either side of it (a swing low is the mirror). The last three swings decide the trend: higher highs + higher lows = bullish, lower highs + lower lows = bearish, anything else = ranging.",
    fields: [
      {
        key: "pivotWidth",
        label: "Swing width",
        rule: "Candles required on each side before a high or low counts as a swing point. Higher = fewer, bigger swings.",
        min: 1,
        max: 6,
        step: 1,
        unit: "candles",
      },
      {
        key: "atrPeriod",
        label: "ATR period",
        rule: "Number of candles averaged for ATR (average true range). ATR is the unit almost every other rule below is measured in.",
        min: 5,
        max: 50,
        step: 1,
        unit: "candles",
      },
      {
        key: "breakLookback",
        label: "Structure-break lookback",
        rule: "How many recent candles are scanned for a break of a prior swing (BOS/MSS). A break scores 2 when the candle closes beyond the level, 1 when it only wicks through.",
        min: 5,
        max: 120,
        step: 1,
        unit: "candles",
      },
    ],
  },
  {
    title: "Support, resistance & liquidity",
    intro:
      "Swing points within a tolerance band are merged into one level. Levels below price are support, above price are resistance; levels touched twice or more become liquidity pools.",
    fields: [
      {
        key: "levelToleranceAtr",
        label: "Level merge tolerance",
        rule: "Swings closer than this many ATR are treated as the same level.",
        min: 0.05,
        max: 2,
        step: 0.05,
        unit: "x ATR",
      },
      {
        key: "levelTolerancePct",
        label: "Minimum merge tolerance",
        rule: "Floor for the merge band as a fraction of price, so very quiet markets still group levels. 0.0005 = 0.05% of price.",
        min: 0,
        max: 0.01,
        step: 0.0001,
        unit: "x price",
      },
      {
        key: "atLevelAtr",
        label: "Reacting-at-level distance",
        rule: "Price must be within this many ATR of the nearest level to score the support/resistance point.",
        min: 0.1,
        max: 3,
        step: 0.1,
        unit: "x ATR",
      },
      {
        key: "flipZoneAtr",
        label: "Flipped-level zone",
        rule: "A broken resistance still counts as support while price stays within this many ATR above it.",
        min: 0.2,
        max: 5,
        step: 0.1,
        unit: "x ATR",
      },
      {
        key: "equalLevelToleranceAtr",
        label: "Equal-highs tolerance",
        rule: "Highs (or lows) within this many ATR of each other count as equal highs/lows — a liquidity pool.",
        min: 0.02,
        max: 1,
        step: 0.02,
        unit: "x ATR",
      },
      {
        key: "equalLevelTolerancePct",
        label: "Minimum equal-highs tolerance",
        rule: "Floor for the equal-highs band as a fraction of price.",
        min: 0,
        max: 0.01,
        step: 0.0001,
        unit: "x price",
      },
      {
        key: "sweepLookback",
        label: "Sweep lookback",
        rule: "How many recent candles are scanned for a liquidity sweep (price trades beyond a prior swing). Closing back inside scores 2, staying outside scores 1.",
        min: 5,
        max: 120,
        step: 1,
        unit: "candles",
      },
    ],
  },
  {
    title: "Momentum: displacement, AMD & gaps",
    intro:
      "Displacement is one decisive candle. AMD scores 2 only when accumulation (a tight range), manipulation (a sweep) and distribution (expansion after that sweep) all appear, and 1 when two of the three do.",
    fields: [
      {
        key: "displacementLookback",
        label: "Displacement lookback",
        rule: "How many recent candles are checked for a decisive expansion candle.",
        min: 3,
        max: 60,
        step: 1,
        unit: "candles",
      },
      {
        key: "displacementBodyAtr",
        label: "Displacement body size",
        rule: "Candle body must be at least this many ATR to count as displacement.",
        min: 0.5,
        max: 4,
        step: 0.1,
        unit: "x ATR",
      },
      {
        key: "displacementBodyRatio",
        label: "Displacement body-to-range",
        rule: "Body must be at least this share of the candle's full range, so long-wicked candles are rejected.",
        min: 0.2,
        max: 1,
        step: 0.05,
        unit: "ratio",
      },
      {
        key: "compressionAtr",
        label: "Accumulation tightness",
        rule: "The pre-move window counts as accumulation when its whole high-low range fits inside this many ATR.",
        min: 1,
        max: 8,
        step: 0.1,
        unit: "x ATR",
      },
      {
        key: "accumulationLookback",
        label: "Accumulation window",
        rule: "How many recent candles are scanned for the pre-move accumulation range. The most recent third of that window is excluded so the expansion itself is not measured.",
        min: 10,
        max: 120,
        step: 1,
        unit: "candles",
      },
      {
        key: "fvgLookback",
        label: "Fair value gap lookback",
        rule: "How many recent candles are scanned for a three-candle imbalance (candle 1's high below candle 3's low, or the mirror).",
        min: 5,
        max: 120,
        step: 1,
        unit: "candles",
      },
      {
        key: "fvgMinAtr",
        label: "Minimum gap size",
        rule: "A gap smaller than this many ATR is ignored as noise. Only unfilled gaps score.",
        min: 0.02,
        max: 1,
        step: 0.01,
        unit: "x ATR",
      },
    ],
  },
  {
    title: "Volume",
    intro:
      "Scored only when the symbol stores tick volume. The point is given when the move expands on volume and the pullback goes quiet.",
    fields: [
      {
        key: "volumeBaseWindow",
        label: "Volume baseline window",
        rule: "Number of recent candles averaged for the baseline volume.",
        min: 5,
        max: 100,
        step: 1,
        unit: "candles",
      },
      {
        key: "volumeImpulseMult",
        label: "Expansion multiple",
        rule: "Displacement-candle volume must exceed the baseline by this multiple.",
        min: 1,
        max: 5,
        step: 0.05,
        unit: "x average",
      },
      {
        key: "volumeQuietMult",
        label: "Pullback quiet multiple",
        rule: "The last three candles' average volume must stay below the baseline times this multiple.",
        min: 0.3,
        max: 3,
        step: 0.05,
        unit: "x average",
      },
    ],
  },
  {
    title: "Direction, trade plan & gating",
    intro:
      `Up to seven signals can vote on direction (HTF bias, sweep side, closed structure break, displacement direction, CHoCH, order block side, Fibonacci zone) — but only the components you've switched on above actually count. The side with enough votes, and more than the other side, sets the direction.`,
    fields: [
      {
        key: "directionMinSignals",
        label: "Signals needed for a direction",
        rule: "How many active signals must agree before the engine proposes a long or short. One or fewer active signals on both sides returns NO TRADE.",
        min: 1,
        max: 7,
        step: 1,
        unit: "signals",
      },
      {
        key: "swingWindow",
        label: "Stop/target swing window",
        rule: "The recent high and low used to place stops and targets are taken from this many candles.",
        min: 5,
        max: 100,
        step: 1,
        unit: "candles",
      },
      {
        key: "stopBufferAtr",
        label: "Stop buffer",
        rule: "Extra room placed beyond the swing or swept level when setting the stop loss.",
        min: 0,
        max: 2,
        step: 0.05,
        unit: "x ATR",
      },
      {
        key: "tp2ExtensionAtr",
        label: "Second target extension",
        rule: "Target 2 is pushed this many ATR beyond target 1 / the swing extreme.",
        min: 0.2,
        max: 6,
        step: 0.1,
        unit: "x ATR",
      },
      {
        key: "entryStageScore",
        label: "Entry-available score",
        rule: "Checklist score (out of 16) at which the setup stage becomes ENTRY AVAILABLE instead of SETUP CONFIRMED.",
        min: 4,
        max: 16,
        step: 1,
        unit: "/ 16",
      },
      {
        key: "strictMinScore",
        label: "Strict-mode floor",
        rule: "With strict mode on in Risk settings, a directional call below this score is downgraded to WAIT.",
        min: 0,
        max: 16,
        step: 1,
        unit: "/ 16",
      },
      {
        key: "evidenceHighScore",
        label: "HIGH evidence score",
        rule: "Score at or above which the read is labelled HIGH evidence.",
        min: 4,
        max: 16,
        step: 1,
        unit: "/ 16",
      },
      {
        key: "evidenceMediumScore",
        label: "MEDIUM evidence score",
        rule: "Score at or above which the read is labelled MEDIUM evidence (below it, LOW).",
        min: 1,
        max: 16,
        step: 1,
        unit: "/ 16",
      },
    ],
  },
  {
    title: "Smart Money Concepts (CHoCH, order blocks, Fibonacci)",
    intro:
      "An order block is the last opposing candle before a displacement that broke structure. A breaker block is an order block price traded straight through and later came back to retest. CHoCH is the first break against the current trend. The dealing range is the recent swing high to swing low: below 50% is discount, above is premium.",
    fields: [
      {
        key: "chochLookback",
        label: "CHoCH lookback",
        rule: "How many recent candles are scanned for a counter-trend structure break. Closing beyond scores 2, wicking through scores 1.",
        min: 5,
        max: 150,
        step: 1,
        unit: "candles",
      },
      {
        key: "obLookback",
        label: "Order block lookback",
        rule: "How far back the engine searches for the displacement candle whose origin becomes the order block.",
        min: 5,
        max: 150,
        step: 1,
        unit: "candles",
      },
      {
        key: "obProximityAtr",
        label: "Order block proximity",
        rule: "Price must be within this many ATR of a fresh order block to score the full 2 points.",
        min: 0.2,
        max: 6,
        step: 0.1,
        unit: "x ATR",
      },
      {
        key: "breakerProximityAtr",
        label: "Breaker retest distance",
        rule: "A failed order block scores once price returns within this many ATR of it.",
        min: 0.2,
        max: 6,
        step: 0.1,
        unit: "x ATR",
      },
      {
        key: "fibSwingWindow",
        label: "Dealing range window",
        rule: "Candles used to find the swing high and swing low that define the Fibonacci dealing range.",
        min: 10,
        max: 200,
        step: 1,
        unit: "candles",
      },
      {
        key: "fibEquilibriumBand",
        label: "Equilibrium band",
        rule: "How close to the 50% level counts as equilibrium rather than premium or discount. 0.03 = 3% of the range.",
        min: 0,
        max: 0.2,
        step: 0.01,
        unit: "of range",
      },
      {
        key: "fibTpExtension",
        label: "Extension used for target 2",
        rule: "Which Fibonacci extension of the dealing range is used as the second take-profit when Fibonacci is active (1.272, 1.618, 2.0 or 2.618).",
        min: 1.272,
        max: 2.618,
        step: 0.001,
        unit: "x range",
      },
    ],
  },
];

const FIELD_BY_KEY = new Map<DenNumericKey, DenRuleField>(
  DEN_RULE_GROUPS.flatMap((group) => group.fields).map((field) => [field.key, field]),
);

/** Clamps a stored/partial rulebook into a valid, complete one. */
export function normalizeDenRules(input: unknown): DenRules {
  const raw = (input ?? {}) as Record<string, unknown>;
  const out: DenRules = { ...DEFAULT_DEN_RULES, components: { ...DEFAULT_DEN_COMPONENTS } };

  const rawComponents = raw["components"];
  if (rawComponents && typeof rawComponents === "object") {
    const map = rawComponents as Record<string, unknown>;
    for (const key of DEN_COMPONENT_KEYS) {
      if (typeof map[key] === "boolean") out.components[key] = map[key] as boolean;
    }
  }

  for (const key of Object.keys(DEFAULT_DEN_RULES) as DenNumericKey[]) {
    const value = Number(raw[key]);
    if (!Number.isFinite(value)) continue;
    const field = FIELD_BY_KEY.get(key);
    const min = field?.min ?? 0;
    const max = field?.max ?? Number.MAX_SAFE_INTEGER;
    const clamped = Math.min(max, Math.max(min, value));
    out[key] = field && field.step >= 1 ? Math.round(clamped) : clamped;
  }
  return out;
}
