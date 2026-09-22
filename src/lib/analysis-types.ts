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
  | "risk_reward"
  // Smart Money Concepts components — scored by the Den Analyzer only.
  | "choch"
  | "order_block"
  | "breaker_block"
  | "fibonacci";

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

/**
 * Extra Smart Money Concepts components. Only the rule-based Den Analyzer
 * scores these, so the AI checklist and its 16-point maximum stay unchanged.
 */
export const SMC_CHECKLIST_SPEC: ChecklistSpec[] = [
  {
    key: "choch",
    label: "Change of Character",
    max: 2,
    help: "CHoCH — the first structural break against the prevailing trend, the earliest hint the trend may be turning.",
    rule: "2 = a counter-trend swing was broken with a close beyond. 1 = counter-trend break wicked only. 0 = no counter-trend break.",
  },
  {
    key: "order_block",
    label: "Order Block",
    max: 2,
    help: "The last opposing candle before a strong displacement that broke structure — where institutional orders likely sit.",
    rule: "2 = fresh (unmitigated) order block and price is near it. 1 = order block exists but is mitigated or far away. 0 = none.",
  },
  {
    key: "breaker_block",
    label: "Breaker Block",
    max: 1,
    help: "An order block that failed — price broke through it and later returned to retest it from the other side.",
    rule: "1 = a failed order block has been retested or price is at it. 0 = no breaker.",
  },
  {
    key: "fibonacci",
    label: "Fibonacci & Premium/Discount",
    max: 1,
    help: "The dealing range from the recent swing high to swing low. Below 50% is discount (favours longs), above 50% is premium (favours shorts).",
    rule: "1 = price sits on the favourable side of equilibrium for the proposed direction (or in a key retracement zone). 0 = price is on the wrong side of 50%.",
  },
];

/** Every component the app knows about, AI-scored plus SMC extras. */
export const ALL_CHECKLIST_SPEC: ChecklistSpec[] = [...CHECKLIST_SPEC, ...SMC_CHECKLIST_SPEC];

export const CHECKLIST_BY_KEY: Record<ChecklistKey, ChecklistSpec> = Object.fromEntries(
  ALL_CHECKLIST_SPEC.map((item) => [item.key, item]),
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
  /** Which provider/model actually served this analysis (data-mode only). */
  provider_used?: string | null;
  model_used?: string | null;
  // Den profitability layer (optional; only Den Analyzer fills these)
  tradable?: boolean;
  tradable_reasons?: string[];
  setup_type?: string | null;
  position_size?: number | null;
  risk_amount?: number | null;
  session_key?: string | null;
  session_label?: string | null;
  /** One-line what to wait for when direction is WAIT */
  waiting_for?: string | null;
}

/**
 * Grade bands. The grade describes setup quality — never a probability.
 * Bands are proportional so a modular checklist with fewer active components
 * grades on the same scale as the full 16-point one.
 */
export function gradeFor(score: number, max: number = MAX_SCORE): Grade {
  const ratio = max > 0 ? score / max : 0;
  if (ratio >= 13 / MAX_SCORE) return "A";
  if (ratio >= 10 / MAX_SCORE) return "B";
  if (ratio >= 7 / MAX_SCORE) return "C";
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
export function normalizeChecklist(
  raw: unknown,
  specs: ChecklistSpec[] = CHECKLIST_SPEC,
): ChecklistItem[] {
  const list = Array.isArray(raw) ? raw : [];
  return specs.map((spec) => {
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

export function checklistMax(checklist: ChecklistItem[]): number {
  return checklist.reduce((sum, item) => sum + item.max, 0);
}

export function totalScore(checklist: ChecklistItem[]): number {
  return Math.min(
    checklist.reduce((sum, item) => sum + clampInt(item.score, item.max), 0),
    checklistMax(checklist),
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

  Holdout:
    "The final segment of the backtest timeline (e.g. last 30% of bars after warmup). Metrics on this segment are the primary honesty check against overfitting.",
  "Holdout %":
    "Percentage of the tradeable timeline reserved as the unseen test window. 30 means the latest 30%.",
  "Holdout Avg R":
    "Mean realized R for setups whose signal time falls inside the holdout window only.",
  "Train Avg R":
    "Mean realized R for setups in the earlier (non-holdout) window.",
  Backtest:
    "Historical walk-forward simulation of the Den Analyzer signals with no lookahead bias.",
  "Walk-forward":
    "At each step only candles with time <= current step are visible to the analyzer.",
  Overfitting:
    "Fitting rules so tightly to historical data that out-of-sample performance collapses.",
  Tradable:
    "Passes the Den profitability / quality gate (grade, score, R:R, optional session).",

  "Trading session":
    "Market hours grouped by region (Asian, London, New York). Activity and volatility often change by session.",
  Asian: "Typical Asian-session hours in UTC when Asia is the main active region.",
  London: "Typical London-session hours in UTC.",
  "New York": "Typical New York-session hours in UTC.",
  "London + NY overlap": "Hours when both London and New York sessions are open — often highest FX liquidity.",
  "Session filter": "Optional gate that only allows analysis while selected sessions are active.",
  "Max loss": "Account currency amount risked if the stop is hit at the planned position size.",
};

/**
 * Kid-simple explanations. Every technical word in the UI gets a question mark
 * that opens one of these — plain words first, jargon second.
 */
export const SIMPLE_TERMS: Record<string, string> = {
  // --- Big picture ---
  HTF: "The big-picture chart. Like looking at a whole city from a plane instead of one street.",
  MTF: "The medium chart. Between the big picture and the close-up.",
  LTF: "The close-up chart. Like using a magnifying glass to pick the exact moment.",
  "HTF bias": "Which way the big picture is leaning: up, down, or mixed.",
  "HTF Structure": "The big-picture path of swing highs and lows — is it mostly climbing, falling, or stuck?",

  // --- Checklist labels (must match UI labels) ---
  "Support / Resistance": "Floors and ceilings price bounced from before. Support is a floor; resistance is a ceiling.",
  Support: "A floor area where price often stopped falling and bounced up.",
  Resistance: "A ceiling area where price often stopped rising and turned down.",
  Liquidity: "Places where lots of stop orders likely sit — like candy jars price likes to reach into.",
  "Liquidity Sweep": "Price pokes past a high or low to grab those stops, then turns back. A wick alone is not enough.",
  "AMD Model": "A three-step story: quiet build-up, a fake move that tricks people, then a real run the other way.",
  AMD: "Quiet range → fake break → real move. Only count it when all three steps are clear.",
  "MSS / BOS": "Structure break: either the trend continues (BOS) or the character changes (MSS).",
  MSS: "The trend changes its mind (for example downtrend starts making higher highs).",
  BOS: "The trend keeps going and breaks past its last swing point.",
  "Change of Character": "The first clear break against the old trend — an early hint the story may be flipping.",
  CHoCH: "Same as Change of Character: first break against the old trend.",
  Displacement: "One big strong candle — like a sudden sprint, not a slow walk.",
  "FVG / Imbalance": "A gap left when price moved too fast. Price often comes back to fill that empty spot.",
  FVG: "A gap from a fast move that price may revisit later.",
  Volume: "How busy trading was. Loud on the break, quieter on the pullback is a common healthy pattern.",
  "Risk / Reward": "How much you could win compared to how much you could lose. It does NOT say how often you win.",
  "Order Block": "The last opposite candle before a strong push. Price often returns to that area later.",
  "Breaker Block": "An order block that failed; price smashed through it and may retest it from the other side.",
  "Fibonacci & Premium/Discount": "A measuring stick on a swing. Discount = cheaper half (better for buys). Premium = expensive half (better for sells).",
  Fibonacci: "A measuring stick between a swing high and low to find discount and premium zones.",

  // --- Plan & risk ---
  R: "One R is the money you agreed to risk on the trade. +2R means you made about twice that. −1R means you lost that amount.",
  "R:R": "Reward compared to risk. 1:2 means you aim to make about twice what you risk. Not a win-rate promise.",
  "Average R": "On average, how many R you made or lost per finished trade. Very important for profit.",
  "Avg R": "Same as Average R: average result per trade in R units.",
  "Entry zone": "The price area where you would start the trade if the plan is still valid.",
  "Stop loss": "The “I was wrong” price. Getting out here keeps a small loss small.",
  "Stop / invalidation": "The price that says the idea failed — leave so the loss stays controlled.",
  TP1: "First profit target — a nearby place you might take some profit.",
  TP2: "Further profit target if price keeps going your way.",
  "Position size": "How many units to trade so that being wrong only costs your chosen risk amount.",
  "Risk per trade": "The slice of your account you allow yourself to lose on one trade (for example 1%).",
  "Max loss": "The most money this plan is allowed to lose if the stop is hit.",
  Tradable: "The app thinks the setup is clear enough to show a full plan. Still not a promise of profit.",

  // --- Results & journal ---
  "Setup quality": "Checklist score for how many good pieces this chart has. A report card, not a fortune teller.",
  Grade: "A letter (A–D) for how strong the checklist score was.",
  "Visual evidence": "How clearly the clues appear on the chart or in the data. Not the chance of winning.",
  "Historical edge": "How similar setups in your own journal ended. Needs enough past trades to mean anything.",
  "Sample quality": "Whether you have enough past trades for the numbers to be meaningful yet.",
  "Comparable setups": "Past trades that look a lot like this one, so comparing them is fair.",
  "Win rate": "Out of finished trades, what percent made money. High win rate alone does not mean profit.",
  Expectancy: "Average money result per trade (in R). Positive expectancy is the real goal.",
  "Profit factor": "Total wins divided by total losses. Above 1 means more won than lost.",
  "Max drawdown": "The biggest drop from a peak. How painful the worst stretch was.",
  Breakeven: "Finished with basically no win and no loss.",
  Outcome: "What really happened: win, loss, breakeven, missed, or invalidated.",
  Invalidation: "Warning signs the idea is dead. If these happen, cancel the plan.",
  "Invalidation watch": "The list of “idea is broken” conditions to watch.",
  "Setup stage": "How far along the idea is: still forming, ready, already gone, or dead.",
  "Required confirmation": "Extra proof you still need to see on the chart before acting.",
  WAIT: "Not ready yet. Wait for a specific price event (the app should say which one).",
  "POTENTIAL LONG": "The rules lean toward a possible buy idea — still conditional.",
  "POTENTIAL SHORT": "The rules lean toward a possible sell idea — still conditional.",
  "NO TRADE": "No clear idea right now. Sitting out is allowed.",

  // --- Backtest ---
  Backtest: "Practice on past candles: the app pretends it traded in the past and counts the results.",
  "Walk-forward": "Moves one candle at a time and never peeks into the future when deciding. Fair test.",
  Holdout: "The newest slice of history (like the last 30%). Treat it as the final exam for the strategy.",
  "Holdout %": "How much of the timeline is the final exam. 30% = the latest 30% of the test period.",
  "Holdout Avg R": "Average R on that newest slice only. Trust this more than the full-sample number.",
  "Train Avg R": "Average R on the older part. Useful for comparison, not the main grade.",
  "Full sample": "All trades in the whole test (old + new). Can look too good if you got lucky overall.",
  "Resolved setups": "Trades that already hit take-profit or stop.",
  Unresolved: "Price never hit take-profit or stop in time — not counted as a win or a loss.",
  "Simulation step": "Which timeframe’s candles move the backtest clock (for example each M15 close).",
  "History depth": "How many past candles to load. More candles = longer history, slower run.",
  Overfitting: "Rules that look amazing on the past only because they were tuned too tightly — then fail on new data.",
  "Strict mode": "Stricter filter: weak scores become WAIT instead of a full plan.",
  Den: "Your rule-based analyzer (no AI). It only follows fixed checklist rules on stored candles.",

  // --- Sessions ---
  "Trading session": "Which part of the world is actively trading right now (Asia, London, New York).",
  Session: "A block of hours when a region’s market is open and volume is usually higher.",
  Asian: "Asia trading hours. Often quieter for many FX pairs.",
  London: "London trading hours. Often more movement for FX.",
  "New York": "New York trading hours. Another busy stretch for FX.",
  "London + NY overlap": "When London and New York are open together — often the busiest FX time.",
  Overlap: "When two sessions are open at the same time.",
  "Session filter": "Optional rule: only run analysis when your chosen sessions are open.",
  "Only analyze during selected sessions": "If on, the app blocks a run when none of your chosen sessions is open.",
  UTC: "A shared world clock so session times match everywhere.",

  // --- UI sections ---
  "Conditional trade plan": "A plan that is only valid if the listed conditions still hold. Not an order to trade.",
  "Educational trade plan": "A practice plan for learning. Not financial advice and not a command to trade.",
  "In plain English": "The same idea explained with everyday words.",
  "Why this read": "Step-by-step reasons behind the conclusion, so you can learn the logic.",
  "Journal this setup": "Save what happened so your future statistics stay honest.",
  "Risk management": "Deciding in advance how much you can lose so one trade cannot hurt too much.",
  "Smart Money": "A chart-reading style focused on liquidity and structure — not proof of what banks did.",
  "Market illustration": "A simple drawing of the candles with optional lines for levels and checklist ideas.",

  "Performance statistics":
    "A report card of your finished trades: wins, losses, and average R. Only real outcomes count.",
  Trades: "How many finished trades are in this report.",
  "Avg winner": "When you won, how big the win was on average (in R).",
  "Avg loser": "When you lost, how big the loss was on average (in R).",
  Cumulative: "Running total of all your R results added together.",
  "Cumulative R": "Running total of all your R results added together.",
  "Journal history": "Your diary of saved chart reads. Write what really happened so the numbers stay honest.",
  "Admin market history": "Saved reads from the admin market tool (Den Analyzer on live stored candles).",
  "Backtest history": "Saved practice runs on past candles so you can reload the same test later.",
  Analyze: "The page where you check a setup with the checklist (from screenshots or market data).",
  "Topic strength": "How well you are doing on each lesson topic in the Academy quizzes.",
  Academy: "Practice lessons and quizzes so you learn the ideas before risking money.",
  Journal: "Your trading diary: history of ideas, real results, and notes.",
  Home: "The main screen: session clock, news, and (for admin) market tools.",

  "My edge board":
    "A scoreboard of what has worked for YOU from finished journal trades. It does not change the Den Analyzer rules.",
  "By symbol": "Your results grouped by market (for example EURUSD vs Gold).",
  "By grade": "Your results grouped by setup letter grade (A, B, C, D).",
  "By direction": "Your results for buys (long) versus sells (short).",
  "By timeframe": "Your results grouped by the main timeframe of the setup.",

  "From saved backtests":
    "Practice results you saved from the Backtest page. Helpful hints only — not the same as real journal trades.",
};


export const DISCLAIMER =
  "ChartPilot is an educational analysis assistant, not financial advice. Every trade plan is conditional, not a prediction or an instruction to trade. Nothing here guarantees any result.";
