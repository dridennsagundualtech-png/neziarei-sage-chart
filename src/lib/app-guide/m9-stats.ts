import type { GuideModule } from "./types";

export const M9_STATS: GuideModule = {
  id: "stats",
  title: "Journal: Stats and Edge board",
  blurb:
    "Your real results: the headline numbers, the charts, the Edge board and which checklist items help you.",
  lessons: [
    {
      id: "g-st-numbers",
      title: "The Stats tab numbers",
      summary: "Win rate, profit factor, average R and drawdown, from finished trades only.",
      where: "Journal › Stats",
      access: "signed-in",
      open: { to: "/journal", tab: "stats", label: "Open Stats" },
      steps: [
        {
          title: "Only finished trades",
          body: "**Your results** uses only reads recorded as Win, Loss or Breakeven with a result in R. Open trades are not counted, and the AI never invents these numbers. With none recorded you see **No finished trades yet**.",
        },
        {
          title: "The numbers",
          body: "The overview cards:",
          bullets: [
            "**Win rate**: wins ÷ finished trades.",
            "**Average R per trade**: the average result in R, your expectancy. Above 0 means the trades made money on average.",
            "**Profit factor**: total R won ÷ total R lost. Above 1 is profitable.",
            "**Cumulative R**: all results added up.",
            "**Avg winner** and **Avg loser**: the typical size of a win and of a loss.",
            "**Max drawdown**: the deepest fall from a high point, in R.",
          ],
          mock: {
            where: "Journal › Stats",
            parts: [
              {
                kind: "stats",
                items: [
                  ["Win rate", "44%"],
                  ["Profit factor", "1.38"],
                  ["Cumulative R", "+9.6R"],
                  ["Avg winner", "+2.0R"],
                  ["Avg loser", "-1.0R"],
                  ["Max drawdown", "4.2R"],
                ],
                hl: true,
              },
            ],
          },
        },
        {
          title: "The sample warning",
          body: "Below your **Minimum setups before showing a win rate** (Settings, default 100) a notice says the sample is below your threshold: “Treat these figures as a description of the past, not a win probability.”",
          tip: "A 44% win rate with +2R winners is profitable. Win rate alone never tells you if you are making money.",
        },
      ],
      checks: [
        {
          id: "g-st-numbers-1",
          prompt: "Profit factor is 0.8. What does it mean?",
          options: [
            "You lost more R than you won",
            "You won 80% of trades",
            "Average R is +0.8",
            "Drawdown is 0.8R",
          ],
          correctIndex: 0,
          explanation: "Profit factor is R won ÷ R lost. Below 1 means losses outweigh wins.",
        },
        {
          id: "g-st-numbers-2",
          prompt: "You have 20 Open reads and 0 finished. What does Stats show?",
          options: [
            "No finished trades yet",
            "A 0% win rate",
            "A guessed win rate",
            "Your backtest results",
          ],
          correctIndex: 0,
          explanation: "Open trades are not counted, so there is nothing honest to show yet.",
        },
      ],
    },
    {
      id: "g-st-charts",
      title: "Running total and Result by month",
      summary: "Your equity curve in R, and good and bad months.",
      where: "Journal › Stats",
      access: "signed-in",
      open: { to: "/journal", tab: "stats", label: "Open Stats" },
      steps: [
        {
          title: "Running total in R",
          body: "**Running total in R** draws your cumulative result trade by trade. “Up means your results are growing. Down means a losing stretch.” Use **How many trades to show** to zoom in on recent trades. The labels show where it **Ends at** and the **Best point**.",
        },
        {
          title: "Result by month",
          body: "**Result by month** shows a bar per month: above the line made money, below it lost money. The caption names the best and weakest month.",
        },
        {
          title: "How to use them",
          body: "Look at the curve after every 10 or 20 trades. A long flat or falling stretch is the moment to review your process in Notes, not to raise risk to win it back.",
        },
      ],
      checks: [
        {
          id: "g-st-charts-1",
          prompt: "Your running total has fallen for three weeks. What is the sensible step?",
          options: [
            "Review your process and journal notes",
            "Double your risk to recover",
            "Delete the losing reads",
            "Turn off the daily loss limit",
          ],
          correctIndex: 0,
          explanation: "A losing stretch calls for review, never for bigger risk or hidden losses.",
        },
        {
          id: "g-st-charts-2",
          prompt: "What does a bar below the line in Result by month mean?",
          options: [
            "That month lost money in R",
            "No trades that month",
            "A data error",
            "The month is not finished",
          ],
          correctIndex: 0,
          explanation: "Above the line made money, below it lost money.",
        },
      ],
    },
    {
      id: "g-st-edge",
      title: "My edge board and checklist items",
      summary: "What has worked for you, grouped six ways.",
      where: "Journal › Stats › My edge board",
      access: "signed-in",
      open: { to: "/journal", tab: "stats", label: "Open Stats" },
      steps: [
        {
          title: "Group your results",
          body: "**My edge board** shows what has actually worked for you, from finished journal trades only. Choose how to group: **Symbol**, **Grade**, **Direction**, **Timeframe**, **Setup type** or **Session (UTC)**. Each row shows Trades, Win rate and Avg R.",
          mock: {
            where: "Journal › Stats › My edge board",
            parts: [
              {
                kind: "chips",
                label: "Edge board: group by",
                items: ["Symbol", "Grade", "Direction", "Timeframe", "Setup type", "Session (UTC)"],
                on: [1],
                hl: true,
              },
              {
                kind: "rows",
                rows: [
                  { left: "A · 31 trades", right: "52% · +0.61R", tone: "bull" },
                  { left: "C · 18 trades", right: "33% · -0.22R", tone: "bear" },
                ],
              },
            ],
          },
        },
        {
          title: "Enough data",
          body: "A group needs about 30 trades (the smaller of 30 and your minimum setups setting, never below 10) before it counts as “enough data”; those rows get a short comment. Smaller groups are shown without one, because a few trades prove nothing.",
          tip: "The Edge board never changes the Den Analyzer rules. It only describes your past.",
        },
        {
          title: "Which checklist items help you",
          body: "**Which checklist items help you** shows results of finished trades where each checklist item was present. “They happened together; that does not prove it caused the result.” Use it to decide what to study or backtest next.",
        },
      ],
      checks: [
        {
          id: "g-st-edge-1",
          prompt:
            "Your Session (UTC) group shows London with 6 trades at +1.5R average. What should you conclude?",
          options: [
            "Too few trades to conclude anything yet",
            "Only trade London from now on",
            "London is a guaranteed edge",
            "Change the Den rules",
          ],
          correctIndex: 0,
          explanation: "Six trades is far below the “enough data” threshold.",
        },
        {
          id: "g-st-edge-2",
          prompt: "Does the Edge board change how Den scores setups?",
          options: [
            "No, it only describes your past",
            "Yes, automatically",
            "Only for A grades",
            "Only after 100 trades",
          ],
          correctIndex: 0,
          explanation: "It is a report. Rule changes are always yours to make in the rulebook.",
        },
      ],
    },
  ],
};
