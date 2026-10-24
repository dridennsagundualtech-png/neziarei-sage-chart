import type { GuideModule } from "@/lib/app-guide/types";
import { go } from "@/lib/breakthrough/scene";
import { calc, flow, scene } from "@/lib/breakthrough/types";

export const FC1_START: GuideModule = {
  id: "fc-start",
  title: "Start here",
  blurb:
    "Why most beginners lose, the path this course follows, and setting up a practice account.",
  lessons: [
    {
      id: "fc-why",
      title: "Why most beginners lose money",
      summary:
        "Losing at the start is the normal outcome, not a verdict on you. Here is what causes it.",
      where: "Anywhere",
      access: "everyone",
      steps: [
        {
          title: "You are not unusual",
          mock: {
            where: "A typical broker risk warning",
            parts: [
              { kind: "stats", items: [["Retail CFD accounts that lose money", "70–80%"]] },
              {
                kind: "note",
                text: "You should consider whether you can afford to take the high risk of losing your money.",
                tone: "warn",
              },
            ],
          },
          body: "Brokers in Europe must publish how many of their retail CFD accounts lose money. The figure is usually between 70% and 80%. Most people who try trading lose, and most of them lose for the same handful of reasons. The good news: every one of those reasons can be trained out.",
        },
        {
          title: "The usual reasons",
          body: "Almost every blown account has at least two of these:",
          bullets: [
            "**Too big.** One trade risks 5–20% of the account, so a few losses do real damage.",
            "**No stop-loss**, or a stop that gets moved when price gets close.",
            "**No plan.** Entries come from a feeling, a video or a signal group.",
            "**Revenge trading.** After a loss, a bigger trade to win it back.",
            "**Costs ignored.** Spread and commission quietly eat small, frequent trades.",
          ],
          visual: flow({
            layout: "grid",
            nodes: [
              { label: "Too big", note: "A few losses do real damage.", tone: "bear" },
              { label: "No stop", note: "One trade can take the account.", tone: "bear" },
              { label: "No plan", note: "Nothing to measure or improve.", tone: "warn" },
              { label: "Revenge", note: "Bigger trades after losses.", tone: "warn" },
            ],
          }),
        },
        {
          title: "Why it feels random",
          body: "Short term, trading results are mostly noise. A bad trader can win five in a row and a good one can lose five in a row. That is why a few trades never tell you whether you are good or bad. Only a plan, followed many times and measured honestly, tells you anything.",
          visual: calc("streak"),
          tip: "Move the sliders: even a solid plan has long losing runs. Expecting them is what stops you from panicking.",
        },
        {
          title: "What this course does differently",
          body: "No secret indicator. You learn the basics, practise one simple plan on a free demo account, measure it with ChartPilot, and only then risk small real money. Profit is never promised, by this course or anyone honest. What you get is a way to find out, cheaply, whether your trading works.",
        },
      ],
      checks: [
        {
          id: "fc-why-1",
          prompt: "You won 5 trades in a row on your first week. What does that tell you?",
          options: [
            "Very little: five trades is mostly luck",
            "You have found an edge",
            "You should double your size",
            "You can skip the stop-loss now",
          ],
          correctIndex: 0,
          explanation:
            "A handful of trades is noise. Only many trades with the same plan say anything.",
        },
        {
          id: "fc-why-2",
          prompt: "Which habit does the most damage to a new account?",
          options: [
            "Risking a large share of the account on each trade",
            "Using a dark chart theme",
            "Trading only one symbol",
            "Writing notes after trades",
          ],
          correctIndex: 0,
          explanation: "Oversizing turns ordinary losing streaks into blown accounts.",
        },
      ],
      task: "Write down, honestly and without judging yourself, what happened with your first money: how much you risked per trade, whether you used stops, and what you did after losses. Keep it in **Journal › Notes**; you will compare it with your new habits later.",
    },
    {
      id: "fc-path",
      title: "The path: learn, practise, measure, then risk money",
      summary: "Four stages, each with a clear finish line. Real money comes last, and small.",
      where: "Anywhere",
      access: "everyone",
      steps: [
        {
          title: "Four stages",
          body: "This course follows the same order good traders followed, whether they knew it or not:",
          visual: flow({
            nodes: [
              { label: "1. Learn", note: "Risk, charts, one setup.", tone: "primary" },
              { label: "2. Practise", note: "Demo account, same rules every time." },
              { label: "3. Measure", note: "Journal and stats: does it earn?" },
              { label: "4. Go live small", note: "Only if stage 3 says yes.", tone: "bull" },
            ],
          }),
        },
        {
          title: "Each stage has a finish line",
          body: "You move on because you hit a number, not because you are bored:",
          bullets: [
            "**Learn** is done when you pass every check in modules 2–4.",
            "**Practise** is done after about 100 demo trades with the same plan.",
            "**Measure** passes if your average result per trade is above 0 after costs and you followed your rules on at least 9 out of 10 trades.",
            "**Go live** starts at the smallest size the broker allows.",
          ],
        },
        {
          title: "How long this takes",
          body: "Expect months, not weeks. A hundred trades on one-hour charts can take two to four months. That feels slow, but it is far cheaper than learning with real money. Some people find at the end that trading is not for them, and that is a perfectly good result too.",
        },
        {
          title: "Your tools",
          visual: flow({
            nodes: [
              { label: "Lessons", note: "One idea at a time." },
              {
                label: "Analyze",
                note: "Your bias first, then a second opinion and a plan check.",
                tone: "primary",
              },
              { label: "MT5 demo", note: "Where the order goes." },
              { label: "Journal", note: "Every trade and skip, in R." },
              { label: "Stats", note: "Does it earn?", tone: "bull" },
            ],
          }),
          body: "Everything happens inside ChartPilot: the **Lessons** tab for the concepts, **Analyze** to read charts and check plans, the position size on every result, the **Journal** to record trades, and **Stats** to measure them. MT5 is only where you place the demo orders.",
        },
      ],
      checks: [
        {
          id: "fc-path-1",
          prompt: "When should you start trading real money in this course?",
          options: [
            "After measuring about 100 demo trades and finding a positive average",
            "After the first winning week",
            "Straight away, to feel real pressure",
            "When a signal group says so",
          ],
          correctIndex: 0,
          explanation:
            "Real money comes after the numbers say the plan works, and then only at minimum size.",
        },
        {
          id: "fc-path-2",
          prompt: "What decides when you move from one stage to the next?",
          options: [
            "Hitting the stage's finish line",
            "How confident you feel",
            "How many videos you watched",
            "A good day in the market",
          ],
          correctIndex: 0,
          explanation: "Each stage ends on a measurable condition, not a mood.",
        },
      ],
      task: "Pick the one market you will practise on for the whole course. EURUSD or XAUUSD are good choices: they move enough and their costs are low.",
    },
    {
      id: "fc-setup-account",
      title: "Set up a realistic demo and your app",
      summary:
        "A demo only teaches you something if it looks like the account you would really trade.",
      where: "MT5 and Settings",
      access: "everyone",
      open: { to: "/settings", label: "Open Settings" },
      steps: [
        {
          title: "Why your demo showed 90% wins",
          body: "A demo with a huge balance lets a losing trade sit open for days without a margin call, so most losers eventually come back and get closed as small wins. The one that doesn't come back is never felt. That is why the demo must be set up like your real account.",
          visual: scene({
            start: 50,
            items: [
              go(53, 3, "w1"),
              go(51, 2),
              go(54, 3, "w2"),
              go(52, 2),
              go(55, 3, "w3"),
              go(44, 6, "drop"),
              go(38, 5, "bottom"),
            ],
            marks: [
              { at: "w1", y: 54, text: "+$5", dir: "down", tone: "bull" },
              { at: "w2", y: 55, text: "+$5", dir: "down", tone: "bull" },
              { at: "w3", y: 56, text: "+$5", dir: "down", tone: "bull" },
              { at: "bottom", y: 37.5, text: "held, no stop: −$60", dir: "up", tone: "bear" },
            ],
            steps: [
              { upTo: "w3", text: "Three quick wins, closed early. Win rate 100%." },
              {
                upTo: "drop",
                text: "The next trade goes against you. No stop: 'it will come back'.",
              },
              {
                upTo: 99,
                text: "It doesn't. One loss erases twelve wins, and the win rate still looks great.",
              },
            ],
          }),
        },
        {
          title: "Open a demo the right way",
          mock: {
            where: "MT5 › File › Open an Account",
            parts: [
              { kind: "field", label: "Server", value: "Your broker's demo server" },
              { kind: "field", label: "Account type", value: "Same as your real one (e.g. Raw)" },
              {
                kind: "field",
                label: "Deposit",
                value: "25,000 PHP",
                hint: "What you would really trade, not 1,000,000",
              },
              { kind: "field", label: "Leverage", value: "Your broker's usual" },
            ],
          },
          body: "In MT5: **File › Open an Account**, choose your broker's server, then a demo account. Set the deposit to the amount you would really trade, for example ₱25,000 or $500, not ₱1,000,000. Use the same account type as your real one (your broker's raw or standard account) so the spreads match.",
        },
        {
          title: "Tell ChartPilot the same numbers",
          body: "In **Settings › Risk management**, set:",
          bullets: [
            "**Account balance**: your demo balance, and **Currency**: the same currency.",
            "**Risk per trade**: 0.5%. Small on purpose.",
            "**Minimum R:R**: 2.",
            "**Daily loss limit**: 2R. Two full losses and you stop for the day.",
          ],
          mock: {
            where: "Settings › Risk management",
            parts: [
              { kind: "field", label: "Account balance", value: "25,000 PHP" },
              { kind: "field", label: "Risk per trade", value: "0.5%" },
              { kind: "field", label: "Minimum R:R", value: "2" },
              {
                kind: "field",
                label: "Daily loss limit",
                value: "2R",
                hint: "Stops analysis for the day",
              },
            ],
          },
        },
        {
          title: "What 0.5% means in money",
          body: "At 0.5% of ₱25,000, a full loss costs ₱125. Ten losses in a row, which happens to everyone eventually, cost about 5% of the account. That is survivable. At 5% per trade, the same streak would cost about 40%.",
          visual: calc("drawdown"),
        },
      ],
      checks: [
        {
          id: "fc-setup-account-1",
          prompt: "Why should the demo balance match what you would really trade?",
          options: [
            "A huge balance hides the losses that would hurt a real account",
            "Brokers charge more on big demos",
            "Small balances get better spreads",
            "It makes the charts load faster",
          ],
          correctIndex: 0,
          explanation:
            "With a huge balance, bad trades never cause a margin call, so the results look better than reality.",
        },
        {
          id: "fc-setup-account-2",
          prompt: "Balance ₱25,000, risk 0.5% per trade. What is one full loss?",
          options: ["₱125", "₱1,250", "₱12.50", "₱500"],
          correctIndex: 0,
          explanation: "0.5% of 25,000 is 125.",
        },
      ],
      task: "Open a new MT5 demo with a realistic balance, and put the same balance, 0.5% risk, minimum R:R 2 and a 2R daily loss limit into **Settings**.",
    },
  ],
};
