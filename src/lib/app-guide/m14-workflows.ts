import type { GuideModule } from "./types";

export const M14_WORKFLOWS: GuideModule = {
  id: "workflows",
  title: "Putting it together",
  blurb: "A trading-day routine, a weekly review, and what every warning message means.",
  lessons: [
    {
      id: "g-wf-day",
      title: "A trading day with ChartPilot",
      summary: "From the session card to recording the result, in order.",
      where: "Whole app",
      access: "premium",
      open: { to: "/", label: "Open Home" },
      steps: [
        {
          title: "Before the session",
          body: "Open **Home**: check which session is open and read any **Shared signals**. Confirm your balance on Analyze is current. If you only trade certain hours, keep **Only analyze during selected sessions** on.",
        },
        {
          title: "Read the chart",
          body: "Take top-down screenshots (for example 4H, 1H, 15M), merge them in the **Screenshot compiler**, type the asset, lock **Your bias first**, then tap **Analyze setup**. Admins and market-data members can use **Market data** with **Den Analyzer** instead.",
        },
        {
          title: "Decide with the plan, not the grade",
          body: "Read the **Conditional trade plan**: is the stop beyond the entry and TP1 in front? Is R:R at least your minimum? What does **Required confirmation** ask for? Size from **Position size** and confirm your broker's contract size. If confirmation never comes, there is no trade.",
        },
        {
          title: "After the trade",
          body: "Go to **Journal › History**, open the read and record the **Outcome** and **Result in R**. Market-data members can run **Check open trades** at the end of the day. Add a line in **Notes** about what you did well or badly.",
          tip: "The daily loss limit counts what you record. A loss you never record cannot stop you from revenge trading.",
        },
      ],
      checks: [
        {
          id: "g-wf-day-1",
          prompt:
            "The analysis grades A but Required confirmation has not happened. What do you do?",
          options: [
            "Wait: without confirmation there is no trade",
            "Enter now because it is an A",
            "Double the size",
            "Delete the read",
          ],
          correctIndex: 0,
          explanation: "The plan is conditional. The grade describes evidence, not permission.",
        },
        {
          id: "g-wf-day-2",
          prompt: "Why record a loss straight away?",
          options: [
            "Stats and the daily loss limit depend on it",
            "To earn XP",
            "To share it with members",
            "It is required to sign out",
          ],
          correctIndex: 0,
          explanation:
            "Unrecorded results make statistics wrong and switch off your own safety stop.",
        },
      ],
    },
    {
      id: "g-wf-week",
      title: "A weekly review",
      summary: "Twenty minutes that turn a journal into an edge.",
      where: "Journal",
      access: "signed-in",
      open: { to: "/journal", tab: "history", label: "Open the Journal" },
      steps: [
        {
          title: "Close out every open read",
          body: "In **History**, filter by **Open** and record every ending: Win, Loss, Breakeven, Missed, Invalidated or No trade. Delete only duplicates and test runs.",
        },
        {
          title: "Look at the numbers",
          body: "In **Stats**, note Average R per trade, profit factor and the running total. In **My edge board**, group by **Grade** and **Session (UTC)**: are A setups really better than C? Remember the “enough data” rule before drawing conclusions.",
        },
        {
          title: "Study the gap",
          body: "Check **Which checklist items help you** and your **Topic strength** in the Academy. Pick one weak topic, do its lesson and quiz, and write three bullets in **Notes**. Admins can test one rulebook change in **Backtest** with a 30% holdout.",
        },
      ],
      checks: [
        {
          id: "g-wf-week-1",
          prompt: "What is the first step of the weekly review?",
          options: [
            "Record the ending of every Open read",
            "Change the rulebook",
            "Raise your risk",
            "Clear Ask AI",
          ],
          correctIndex: 0,
          explanation: "Statistics are only as honest as the endings you recorded.",
        },
        {
          id: "g-wf-week-2",
          prompt: "Grade A shows 12 trades and grade C shows 9. What can you conclude?",
          options: [
            "Not much yet: both samples are small",
            "A is proven better",
            "Stop trading C forever",
            "Turn off strict mode",
          ],
          correctIndex: 0,
          explanation: "Groups need about 30 trades before they say anything.",
        },
      ],
    },
    {
      id: "g-wf-trouble",
      title: "What each warning means",
      summary: "The messages you will meet, and what to do about each.",
      where: "Whole app",
      access: "everyone",
      steps: [
        {
          title: "Access messages",
          body: "These are about your account, not a fault:",
          bullets: [
            "**Sign in to use …**: sign in or create an account.",
            "**Chart analysis is premium**: enter a premium code in Settings.",
            "**Market data analysis is locked**: ask an admin to switch market data on for you.",
            "**An admin has hidden this page for your account**: ask an admin to show it again.",
            "**Admin only**: that screen is for the admin account.",
          ],
        },
        {
          title: "Guard messages",
          body: "These are your own rules working:",
          bullets: [
            "**Daily loss limit reached**: today's recorded losses hit your limit. Stop, or tap “I understand, analyze anyway”.",
            "**Outside your selected trading sessions: analysis is paused.**: change the session filter on Home if you meant to trade now.",
            "**Reward-to-risk is below your minimum**: the plan pays too little for its risk.",
            "**These levels don't form a valid trade**: do not place it as written.",
          ],
        },
        {
          title: "Data messages",
          body: "These mean something is missing or stale:",
          bullets: [
            "**Your market data hasn't updated recently** / **No candles stored**: the price feed has not sent recent candles for that symbol or timeframe.",
            "**Rate unavailable** / **Unknown currency** / **Not calculable**: size the trade in your platform.",
            "**More chart context required**: add the screenshots it asks for.",
            "**Analysis finished but saving to your journal failed.**: copy the plan, check your connection and sign-in, then run it again later.",
          ],
          tip: "If everything shows you as a free user although you have premium, sign out and back in. If it persists, the app cannot reach its server; tell the admin.",
        },
      ],
      checks: [
        {
          id: "g-wf-trouble-1",
          prompt: "“Market data analysis is locked” appears. What fixes it?",
          options: [
            "An admin switching market data on for your account",
            "Restarting your phone",
            "Uploading more screenshots",
            "Turning on Beginner mode",
          ],
          correctIndex: 0,
          explanation: "Market data is a per-account permission.",
        },
        {
          id: "g-wf-trouble-2",
          prompt: "“No candles stored” shows for M5. What does it mean?",
          options: [
            "Your price feed has no M5 data for that symbol",
            "The market is closed forever",
            "Your premium expired",
            "Den is broken",
          ],
          correctIndex: 0,
          explanation: "That timeframe has no stored candles yet, so it cannot be analysed.",
        },
      ],
    },
  ],
};
