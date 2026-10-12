/**
 * Two check questions per Academy lesson, answered at the end of the lesson.
 * The same questions make up the unit quizzes and the placement check.
 */
import type { StaticQuestion } from "@/lib/static-quizzes";

export type LessonCheck = Pick<
  StaticQuestion,
  "id" | "prompt" | "options" | "correctIndex" | "explanation"
>;

const TF: [string, string] = ["True", "False"];

export const LESSON_CHECKS: Record<string, [LessonCheck, LessonCheck]> = {
  // —— Unit 0 ——
  "l0-balance-equity": [
    {
      id: "lc-l0-balance-equity-a",
      prompt: "Your balance is $1,000 and one open trade is at −$80. What is your equity?",
      options: ["$1,000", "$920", "$1,080", "$80"],
      correctIndex: 1,
      explanation:
        "Equity = balance ± floating P&L: 1,000 − 80 = 920. Balance stays at 1,000 until the trade closes.",
    },
    {
      id: "lc-l0-balance-equity-b",
      prompt: "True or false: balance changes the moment an open trade moves into profit.",
      options: TF,
      correctIndex: 1,
      explanation:
        "False. Balance only moves when a trade closes, or on deposits and withdrawals. Floating profit shows in equity.",
    },
  ],
  "l0-margin": [
    {
      id: "lc-l0-margin-a",
      prompt: "Equity is $1,000 and used margin is $250. What is the free margin?",
      options: ["$250", "$1,250", "$750", "$4,000"],
      correctIndex: 2,
      explanation: "Free margin = equity − used margin = 1,000 − 250 = 750.",
    },
    {
      id: "lc-l0-margin-b",
      prompt: "Same account: equity $1,000, used margin $250. What is the margin level?",
      options: ["25%", "400%", "75%", "250%"],
      correctIndex: 1,
      explanation:
        "(1,000 ÷ 250) × 100 = 400%. It falls as floating losses shrink equity, and the broker stops you out if it gets too low.",
    },
  ],
  "l0-leverage": [
    {
      id: "lc-l0-leverage-a",
      prompt:
        "Two traders open the same 0.10 lot EURUSD trade with the same 20-pip stop. One account is 1:30, the other 1:500. Both get stopped out. Who loses more?",
      options: [
        "The 1:500 trader",
        "The 1:30 trader",
        "They lose the same amount",
        "Neither: leverage protects the stop",
      ],
      correctIndex: 2,
      explanation:
        "Same size and same stop means the same loss (about $20 here). Leverage only changed how much margin each one locked.",
    },
    {
      id: "lc-l0-leverage-b",
      prompt: "At 1:100 leverage, roughly how much margin does a $10,000 position need?",
      options: ["$10,000", "$1,000", "$100", "$10"],
      correctIndex: 2,
      explanation: "$10,000 ÷ 100 = $100. Exact margin rules depend on the broker and the symbol.",
    },
  ],
  "l0-lots-pips": [
    {
      id: "lc-l0-lots-pips-a",
      prompt: "On EURUSD with a USD account, 0.10 lot is worth about how much per pip?",
      options: ["$0.10", "$1", "$10", "$100"],
      correctIndex: 1,
      explanation: "1.00 lot ≈ $10 per pip, so 0.10 lot ≈ $1 and 0.01 lot ≈ $0.10.",
    },
    {
      id: "lc-l0-lots-pips-b",
      prompt:
        "Gold (XAUUSD, 100 oz per lot) falls from 2,400.00 to 2,395.00 against a 0.10 lot buy. What is the loss?",
      options: ["$5", "$50", "$500", "$0.50"],
      correctIndex: 1,
      explanation:
        "0.10 lot = 10 oz. A $5 move × 10 oz = $50. Some brokers use a different contract size, so check the symbol specification.",
    },
  ],
  "l0-spread-swap": [
    {
      id: "lc-l0-spread-swap-a",
      prompt: "EURUSD bid is 1.08500 and ask is 1.08512. What is the spread?",
      options: ["0.12 pips", "1.2 pips", "12 pips", "120 pips"],
      correctIndex: 1,
      explanation: "1.08512 − 1.08500 = 0.00012 = 1.2 pips (12 points on a 5-digit quote).",
    },
    {
      id: "lc-l0-spread-swap-b",
      prompt: "Swap is:",
      options: [
        "A fee charged on every trade at entry",
        "Overnight financing credited or charged when you hold past rollover",
        "The difference between bid and ask",
        "A type of stop order",
      ],
      correctIndex: 1,
      explanation:
        "Swap applies to positions still open at the broker's rollover time. It can be a credit or a charge.",
    },
  ],
  "l0-mt5-tv": [
    {
      id: "lc-l0-mt5-tv-a",
      prompt: "In MT5, a buy limit that has not filled yet is called:",
      options: ["A position", "A deal", "An order", "A swap"],
      correctIndex: 2,
      explanation:
        "An order is an instruction waiting to fill. When it fills you get a deal (the execution) and a position (the open exposure).",
    },
    {
      id: "lc-l0-mt5-tv-b",
      prompt:
        "You drew an entry and a stop on TradingView. What still has to happen before you are in the trade?",
      options: [
        "Nothing: the drawing is the order",
        "Place the order, with stop and target, at your broker (for example MT5)",
        "Wait for ChartPilot to send it",
        "Raise the leverage",
      ],
      correctIndex: 1,
      explanation:
        "Drawings are analysis. Execution happens at the broker unless you have deliberately linked an account.",
    },
  ],
  "l0-order-types": [
    {
      id: "lc-l0-order-types-a",
      prompt: "Price is 1.0850. You want to buy only after a breakout above 1.0880. Which order?",
      options: [
        "Buy limit at 1.0880",
        "Buy stop at 1.0880",
        "Sell limit at 1.0880",
        "Market buy now",
      ],
      correctIndex: 1,
      explanation:
        "A buy stop sits above price and triggers on the way up. A buy limit sits below price for pullback entries.",
    },
    {
      id: "lc-l0-order-types-b",
      prompt: "Price is 1.0850. You want to buy a pullback into 1.0820. Which order?",
      options: [
        "Buy limit at 1.0820",
        "Buy stop at 1.0820",
        "Sell stop at 1.0820",
        "Sell limit at 1.0820",
      ],
      correctIndex: 0,
      explanation: "Buy limit = buy at this price or lower. It waits below the current price.",
    },
  ],

  // —— Unit 1 ——
  "l1-candles": [
    {
      id: "lc-l1-candles-a",
      prompt:
        "A candle opens at 100, trades up to 110 and closes at 101. What does the long upper wick show?",
      options: [
        "Buyers are in full control",
        "Price was pushed up, then rejected back down",
        "The candle is invalid",
        "Volume was low",
      ],
      correctIndex: 1,
      explanation:
        "The wick shows where price travelled and got pushed back. Closing near the open says the push up was rejected.",
    },
    {
      id: "lc-l1-candles-b",
      prompt: "True or false: one big green candle is enough to call the trend up.",
      options: TF,
      correctIndex: 1,
      explanation:
        "False. One candle says little. Trend comes from the sequence of swings around it.",
    },
  ],
  "l1-timeframes": [
    {
      id: "lc-l1-timeframes-a",
      prompt:
        "The daily chart is in a clear downtrend. The 5-minute chart just made a higher high. What is the sensible read?",
      options: [
        "The trend has flipped up",
        "The daily still leads; the 5M move is likely a pullback until higher timeframes confirm",
        "Ignore the daily chart",
        "Buy with full size",
      ],
      correctIndex: 1,
      explanation:
        "Lower timeframes refine timing. On their own they do not overrule the higher-timeframe direction.",
    },
    {
      id: "lc-l1-timeframes-b",
      prompt: "Which timeframe should usually set your direction?",
      options: ["1-minute", "5-minute", "4-hour or daily", "Whichever moves fastest"],
      correctIndex: 2,
      explanation:
        "Higher timeframes carry less noise and set the bias. Lower timeframes are for timing.",
    },
  ],
  "l1-structure": [
    {
      id: "lc-l1-structure-a",
      prompt: "Swings go: high 110, low 100, high 115, low 105, high 120. What is the structure?",
      options: [
        "Uptrend: higher highs and higher lows",
        "Downtrend",
        "Range",
        "Can't be told from swings",
      ],
      correctIndex: 0,
      explanation:
        "Highs 110 → 115 → 120 and lows 100 → 105 rise together: higher highs and higher lows.",
    },
    {
      id: "lc-l1-structure-b",
      prompt: "What makes a point a real swing high?",
      options: [
        "Any green candle",
        "A clear pullback on both sides of it",
        "The highest wick of the day, nothing else",
        "A round number",
      ],
      correctIndex: 1,
      explanation:
        "A swing needs price to move away on both sides. Tiny bumps are noise, not structure.",
    },
  ],
  "l1-sr": [
    {
      id: "lc-l1-sr-a",
      prompt: "Price reacted three times around 1.0900–1.0910. How should you mark it?",
      options: [
        "One line at exactly 1.0905",
        "A band covering 1.0900–1.0910",
        "Don't mark it: it's in the past",
        "A trend line",
      ],
      correctIndex: 1,
      explanation:
        "Price reacts to areas. A band holds the reactions; an exact line makes every small overshoot look like a break.",
    },
    {
      id: "lc-l1-sr-b",
      prompt: "Old resistance becomes support when:",
      options: [
        "Price trades through it once",
        "Price breaks it, comes back to retest it, and holds",
        "Ten days pass",
        "A news event happens",
      ],
      correctIndex: 1,
      explanation: "The flip is only confirmed when the retest holds.",
    },
  ],
  "l1-volume": [
    {
      id: "lc-l1-volume-a",
      prompt: "Volume on a breakout candle should be judged against:",
      options: [
        "A fixed number such as 10,000",
        "The recent average volume on the same chart",
        "Yesterday's high",
        "The spread",
      ],
      correctIndex: 1,
      explanation:
        "Volume is relative. Compare it with the recent average; raw numbers differ by broker and symbol.",
    },
    {
      id: "lc-l1-volume-b",
      prompt: "Your screenshot has no volume histogram. What is the honest volume read?",
      options: [
        "Volume is high",
        "Volume is low",
        "Volume context unavailable",
        "Judge it from candle colour",
      ],
      correctIndex: 2,
      explanation: "If it isn't on the chart, say so. Don't invent volume analysis.",
    },
  ],

  // —— Unit 2 ——
  "l2-what": [
    {
      id: "lc-l2-what-a",
      prompt: "Which sentence about liquidity is worded correctly?",
      options: [
        "“Stops are definitely sitting above that high.”",
        "“Stops likely rest above that high.”",
        "“The order book shows stops above that high.”",
        "“There is never liquidity above highs.”",
      ],
      correctIndex: 1,
      explanation:
        "A retail chart doesn't show resting orders. Liquidity is inferred, so say “likely”.",
    },
    {
      id: "lc-l2-what-b",
      prompt: "Why do obvious highs and lows attract price?",
      options: [
        "They are always round numbers",
        "Many traders put stops and orders just beyond them",
        "Indicators are drawn there",
        "Spreads are smaller there",
      ],
      correctIndex: 1,
      explanation:
        "Obvious extremes are obvious stop locations, so orders cluster there and large positions can be filled against them.",
    },
  ],
  "l2-sides": [
    {
      id: "lc-l2-sides-a",
      prompt: "Where does buy-side liquidity sit?",
      options: [
        "Below swing lows",
        "Above swing highs",
        "At the middle of the range",
        "Only at round numbers",
      ],
      correctIndex: 1,
      explanation: "Short sellers' stops are buy orders, and they sit above highs.",
    },
    {
      id: "lc-l2-sides-b",
      prompt: "A buyer puts the stop under a swing low. That stop is part of:",
      options: ["Buy-side liquidity", "Sell-side liquidity", "The spread", "Used margin"],
      correctIndex: 1,
      explanation:
        "A long position's stop is a sell order. Sell orders resting below lows are sell-side liquidity.",
    },
  ],
  "l2-equal": [
    {
      id: "lc-l2-equal-a",
      prompt: "Two highs form at 1.2500 and 1.2502. What do they most likely mark?",
      options: [
        "A pool of buy-side liquidity just above them",
        "Sell-side liquidity",
        "A fair value gap",
        "Nothing: equal highs mean nothing",
      ],
      correctIndex: 0,
      explanation: "Equal highs are a tidy, visible cluster. Stops likely rest just above them.",
    },
    {
      id: "lc-l2-equal-b",
      prompt:
        "Yesterday price swept a set of equal lows and closed back above them. Are those lows still a target below?",
      options: [
        "Yes, they are always the target",
        "No: that pool has been taken",
        "Only on Fridays",
        "Yes, and twice as strong now",
      ],
      correctIndex: 1,
      explanation: "Once a pool is taken it's gone. Look for the next untouched one.",
    },
  ],
  "l2-sweeps": [
    {
      id: "lc-l2-sweeps-a",
      prompt: "Price wicks above an old high, then the candle closes back below it. This is:",
      options: [
        "A confirmed breakout",
        "A likely sweep: penetration plus a close back inside",
        "A fair value gap",
        "A break of structure",
      ],
      correctIndex: 1,
      explanation:
        "Penetration plus a close back inside is a sweep. Without the close back, it may simply be a break.",
    },
    {
      id: "lc-l2-sweeps-b",
      prompt: "After a sweep, what do you still need before treating it as a setup?",
      options: [
        "Nothing: enter on the wick",
        "A structure shift in your direction",
        "A news release",
        "A wider spread",
      ],
      correctIndex: 1,
      explanation:
        "A sweep is a clue. Structure still has to change afterwards before it becomes a setup.",
    },
  ],

  // —— Unit 3 ——
  "l3-bos": [
    {
      id: "lc-l3-bos-a",
      prompt: "In an uptrend, price closes above the last swing high. This is:",
      options: [
        "A break of structure (continuation)",
        "A market structure shift (reversal)",
        "A sweep",
        "Accumulation",
      ],
      correctIndex: 0,
      explanation:
        "Breaking its own swing in the direction of the trend is a BOS: the trend continues.",
    },
    {
      id: "lc-l3-bos-b",
      prompt:
        "A wick pokes above the swing high but the candle closes below it. Has structure broken?",
      options: [
        "Yes, any touch counts",
        "Not on a close: treat it as unconfirmed, or a possible sweep",
        "Yes, if the wick is long",
        "Only on the 1-minute chart",
      ],
      correctIndex: 1,
      explanation:
        "Judge breaks on closes. A wick through with a close back below is not a confirmed BOS.",
    },
  ],
  "l3-mss": [
    {
      id: "lc-l3-mss-a",
      prompt: "In a downtrend, which break is a market structure shift?",
      options: [
        "A close below the last low",
        "A close above the last lower high that protected the trend",
        "A touch of a round number",
        "Any green candle",
      ],
      correctIndex: 1,
      explanation:
        "The protected lower high keeps a downtrend intact. A close above it is the first reversal evidence.",
    },
    {
      id: "lc-l3-mss-b",
      prompt: "True or false: one MSS means a new trend has started.",
      options: TF,
      correctIndex: 1,
      explanation:
        "False. It's the first piece of evidence. The new direction still has to build its own swings.",
    },
  ],
  "l3-ranges": [
    {
      id: "lc-l3-ranges-a",
      prompt:
        "Price sits in the middle of a clear range with no sweep and no break. The best action is usually:",
      options: ["Buy, targeting the top", "Sell, targeting the bottom", "WAIT", "Double the size"],
      correctIndex: 2,
      explanation: "The middle of a range gives poor R:R both ways. Wait for an edge to be tested.",
    },
    {
      id: "lc-l3-ranges-b",
      prompt:
        "Price closes above the range top, then closes back inside two candles later. What was it?",
      options: [
        "A new uptrend",
        "A failed break, likely taking liquidity above the range",
        "A break of structure",
        "A fair value gap",
      ],
      correctIndex: 1,
      explanation: "A quick close back inside is a failed break. Ranges punish breakout chasers.",
    },
  ],

  // —— Unit 4 ——
  "l4-displacement": [
    {
      id: "lc-l4-displacement-a",
      prompt: "How do you decide a candle is displacement?",
      options: [
        "It's green",
        "Its range clearly stands out against the last 20 or so candles",
        "It touches a level",
        "It has a long wick",
      ],
      correctIndex: 1,
      explanation:
        "Displacement is relative. If it isn't obviously bigger than its neighbours, it isn't displacement.",
    },
    {
      id: "lc-l4-displacement-b",
      prompt: "Which displacement carries the most weight?",
      options: [
        "One inside a range",
        "One that also breaks structure",
        "One that closes back where it opened",
        "One on the 1-minute chart",
      ],
      correctIndex: 1,
      explanation:
        "Displacement that breaks structure shows real intent and leaves imbalances behind.",
    },
  ],
  "l4-fvg": [
    {
      id: "lc-l4-fvg-a",
      prompt: "In a three-candle move up, the bullish FVG is the space between:",
      options: [
        "Candle 1's high and candle 3's low, when they don't overlap",
        "Candle 2's open and close",
        "Today's high and yesterday's low",
        "Bid and ask",
      ],
      correctIndex: 0,
      explanation:
        "If candle 3's low stays above candle 1's high, the space between them is the gap price skipped.",
    },
    {
      id: "lc-l4-fvg-b",
      prompt: "True or false: price must come back to every FVG, and the FVG must hold.",
      options: TF,
      correctIndex: 1,
      explanation:
        "False. An FVG is a conditional entry zone. Some fill partly, some never, and some break straight through.",
    },
  ],
  "l4-premium": [
    {
      id: "lc-l4-premium-a",
      prompt: "A bullish leg runs from 1.1000 to 1.1100. Where is the discount area for buys?",
      options: ["Above 1.1050", "Below 1.1050", "Exactly at 1.1100", "Above 1.1100"],
      correctIndex: 1,
      explanation:
        "The midpoint is 1.1050. Below it is discount: the better place to buy in an uptrend.",
    },
    {
      id: "lc-l4-premium-b",
      prompt: "Which describes a correction rather than an impulse?",
      options: [
        "Fast candles with big bodies",
        "Slow, overlapping candles drifting against the trend",
        "A gap up",
        "One huge candle",
      ],
      correctIndex: 1,
      explanation: "Impulses are fast and wide. Corrections are slow and overlapping.",
    },
  ],

  // —— Unit 5 ——
  "l5-phases": [
    {
      id: "lc-l5-phases-a",
      prompt: "What is the AMD order?",
      options: [
        "Distribution → manipulation → accumulation",
        "Accumulation → manipulation → distribution",
        "Manipulation → accumulation → distribution",
        "Accumulation → distribution → manipulation",
      ],
      correctIndex: 1,
      explanation:
        "A range (accumulation), a false break of one side (manipulation), then expansion the other way (distribution).",
    },
    {
      id: "lc-l5-phases-b",
      prompt: "In AMD, the manipulation phase is:",
      options: [
        "The range itself",
        "A break of one extreme that fails and reclaims",
        "The final trend move",
        "A news release",
      ],
      correctIndex: 1,
      explanation:
        "Manipulation takes the liquidity on one side, then reclaims back into the range.",
    },
  ],
  "l5-notforcing": [
    {
      id: "lc-l5-notforcing-a",
      prompt: "You see a range and an expansion, but no false break. What's the AMD read?",
      options: [
        "AMD confirmed",
        "Not confirmed: the manipulation is missing",
        "The manipulation must be hidden",
        "Switch timeframes until it appears",
      ],
      correctIndex: 1,
      explanation:
        "All three phases must be visible, in order. Two out of three is “not confirmed”.",
    },
    {
      id: "lc-l5-notforcing-b",
      prompt: "Why does AMD look so obvious after the move?",
      options: [
        "It always happens",
        "Hindsight makes any sequence look obvious",
        "Indicators confirm it",
        "Brokers mark it on the chart",
      ],
      correctIndex: 1,
      explanation:
        "Fitting AMD after the fact is easy. Only count what you identified while it formed.",
    },
  ],

  // —— Unit 6 ——
  "l6-stops": [
    {
      id: "lc-l6-stops-a",
      prompt: "Where does the stop belong?",
      options: [
        "At an amount of money you feel OK losing",
        "Where the trade idea is proven wrong",
        "Always 10 pips away",
        "As far away as possible so it never gets hit",
      ],
      correctIndex: 1,
      explanation:
        "The stop sits at invalidation. The size then adjusts so that distance costs your fixed risk.",
    },
    {
      id: "lc-l6-stops-b",
      prompt: "Price approaches your stop and you widen it “to give it room”. What just happened?",
      options: [
        "Good risk management",
        "You raised your risk after entry and moved the invalidation",
        "Nothing changed",
        "You locked in profit",
      ],
      correctIndex: 1,
      explanation:
        "Widening a stop pushes the loss past your plan. The idea was already wrong there.",
    },
  ],
  "l6-targets": [
    {
      id: "lc-l6-targets-a",
      prompt: "Buy at 1.1000, stop 1.0980, TP1 1.1050. What is the R:R?",
      options: ["1:1", "2:1", "2.5:1", "5:1"],
      correctIndex: 2,
      explanation: "Risk 20 pips, reward 50 pips: 50 ÷ 20 = 2.5R.",
    },
    {
      id: "lc-l6-targets-b",
      prompt: "At 2:1 R:R, what win rate do you need just to break even, before costs?",
      options: ["50%", "About 33%", "66%", "10%"],
      correctIndex: 1,
      explanation:
        "Break-even win rate = 1 ÷ (1 + R) = 1 ÷ 3 ≈ 33%. R:R says nothing about the win rate you actually have.",
    },
  ],
  "l6-sizing": [
    {
      id: "lc-l6-sizing-a",
      prompt:
        "USD account of $2,000, risking 1%. The EURUSD stop is 25 pips (about $10 per pip per lot). What size?",
      options: ["0.08 lot", "0.80 lot", "0.02 lot", "0.25 lot"],
      correctIndex: 0,
      explanation: "Risk $20. Loss per lot = 25 × $10 = $250. 20 ÷ 250 = 0.08 lot.",
    },
    {
      id: "lc-l6-sizing-b",
      prompt:
        "Your risk budget is ₱300, but 0.01 lot already loses ₱600 at the logical stop. What do you do?",
      options: [
        "Trade 0.01 lot anyway",
        "Move the stop closer than the logic allows",
        "Skip it, or wait for a setup with a tighter logical stop",
        "Use higher leverage",
      ],
      correctIndex: 2,
      explanation:
        "If the smallest size breaks your risk rule, the trade doesn't fit this account. Leverage doesn't change the loss.",
    },
  ],

  // —— Unit 7 ——
  "l7-model": [
    {
      id: "lc-l7-model-a",
      prompt: "In the full model, what comes right after the liquidity sweep?",
      options: ["The entry", "A structure shift, on a close", "TP2", "Accumulation"],
      correctIndex: 1,
      explanation:
        "HTF bias → sweep → structure shift → displacement → retracement into the imbalance → entry.",
    },
    {
      id: "lc-l7-model-b",
      prompt: "In this model, the stop usually goes:",
      options: [
        "Beyond the sweep extreme",
        "At the middle of the FVG",
        "At the next liquidity pool",
        "Nowhere: use a mental stop",
      ],
      correctIndex: 0,
      explanation:
        "The sweep extreme is where the idea dies. Targets go at the next untouched liquidity.",
    },
  ],
  "l7-notrade": [
    {
      id: "lc-l7-notrade-a",
      prompt:
        "The HTF bias is up, but the 1H just shifted down and there is no sweep. Best decision?",
      options: ["Buy", "Sell", "WAIT: the evidence conflicts", "Trade both directions"],
      correctIndex: 2,
      explanation: "Conflicting evidence means WAIT.",
    },
    {
      id: "lc-l7-notrade-b",
      prompt: "Price ran through your invalidation level before you entered. The setup is:",
      options: [
        "Still valid: enter now",
        "Invalidated: NO TRADE",
        "Better than before",
        "A WAIT for the same idea",
      ],
      correctIndex: 1,
      explanation:
        "Once invalidation prints, the idea is gone. Look for a new setup, not the old one.",
    },
  ],
};

/** One question from each corner of the path; 10 of 12 opens every unit and Breakthrough. */
export const PLACEMENT_IDS = [
  "lc-l0-margin-a",
  "lc-l0-lots-pips-a",
  "lc-l1-structure-a",
  "lc-l1-timeframes-a",
  "lc-l2-sides-a",
  "lc-l2-sweeps-a",
  "lc-l3-mss-a",
  "lc-l4-fvg-a",
  "lc-l4-premium-a",
  "lc-l5-phases-a",
  "lc-l6-targets-a",
  "lc-l6-sizing-a",
];
export const PLACEMENT_PASS_PCT = 80;
