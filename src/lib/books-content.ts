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
    id: "think-and-grow-rich",
    title: "Think and Grow Rich",
    author: "Napoleon Hill",
    category: "mindset",
    blurb: "Classic on definite purpose, persistence, and belief — not a trading manual.",
    why: "Helps with long-term drive; pair it with risk rules so motivation does not become overtrading.",
    takeaways: [
      "Write a clear goal and revisit it — vague wishes rarely change behavior.",
      "Persistence matters, but in trading it must sit behind position sizing.",
      "Mastermind / good peers beat learning in isolation.",
      "Desire without a plan is just noise; plan without review is incomplete.",
    ],
    order: 2,
    searchUrl: "https://www.google.com/search?q=Think+and+Grow+Rich+Napoleon+Hill+book",
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
      "Track process metrics (rules followed), not only P&amp;L.",
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
    id: "how-to-win-friends",
    title: "How to Win Friends and Influence People",
    author: "Dale Carnegie",
    category: "mindset",
    blurb: "Timeless people skills — useful in life, prop firms, and teams.",
    why: "Not a chart book, but communication and ego control transfer to trading communities and coaching.",
    takeaways: [
      "Listen more than you argue — including when reviewing your own trades.",
      "Don’t humiliate others (or yourself) after a loss; correct the process.",
      "Appreciation and clarity beat aggression in almost every room.",
    ],
    order: 6,
    searchUrl: "https://www.google.com/search?q=How+to+Win+Friends+and+Influence+People+Dale+Carnegie+book",
  },
];

export const READING_PATH = [
  "trading-in-the-zone",
  "atomic-habits",
  "think-and-grow-rich",
  "reminiscences",
  "market-wizards",
  "psychology-of-money",
] as const;
