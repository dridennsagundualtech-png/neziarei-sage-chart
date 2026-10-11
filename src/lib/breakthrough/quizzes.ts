/**
 * Breakthrough quizzes: five questions per chapter, no AI.
 * `visual` is shown with the question (unlabelled, so it doesn't give the answer away);
 * `reveal` is the chapter's own illustration, shown after the answer is checked.
 */
import type { StaticQuestion, StaticQuizBatch } from "@/lib/static-quizzes";
import { BREAKTHROUGH } from "./index";
import type { SceneSpec } from "./scene";
import type { BreakthroughChapter, Visual } from "./types";

const byId = new Map(BREAKTHROUGH.chapters.map((c, i) => [i + 1, c]));

function chapter(n: number): BreakthroughChapter {
  const c = byId.get(n);
  if (!c) throw new Error(`Breakthrough chapter ${n} missing`);
  return c;
}

/** The illustration of a term, to show after answering. */
function term(n: number, name: string): Visual {
  const t = chapter(n).terms.find((x) => x.term === name);
  if (!t) throw new Error(`Breakthrough term "${name}" missing in chapter ${n}`);
  return t.visual;
}

/** The same picture with every label removed and shown complete, for "what is this?" questions. */
function unlabelled(n: number, name: string): Visual {
  const v = term(n, name);
  if (v.kind !== "scene") return v;
  const s = v.scene;
  const clean: SceneSpec = {
    ...s,
    zones: s.zones?.map(({ label: _label, ...z }) => z),
    lines: s.lines?.map(({ label: _label, ...l }) => l),
    marks: [],
    steps: [{ upTo: 9999, text: "" }],
  } as SceneSpec;
  return { kind: "scene", scene: clean };
}

type Q = Omit<StaticQuestion, "topic">;

const SETS: Record<number, Q[]> = {
  1: [
    {
      id: "bt1-ob",
      prompt:
        "The shaded zone is the last down candle before a big rally that broke the swing high. What is it?",
      options: ["Bearish breaker", "Bullish order block", "Balanced price range", "Liquidity void"],
      correctIndex: 1,
      explanation:
        "The last opposite candle before displacement that breaks structure is an order block. Here it's bullish.",
      visual: unlabelled(1, "Order block"),
      reveal: term(1, "Order block"),
    },
    {
      id: "bt1-breaker",
      prompt:
        "An order block fails after price first sweeps a high, then price retests it from the other side. That zone is a:",
      options: ["Breaker block", "Mitigation block", "Rejection block", "Fair value gap"],
      correctIndex: 0,
      explanation: "Sweep, break through the OB, retest from the other side: a breaker block.",
      reveal: term(1, "Breaker block"),
    },
    {
      id: "bt1-mitigation",
      prompt: "What separates a breaker from a mitigation block?",
      options: [
        "A breaker is bullish only; a mitigation block is bearish only",
        "A mitigation block always contains a fair value gap",
        "A breaker sweeps the old extreme first; a mitigation block fails to reach it",
        "Nothing: they are two names for the same order block",
      ],
      correctIndex: 2,
      explanation:
        "Breaker: liquidity taken, then the break. Mitigation block: a lower high (no sweep), then the break.",
      reveal: term(1, "Mitigation block"),
    },
    {
      id: "bt1-ce",
      prompt: "In this bullish fair value gap, what is consequent encroachment (CE)?",
      options: [
        "The top edge of the gap",
        "The 50% midpoint of the gap",
        "The candle that created the gap",
        "The first touch of the gap",
      ],
      correctIndex: 1,
      explanation:
        "CE is the midpoint of the gap. Reacting at CE and filling the whole gap are two different outcomes.",
      visual: unlabelled(1, "Fair value gap anatomy"),
      reveal: term(1, "Fair value gap anatomy"),
    },
    {
      id: "bt1-ifvg",
      prompt:
        "A bearish gap gets closed through by a candle body, then holds as support on a retest from above. That is:",
      options: [
        "A balanced price range",
        "A liquidity void",
        "A volume imbalance",
        "An inversion fair value gap",
      ],
      correctIndex: 3,
      explanation:
        "A gap that fails with a body close and flips role is an inversion fair value gap (IFVG).",
      reveal: term(1, "Inversion fair value gap"),
    },
  ],
  2: [
    {
      id: "bt2-eqh",
      prompt: "Three highs at almost the same price. Why is this treated as a pool of liquidity?",
      options: [
        "Stops from traders who sold the double or triple top rest just above it",
        "Banks have to defend round numbers",
        "Equal highs always turn into support",
        "Volume is always highest at equal highs",
      ],
      correctIndex: 0,
      explanation:
        "Obvious highs collect stop orders just beyond them. That is the pool price often runs.",
      visual: unlabelled(2, "Equal highs and equal lows"),
      reveal: term(2, "Equal highs and equal lows"),
    },
    {
      id: "bt2-sweep",
      prompt:
        "Price trades above a level, then closes back below it within a candle or two. That is:",
      options: ["A run (a real breakout)", "A sweep", "An inversion", "A break of structure"],
      correctIndex: 1,
      explanation: "Take the orders and close back inside: sweep. Take them and hold beyond: run.",
      reveal: term(2, "Sweep vs run"),
    },
    {
      id: "bt2-irl",
      prompt: "Unfilled gaps and order blocks inside the current range are called:",
      options: [
        "External range liquidity",
        "Buy-side liquidity",
        "Internal range liquidity",
        "Inducement",
      ],
      correctIndex: 2,
      explanation: "Inside the range is internal (IRL); beyond its high and low is external (ERL).",
      reveal: term(2, "Internal vs external range liquidity"),
    },
    {
      id: "bt2-turtle",
      prompt: "Turtle soup trades:",
      options: [
        "The first pullback in a new trend",
        "Any candle with a long wick",
        "A gap at the weekly open",
        "A 20-bar breakout that fails and closes back inside",
      ],
      correctIndex: 3,
      explanation:
        "It fades failed breakouts of the 20-bar high or low, a play on the Turtle traders' breakout rules.",
      reveal: term(2, "Turtle soup"),
    },
    {
      id: "bt2-judas",
      prompt: "A Judas swing is:",
      options: [
        "A false move at the open, against the day's eventual direction",
        "A breakout caused by news",
        "The last candle before the daily close",
        "A double top on the daily chart",
      ],
      correctIndex: 0,
      explanation:
        "The first move misleads, takes stops, and price then makes the day's real move the other way.",
      reveal: term(2, "Judas swing"),
    },
  ],
  3: [
    {
      id: "bt3-fractal",
      prompt: "A Williams fractal swing high needs:",
      options: [
        "Three green candles in a row",
        "A high with two lower highs on each side",
        "A close above the previous candle",
        "A wick at least twice the body",
      ],
      correctIndex: 1,
      explanation:
        "Five candles: the middle high above the two on each side. It's only confirmed two candles later.",
      reveal: term(3, "Swing points and fractals"),
    },
    {
      id: "bt3-choch",
      prompt:
        "In a downtrend, the first candle that closes above the most recent lower high is usually called:",
      options: [
        "Break of structure (BOS)",
        "Change of character (CHoCH)",
        "Liquidity sweep",
        "Fair value gap",
      ],
      correctIndex: 1,
      explanation:
        "The first break against the trend is a CHoCH. BOS is a break in the trend's own direction.",
      visual: unlabelled(3, "Change of character"),
      reveal: term(3, "Change of character"),
    },
    {
      id: "bt3-internal",
      prompt:
        "Internal structure turns bearish, but the swing low still holds. The best reading is:",
      options: [
        "A confirmed downtrend",
        "An accumulation schematic",
        "A reason to short right away",
        "Most likely a pullback inside the bigger uptrend",
      ],
      correctIndex: 3,
      explanation:
        "Swing structure carries more weight. Until the swing low breaks, it's a pullback.",
      reveal: term(3, "Internal vs swing structure"),
    },
    {
      id: "bt3-cisd",
      prompt: "A bullish CISD happens when price:",
      options: [
        "Closes above the open of the first candle in the last run of down candles",
        "Pushes RSI above 50",
        "Touches the 50% of the range",
        "Prints a green daily candle",
      ],
      correctIndex: 0,
      explanation:
        "Change in state of delivery: the first close back beyond the open of the run that delivered the last leg.",
      reveal: term(3, "Change in state of delivery"),
    },
    {
      id: "bt3-discount",
      prompt: "In a bullish dealing range, where do smart-money traders prefer to buy?",
      options: [
        "In premium, above equilibrium",
        "In discount, below equilibrium",
        "Exactly at the range high",
        "Only after a new all-time high",
      ],
      correctIndex: 1,
      explanation:
        "Buying below the 50% line improves reward-to-risk if the bullish idea is right.",
      visual: unlabelled(3, "Dealing range, equilibrium, premium and discount"),
      reveal: term(3, "Dealing range, equilibrium, premium and discount"),
    },
  ],
  4: [
    {
      id: "bt4-50",
      prompt:
        "Which common retracement level is not a Fibonacci ratio but is included by convention?",
      options: ["38.2%", "50%", "61.8%", "78.6%"],
      correctIndex: 1,
      explanation:
        "50% isn't from the Fibonacci sequence; it's included because traders watch the midpoint.",
      reveal: term(4, "Fibonacci retracement"),
    },
    {
      id: "bt4-ote",
      prompt: "ICT's optimal trade entry (OTE) zone is roughly:",
      options: ["23.6% to 38.2%", "Exactly 50%", "62% to 79% retracement", "100% to 127%"],
      correctIndex: 2,
      explanation: "OTE is the 62–79% retracement band, with 70.5% as its middle.",
      reveal: term(4, "Optimal trade entry"),
    },
    {
      id: "bt4-ext",
      prompt: "A trend-based Fib extension needs which three points?",
      options: [
        "Start of the leg, end of the leg, and the pullback",
        "Open, high and low of one candle",
        "Three equal highs",
        "Session open, high and close",
      ],
      correctIndex: 0,
      explanation: "A, B and C: the leg and its pullback. The tool projects the leg's size from C.",
      reveal: term(4, "Fibonacci extensions"),
    },
    {
      id: "bt4-confluence",
      prompt: "Which is genuine confluence?",
      options: [
        "RSI, Stochastic and MACD all overbought",
        "A 61.8% level, a fair value gap and an old high in the same band",
        "Three moving averages crossing at once",
        "Two timeframes showing the same candle colour",
      ],
      correctIndex: 1,
      explanation:
        "Independent reasons count. Three momentum indicators are one reason measured three times.",
      reveal: term(4, "Confluence"),
    },
    {
      id: "bt4-abcd",
      prompt: "Measured move: A = 40, B = 55, C = 48. Roughly where is D?",
      options: ["55", "63", "70", "48"],
      correctIndex: 1,
      explanation: "AB is 15 points; C + 15 = 63.",
      reveal: term(4, "Measured move"),
    },
  ],
  5: [
    {
      id: "bt5-overlap",
      prompt: "In ChartPilot's session hours, the London–New York overlap in UTC is:",
      options: ["00:00–09:00", "08:00–17:00", "13:00–17:00", "13:00–22:00"],
      correctIndex: 2,
      explanation:
        "London runs 08:00–17:00 UTC and New York 13:00–22:00 UTC; they overlap 13:00–17:00.",
      reveal: term(5, "Trading sessions"),
    },
    {
      id: "bt5-killzone",
      prompt:
        "In US winter, New York is UTC−5. The London kill zone (02:00–05:00 New York) in UTC is:",
      options: ["02:00–05:00", "06:00–09:00", "07:00–10:00", "15:00–18:00"],
      correctIndex: 2,
      explanation: "Add 5 hours in US winter: 07:00–10:00 UTC. In US summer it's 06:00–09:00.",
      reveal: term(5, "Kill zones"),
    },
    {
      id: "bt5-asia",
      prompt:
        "London spikes above the Asian high, closes back inside, then falls through the Asian low. This is:",
      options: [
        "A London sweep of Asian liquidity",
        "A continuation breakout",
        "A new week opening gap",
        "A Silver Bullet window",
      ],
      correctIndex: 0,
      explanation: "The Asian high was liquidity; London took it and reversed.",
      visual: unlabelled(5, "Asian range"),
      reveal: term(5, "Asian range"),
    },
    {
      id: "bt5-po3",
      prompt: "On a bullish power-of-three day, the daily candle typically shows:",
      options: [
        "A long upper wick and a close near the low",
        "A long lower wick and a close near the high",
        "No wicks at all",
        "An open and close at the same price",
      ],
      correctIndex: 1,
      explanation: "Open, a false dip below it (the lower wick), then expansion up into the close.",
      reveal: term(5, "Power of three"),
    },
    {
      id: "bt5-sb",
      prompt: "The Silver Bullet windows are:",
      options: [
        "Any hour after a news release",
        "The first 15 minutes of every hour",
        "Only the Asian session",
        "One-hour windows: 03–04, 10–11 and 14–15 New York time",
      ],
      correctIndex: 3,
      explanation: "Three one-hour windows in New York time. They move with US daylight saving.",
      reveal: term(5, "Silver Bullet"),
    },
  ],
  6: [
    {
      id: "bt6-topdown",
      prompt: "Top-down analysis means:",
      options: [
        "Direction from the higher timeframe, zone from the middle, trigger from the lower",
        "Entries on the daily, direction from the 1-minute",
        "Using only one timeframe",
        "Reading only the top of each candle",
      ],
      correctIndex: 0,
      explanation: "Each timeframe narrows the one above it: direction, then zone, then trigger.",
      reveal: term(6, "Top-down analysis"),
    },
    {
      id: "bt6-aggressive",
      prompt: "Compared with a conservative entry, an aggressive entry usually has:",
      options: [
        "A worse price, a wider stop and fewer failures",
        "The same price and stop",
        "A better price, a smaller stop and more failed trades",
        "No stop at all",
      ],
      correctIndex: 2,
      explanation:
        "Entering before confirmation buys a better price at the cost of more zones that fail.",
      reveal: term(6, "Aggressive vs conservative entry"),
    },
    {
      id: "bt6-smt",
      prompt: "EURUSD (top) makes a lower low while GBPUSD (bottom) holds a higher low. This is:",
      options: [
        "A double bottom",
        "SMT divergence",
        "An inversion fair value gap",
        "Hidden RSI divergence",
      ],
      correctIndex: 1,
      explanation: "Correlated markets failing to confirm each other's new low: SMT divergence.",
      visual: unlabelled(6, "SMT divergence"),
      reveal: term(6, "SMT divergence"),
    },
    {
      id: "bt6-be",
      prompt: "Moving the stop to break-even after TP1:",
      options: [
        "Always increases profit",
        "Protects capital but can turn some winners into zero-R exits",
        "Is required by brokers",
        "Doubles the reward-to-risk",
      ],
      correctIndex: 1,
      explanation: "It's a trade-off. Your journal should decide whether it helps your setups.",
      reveal: term(6, "Break-even and partials"),
    },
    {
      id: "bt6-reaction",
      prompt: "A bounce from a zone that never breaks a swing on your timeframe is best called:",
      options: ["A reversal", "A reaction", "A change of character", "A sign of strength"],
      correctIndex: 1,
      explanation: "No structure break on your timeframe means a reaction, not a reversal.",
      reveal: term(6, "Reaction vs reversal"),
    },
  ],
  7: [
    {
      id: "bt7-spring",
      prompt:
        "A brief break below range support that is bought straight back inside the range is a:",
      options: ["Spring", "Upthrust", "Sign of weakness", "Buying climax"],
      correctIndex: 0,
      explanation:
        "The spring tests whether sellers are exhausted. In SMC terms, a sell-side sweep.",
      visual: unlabelled(7, "Spring and upthrust"),
      reveal: term(7, "Spring and upthrust"),
    },
    {
      id: "bt7-ut",
      prompt: "In SMC language, a Wyckoff upthrust is most like:",
      options: [
        "A bullish order block",
        "A fair value gap",
        "A buy-side liquidity sweep",
        "A sell-side sweep",
      ],
      correctIndex: 2,
      explanation: "An upthrust pokes above resistance and fails: the stops above were taken.",
      reveal: term(7, "Spring and upthrust"),
    },
    {
      id: "bt7-phasec",
      prompt: "Wyckoff Phase C is mainly about:",
      options: [
        "Stopping the prior trend",
        "The test of supply, often a spring",
        "Markup out of the range",
        "Back-and-forth trading that builds the cause",
      ],
      correctIndex: 1,
      explanation:
        "A stops the trend, B builds the cause, C tests (spring), D shows strength, E marks up.",
      reveal: term(7, "Accumulation phases A to E"),
    },
    {
      id: "bt7-absorb",
      prompt: "Several huge-volume candles at a high barely move price. This suggests:",
      options: [
        "An easy path higher",
        "A guaranteed breakout",
        "Very low liquidity",
        "Absorption: large passive orders soaking up the buying",
      ],
      correctIndex: 3,
      explanation: "Big effort, little result: someone is absorbing the pressure.",
      visual: unlabelled(7, "Effort vs result and absorption"),
      reveal: term(7, "Effort vs result and absorption"),
    },
    {
      id: "bt7-tick",
      prompt: "On spot forex charts, 'volume' usually means:",
      options: [
        "Contracts traded on a central exchange",
        "Tick volume: how many times the price changed",
        "Your broker's total client deposits",
        "Open interest",
      ],
      correctIndex: 1,
      explanation:
        "There's no central exchange in spot forex, so charts count price changes as a stand-in.",
      reveal: term(11, "Tick volume vs real volume"),
    },
  ],
  8: [
    {
      id: "bt8-close",
      prompt: "The last candle reached 60 but closed near its low. What does that tell you?",
      options: [
        "Buyers won the period",
        "Sellers won the period, despite the high",
        "Nothing at all",
        "A reversal is guaranteed",
      ],
      correctIndex: 1,
      explanation: "Where a candle closes in its range shows who won that slice of time.",
      visual: unlabelled(8, "Close location and body size"),
      reveal: term(8, "Close location and body size"),
    },
    {
      id: "bt8-hammer",
      prompt: "A small body with a long lower wick after a drop is a:",
      options: ["Shooting star", "Gravestone doji", "Hammer", "Marubozu"],
      correctIndex: 2,
      explanation: "Long lower wick at a low: hammer. Long upper wick at a high: shooting star.",
      reveal: term(8, "Pin bars"),
    },
    {
      id: "bt8-engulf",
      prompt: "A bullish engulfing candle is:",
      options: [
        "An up candle whose body fully covers the previous down candle's body",
        "Two green candles in a row",
        "A gap up at the open",
        "A doji after a rally",
      ],
      correctIndex: 0,
      explanation:
        "The up body swallows the previous down body. Strongest after a sweep at a level.",
      reveal: term(8, "Engulfing candles"),
    },
    {
      id: "bt8-inside",
      prompt: "An inside bar is:",
      options: [
        "A candle with no wicks",
        "A candle that closes at its open",
        "The biggest candle of the day",
        "A candle whose high and low stay within the previous candle",
      ],
      correctIndex: 3,
      explanation:
        "Inside bar = compression inside the mother bar. Outside bar = expansion beyond it.",
      reveal: term(8, "Inside and outside bars"),
    },
    {
      id: "bt8-location",
      prompt: "The most important filter for any candle pattern is:",
      options: [
        "The pattern's name",
        "Its location: at a level, after a sweep",
        "Its colour",
        "How popular the timeframe is",
      ],
      correctIndex: 1,
      explanation: "Same shape, different place, different meaning. No location, no pattern.",
      reveal: term(8, "Location beats pattern"),
    },
  ],
  9: [
    {
      id: "bt9-double",
      prompt: "When is this double top confirmed?",
      options: [
        "When the second top forms",
        "When price closes below the neckline",
        "When RSI reaches 70",
        "When volume falls",
      ],
      correctIndex: 1,
      explanation: "Before the neckline close, it's only two highs.",
      visual: unlabelled(9, "Double top and double bottom"),
      reveal: term(9, "Double top and double bottom"),
    },
    {
      id: "bt9-hs",
      prompt: "The rough target of a head and shoulders top is:",
      options: [
        "The head-to-neckline distance, projected down from the neckline break",
        "The height of the right shoulder",
        "Always 100 pips",
        "The next round number",
      ],
      correctIndex: 0,
      explanation: "Measure head to neckline and project it from the break.",
      reveal: term(9, "Head and shoulders"),
    },
    {
      id: "bt9-triangle",
      prompt: "Flat top, rising lows. Which triangle is this?",
      options: ["Descending", "Symmetrical", "Ascending", "Falling wedge"],
      correctIndex: 2,
      explanation: "Buyers step in higher each time under a flat ceiling: ascending triangle.",
      visual: unlabelled(9, "Triangles"),
      reveal: term(9, "Triangles"),
    },
    {
      id: "bt9-wedge",
      prompt: "A rising wedge is usually read as:",
      options: [
        "Bullish continuation",
        "Bearish: each push gains less",
        "A range with no bias",
        "A sign of strength",
      ],
      correctIndex: 1,
      explanation:
        "Converging upward lines show momentum fading; the break of the lower line is the signal.",
      reveal: term(9, "Wedges"),
    },
    {
      id: "bt9-failed",
      prompt:
        "A double top breaks its neckline, then the next candle closes back above it. This is best described as:",
      options: [
        "A confirmed double top",
        "A flag",
        "A cup and handle",
        "A failed pattern, often fuel for a move up",
      ],
      correctIndex: 3,
      explanation: "Trapped sellers buy back. Failed patterns are information too.",
      reveal: term(9, "Failed patterns"),
    },
  ],
  10: [
    {
      id: "bt10-ema",
      prompt: "The main difference between an EMA and an SMA is that the EMA:",
      options: [
        "Weights recent prices more",
        "Uses volume",
        "Only works on daily charts",
        "Doesn't lag at all",
      ],
      correctIndex: 0,
      explanation: "EMA reacts faster because recent closes count more. Both still lag.",
      reveal: term(10, "Moving averages"),
    },
    {
      id: "bt10-rsi",
      prompt: "RSI is above 70 in a strong uptrend. This means:",
      options: [
        "Sell now",
        "Momentum is strong; price can stay overbought for a long time",
        "The trend has ended",
        "Volume is low",
      ],
      correctIndex: 1,
      explanation: "'Overbought' describes momentum, not a sell signal.",
      reveal: term(10, "RSI"),
    },
    {
      id: "bt10-div",
      prompt: "Price makes a higher high while RSI makes a lower high. This is:",
      options: [
        "Hidden bullish divergence",
        "Regular bearish divergence",
        "Regular bullish divergence",
        "No divergence",
      ],
      correctIndex: 1,
      explanation:
        "Higher price high, lower oscillator high: regular bearish divergence, a sign momentum is fading.",
      visual: unlabelled(10, "Divergence"),
      reveal: term(10, "Divergence"),
    },
    {
      id: "bt10-atr",
      prompt: "ATR tells you:",
      options: [
        "Which way price will move",
        "Where liquidity rests",
        "How much price typically moves per candle",
        "The trend direction",
      ],
      correctIndex: 2,
      explanation:
        "ATR measures volatility in price units: useful for stop distance and sizing, silent on direction.",
      reveal: term(10, "ATR"),
    },
    {
      id: "bt10-poc",
      prompt: "On a volume profile, the point of control (POC) is:",
      options: [
        "The price with the most traded volume",
        "The day's highest price",
        "The session open",
        "The VWAP",
      ],
      correctIndex: 0,
      explanation:
        "POC is the busiest price. The value area holds about 70% of the volume around it.",
      reveal: term(10, "Volume profile"),
    },
  ],
  11: [
    {
      id: "bt11-fill",
      prompt:
        "You market-buy 5 lots. The best ask has 3 lots at 100.02, the next 4 lots at 100.03. Your average fill?",
      options: ["100.020", "100.024", "100.030", "100.025"],
      correctIndex: 1,
      explanation: "(3 × 100.02 + 2 × 100.03) ÷ 5 = 100.024: 0.4 ticks of slippage.",
      reveal: { kind: "dom" },
    },
    {
      id: "bt11-gap",
      prompt: "Your stop is at 49, but the market gaps open at 46. Your stop most likely fills:",
      options: ["At 49", "Near 46, the next available price", "At your entry", "It cancels itself"],
      correctIndex: 1,
      explanation:
        "A stop becomes a market order when triggered, so a gap fills it at the next price.",
      reveal: term(11, "Slippage, gaps and stop orders"),
    },
    {
      id: "bt11-bbook",
      prompt: "In a B-book model, your broker:",
      options: [
        "Takes the other side of your trade",
        "Sends every order to an exchange",
        "Never charges a spread",
        "Guarantees no slippage",
      ],
      correctIndex: 0,
      explanation:
        "B-book: the broker is the counterparty. A-book: orders are routed to liquidity providers.",
      reveal: term(11, "Market makers and liquidity providers"),
    },
    {
      id: "bt11-oi",
      prompt: "Price rises while open interest falls. A common reading is:",
      options: [
        "New longs entering",
        "Shorts closing (short covering)",
        "New shorts entering",
        "Nothing: they're unrelated",
      ],
      correctIndex: 1,
      explanation: "Positions are closing while price rises, often shorts buying back.",
      reveal: term(11, "Open interest and funding"),
    },
    {
      id: "bt11-delta",
      prompt: "Delta in a candle is:",
      options: [
        "High minus low",
        "Close minus open",
        "Volume bought at the ask minus volume sold at the bid",
        "The change in open interest",
      ],
      correctIndex: 2,
      explanation: "Delta compares aggressive buying with aggressive selling inside the candle.",
      reveal: { kind: "footprint" },
    },
  ],
  12: [
    {
      id: "bt12-surprise",
      prompt: "Markets usually react most to a central-bank decision when it:",
      options: [
        "Surprises compared with expectations",
        "Matches expectations exactly",
        "Lands on a Friday",
        "Mentions inflation",
      ],
      correctIndex: 0,
      explanation: "Expected decisions are already priced in. Surprises move markets.",
      reveal: term(12, "Central banks and interest rates"),
    },
    {
      id: "bt12-cpi",
      prompt: "US CPI comes in hotter than forecast. A typical first reaction:",
      options: [
        "USD tends to fall and gold rises",
        "USD tends to rise; gold and stocks tend to fall",
        "Nothing moves",
        "Only crypto reacts",
      ],
      correctIndex: 1,
      explanation:
        "Hotter inflation means 'rates higher for longer', which usually lifts yields and the dollar.",
      reveal: term(12, "Inflation data"),
    },
    {
      id: "bt12-dxy",
      prompt: "The DXY dollar index is weighted most heavily toward:",
      options: ["The yen", "The euro", "The pound", "The Canadian dollar"],
      correctIndex: 1,
      explanation: "That's why EURUSD usually moves roughly opposite to DXY.",
      reveal: term(12, "Dollar index and correlations"),
    },
    {
      id: "bt12-haven",
      prompt: "Which group is usually called safe havens in risk-off moves?",
      options: [
        "AUD, NZD and stocks",
        "Oil and copper",
        "Emerging-market currencies",
        "USD, JPY, CHF, gold and bonds",
      ],
      correctIndex: 3,
      explanation:
        "Fear sends money toward perceived safety, though the exact pattern shifts with each crisis.",
      reveal: term(12, "Risk-on and risk-off"),
    },
    {
      id: "bt12-priced",
      prompt:
        "Price climbed for days before expected good news, then fell on the release. This is:",
      options: [
        "Sell the news: it was priced in",
        "A data error",
        "Proof the news was bad",
        "A short squeeze",
      ],
      correctIndex: 0,
      explanation: "Buyers who positioned early take profit when the expected news arrives.",
      reveal: term(12, "Priced in"),
    },
  ],
  13: [
    {
      id: "bt13-be",
      prompt: "At 2:1 reward-to-risk, the break-even win rate before costs is about:",
      options: ["50%", "33.3%", "25%", "66.7%"],
      correctIndex: 1,
      explanation: "1 ÷ (1 + 2) = 33.3%.",
      reveal: term(13, "Break-even win rate"),
    },
    {
      id: "bt13-exp",
      prompt: "40% winners averaging +2R, 60% losers averaging −1R. Expectancy per trade?",
      options: ["−0.2R", "0R", "+0.2R", "+0.8R"],
      correctIndex: 2,
      explanation: "0.4 × 2 − 0.6 × 1 = 0.8 − 0.6 = +0.2R.",
      reveal: term(13, "Expectancy"),
    },
    {
      id: "bt13-dd",
      prompt: "After a 50% drawdown, what gain gets you back to where you started?",
      options: ["50%", "75%", "100%", "150%"],
      correctIndex: 2,
      explanation: "Half the account has to double to recover.",
      reveal: term(13, "Drawdown"),
    },
    {
      id: "bt13-corr",
      prompt:
        "Three 1% trades: EURUSD long, GBPUSD long, AUDUSD long. Your real exposure is closer to:",
      options: [
        "Three separate 1% bets",
        "One 3% bet against the US dollar",
        "0.33%",
        "Zero, because they hedge",
      ],
      correctIndex: 1,
      explanation: "All three are short the dollar. One dollar move can hit all of them together.",
      reveal: term(13, "Position sizing and correlation"),
    },
    {
      id: "bt13-sample",
      prompt: "With 30 trades and a 50% win rate, your true win rate could reasonably be:",
      options: [
        "Exactly 50%",
        "Between 49% and 51%",
        "Definitely above 50%",
        "Anywhere from about 32% to 68%",
      ],
      correctIndex: 3,
      explanation:
        "Small samples have wide error bands. 300 trades would narrow it to about 44–56%.",
      reveal: term(13, "Sample size"),
    },
  ],
  14: [
    {
      id: "bt14-outcome",
      prompt: "You won a trade you took without following your plan. This is:",
      options: [
        "A good trade",
        "Dangerous luck: a bad process that got rewarded",
        "Proof your plan is wrong",
        "Nothing to review",
      ],
      correctIndex: 1,
      explanation:
        "Grade the process separately from the result. Bad-process wins teach the wrong lesson.",
      reveal: term(14, "Outcome bias"),
    },
    {
      id: "bt14-disposition",
      prompt: "Closing winners early and holding losers hoping to break even is called:",
      options: ["The disposition effect", "Confirmation bias", "Overtrading", "Hindsight bias"],
      correctIndex: 0,
      explanation: "It comes from loss aversion and produces small wins with big losses.",
      reveal: term(14, "Loss aversion and the disposition effect"),
    },
    {
      id: "bt14-tilt",
      prompt: "The best first response to two losses in a row is to:",
      options: [
        "Double the size to win it back",
        "Switch to a lower timeframe",
        "Pause and step away for a set time",
        "Remove the stop",
      ],
      correctIndex: 2,
      explanation: "A pre-written pause rule stops revenge trading before it starts.",
      reveal: term(14, "Tilt and stop rules"),
    },
    {
      id: "bt14-hindsight",
      prompt: "A chart looks obvious after the move has happened. That feeling is:",
      options: ["Edge", "Hindsight bias", "Confluence", "Discipline"],
      correctIndex: 1,
      explanation:
        "Live, the same chart was ambiguous. Practise in Bar Replay to read it honestly.",
      reveal: term(14, "Hindsight bias"),
    },
    {
      id: "bt14-journal",
      prompt: "The most valuable part of a trading journal is:",
      options: [
        "Long written notes",
        "The weekly review that finds patterns",
        "Colourful screenshots",
        "Counting trades",
      ],
      correctIndex: 1,
      explanation:
        "Improvement comes from reviewing your own numbers, then changing one rule at a time.",
      reveal: term(14, "Journal and review loop"),
    },
  ],
  15: [
    {
      id: "bt15-replay",
      prompt: "Bar Replay is best used to:",
      options: [
        "Practise decisions candle by candle without seeing the future",
        "Place live orders",
        "Change your broker's prices",
        "Remove indicators",
      ],
      correctIndex: 0,
      explanation: "Decide before each step, log it, and you get an honest test of your reading.",
      reveal: term(15, "Bar Replay"),
    },
    {
      id: "bt15-alert",
      prompt: "Which alert trigger ignores quick wick pokes through a level?",
      options: ["Only Once", "Once Per Bar", "Once Per Bar Close", "Once Per Minute"],
      correctIndex: 2,
      explanation: "It fires only after the candle closes beyond the level.",
      reveal: term(15, "Alerts"),
    },
    {
      id: "bt15-ha",
      prompt: "Why shouldn't you place stops from Heikin Ashi candles?",
      options: [
        "They only work for crypto",
        "Their opens and closes are averages, not prices you could trade",
        "They hide volume",
        "They're delayed by a day",
      ],
      correctIndex: 1,
      explanation: "Heikin Ashi smooths the picture by averaging. Use normal candles for levels.",
      reveal: term(15, "Chart types"),
    },
    {
      id: "bt15-tester",
      prompt: "A Strategy Tester result looks great. What should you check first?",
      options: [
        "Commission, slippage, repainting and look-ahead",
        "The colour scheme",
        "How many indicators it uses",
        "Whether today is a weekday",
      ],
      correctIndex: 0,
      explanation: "Unrealistic fills and future data make almost anything look profitable.",
      reveal: term(15, "Pine Script and the Strategy Tester"),
    },
    {
      id: "bt15-feed",
      prompt: "TradingView and MT5 show slightly different highs for the same pair. Why?",
      options: [
        "TradingView is always wrong",
        "MT5 lags by a day",
        "Daylight saving",
        "Different data feeds and providers",
      ],
      correctIndex: 3,
      explanation:
        "Each provider has its own prices. Mark final levels on the feed you actually trade.",
      reveal: term(15, "Data feeds and time zones"),
    },
  ],
};

/** Fixed shuffle per question id, so the right answer isn't always in the same slot. */
function shuffleOptions(q: Q): Q {
  if (q.options.length !== 4) return q;
  let h = 0;
  for (const ch of q.id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const order = [0, 1, 2, 3];
  for (let i = 3; i > 0; i--) {
    h = (h * 1103515245 + 12345) >>> 0;
    const j = h % (i + 1);
    [order[i], order[j]] = [order[j] as number, order[i] as number];
  }
  const opts = order.map((i) => q.options[i] as string) as [string, string, string, string];
  return { ...q, options: opts, correctIndex: order.indexOf(q.correctIndex) };
}

export const BREAKTHROUGH_QUESTIONS: StaticQuestion[] = Object.values(SETS)
  .flat()
  .map((q) => ({ ...shuffleOptions(q), topic: "breakthrough" as const }));

export const BREAKTHROUGH_BATCHES: StaticQuizBatch[] = BREAKTHROUGH.chapters.map((c, i) => ({
  id: `bt-quiz-${String(i + 1).padStart(2, "0")}`,
  title: `${i + 1}. ${c.title}`,
  description: c.summary,
  minutes: 4,
  questionIds: (SETS[i + 1] ?? []).map((q) => q.id),
  chapterId: c.id,
}));
