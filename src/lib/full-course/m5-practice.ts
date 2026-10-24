import type { GuideModule } from "@/lib/app-guide/types";
import { LESSON_VISUALS } from "@/lib/breakthrough/lesson-visuals";
import { go } from "@/lib/breakthrough/scene";
import { flow, scene } from "@/lib/breakthrough/types";

export const FC5_PRACTICE: GuideModule = {
  id: "fc-practice",
  title: "Practise on demo",
  blurb:
    "A short daily routine, placing orders in MT5, recording everything, and catching your own mistakes.",
  lessons: [
    {
      id: "fc-routine",
      title: "Your 20-minute routine",
      summary: "The same steps before, during and after every session.",
      where: "Analyze, MT5 and the Journal",
      access: "everyone",
      steps: [
        {
          title: "Three parts",
          body: "Every session follows the same shape:",
          visual: flow({
            nodes: [
              {
                label: "Before (10 min)",
                note: "News check, 4-hour trend, mark your zones.",
                tone: "primary",
              },
              { label: "During", note: "Wait. Only act when every rule on your card is true." },
              {
                label: "After (5 min)",
                note: "Record every trade and skip. Close the platform.",
                tone: "bull",
              },
            ],
          }),
        },
        {
          title: "Before",
          mock: {
            where: "Journal › Notes › Today",
            parts: [
              {
                kind: "rows",
                rows: [
                  { left: "High-impact news in my window?", right: "No" },
                  { left: "4H trend", right: "Up" },
                  { left: "Zones marked", right: "1.1150–1.1160, 1.1205" },
                ],
              },
            ],
          },
          body: "Check the economic calendar for high-impact news in your window. Open the 4-hour chart and write the trend: up, down or range. If it's a range, today's plan is to watch, not trade. Mark your zones on the 1-hour chart.",
        },
        {
          title: "During",
          body: "Set alerts at your zones if you like, and step away from the screen. Staring at candles makes you invent setups. When price reaches a zone, go through your card line by line. Any line false means no trade.",
        },
        {
          title: "After",
          body: "Record what happened in the Journal, including setups you saw and skipped. One sentence on how you felt helps later. Then stop: the day's work is done whether you traded or not.",
        },
      ],
      checks: [
        {
          id: "fc-routine-1",
          prompt: "Your 4-hour chart is ranging today. What is today's plan?",
          options: [
            "Watch and record, no trades",
            "Trade both edges of the range",
            "Switch to the 5-minute chart",
            "Trade the news",
          ],
          correctIndex: 0,
          explanation: "Your card trades with the 4-hour trend. No trend, no trade.",
        },
        {
          id: "fc-routine-2",
          prompt: "Why step away from the screen while waiting?",
          options: [
            "Staring at candles makes you see setups that aren't there",
            "MT5 runs faster",
            "Prices only move when you're away",
            "It's required by brokers",
          ],
          correctIndex: 0,
          explanation: "Boredom turns into forced trades. Alerts can watch the zone for you.",
        },
      ],
      task: "Do the 'before' part today, even if you don't trade: news check, 4-hour trend, zones. Write the trend in Notes.",
    },
    {
      id: "fc-mt5",
      title: "Placing the order in MT5",
      summary: "Market or limit, stop and target set with the order, size from ChartPilot.",
      where: "MT5",
      access: "everyone",
      steps: [
        {
          title: "Market or limit",
          body: "A **market order** fills now at the current price: use it when your entry candle has just closed. A **buy limit** waits below price, a **sell limit** above. A **buy stop** or **sell stop** waits for price to break through a level. Mixing these up is a classic beginner mistake.",
          visual: LESSON_VISUALS["l0-order-types"],
        },
        {
          title: "Fill in the order window",
          mock: {
            where: "MT5 › New Order",
            parts: [
              { kind: "field", label: "Symbol", value: "EURUSD.r" },
              {
                kind: "field",
                label: "Volume",
                value: "0.05",
                hint: "From ChartPilot's position size",
              },
              {
                kind: "field",
                label: "Stop Loss",
                value: "1.11480",
                hint: "Below the entry for a buy",
              },
              { kind: "field", label: "Take Profit", value: "1.12100" },
              {
                kind: "buttons",
                items: [
                  { label: "Sell by Market", tone: "secondary" },
                  { label: "Buy by Market", tone: "primary" },
                ],
              },
            ],
          },
          body: "In MT5, **New Order**: pick the symbol, type the **Volume** (the lot size from ChartPilot), and fill in **Stop Loss** and **Take Profit** before you click Buy or Sell. Check the stop is on the losing side: below the entry for a buy, above for a sell.",
        },
        {
          title: "Check it on the chart",
          visual: scene({
            start: 50,
            items: [go(51.2, 4, "in"), go(52.5, 3), go(51.8, 2), go(54, 3)],
            lines: [
              { y: 57.5, from: "in", label: "take profit", tone: "bull" },
              { y: 51.2, from: "in", label: "entry", tone: "primary" },
              { y: 48.1, from: "in", label: "stop loss", tone: "bear" },
            ],
            steps: [{ upTo: 99, text: "All three lines on the chart: the trade is protected." }],
          }),
          body: "After the order fills, the entry, stop and target lines appear on the chart. If the stop line is missing, add it straight away. A position without a stop is the most expensive mistake there is.",
        },
        {
          title: "Then leave it alone",
          body: "Your card says: no fiddling. Close the order window, take a screenshot if you like (ChartPilot's **Save screenshot to journal**), and wait for the stop or target.",
        },
      ],
      checks: [
        {
          id: "fc-mt5-1",
          prompt: "Your entry candle just closed and you want in now. Which order?",
          options: ["Market order", "Buy limit far below", "Sell stop", "No order, just watch"],
          correctIndex: 0,
          explanation: "A market order fills at the current price straight away.",
        },
        {
          id: "fc-mt5-2",
          prompt: "You placed a buy. Where must the stop-loss be?",
          options: ["Below the entry", "Above the entry", "At the entry", "Anywhere"],
          correctIndex: 0,
          explanation: "For a buy, the loss happens below the entry, so the stop sits below it.",
        },
      ],
    },
    {
      id: "fc-journal",
      title: "Record every trade, and every skip",
      summary: "Your journal is the only honest judge of your trading. It needs every trade.",
      where: "Journal › History",
      access: "everyone",
      open: { to: "/journal", tab: "history", label: "Open the Journal" },
      steps: [
        {
          title: "Why every trade",
          body: "A journal with only the good trades lies. Your stats, the daily loss limit and the comparisons ChartPilot shows all come from what you record. Missing trades make the numbers look better than you are.",
        },
        {
          title: "Pick the right outcome",
          body: "In **Journal this setup**, choose:",
          bullets: [
            "**Win / Loss / Breakeven** with the **Result in R**, for trades you took.",
            "**No trade** for setups you decided to skip, with the reason in **Notes**.",
            "**Missed** when the entry never filled or you weren't there.",
            "**Invalidated** when the idea died before entry.",
          ],
          mock: {
            where: "Journal this setup",
            parts: [
              {
                kind: "chips",
                label: "Outcome",
                items: ["Win", "Loss", "Breakeven", "No trade"],
                on: [1],
              },
              { kind: "field", label: "Result in R", value: "-1" },
              { kind: "field", label: "Notes", value: "Followed rules: yes. Felt calm." },
              { kind: "button", label: "Save result", tone: "primary" },
            ],
          },
        },
        {
          title: "Two notes on every trade",
          mock: {
            where: "Journal this setup › Notes",
            parts: [
              {
                kind: "field",
                label: "Notes",
                value: "Followed rules: no. Felt: rushed. Entered before the close.",
              },
            ],
          },
          body: "Write **Followed rules: yes/no** and one word for how you felt (calm, rushed, angry, bored). In a few weeks, these two notes tell you more than any indicator: most beginners find their losses cluster on 'no' and 'rushed'.",
        },
      ],
      checks: [
        {
          id: "fc-journal-1",
          prompt: "You saw a setup but decided it didn't fit your card. What do you record?",
          options: [
            "No trade, with the reason",
            "Nothing",
            "A win, since you avoided a loss",
            "Delete the analysis",
          ],
          correctIndex: 0,
          explanation:
            "Skips are part of your plan. Recording them shows whether your filter helps.",
        },
        {
          id: "fc-journal-2",
          prompt: "You risked ₱125 and lost ₱131 including spread. What do you type as the result?",
          options: ["About -1.05", "-1 exactly", "-131", "0"],
          correctIndex: 0,
          explanation: "131 ÷ 125 ≈ 1.05R. Type what really happened, costs included.",
        },
      ],
      task: "From today, record every demo trade and every skipped setup, with 'Followed rules: yes/no' and one feeling word.",
    },
    {
      id: "fc-mistakes",
      title: "Catch the five mistakes",
      summary: "Almost every beginner makes these. Spotting them early saves months.",
      where: "Journal › Notes",
      access: "everyone",
      steps: [
        {
          title: "The five",
          body: "Check yourself against these after every session:",
          visual: flow({
            layout: "grid",
            nodes: [
              {
                label: "Moved the stop away",
                note: "A −1R plan became −2R or worse.",
                tone: "bear",
              },
              { label: "Revenge trade", note: "A trade taken to win back a loss.", tone: "bear" },
              { label: "Off-card trade", note: "Entered without every rule true.", tone: "warn" },
              {
                label: "Closed a winner early",
                note: "Took +0.4R because it 'might turn'.",
                tone: "warn",
              },
            ],
            caption: "And the fifth: bigger size because you 'felt sure'.",
          }),
        },
        {
          title: "Why they happen",
          body: "None of them is about knowledge. They come from fear (closing early, moving stops), anger (revenge) and hope (off-card trades, bigger size). Knowing that helps: when you feel one of those, that's the moment to step back.",
        },
        {
          title: "A simple rule for each",
          bullets: [
            "**Moved stop:** the stop only moves towards profit, never away.",
            "**Revenge:** after a loss, wait one full candle of your timeframe before looking again.",
            "**Off-card:** read your card line by line before every order.",
            "**Closed early:** let it hit the stop or the target.",
            "**Bigger size:** use the app's position size every time, no exceptions.",
          ],
          body: "Give each mistake a fixed answer in advance:",
        },
      ],
      checks: [
        {
          id: "fc-mistakes-1",
          prompt: "You just lost a trade and feel you must get it back now. What is happening?",
          options: [
            "The start of a revenge trade: step back",
            "A strong sign for the next trade",
            "Time to raise your size",
            "Normal: take the next candle",
          ],
          correctIndex: 0,
          explanation:
            "The urge to win it back is the classic revenge trigger. Wait, then follow the card.",
        },
        {
          id: "fc-mistakes-2",
          prompt: "Which of these is NOT one of the five beginner mistakes?",
          options: [
            "Leaving a trade alone until stop or target",
            "Moving the stop away",
            "Closing winners early",
            "Sizing up when you feel sure",
          ],
          correctIndex: 0,
          explanation: "Leaving the trade alone is the rule; the others are the mistakes.",
        },
      ],
      task: "At the end of each session this week, write which of the five mistakes you made, if any. Zero is the goal, honesty is the requirement.",
    },
  ],
};
