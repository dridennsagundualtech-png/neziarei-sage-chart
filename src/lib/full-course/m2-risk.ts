import type { GuideModule } from "@/lib/app-guide/types";
import { LESSON_VISUALS } from "@/lib/breakthrough/lesson-visuals";
import { go, k } from "@/lib/breakthrough/scene";
import { calc, scene } from "@/lib/breakthrough/types";

export const FC2_RISK: GuideModule = {
  id: "fc-risk",
  title: "Money and risk first",
  blurb: "R, position size, why win rate lies, and the limits that keep you in the game.",
  lessons: [
    {
      id: "fc-r",
      title: "Think in R, not in pesos",
      summary: "1R is what you risk on a trade. Every result becomes a multiple of it.",
      where: "Anywhere",
      access: "everyone",
      steps: [
        {
          title: "What R is",
          body: "**R** is the amount you lose if the stop is hit. Risk ₱125 and the stop is hit: −1R. Make ₱250 on the same trade: +2R. Close at your entry: 0R.",
          visual: calc("rmultiple"),
          tip: "Move the exit slider: the same trade can be −1R, +0.5R or +3R depending only on where it ends.",
        },
        {
          title: "Why R beats money",
          mock: {
            where: "Same trade, two accounts",
            parts: [
              {
                kind: "rows",
                rows: [
                  { left: "₱25,000 account, risk ₱125", right: "+₱250 = +2R", tone: "bull" },
                  { left: "₱250,000 account, risk ₱1,250", right: "+₱2,500 = +2R", tone: "bull" },
                ],
              },
              { kind: "note", text: "Different money, same skill: both are +2R.", tone: "info" },
            ],
          },
          body: "₱500 on a big account and ₱500 on a small one are very different results. +2R means the same thing on any account, any symbol and any lot size. It lets you compare a gold trade with a EURUSD trade, and this month with last month.",
        },
        {
          title: "R is decided before you enter",
          body: "You choose your stop first, where the idea is proven wrong. That distance is 1R. Your target is then measured in R: a target twice as far as the stop is a 2R target. If the nearest sensible target is less than your minimum R:R, you skip the trade.",
          visual: LESSON_VISUALS["l6-targets"],
        },
        {
          title: "ChartPilot does this for you",
          body: "Every result on **Analyze** shows the plan's R:R measured from the levels, and the **Journal** records each outcome as **Result in R**. Your stats are all in R, so they never depend on how big the account was that week.",
        },
      ],
      checks: [
        {
          id: "fc-r-1",
          prompt: "You risk ₱200. The trade closes at +₱300. What is the result in R?",
          options: ["+1.5R", "+3R", "+0.67R", "+300R"],
          correctIndex: 0,
          explanation: "300 ÷ 200 = 1.5.",
        },
        {
          id: "fc-r-2",
          prompt:
            "Your stop is 20 pips away and the nearest target is 30 pips away. Your minimum R:R is 2. What do you do?",
          options: [
            "Skip it: the target is only 1.5R",
            "Take it and move the target further",
            "Take it with a smaller stop",
            "Take it twice",
          ],
          correctIndex: 0,
          explanation:
            "30 ÷ 20 = 1.5R, below your minimum. Stretching the target or squeezing the stop just to fit is how bad trades get taken.",
        },
      ],
    },
    {
      id: "fc-size",
      title: "Size every trade from the stop",
      summary: "The stop decides the lot size, never the other way round.",
      where: "Analyze › result",
      access: "everyone",
      open: { to: "/analyze", label: "Open Analyze" },
      steps: [
        {
          title: "The rule",
          body: "Lot size = money you are willing to lose ÷ how much 1.00 lot loses at your stop. A wide stop means a small size; a tight stop means a bigger size. The money at risk stays the same: your 0.5%.",
          visual: calc("sizing"),
          tip: "Switch between EURUSD and XAUUSD, and USD and PHP: the size changes, the money at risk doesn't.",
        },
        {
          title: "What a pip is worth",
          body: "On EURUSD, 1.00 lot moves about $10 per pip and 0.01 lot about $0.10. On gold, 1.00 lot (100 oz) moves $100 for every $1 of price. That is why the same stop distance in 'points' means very different money on different symbols.",
          visual: calc("pipvalue"),
        },
        {
          title: "Let the app do the maths",
          body: "Every analysis result shows a **Position size** for your stop, already converted to your account currency at today's rate. Use that number in MT5. If it says even 0.01 lot risks more than your limit, the trade doesn't fit your account: skip it.",
        },
        {
          title: "Never round up",
          mock: {
            where: "Size 0.037 lot at 0.5% risk",
            parts: [
              {
                kind: "rows",
                rows: [
                  { left: "Trade 0.03 lot", right: "risks 0.41%", tone: "bull" },
                  { left: "Trade 0.04 lot", right: "risks 0.54%", tone: "bear" },
                ],
              },
            ],
          },
          body: "If the size comes out at 0.037 lot, trade 0.03, not 0.04. Rounding up quietly raises your risk on every trade, and over 100 trades that adds up.",
        },
      ],
      checks: [
        {
          id: "fc-size-1",
          prompt:
            "You widen your stop from 20 to 40 pips. To keep the same risk, the lot size should…",
          options: ["Halve", "Double", "Stay the same", "Go to zero"],
          correctIndex: 0,
          explanation: "Twice the distance at the same money risk means half the size.",
        },
        {
          id: "fc-size-2",
          prompt: "The app says 0.01 lot already risks more than your 0.5%. What do you do?",
          options: [
            "Skip the trade",
            "Trade 0.01 anyway",
            "Remove the stop",
            "Raise your risk for this one",
          ],
          correctIndex: 0,
          explanation:
            "When the smallest size breaks your rule, the trade doesn't fit your account.",
        },
      ],
      task: "Open the sizing calculator above and work out the lot size for a 25-pip EURUSD stop and a $6 gold stop on your demo balance at 0.5%.",
    },
    {
      id: "fc-winrate",
      title: "Why a 90% win rate can still lose money",
      summary: "What matters is wins times their size minus losses times theirs.",
      where: "MT5 report and Journal › Stats",
      access: "everyone",
      open: { to: "/journal", tab: "stats", label: "Open Stats" },
      steps: [
        {
          title: "The trap",
          body: "Close winners quickly and hold losers 'until they come back', and you win most trades. But each loss is many times bigger than each win, so one or two losses wipe out a month.",
          visual: scene({
            start: 50,
            items: [
              go(52, 2, "a"),
              go(51, 1),
              go(53, 2, "b"),
              go(52, 1),
              go(54, 2, "c"),
              go(53, 1),
              go(55, 2, "d"),
              k(55, 55.4, 47, 47.6, "e"),
              go(44, 3, "f"),
            ],
            marks: [
              { at: "a", y: 52.6, text: "+0.3R", dir: "down", tone: "bull" },
              { at: "b", y: 53.6, text: "+0.3R", dir: "down", tone: "bull" },
              { at: "c", y: 54.6, text: "+0.3R", dir: "down", tone: "bull" },
              { at: "d", y: 55.6, text: "+0.3R", dir: "down", tone: "bull" },
              { at: "f", y: 43.5, text: "−3R", dir: "up", tone: "bear" },
            ],
            steps: [
              { upTo: "d", text: "Four wins of +0.3R each: +1.2R, and a 100% win rate." },
              { upTo: 99, text: "One loss held too long: −3R. Win rate 80%, result −1.8R." },
            ],
          }),
        },
        {
          title: "Expectancy: the number that matters",
          body: "Average result per trade = win rate × average win − loss rate × average loss. Above 0 earns over time; below 0 loses, however often you win. Try it:",
          visual: calc("expectancy"),
        },
        {
          title: "The flip side: you can win less than half the time",
          body: "With 2R targets you only need to win about 1 trade in 3 to break even. Many profitable traders win 40–50% of the time. Never judge yourself by win rate alone.",
          visual: calc("breakeven"),
        },
        {
          title: "Check your old demo honestly",
          body: "In MT5 on desktop, open **View › Reports** (older versions: right-click in the **History** tab › **Report**). Look at three numbers:",
          bullets: [
            "**Profit factor** (total won ÷ total lost). Above 1.3 is decent; below 1 loses.",
            "**Largest loss trade** compared with your average win. If one loss equals ten wins, you are in the trap.",
            "**Maximal drawdown**: the deepest fall from a peak.",
          ],
        },
        {
          title: "Your stats in ChartPilot",
          mock: {
            where: "Journal › Stats › Your results",
            parts: [
              {
                kind: "stats",
                items: [
                  ["Win rate", "42%"],
                  ["Average R per trade", "+0.21R"],
                  ["Profit factor", "1.36"],
                ],
              },
            ],
          },
          body: "**Journal › Stats** shows **Average R per trade** and **Profit factor** from the trades you record. These are the numbers you will judge your plan by, not the win rate.",
        },
      ],
      checks: [
        {
          id: "fc-winrate-1",
          prompt:
            "This trader closed four quick wins and held the last trade. What really happened?",
          visual: scene({
            start: 50,
            items: [
              go(52, 2),
              go(51, 1),
              go(53, 2),
              go(52, 1),
              go(54, 2),
              go(53, 1),
              go(55, 2),
              k(55, 55.4, 47, 47.6),
              go(44, 3),
            ],
            steps: [{ upTo: 99, text: "" }],
          }),
          options: [
            "High win rate, but one big loss made the total negative",
            "They are clearly profitable: 80% wins",
            "The last trade doesn't count",
            "Win rate tells you the total",
          ],
          correctIndex: 0,
          explanation:
            "Small wins and one large loss: the win rate looks great while the account goes down.",
        },
        {
          id: "fc-winrate-2",
          prompt: "Win rate 40%, average win 2.5R, average loss 1R. Over time this plan…",
          options: [
            "Earns about +0.4R per trade",
            "Loses: 40% is below half",
            "Breaks even exactly",
            "Can't be judged",
          ],
          correctIndex: 0,
          explanation: "0.4 × 2.5 − 0.6 × 1 = 1.0 − 0.6 = +0.4R per trade.",
        },
      ],
      task: "Open the report for your old demo account and write its profit factor and largest loss in **Journal › Notes**.",
    },
    {
      id: "fc-limits",
      title: "Stops, daily limits and losing streaks",
      summary: "Three rules that keep a bad week from becoming a blown account.",
      where: "Settings and MT5",
      access: "everyone",
      open: { to: "/settings", label: "Open Settings" },
      steps: [
        {
          title: "Every trade has a stop, set when you enter",
          body: "The stop goes where your idea is proven wrong, and it goes into MT5 with the order, not 'in your head'. Once set, it only ever moves to reduce risk, never further away.",
          visual: LESSON_VISUALS["l6-stops"],
        },
        {
          title: "Moving the stop away is how small losses become big ones",
          body: "Price nears your stop, you move it 'just a bit', then again. A planned −1R becomes −3R. If the idea was wrong at the stop, it is still wrong one pip later.",
          visual: scene({
            start: 55,
            items: [go(52, 3, "near"), go(50, 2, "moved"), go(46, 4, "out")],
            lines: [
              { y: 51, from: 0, to: "near", label: "planned stop −1R", tone: "bear", dashed: true },
              { y: 48, from: "near", to: "moved", label: "moved", tone: "warn", dashed: true },
              { y: 45.5, from: "moved", label: "moved again: −3R", tone: "bear" },
            ],
            steps: [
              { upTo: "near", text: "Price comes close to the planned stop." },
              { upTo: "moved", text: "The stop is moved further away 'to give it room'." },
              { upTo: 99, text: "It keeps going. The loss is three times the plan." },
            ],
          }),
        },
        {
          title: "Losing streaks are normal",
          body: "With a 40% win rate, over 100 trades you will almost surely see 6 losses in a row (about 87% likely), and a run of 8 is close to a coin flip (about 50%). At 0.5% per trade, 8 losses cost about 4%. At 5% per trade, about 34%.",
          visual: calc("streak"),
        },
        {
          title: "A daily loss limit stops the spiral",
          body: "After two full losses in a day, people start forcing trades. Your **Daily loss limit** of 2R makes ChartPilot pause analysis for the rest of the day once you have recorded 2R of losses. Close the platform, come back tomorrow.",
          mock: {
            where: "Analyze",
            parts: [
              {
                kind: "note",
                text: "Daily loss limit reached: analysis is paused until tomorrow.",
                tone: "warn",
              },
            ],
          },
        },
      ],
      checks: [
        {
          id: "fc-limits-1",
          prompt: "Price is 3 pips from your stop and you feel it will turn. What do you do?",
          options: [
            "Leave the stop where it is",
            "Move it 10 pips further",
            "Remove it",
            "Add to the position",
          ],
          correctIndex: 0,
          explanation:
            "The stop marks where the idea is wrong. Moving it only makes the loss bigger.",
        },
        {
          id: "fc-limits-2",
          prompt:
            "You lost 6 trades in a row while following your plan. What does it most likely mean?",
          options: [
            "A normal streak: keep following the plan and review at your next checkpoint",
            "The plan is broken: change everything today",
            "Double the size to win it back",
            "Stop using stops",
          ],
          correctIndex: 0,
          explanation:
            "At a 40% win rate, 6 losses in a row is very likely within 100 trades. Judge the plan on many trades, not one streak.",
        },
      ],
      task: "Check that **Daily loss limit** is set to 2R in Settings, and on your next demo trade put the stop in MT5 at the same moment you enter.",
    },
  ],
};
