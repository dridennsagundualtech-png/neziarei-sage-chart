/**
 * Academy reading list — guides & takeaways only.
 * Full book texts are copyrighted; users should buy/borrow legally.
 */

export type BookCategory = "trading" | "mindset" | "money";

export interface AcademyBook {
  id: string;
  title: string;
  author: string;
  category: BookCategory;
  /** One-line pitch */
  blurb: string;
  /** Why a beginner trader should care */
  why: string;
  /** Original study notes — not quotes from the book */
  takeaways: string[];
  /** Suggested order in a reading path (lower = earlier) */
  order: number;
  /** Optional legal store search link (no affiliate required) */
  searchUrl: string;
}

export const BOOK_CATEGORIES: { id: BookCategory | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "trading", label: "Trading" },
  { id: "mindset", label: "Mindset" },
  { id: "money", label: "Money" },
];

export const ACADEMY_BOOKS: AcademyBook[] = [
  {
    id: "trading-in-the-zone",
    title: "Trading in the Zone",
    author: "Mark Douglas",
    category: "trading",
    blurb: "Think in probabilities so one trade does not control your emotions.",
    why: "Most beginners lose from psychology, not from missing a secret indicator. This is the standard book on that gap.",
    takeaways: [
      "Your job is not to be right every trade — it is to execute a process with an edge over many trades.",
      "Fear of missing out and need to be right both destroy risk rules.",
      "Define risk before entry; accept the outcome after entry.",
      "A loss that followed the plan is different from a loss that broke the rules.",
    ],
    order: 1,
    searchUrl: "https://www.google.com/search?q=Trading+in+the+Zone+Mark+Douglas+book",
  },
  {
    id: "reminiscences",
    title: "Reminiscences of a Stock Operator",
    author: "Edwin Lefèvre",
    category: "trading",
    blurb: "A classic story of speculation, patience, and paying tuition to the market.",
    why: "Shows how crowd emotion and overconfidence repeat across decades — useful humility.",
    takeaways: [
      "The market is not obligated to pay you for being early or clever.",
      "Sitting out is often smarter than forcing action.",
      "Big mistakes often come after a winning streak, not only after losses.",
      "Tape reading without risk control is entertainment, not a business.",
    ],
    order: 3,
    searchUrl: "https://www.google.com/search?q=Reminiscences+of+a+Stock+Operator+book",
  },
  {
    id: "market-wizards",
    title: "Market Wizards",
    author: "Jack D. Schwager",
    category: "trading",
    blurb: "Interviews with top traders — many styles, shared discipline themes.",
    why: "Proves there is no single method; risk and psychology show up in almost every interview.",
    takeaways: [
      "Successful traders protect capital first.",
      "Edge without risk management still fails.",
      "You can borrow ideas, but you must make the process yours.",
      "Consistency beats occasional brilliance.",
    ],
    order: 4,
    searchUrl: "https://www.google.com/search?q=Market+Wizards+Jack+Schwager+book",
  },
  {
    id: "trade-your-way",
    title: "Trade Your Way to Financial Freedom",
    author: "Van K. Tharp",
    category: "trading",
    blurb: "Expectancy, R-multiples and position sizing: the maths behind any method.",
    why: "It explains why the same entries can grow or wreck an account depending on size alone, which is what the Den and the sizing card are built on.",
    takeaways: [
      "Measure every trade in R, the amount you risked, so results compare across symbols and account sizes.",
      "A system is judged by its expectancy over many trades, not by its win rate.",
      "Position sizing decides most of the outcome once a method has a small edge.",
      "Pick a method that fits your temperament, or you won't follow it on a bad week.",
    ],
    order: 2,
    searchUrl: "https://www.google.com/search?q=Trade+Your+Way+to+Financial+Freedom+Van+Tharp+book",
  },
  {
    id: "atomic-habits",
    title: "Atomic Habits",
    author: "James Clear",
    category: "mindset",
    blurb: "Build small systems: journal, review, fixed risk — every day.",
    why: "Trading improvement is mostly habits (prep, size, review), not random motivation spikes.",
    takeaways: [
      "Make the right action the easy action (checklist before every trade).",
      "Identity: “I am someone who follows the plan” beats “I need a big win today.”",
      "Track process metrics (rules followed), not only P&L.",
      "Environment matters — remove one-click revenge trading where you can.",
    ],
    order: 2,
    searchUrl: "https://www.google.com/search?q=Atomic+Habits+James+Clear+book",
  },
  {
    id: "psychology-of-money",
    title: "The Psychology of Money",
    author: "Morgan Housel",
    category: "money",
    blurb: "How people actually behave with money — survival, ego, luck, and compounding.",
    why: "Stops you from treating the account like a video-game score and more like long-term capital.",
    takeaways: [
      "Getting wealthy and staying wealthy are different skills.",
      "Room for error (margin of safety) matters more than optimal forecasts.",
      "Your personal history shapes risk tolerance — know yours.",
      "Enough is a powerful concept; endless target-moving destroys accounts.",
    ],
    order: 5,
    searchUrl: "https://www.google.com/search?q=The+Psychology+of+Money+Morgan+Housel+book",
  },
  {
    id: "evidence-based-ta",
    title: "Evidence-Based Technical Analysis",
    author: "David Aronson",
    category: "trading",
    blurb: "How to test a trading idea instead of trusting how good it looks on a chart.",
    why: "Backtests and setup win rates are easy to fool yourself with. This is the book on telling a real edge from a lucky one.",
    takeaways: [
      "A rule that looks great on past data may only fit that data. Test it on data it hasn't seen.",
      "The more rules you try, the more likely the best one won by luck.",
      "Write a rule precisely enough that a computer could follow it, or you can't test it.",
      "Small samples prove very little; a handful of winners is not an edge.",
    ],
    order: 6,
    searchUrl:
      "https://www.google.com/search?q=Evidence-Based+Technical+Analysis+David+Aronson+book",
  },
];

export const READING_PATH = [
  "trading-in-the-zone",
  "atomic-habits",
  "trade-your-way",
  "reminiscences",
  "market-wizards",
  "evidence-based-ta",
  "psychology-of-money",
] as const;
