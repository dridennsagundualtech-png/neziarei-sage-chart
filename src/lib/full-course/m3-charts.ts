import type { GuideModule } from "@/lib/app-guide/types";
import { BREAKTHROUGH } from "@/lib/breakthrough";
import { LESSON_VISUALS } from "@/lib/breakthrough/lesson-visuals";
import { go } from "@/lib/breakthrough/scene";
import { calc, clock, scene, type Visual } from "@/lib/breakthrough/types";

const term = (name: string): Visual =>
  BREAKTHROUGH.chapters.flatMap((c) => c.terms).find((t) => t.term === name)!.visual;

/** Unlabelled pictures for the chart-reading checks. */
const UPTREND = scene({
  start: 40,
  items: [go(47, 3), go(44, 2), go(52, 3), go(48.5, 2), go(57, 3), go(53.5, 2), go(58, 2)],
  steps: [{ upTo: 99, text: "" }],
});
const RANGE = scene({
  start: 50,
  items: [go(56, 3), go(50.5, 3), go(55.7, 3), go(50.2, 3), go(55.9, 3), go(50.6, 3), go(53, 2)],
  steps: [{ upTo: 99, text: "" }],
});

export const FC3_CHARTS: GuideModule = {
  id: "fc-charts",
  title: "Reading a chart, simply",
  blurb: "Two timeframes, trend or range, the levels worth marking, and when to trade.",
  lessons: [
    {
      id: "fc-tf",
      title: "Candles and two timeframes",
      summary:
        "The 4-hour chart for direction, the 1-hour chart for entries. Nothing smaller for now.",
      where: "Analyze › Market data or your MT5 charts",
      access: "everyone",
      steps: [
        {
          title: "Reading one candle",
          body: "Each candle shows where price opened, the highest and lowest it went, and where it closed. Long wicks show prices that were tried and pushed back. One candle alone says little; candles mean something in a sequence.",
          visual: LESSON_VISUALS["l1-candles"],
        },
        {
          title: "Two timeframes, two jobs",
          body: "Use the **4-hour** chart to decide which way you are allowed to trade, and the **1-hour** chart to time the entry. The bigger chart always wins an argument with the smaller one.",
          visual: LESSON_VISUALS["l1-timeframes"],
        },
        {
          title: "Why not the 1- or 5-minute chart",
          body: "On tiny timeframes your stop is small, so the spread is a big part of it. A 1.5-pip spread on a 5-pip stop costs you 30% of your risk before the trade starts. On a 25-pip one-hour stop it is 6%. Small timeframes also move on noise. Start on 1-hour and 4-hour.",
          visual: calc("spread"),
          tip: "Slide the spread up and watch how a '1:1' trade stops being 1:1.",
        },
      ],
      checks: [
        {
          id: "fc-tf-1",
          prompt:
            "The 4-hour chart is falling, the 1-hour chart just bounced. Which way are you allowed to trade?",
          options: [
            "Short, or wait",
            "Long, the 1-hour is up",
            "Both",
            "Whatever the 5-minute says",
          ],
          correctIndex: 0,
          explanation:
            "The higher timeframe sets the direction. A 1-hour bounce inside a 4-hour fall is a pullback until proven otherwise.",
        },
        {
          id: "fc-tf-2",
          prompt: "Why are 1- and 5-minute charts hard for beginners?",
          options: [
            "Stops are small, so spread eats a big share, and moves are noisier",
            "Brokers don't allow them",
            "They have no candles",
            "They always trend",
          ],
          correctIndex: 0,
          explanation:
            "Costs are fixed per trade, so the smaller the stop, the bigger the cost in R.",
        },
      ],
    },
    {
      id: "fc-structure",
      title: "Trend or range, in three questions",
      summary:
        "Most of what you need from a chart is whether it is going up, going down, or going nowhere.",
      where: "Your 4-hour chart",
      access: "everyone",
      open: { to: "/learn", tab: "lessons", label: "Open Unit 1 lessons" },
      steps: [
        {
          title: "Question 1: are the highs and lows rising?",
          body: "Higher highs and higher lows: an uptrend. You look for longs only.",
          visual: LESSON_VISUALS["l1-structure"],
        },
        {
          title: "Question 2: are they falling?",
          visual: scene({
            start: 62,
            items: [
              go(55, 3, "l1"),
              go(58.5, 2, "h1"),
              go(50, 3, "l2"),
              go(54, 2, "h2"),
              go(45, 3, "l3"),
              go(49, 2, "h3"),
              go(43, 3),
            ],
            marks: [
              { at: "h2", y: 54.4, text: "LH", dir: "down", tone: "bear" },
              { at: "l2", y: 49.6, text: "LL", dir: "up", tone: "bear" },
              { at: "h3", y: 49.4, text: "LH", dir: "down", tone: "bear" },
              { at: "l3", y: 44.6, text: "LL", dir: "up", tone: "bear" },
            ],
            steps: [
              { upTo: "h1", text: "A high, then a drop." },
              { upTo: "h2", text: "The bounce stops lower than the last high: a lower high." },
              { upTo: 99, text: "Lower highs and lower lows: a downtrend. Shorts only." },
            ],
          }),
          body: "Lower highs and lower lows: a downtrend. You look for shorts only. Same rules as the uptrend, upside down.",
        },
        {
          title: "Question 3: neither?",
          body: "Highs and lows going sideways inside a box: a range. Breakouts often fail and price swings between the edges. As a beginner, a range on the 4-hour chart means **wait**.",
          visual: LESSON_VISUALS["l3-ranges"],
        },
        {
          title: "Only count clear swings",
          body: "A swing high needs lower candles on both sides of it; tiny bumps don't count. If you have to squint to decide, the answer is 'range', and range means wait.",
        },
      ],
      checks: [
        {
          id: "fc-structure-1",
          prompt: "What is this 4-hour chart doing?",
          visual: UPTREND,
          options: ["Uptrend: higher highs and higher lows", "Downtrend", "Range", "Can't be read"],
          correctIndex: 0,
          explanation: "Each swing high and each swing low is above the one before.",
        },
        {
          id: "fc-structure-2",
          prompt: "And this one? What does the course tell you to do?",
          visual: RANGE,
          options: ["Range: wait", "Uptrend: buy", "Downtrend: sell", "Range: buy the middle"],
          correctIndex: 0,
          explanation:
            "The highs and lows go sideways. On the 4-hour chart, a range means no trade for now.",
        },
      ],
      task: "On your chosen market, open the 4-hour chart and write today's answer in **Journal › Notes**: uptrend, downtrend or range.",
    },
    {
      id: "fc-levels",
      title: "The levels worth marking",
      summary: "A few zones where price is likely to react, drawn as bands, not exact lines.",
      where: "Your 1-hour chart and the Den chart",
      access: "everyone",
      steps: [
        {
          title: "Zones, not lines",
          body: "Price reacts to areas, not exact numbers. Draw a band around the place where price turned more than once. A break of a line by two pips means nothing; a close well beyond the band means something.",
          visual: LESSON_VISUALS["l1-sr"],
        },
        {
          title: "Where stops collect",
          body: "Obvious swing highs and lows, especially equal ones, have many stop orders sitting just beyond them. Price is often drawn there before turning. These are good places for targets, and places to keep your own stop away from.",
          visual: LESSON_VISUALS["l2-equal"],
        },
        {
          title: "Yesterday's value area",
          body: "ChartPilot's Den chart shows the **Prior day value area** (where most of yesterday's trading happened) and the **Prior day POC** (the busiest price). Price often slows down or turns around them. Use them as a map; on their own they are not a reason to trade.",
          visual: term("Volume profile"),
        },
        {
          title: "Keep it to four or five",
          body: "Mark the 4-hour swing high and low, yesterday's high and low, and the value area. More lines don't make better decisions; they make every move look like a 'reaction'.",
        },
      ],
      checks: [
        {
          id: "fc-levels-1",
          prompt:
            "Price pokes 2 pips through your support band and closes back inside. Is the level broken?",
          options: [
            "No: it's a band, and price closed back inside",
            "Yes, any touch counts",
            "Yes, sell now",
            "Levels can't be broken",
          ],
          correctIndex: 0,
          explanation: "Bands allow for small overshoots; the close matters more than a wick.",
        },
        {
          id: "fc-levels-2",
          prompt: "Two equal highs sit just above price. What do they most likely mark?",
          options: [
            "A cluster of stop orders: a likely target",
            "A guaranteed top",
            "Nothing at all",
            "The broker's price",
          ],
          correctIndex: 0,
          explanation:
            "Equal highs are an obvious place for stops, so price is often drawn to them.",
        },
      ],
    },
    {
      id: "fc-when",
      title: "When to trade, and when not to",
      summary: "The busy hours, the news to avoid, and what they are in Philippine time.",
      where: "Anywhere",
      access: "everyone",
      steps: [
        {
          title: "Trade when the market is awake",
          body: "Forex moves most when London and New York are open. ChartPilot uses these hours (UTC): London 08:00–17:00, New York 13:00–22:00, overlap 13:00–17:00. In the Philippines (UTC+8) that is London 4 pm–1 am, New York 9 pm–6 am, and the busy overlap 9 pm–1 am.",
          visual: clock({
            bands: [
              { label: "Asian session", start: 0, end: 9, tz: "utc", tone: "muted" },
              { label: "London session", start: 8, end: 17, tz: "utc", tone: "primary" },
              { label: "New York session", start: 13, end: 22, tz: "utc", tone: "primary" },
              { label: "London–NY overlap", start: 13, end: 17, tz: "utc", tone: "warn" },
            ],
            caption: "UTC hours. Add 8 for Philippine time.",
          }),
        },
        {
          title: "Pick hours you can actually keep",
          body: "A plan you can only follow at 2 am won't be followed. Choose one window, for example London's open (4–7 pm Philippine time) or the overlap (9 pm–1 am), and only take setups then.",
        },
        {
          title: "Step aside for the big news",
          visual: clock({
            bands: [
              {
                label: "US data (jobs, CPI): 8:30 am NY",
                start: 8,
                end: 9,
                tz: "ny",
                tone: "warn",
              },
              { label: "US rate decision: 2 pm NY", start: 14, end: 15, tz: "ny", tone: "bear" },
              { label: "London–NY overlap", start: 13, end: 17, tz: "utc", tone: "primary" },
            ],
            caption:
              "Switch between US winter and summer time: the news hours move by one hour in UTC.",
          }),
          body: "Some releases move price in seconds and widen spreads. Don't hold new trades through them while learning:",
          bullets: [
            "**US jobs report (NFP)**: first Friday of the month, 8:30 am New York time (8:30 or 9:30 pm in the Philippines, depending on US daylight saving).",
            "**US inflation (CPI)**: usually mid-month, same time.",
            "**US interest-rate decisions (FOMC)**: eight times a year, 2:00 pm New York time (2 or 3 am in the Philippines).",
          ],
          tip: "Any free economic calendar shows these with a 'high impact' flag. Check it before your session.",
        },
        {
          title: "Quiet times to skip",
          body: "Late Friday (spreads widen, positions get closed into the weekend), the first hour after the Monday open, and holidays like Christmas week. Fewer, cleaner trades beat many messy ones.",
        },
      ],
      checks: [
        {
          id: "fc-when-1",
          prompt: "In the Philippines, when is the busy London–New York overlap?",
          options: [
            "About 9 pm to 1 am",
            "About 9 am to 1 pm",
            "Midnight to 6 am",
            "All day equally",
          ],
          correctIndex: 0,
          explanation: "13:00–17:00 UTC plus 8 hours is 9 pm–1 am Philippine time.",
        },
        {
          id: "fc-when-2",
          prompt: "The US jobs report comes out in 10 minutes. You are learning. What do you do?",
          options: [
            "Wait until it is out and things settle",
            "Enter just before it",
            "Double your size",
            "Remove your stop",
          ],
          correctIndex: 0,
          explanation:
            "Big releases can jump past stops and widen spreads. Sit them out while you learn.",
        },
      ],
      task: "Choose your trading window and write it in **Journal › Notes**, in Philippine time. If you trade only at certain hours, also set your sessions in ChartPilot so it pauses outside them.",
    },
  ],
};
