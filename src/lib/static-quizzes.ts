/**
 * Static knowledge quizzes — zero AI.
 * Safe for offline / shared use with no model limits.
 */

export type StaticQuizTopic =
  | "platform_basics"
  | "market_structure"
  | "risk_management"
  | "trade_planning"
  | "orders_costs";

export interface StaticQuestion {
  id: string;
  topic: StaticQuizTopic;
  prompt: string;
  /** Exactly one correct index into options */
  options: [string, string, string, string] | [string, string];
  correctIndex: number;
  explanation: string;
}

export interface StaticQuizBatch {
  id: string;
  title: string;
  description: string;
  /** Suggested time in minutes */
  minutes: number;
  questionIds: string[];
}

export const STATIC_QUESTIONS: StaticQuestion[] = [
  // —— Platform basics ——
  {
    id: "q-balance-1",
    topic: "platform_basics",
    prompt: "What is account balance?",
    options: [
      "Balance + floating profit/loss on open trades",
      "Money from closed trades (deposits, withdrawals, closed P&L only)",
      "The margin locked by the broker",
      "Your maximum allowed loss for the day",
    ],
    correctIndex: 1,
    explanation:
      "Balance only moves when trades close (or you deposit/withdraw). Open trades affect equity, not balance.",
  },
  {
    id: "q-equity-1",
    topic: "platform_basics",
    prompt: "Equity is best described as:",
    options: [
      "Balance only, ignoring open trades",
      "Used margin divided by free margin",
      "Balance plus unrealised (floating) profit or loss",
      "The leverage setting on the account",
    ],
    correctIndex: 2,
    explanation:
      "Equity = balance ± floating P&L. If you closed everything right now, equity is roughly what the account would show.",
  },
  {
    id: "q-margin-1",
    topic: "platform_basics",
    prompt: "Used margin is:",
    options: [
      "A fee the broker keeps forever",
      "Collateral locked to keep positions open",
      "The same thing as your stop-loss size",
      "Only charged on losing trades",
    ],
    correctIndex: 1,
    explanation:
      "Margin is reserved collateral, not a cost and not your loss. Free margin = equity − used margin.",
  },
  {
    id: "q-free-margin-1",
    topic: "platform_basics",
    prompt: "Free margin is:",
    options: [
      "Equity − used margin",
      "Balance − equity",
      "Leverage × balance",
      "Spread × lot size",
    ],
    correctIndex: 0,
    explanation:
      "Free margin is room left to open new trades or absorb floating losses before a margin call risk rises.",
  },
  {
    id: "q-leverage-1",
    topic: "platform_basics",
    prompt: "Higher leverage (e.g. 1:500 vs 1:25) mainly:",
    options: [
      "Increases your win rate",
      "Guarantees larger profits",
      "Lowers the margin required for a given position size",
      "Removes the need for a stop-loss",
    ],
    correctIndex: 2,
    explanation:
      "Leverage changes margin requirement, not edge. Risk still comes from position size and stop distance.",
  },
  {
    id: "q-leverage-2",
    topic: "platform_basics",
    prompt: "True or false: Using 1:500 leverage means you must risk 500× more money than with 1:1.",
    options: ["True", "False"],
    correctIndex: 1,
    explanation:
      "False. You can still risk 0.5–1% of equity with a small lot size. High leverage only makes oversized positions easier — not mandatory.",
  },
  {
    id: "q-lots-1",
    topic: "platform_basics",
    prompt: "In many forex symbols, 1.00 standard lot is often:",
    options: [
      "1 unit of base currency",
      "1,000 units of base currency",
      "100,000 units of base currency",
      "The same as 1% account risk",
    ],
    correctIndex: 2,
    explanation:
      "A common convention is 100,000 units for 1.00 lot — always confirm in the symbol specification on your broker/MT5.",
  },
  {
    id: "q-spread-1",
    topic: "orders_costs",
    prompt: "The spread is:",
    options: [
      "Your take-profit distance",
      "The difference between bid and ask prices",
      "Overnight swap only",
      "Commission charged once per month",
    ],
    correctIndex: 1,
    explanation:
      "You typically buy at ask and sell at bid. Price must move past the spread before a long is in profit at market prices.",
  },
  {
    id: "q-tv-mt5-1",
    topic: "platform_basics",
    prompt: "TradingView drawings on a chart mean:",
    options: [
      "Orders are already live at the broker",
      "Ideas/levels for analysis — not automatic broker orders",
      "Margin is reserved automatically",
      "Equity equals balance",
    ],
    correctIndex: 1,
    explanation:
      "TV is great for analysis and alerts. Execution, balance, equity and margin usually live on MT5 or the broker app unless linked.",
  },
  {
    id: "q-order-1",
    topic: "orders_costs",
    prompt: "A buy limit order is typically used to:",
    options: [
      "Buy only if price rises above the current price (breakout)",
      "Buy at a specified price or better (usually on a pullback lower)",
      "Close all positions at market",
      "Increase leverage automatically",
    ],
    correctIndex: 1,
    explanation:
      "Buy limit: fill at your limit or lower. Buy stop: triggers when price rises to/through a level (breakout style).",
  },
  {
    id: "q-order-2",
    topic: "orders_costs",
    prompt: "Stop-loss is:",
    options: [
      "The same as a buy stop entry",
      "An exit instruction to cap loss if price hits an invalidation level",
      "A type of deposit",
      "Required only on leveraged accounts above 1:100",
    ],
    correctIndex: 1,
    explanation:
      "Stop-loss protects the account when the idea is wrong. It is not the same as a stop entry order.",
  },

  // —— Structure / planning ——
  {
    id: "q-structure-1",
    topic: "market_structure",
    prompt: "A simple bullish structure is usually:",
    options: [
      "Lower highs and lower lows",
      "Higher highs and higher lows",
      "Only green candles",
      "One engulfing candle on M1",
    ],
    correctIndex: 1,
    explanation:
      "Uptrend character: rising swing highs and rising swing lows. Colour of a single candle is not structure.",
  },
  {
    id: "q-tf-1",
    topic: "market_structure",
    prompt: "Higher timeframe (e.g. H4/Daily) is mainly used for:",
    options: [
      "Exact scalping entries only",
      "Directional bias and major levels",
      "Ignoring risk management",
      "Replacing the need for a stop",
    ],
    correctIndex: 1,
    explanation:
      "HTF sets context. Lower timeframes refine timing. LTF should not casually overrule HTF bias.",
  },
  {
    id: "q-risk-1",
    topic: "risk_management",
    prompt: "Position size should primarily be based on:",
    options: [
      "How confident the AI score looks",
      "Maximum leverage available",
      "Account risk % and distance from entry to stop",
      "How many indicators agree",
    ],
    correctIndex: 2,
    explanation:
      "Size = (account × risk %) ÷ stop distance (in money terms). Confidence is not a sizing input.",
  },
  {
    id: "q-risk-2",
    topic: "risk_management",
    prompt: "True or false: A high setup score means you should increase risk above your normal %.",
    options: ["True", "False"],
    correctIndex: 1,
    explanation:
      "False. Fixed fractional risk keeps losing streaks survivable. Scores are not guarantees.",
  },
  {
    id: "q-plan-1",
    topic: "trade_planning",
    prompt: "Invalidation means:",
    options: [
      "The target was hit",
      "Conditions that prove the trade idea wrong — often where the stop belongs",
      "The spread widened",
      "You changed timeframe",
    ],
    correctIndex: 1,
    explanation:
      "Define invalidation before entry. If price goes there, the idea is wrong — exit without debating.",
  },
  {
    id: "q-plan-2",
    topic: "trade_planning",
    prompt: "“No trade” is:",
    options: [
      "A failure as a trader",
      "A valid decision when evidence is weak or conflicting",
      "Only allowed on weekends",
      "The same as holding a losing position",
    ],
    correctIndex: 1,
    explanation:
      "Standing aside is part of the job. Forced trades are a common account killer.",
  },
  {
    id: "q-m1-1",
    topic: "trade_planning",
    prompt: "On M1 scalping, setups generally:",
    options: [
      "Stay valid for days",
      "Expire quickly — often within minutes if structure does not follow through",
      "Never need a stop-loss",
      "Ignore spread completely",
    ],
    correctIndex: 1,
    explanation:
      "Lower timeframes mean faster expiry and more noise. Spread and speed matter more on M1.",
  },
  {
    id: "q-rr-1",
    topic: "risk_management",
    prompt: "R:R (reward-to-risk) measures:",
    options: [
      "Probability of winning",
      "Potential reward size versus defined risk size",
      "Leverage ratio only",
      "Win rate from the last 10 trades",
    ],
    correctIndex: 1,
    explanation:
      "2R means the target is about twice the stop distance. It is not a win probability.",
  },
  {
    id: "q-margin-level-1",
    topic: "platform_basics",
    prompt: "Margin level is commonly:",
    options: [
      "(Equity ÷ used margin) × 100%",
      "(Balance ÷ leverage) × 100%",
      "Spread × free margin",
      "Always fixed at 100%",
    ],
    correctIndex: 0,
    explanation:
      "As equity falls toward used margin, margin level drops and stop-out risk rises. Exact stop-out rules depend on the broker.",
  },
];

export const STATIC_BATCHES: StaticQuizBatch[] = [
  {
    id: "batch-platform-1",
    title: "Platform basics",
    description: "Balance, equity, margin, leverage, lots — MT5-style account terms.",
    minutes: 8,
    questionIds: [
      "q-balance-1",
      "q-equity-1",
      "q-margin-1",
      "q-free-margin-1",
      "q-leverage-1",
      "q-leverage-2",
      "q-lots-1",
      "q-margin-level-1",
    ],
  },
  {
    id: "batch-orders-1",
    title: "Orders & costs",
    description: "Spread, order types, TradingView vs broker execution.",
    minutes: 5,
    questionIds: ["q-spread-1", "q-tv-mt5-1", "q-order-1", "q-order-2"],
  },
  {
    id: "batch-structure-risk-1",
    title: "Structure & risk",
    description: "Trend character, timeframes, sizing, invalidation, no-trade.",
    minutes: 7,
    questionIds: [
      "q-structure-1",
      "q-tf-1",
      "q-risk-1",
      "q-risk-2",
      "q-plan-1",
      "q-plan-2",
      "q-m1-1",
      "q-rr-1",
    ],
  },
  {
    id: "batch-mixed-starter",
    title: "Starter mixed check",
    description: "A short mixed set from platform + risk + planning.",
    minutes: 6,
    questionIds: [
      "q-balance-1",
      "q-equity-1",
      "q-leverage-1",
      "q-spread-1",
      "q-structure-1",
      "q-risk-1",
      "q-plan-2",
      "q-rr-1",
    ],
  },
];

export function questionsForBatch(batchId: string): StaticQuestion[] {
  const batch = STATIC_BATCHES.find((b) => b.id === batchId);
  if (!batch) return [];
  const map = new Map(STATIC_QUESTIONS.map((q) => [q.id, q]));
  return batch.questionIds
    .map((id) => map.get(id))
    .filter((q): q is StaticQuestion => Boolean(q));
}
