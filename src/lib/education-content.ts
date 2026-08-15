/**
 * ChartPilot educational content.
 *
 * Static, hand-written teaching material. Nothing here predicts price and
 * nothing here promises a result — every concept card ends in evidence,
 * invalidation and the common beginner mistake.
 */

export type TopicKey =
  | "market_structure"
  | "support_resistance"
  | "liquidity"
  | "liquidity_sweep"
  | "amd"
  | "mss_bos"
  | "displacement"
  | "fvg"
  | "volume"
  | "risk_management"
  | "trade_planning";

export const TOPICS: { key: TopicKey; label: string }[] = [
  { key: "market_structure", label: "Market Structure" },
  { key: "support_resistance", label: "Support / Resistance" },
  { key: "liquidity", label: "Liquidity" },
  { key: "liquidity_sweep", label: "Liquidity Sweep" },
  { key: "amd", label: "AMD" },
  { key: "mss_bos", label: "MSS / BOS" },
  { key: "displacement", label: "Displacement" },
  { key: "fvg", label: "FVG" },
  { key: "volume", label: "Volume" },
  { key: "risk_management", label: "Risk Management" },
  { key: "trade_planning", label: "Trade Planning" },
];

export const TOPIC_LABEL: Record<TopicKey, string> = Object.fromEntries(
  TOPICS.map((t) => [t.key, t.label]),
) as Record<TopicKey, string>;

export interface Concept {
  id: string;
  name: string;
  topic: TopicKey;
  /** Technical definition. */
  technical: string;
  /** Plain, child-friendly wording. */
  simple: string;
  /** Where it shows up on a chart. */
  where: string;
  /** Why a trader cares. */
  why: string;
  /** What counts as supporting evidence. */
  evidence: string;
  /** What is usually missing / unknowable from a screenshot. */
  missing: string;
  /** What would invalidate the interpretation. */
  invalidates: string;
  /** The classic beginner error. */
  mistake: string;
  /** Concrete worked example. */
  example: string;
}

export const CONCEPTS: Concept[] = [
  {
    id: "market_structure",
    name: "Market structure",
    topic: "market_structure",
    technical:
      "The sequence of swing highs and swing lows that describes whether price is trending up, trending down or ranging.",
    simple: "Is the chart making steps upward, steps downward, or just wobbling side to side?",
    where: "Read from the meaningful swing points on the highest timeframe you uploaded.",
    why: "Every other read — liquidity, sweeps, entries — is judged against this direction.",
    evidence: "At least two consecutive higher highs and higher lows (or the bearish mirror).",
    missing: "Structure off the left edge of the screenshot, and anything above your highest timeframe.",
    invalidates: "A close beyond the last protected swing in the opposite direction.",
    mistake: "Reading structure from the colour of the last candle instead of from swing points.",
    example:
      "Price sets 100 → 90 → 112 → 98 → 125: highs and lows are both rising, so structure is bullish.",
  },
  {
    id: "higher_high",
    name: "Higher High (HH)",
    topic: "market_structure",
    technical: "A swing high that prints above the previous swing high.",
    simple: "The chart reached a new top that is taller than the last top.",
    where: "At the tip of an upward wick/peak that exceeds the prior peak.",
    why: "Confirms buyers are still able to push past the previous ceiling.",
    evidence: "A clearly separated peak with a pullback on both sides of it.",
    missing: "Whether the high was made on real participation — volume is often not visible.",
    invalidates: "The following low breaking under the prior higher low.",
    mistake: "Calling every tiny bump a HH; a swing needs a pullback either side to count.",
    example: "Peak at 112 followed later by a peak at 125 — the 125 peak is the higher high.",
  },
  {
    id: "higher_low",
    name: "Higher Low (HL)",
    topic: "market_structure",
    technical: "A swing low that forms above the previous swing low.",
    simple: "The chart dipped, but not as deep as last time.",
    where: "At the bottom of a pullback inside an uptrend.",
    why: "Shows buyers stepping in earlier — the engine of an uptrend.",
    evidence: "A visible pullback that turns before the previous low.",
    missing: "Whether the low will hold — that is only known later.",
    invalidates: "Price closing below that higher low.",
    mistake: "Treating an intraday wobble as a HL on a daily-structure read.",
    example: "Lows at 90 then 98: the 98 low is the higher low.",
  },
  {
    id: "lower_high",
    name: "Lower High (LH)",
    topic: "market_structure",
    technical: "A swing high that forms below the previous swing high.",
    simple: "The chart tried to go up but stopped lower than last time.",
    where: "At the top of a bounce inside a downtrend.",
    why: "Shows sellers taking control earlier each time.",
    evidence: "A rejection wick or stall clearly under the previous peak.",
    missing: "Whether sellers were institutional or thin liquidity — unknowable from a picture.",
    invalidates: "A close above that lower high.",
    mistake: "Shorting the LH without any structural break to support it.",
    example: "Peaks at 125 then 118: 118 is the lower high.",
  },
  {
    id: "lower_low",
    name: "Lower Low (LL)",
    topic: "market_structure",
    technical: "A swing low printed beneath the previous swing low.",
    simple: "The chart fell to a new bottom, lower than the last bottom.",
    where: "Below the prior trough in a downtrend.",
    why: "Confirms downtrend continuation.",
    evidence: "A body close beneath the prior low, not just a wick through it.",
    missing: "Whether the break was a real break or a sweep — needs the next candles.",
    invalidates: "An immediate reclaim back above the broken low (that becomes a sweep instead).",
    mistake: "Confusing a wick below a low with a genuine lower low.",
    example: "Lows at 98 then 88: 88 is the lower low.",
  },
  {
    id: "support",
    name: "Support",
    topic: "support_resistance",
    technical: "A price zone where demand has previously stopped a decline.",
    simple: "A floor the price has bounced off before.",
    where: "Under price, at prior swing lows, range bottoms, or a broken resistance that was retested.",
    why: "Reactions often repeat at zones many participants can see.",
    evidence: "Two or more separate reactions from the same zone.",
    missing: "How much resting demand is actually there today.",
    invalidates: "A decisive close through the zone with follow-through.",
    mistake: "Drawing support as a single exact price instead of a zone.",
    example: "Price bounced from 1,940–1,948 three times: that band is support, not the single number 1,944.",
  },
  {
    id: "resistance",
    name: "Resistance",
    topic: "support_resistance",
    technical: "A price zone where supply has previously stopped an advance.",
    simple: "A ceiling the price has bumped its head on before.",
    where: "Above price, at prior swing highs, range tops or broken support retested from below.",
    why: "Gives a logical place for targets and for setups to fail.",
    evidence: "Repeated rejection wicks or stalls in the same band.",
    missing: "Whether sellers are still there — old levels decay.",
    invalidates: "A decisive close above the band that then holds on a retest.",
    mistake: "Assuming resistance must hold rather than treating it as a decision zone.",
    example: "Two rejections from 2,080–2,090 make that band resistance.",
  },
  {
    id: "liquidity",
    name: "Liquidity",
    topic: "liquidity",
    technical: "Areas where resting orders and protective stops are likely clustered.",
    simple: "Places where lots of people probably have orders waiting — a magnet for price.",
    where: "Beyond obvious highs and lows, equal highs/lows, and range extremes.",
    why: "Price often travels toward liquidity because that is where trades can be filled.",
    evidence: "Clean, obvious highs/lows that everyone can see on the chart.",
    missing: "The actual order book. Liquidity is always inferred, never known.",
    invalidates: "Liquidity already taken earlier — it cannot be taken twice.",
    mistake: "Claiming to 'know' where liquidity is instead of saying where it is likely.",
    example: "Three highs at almost exactly 108 suggest stops resting just above 108.",
  },
  {
    id: "buyside_liquidity",
    name: "Buy-side liquidity",
    topic: "liquidity",
    technical: "Resting buy orders — mostly short-sellers' stops — sitting above highs.",
    simple: "Waiting buy orders above the tops of the chart.",
    where: "Above previous highs and equal highs.",
    why: "Explains why price sometimes spikes upward before falling.",
    evidence: "Visible equal or obvious highs.",
    missing: "The size of the pool.",
    invalidates: "The highs already being run through and left behind.",
    mistake: "Treating a spike into buy-side liquidity as a breakout to chase.",
    example: "Price pushes 5 ticks above a triple top, fills stops, then reverses.",
  },
  {
    id: "sellside_liquidity",
    name: "Sell-side liquidity",
    topic: "liquidity",
    technical: "Resting sell orders — mostly long-holders' stops — sitting below lows.",
    simple: "Waiting sell orders under the bottoms of the chart.",
    where: "Below previous lows, equal lows and range bottoms.",
    why: "Explains sharp dips that immediately recover.",
    evidence: "Visible equal or obvious lows.",
    missing: "The size of the pool.",
    invalidates: "Those lows already having been swept.",
    mistake: "Panic-selling into the sweep instead of watching for the reclaim.",
    example: "A long lower wick that pierces a double bottom then closes back inside.",
  },
  {
    id: "liquidity_sweep",
    name: "Liquidity sweep",
    topic: "liquidity_sweep",
    technical: "Price trades through a prior high or low, takes the resting orders, then rejects or reclaims the level.",
    simple: "Price pokes past a top or bottom to grab orders, then turns back around.",
    where: "At the extreme of an obvious high or low, usually as a long wick.",
    why: "A sweep plus a reclaim is one of the cleaner reversal clues on a chart.",
    evidence: "Penetration of the level AND a close back on the original side.",
    missing: "Whether the reclaim will hold — the next candles decide.",
    invalidates: "Price continuing beyond the level and accepting there.",
    mistake: "Calling every wick a sweep. A wick with no rejection or reclaim is just a wick.",
    example: "Price dips 0.4% below the weekly low, then closes back above it in the same session.",
  },
  {
    id: "amd",
    name: "AMD (Accumulation → Manipulation → Distribution)",
    topic: "amd",
    technical: "A three-phase model: a range builds, a false break takes liquidity, then price expands directionally.",
    simple: "Price rests quietly, plays a trick, then makes its real move.",
    where: "Across a consolidation, its false break, and the expansion that follows.",
    why: "It frames the false break as information rather than as a signal to chase.",
    evidence: "All three phases visible in sequence on the same screenshot.",
    missing: "Intent. Nobody can prove a move was deliberate manipulation.",
    invalidates: "Price returning inside the range after the supposed distribution.",
    mistake: "Forcing AMD onto every chart. Most charts are not an AMD.",
    example: "A four-hour range, a spike below it that fails, then a strong rally through the range high.",
  },
  {
    id: "mss",
    name: "MSS — Market Structure Shift",
    topic: "mss_bos",
    technical: "A break of the most recent protected swing in the opposite direction of the prevailing trend.",
    simple: "Evidence that the market may be changing direction.",
    where: "At the last lower high (bullish MSS) or last higher low (bearish MSS).",
    why: "It is the first structural evidence that a trend may be turning.",
    evidence: "A body close beyond the named swing, ideally with displacement.",
    missing: "Whether the shift sticks — reversals fail often.",
    invalidates: "Price closing back inside the old structure.",
    mistake: "Calling every small break an MSS.",
    example: "In a downtrend, price closes above the last lower high after sweeping the low.",
  },
  {
    id: "bos",
    name: "BOS — Break of Structure",
    topic: "mss_bos",
    technical: "A continuation break: the trend takes out its previous swing in the trending direction.",
    simple: "The trend keeps going and breaks past its last stopping point.",
    where: "At the prior swing high in an uptrend, or prior swing low in a downtrend.",
    why: "Confirms the trend is still intact.",
    evidence: "A close beyond the swing, not just a wick.",
    missing: "Whether continuation follows or the break is sold into.",
    invalidates: "Immediate reclaim back inside the range — that becomes a sweep.",
    mistake: "Entering right at the break instead of waiting for the retracement.",
    example: "Uptrend closes above the previous 125 high: bullish BOS.",
  },
  {
    id: "displacement",
    name: "Displacement",
    topic: "displacement",
    technical: "A decisive, large-bodied expansion clearly bigger than surrounding candles, usually breaking structure.",
    simple: "One big strong candle — a sprint instead of a slow walk.",
    where: "Right at the structural break, immediately after a sweep in a clean model.",
    why: "Shows conviction and usually leaves an imbalance behind to trade back into.",
    evidence: "Candle range far above the recent average, with small wicks and follow-through.",
    missing: "Whether the move was news-driven — screenshots do not show news.",
    invalidates: "The whole candle being retraced immediately.",
    mistake: "Chasing the displacement candle instead of waiting for its retracement.",
    example: "After the sweep, one candle covers three times the average range and breaks the last LH.",
  },
  {
    id: "fvg",
    name: "FVG — Fair Value Gap / imbalance",
    topic: "fvg",
    technical: "A three-candle inefficiency where the first and third candle wicks do not overlap.",
    simple: "A skipped spot left by a fast move that price often comes back to fill.",
    where: "Inside the displacement leg.",
    why: "Gives a defined, conditional entry zone rather than a guess.",
    evidence: "A visible unfilled or partly filled gap between the wicks.",
    missing: "Candle detail — on a zoomed-out screenshot, gaps are frequently unreadable.",
    invalidates: "Price passing straight through the gap and closing beyond it.",
    mistake: "Treating every gap as a guaranteed bounce zone.",
    example: "Candle 1 high 102, candle 3 low 106 — the 102–106 band is an unfilled bullish FVG.",
  },
  {
    id: "volume",
    name: "Volume",
    topic: "volume",
    technical: "Traded quantity per candle, read relatively: expansion on breaks, contraction in ranges.",
    simple: "How busy the market was. Tall bars mean lots of trading.",
    where: "The histogram under the chart — only if the screenshot includes it.",
    why: "A break on shrinking volume deserves more suspicion.",
    evidence: "A visible histogram with a clear relative difference.",
    missing: "Volume is often cropped out entirely. Then the honest answer is 'not available'.",
    invalidates: "Volume contradicting the read — e.g. a breakout on the lowest volume of the session.",
    mistake: "Assuming a green volume bar means buyers won.",
    example: "Breakout candle prints double the 20-bar average volume.",
  },
  {
    id: "entry",
    name: "Entry",
    topic: "trade_planning",
    technical: "The conditional price zone at which a plan would begin, defined before the market gets there.",
    simple: "The price area where the plan would start — if the conditions happen.",
    where: "At the retracement into an FVG, an order-block or a reclaimed level.",
    why: "A pre-defined entry stops you from chasing.",
    evidence: "A zone that follows from the structure you already identified.",
    missing: "Spread, slippage and fills — none of that is visible.",
    invalidates: "Invalidation being hit before the entry ever triggers.",
    mistake: "Entering at market because the analysis 'looks good' rather than waiting for the zone.",
    example: "Enter only on a retracement into 104–106 after the bullish MSS.",
  },
  {
    id: "stop_loss",
    name: "Stop-loss",
    topic: "risk_management",
    technical: "A pre-placed exit that caps loss at the point where the idea is objectively wrong.",
    simple: "The 'I was wrong' price. You leave, so a small loss stays small.",
    where: "Beyond the swing that would break the idea, not at a round number you like.",
    why: "It is what makes risk finite and makes R measurable at all.",
    evidence: "A structural level that, if broken, kills the reasoning.",
    missing: "Volatility data such as ATR is usually not on the screenshot.",
    invalidates: "Nothing — a stop is a decision, not a prediction.",
    mistake: "Placing the stop where the loss feels affordable instead of where the idea dies.",
    example: "Long entry 105 with the sweep low at 99 → stop just below 99.",
  },
  {
    id: "invalidation",
    name: "Invalidation",
    topic: "risk_management",
    technical: "The observable condition that proves the analysis wrong, independent of profit and loss.",
    simple: "The sign that the idea is broken. If it happens, cancel the plan.",
    where: "Written down before entry — usually a close beyond a named level.",
    why: "Separates 'the market moved against me' from 'my read was wrong'.",
    evidence: "A specific level plus a specific condition (close, not touch).",
    missing: "Nothing — this is yours to define.",
    invalidates: "n/a",
    mistake: "Moving invalidation once price approaches it.",
    example: "Idea is dead on a 1H close below 99, whether or not the stop was hit.",
  },
  {
    id: "take_profit",
    name: "Take profit",
    topic: "trade_planning",
    technical: "A pre-defined area at which part or all of the position is closed, usually the next liquidity pool.",
    simple: "The place where you plan to bank some profit.",
    where: "At the next obvious high/low, range extreme or unfilled imbalance.",
    why: "Targeting liquidity is more objective than targeting a round number.",
    evidence: "A visible prior high/low or range boundary between entry and target.",
    missing: "Whether price reaches it at all.",
    invalidates: "Structure breaking against the position before the target is hit.",
    mistake: "Setting a target purely to make the R:R look attractive.",
    example: "TP1 at the equal highs at 118; TP2 at the range high at 125.",
  },
  {
    id: "risk_reward",
    name: "Risk / reward (R:R)",
    topic: "risk_management",
    technical: "Distance to target divided by distance to stop, expressed in units of risk (R).",
    simple: "How much you could win compared to how much you could lose.",
    where: "Measured between the entry, stop and target you already defined.",
    why: "It defines what win rate you would need to break even — nothing more.",
    evidence: "All three levels readable from the chart.",
    missing: "Win probability. R:R never tells you how often you will win.",
    invalidates: "Moving the stop or target after entry — that changes the real R:R.",
    mistake: "Reading 3R as 'a very likely trade'. It is a payoff ratio, not a probability.",
    example: "Entry 105, stop 99, TP 123 → 6 risk, 18 reward → 3R.",
  },
];

export const CONCEPT_BY_ID: Record<string, Concept> = Object.fromEntries(
  CONCEPTS.map((c) => [c.id, c]),
);

/** The ten guided steps of "Teach Me This Chart". */
export const TEACH_STEPS: { key: string; title: string; question: string; topic: TopicKey }[] = [
  { key: "structure", title: "Market structure", question: "What do you see — higher highs and higher lows, lower highs and lower lows, or a range?", topic: "market_structure" },
  { key: "levels", title: "Important levels", question: "Where is the nearest meaningful support or resistance?", topic: "support_resistance" },
  { key: "liquidity", title: "Liquidity", question: "Where might obvious liquidity be resting?", topic: "liquidity" },
  { key: "sweep", title: "Liquidity sweep", question: "Did price actually sweep that liquidity — and reclaim it?", topic: "liquidity_sweep" },
  { key: "mss", title: "MSS / BOS", question: "Did market structure change, continue, or neither?", topic: "mss_bos" },
  { key: "displacement", title: "Displacement", question: "Was there decisive movement, or ordinary candles?", topic: "displacement" },
  { key: "fvg", title: "FVG", question: "Is there a valid imbalance left behind?", topic: "fvg" },
  { key: "setup", title: "Trade setup", question: "Does the evidence actually justify a potential setup — or a WAIT?", topic: "trade_planning" },
  { key: "risk", title: "Risk", question: "Where exactly is this idea invalidated?", topic: "risk_management" },
  { key: "target", title: "Target", question: "Where is the next logical liquidity or target area?", topic: "trade_planning" },
];

export interface Lesson {
  id: string;
  title: string;
  topic: TopicKey;
  summary: string;
  body: string[];
  mistake: string;
}

export interface AcademyLevel {
  level: number;
  title: string;
  blurb: string;
  lessons: Lesson[];
}

export const ACADEMY: AcademyLevel[] = [
  {
    level: 1,
    title: "Foundations",
    blurb: "How to read a candle, a timeframe and the shape of a trend.",
    lessons: [
      {
        id: "l1-candles",
        title: "Candlesticks",
        topic: "market_structure",
        summary: "One candle = open, high, low, close over a fixed slice of time.",
        body: [
          "The body shows where price opened and closed. The wicks show how far it travelled and got rejected.",
          "A long wick means price went there and was pushed back — that rejection is the information, not the colour.",
          "One candle on its own says very little. Candles only mean something in the context of the candles around them.",
        ],
        mistake: "Reading a single green candle as 'buyers are in control'.",
      },
      {
        id: "l1-timeframes",
        title: "Timeframes",
        topic: "market_structure",
        summary: "Higher timeframe sets direction, lower timeframe refines timing.",
        body: [
          "HTF (1D/4H) = the big picture. MTF (1H) = the bridge. LTF (15M/5M) = timing only.",
          "The lower you go, the more noise you see and the more often you will be wrong about direction.",
          "Never let a 5-minute chart overrule what the daily chart is doing.",
        ],
        mistake: "Taking direction from the lowest timeframe because it moves fastest.",
      },
      {
        id: "l1-structure",
        title: "Market structure, HH, HL, LH, LL",
        topic: "market_structure",
        summary: "Structure is a sequence of swings, not the last candle's colour.",
        body: [
          "Uptrend = higher highs and higher lows. Downtrend = lower highs and lower lows. Anything else is a range.",
          "A swing point needs a pullback on both sides of it. Tiny bumps are not swings.",
          "Mark structure on the highest timeframe first, then work down.",
        ],
        mistake: "Marking dozens of micro-swings until any story can be told.",
      },
      {
        id: "l1-sr",
        title: "Support and resistance",
        topic: "support_resistance",
        summary: "Levels are zones where price has repeatedly reacted.",
        body: [
          "Draw bands, not lines. Price reacts to areas, not exact numbers.",
          "A level earns respect through repeated reactions, and it decays with age.",
          "Broken resistance often becomes support and vice versa — but only once it is retested and holds.",
        ],
        mistake: "Drawing an exact price and treating a two-tick overshoot as a break.",
      },
      {
        id: "l1-volume",
        title: "Volume",
        topic: "volume",
        summary: "Volume is read relatively, and only when it is actually visible.",
        body: [
          "Compare a candle's volume to the recent average, never in absolute terms.",
          "Expansion on breaks and contraction inside ranges is the classic supportive pattern.",
          "If the histogram is cropped out of your screenshot, the honest answer is 'volume context unavailable'.",
        ],
        mistake: "Inventing volume analysis when no volume is on the chart.",
      },
    ],
  },
  {
    level: 2,
    title: "Liquidity",
    blurb: "Why price is drawn to obvious highs and lows.",
    lessons: [
      {
        id: "l2-what",
        title: "What liquidity means",
        topic: "liquidity",
        summary: "Liquidity is where orders likely rest — always inferred, never known.",
        body: [
          "Markets need counterparties. Clusters of resting orders are where large positions can be filled.",
          "The most obvious highs and lows are the most obvious stop locations, so they attract price.",
          "You never see the order book from a screenshot. Say 'likely', never 'is'.",
        ],
        mistake: "Speaking about liquidity as a fact instead of an inference.",
      },
      {
        id: "l2-sides",
        title: "Buy-side and sell-side liquidity",
        topic: "liquidity",
        summary: "Buy-side sits above highs; sell-side sits below lows.",
        body: [
          "Short-sellers' stops are buy orders — they sit above highs.",
          "Long-holders' stops are sell orders — they sit below lows.",
          "That is why sharp spikes so often occur just beyond the obvious extremes.",
        ],
        mistake: "Getting the sides backwards and chasing the spike.",
      },
      {
        id: "l2-equal",
        title: "Equal highs, equal lows and pools",
        topic: "liquidity",
        summary: "Flat, tidy extremes are the strongest visual liquidity clue.",
        body: [
          "Two or more highs at nearly the same price form an obvious pool everyone can see.",
          "The tidier the level, the more attractive it becomes as a target.",
          "Once a pool is taken, it is gone — it cannot be the target twice.",
        ],
        mistake: "Still targeting a pool that was swept two sessions ago.",
      },
      {
        id: "l2-sweeps",
        title: "Liquidity sweeps",
        topic: "liquidity_sweep",
        summary: "A sweep = penetration plus rejection or reclaim.",
        body: [
          "Penetration alone is not a sweep. Without the reclaim it may simply be a break.",
          "The reclaim is the confirmation. Wait for the close, not the wick.",
          "A sweep is a clue, not a signal — it still needs structure to change afterwards.",
        ],
        mistake: "Entering on the wick and being stopped out by the continuation.",
      },
    ],
  },
  {
    level: 3,
    title: "Structure",
    blurb: "Continuation, reversal, and the difference between a break and a trap.",
    lessons: [
      {
        id: "l3-bos",
        title: "BOS — break of structure",
        topic: "mss_bos",
        summary: "Continuation: the trend takes out its own swing.",
        body: [
          "A BOS confirms the existing trend is intact.",
          "Judge it on closes beyond the swing, not on wicks through it.",
          "The tradeable part is usually the retracement after the break, not the break itself.",
        ],
        mistake: "Buying the breakout candle at its high.",
      },
      {
        id: "l3-mss",
        title: "MSS — market structure shift",
        topic: "mss_bos",
        summary: "Reversal evidence: the last protected swing breaks against the trend.",
        body: [
          "An MSS is strongest right after a liquidity sweep of the opposite extreme.",
          "Name the exact swing that must break before you claim a shift.",
          "One MSS does not make a new trend. It is the first piece of evidence, not the conclusion.",
        ],
        mistake: "Calling every small break an MSS.",
      },
      {
        id: "l3-ranges",
        title: "Consolidation and false breakouts",
        topic: "market_structure",
        summary: "Most of the time, markets are ranging — and ranges punish breakout chasers.",
        body: [
          "In a range, both extremes are liquidity. Expect false breaks at both edges.",
          "A break that closes back inside the range within a candle or two is a failed break, not a trend.",
          "Ranges are usually the correct place to say WAIT.",
        ],
        mistake: "Trading the middle of a range with a target at the other extreme.",
      },
    ],
  },
  {
    level: 4,
    title: "Price delivery",
    blurb: "How impulsive moves leave evidence behind.",
    lessons: [
      {
        id: "l4-displacement",
        title: "Displacement",
        topic: "displacement",
        summary: "A decisive expansion that stands out from its neighbours.",
        body: [
          "Compare the candle range to the last 20 candles. If it is not obviously bigger, it is not displacement.",
          "Displacement that also breaks structure is the strongest form.",
          "Displacement is where imbalances come from.",
        ],
        mistake: "Labelling an average-sized candle as displacement to justify an entry.",
      },
      {
        id: "l4-fvg",
        title: "FVG and retracement",
        topic: "fvg",
        summary: "Fast moves skip price; price often returns to fill the skipped area.",
        body: [
          "Look for a three-candle sequence where candle 1 and candle 3 wicks do not overlap.",
          "The gap is a conditional entry zone — it is not a bounce guarantee.",
          "If the screenshot is too zoomed out to see candle detail, say so instead of guessing.",
        ],
        mistake: "Assuming every FVG must be filled and must hold.",
      },
      {
        id: "l4-premium",
        title: "Premium, discount, impulse vs correction",
        topic: "trade_planning",
        summary: "Buy in the lower half of the leg, sell in the upper half — when structure allows.",
        body: [
          "Split the leg in half. Above the midpoint is premium; below is discount.",
          "Impulse legs are fast with large bodies; corrections are slow and overlapping.",
          "Entering an uptrend at premium prices gives you the worst possible R:R.",
        ],
        mistake: "Buying at the very top of an impulse because it looks strong.",
      },
    ],
  },
  {
    level: 5,
    title: "AMD",
    blurb: "The three-phase model — and how not to force it.",
    lessons: [
      {
        id: "l5-phases",
        title: "Accumulation, manipulation, distribution",
        topic: "amd",
        summary: "Range → false break that takes liquidity → directional expansion.",
        body: [
          "Accumulation is a visible range with obvious extremes.",
          "Manipulation is the break of one extreme that fails and reclaims.",
          "Distribution is the expansion into the opposite liquidity.",
        ],
        mistake: "Naming AMD from two phases and imagining the third.",
      },
      {
        id: "l5-notforcing",
        title: "How NOT to force AMD",
        topic: "amd",
        summary: "If all three phases are not visible in sequence, the answer is 'not confirmed'.",
        body: [
          "AMD is a lens, not a law. Plenty of charts simply trend or chop.",
          "If you have to zoom and squint to find the manipulation, it is not there.",
          "'Not confirmed' is a complete, professional answer.",
        ],
        mistake: "Retro-fitting AMD after the move, which always looks obvious in hindsight.",
      },
    ],
  },
  {
    level: 6,
    title: "Trade management",
    blurb: "The part that actually determines survival.",
    lessons: [
      {
        id: "l6-stops",
        title: "Entry, stop-loss and invalidation",
        topic: "risk_management",
        summary: "Define all three before you consider taking anything.",
        body: [
          "The stop belongs where the idea dies, not where the loss feels comfortable.",
          "Invalidation can be hit without the stop being hit — and that still means get out.",
          "If you cannot state your invalidation in one sentence, you do not have a plan.",
        ],
        mistake: "Widening the stop as price approaches it.",
      },
      {
        id: "l6-targets",
        title: "TP1, TP2 and R:R",
        topic: "trade_planning",
        summary: "Target liquidity, then check the resulting R:R — in that order.",
        body: [
          "Pick targets from structure first; compute R:R afterwards.",
          "If the honest R:R is below your minimum, the correct action is to skip the trade.",
          "R:R tells you the break-even win rate you would need. It never tells you the win rate you have.",
        ],
        mistake: "Stretching the target until the R:R looks acceptable.",
      },
      {
        id: "l6-sizing",
        title: "Position sizing, risk percentage and leverage",
        topic: "risk_management",
        summary: "Size from the stop distance, never from confidence.",
        body: [
          "Position size = (account × risk %) ÷ distance from entry to stop.",
          "A fixed small percentage per trade is what keeps a losing streak survivable.",
          "Leverage changes nothing about correct risk — it only changes how fast a mistake becomes fatal.",
        ],
        mistake: "Increasing size because the setup scored highly.",
      },
    ],
  },
  {
    level: 7,
    title: "Complete setups",
    blurb: "Combining the pieces — and knowing when to stand aside.",
    lessons: [
      {
        id: "l7-model",
        title: "Sweep → MSS → displacement → retracement → entry",
        topic: "trade_planning",
        summary: "The full sequence, in order, with each step evidenced.",
        body: [
          "1. HTF bias gives direction. 2. Price sweeps the opposite liquidity. 3. Structure shifts with a close.",
          "4. Displacement leaves an imbalance. 5. Price retraces into it — that is the conditional entry.",
          "Stop beyond the sweep extreme; target the next untouched liquidity pool.",
        ],
        mistake: "Taking the entry when steps 2 and 3 never actually happened.",
      },
      {
        id: "l7-notrade",
        title: "When NOT to trade",
        topic: "trade_planning",
        summary: "No trade is a position, and usually the best available one.",
        body: [
          "Evidence insufficient → WAIT. Evidence conflicting → WAIT. Setup invalidated → NO TRADE.",
          "Mid-range, no sweep, no structural break, unclear screenshot: all reasons to stand aside.",
          "You are paid for the trades you skip as much as the ones you take.",
        ],
        mistake: "Needing to be in a trade to feel productive.",
      },
    ],
  },
];

export const ALL_LESSONS: Lesson[] = ACADEMY.flatMap((level) => level.lessons);

/** Repeated, non-negotiable uncertainty reminders (spec item 13). */
export const UNCERTAINTY_PRINCIPLES = [
  "A setup is not a guarantee.",
  "A high score is not a guaranteed win.",
  "AI confidence describes how clear the picture is — it is not win probability.",
  "Historical win rate is not future performance.",
  "A losing trade does not necessarily mean the analysis was bad.",
  "A winning trade does not necessarily mean the analysis was good.",
  "Risk management matters more than being right every time.",
  "Evidence insufficient → WAIT. Evidence conflicting → WAIT. Setup invalidated → NO TRADE.",
];

/** Post-trade lesson options (spec item 6). */
export const POST_TRADE_LESSONS = [
  "Setup was invalidated before/after entry",
  "Liquidity sweep failed",
  "MSS failed to hold",
  "Breakout failed",
  "Entry was too early",
  "Entry was chased",
  "Stop was too tight",
  "Risk/reward was poor",
  "Higher-timeframe bias was wrong",
  "News or volatility changed conditions",
  "Analysis was correct but the trade still lost",
  "Analysis was weak but the trade still won",
];

export const PRACTICE_TAGS = [
  "Practice",
  "Correct setup",
  "Incorrect setup",
  "Unclear",
  "Failed setup",
  "Successful setup",
] as const;

export type PracticeTag = (typeof PRACTICE_TAGS)[number];
