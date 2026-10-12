import type { GuideModule } from "./types";

export const M7_BACKTEST: GuideModule = {
  id: "backtest",
  title: "Backtest",
  blurb:
    "Replay history against your rules: every input, the trade rules the replay follows, Auto Optimize, reading results and saving runs.",
  lessons: [
    {
      id: "g-bt-what",
      title: "What the backtest does, and the two engines",
      summary: "Walk-forward replay with no lookahead. Den or AI.",
      where: "Settings › Admin tools › Den Backtest",
      access: "admin",
      open: { to: "/backtest", label: "Open Backtest" },
      steps: [
        {
          title: "Walk-forward, no peeking",
          body: "“At every step the engine only sees candles that existed at that moment, on every timeframe, no lookahead.” The replay walks through history one step at a time, runs the analysis as if it were live, and then watches what price did next.",
        },
        {
          title: "Where to open it",
          body: "Open **Settings**, and in the account card under **Admin tools** tap **Den Backtest** (“Replay history against the Den rulebook”). It is admin-only.",
          mock: {
            where: "Settings › Admin tools",
            parts: [
              {
                kind: "rows",
                rows: [
                  { left: "Premium code generator", right: "›" },
                  { left: "Pro Charts", right: "›" },
                  { left: "Den Backtest", right: "›" },
                ],
                hl: true,
              },
            ],
          },
        },
        {
          title: "Pick the engine",
          body: "Under **Engine**:",
          bullets: [
            "**Den Analyzer**: “Free, instant, deterministic.” Replays every step with your rules.",
            "**AI Analyzer**: “Real model calls, real cost.” Pick a model and **Sampled steps** (5 to 60, default 20): only that many points in history get a real AI call, so results are a small sample.",
          ],
          mock: {
            where: "Backtest › Engine",
            parts: [
              {
                kind: "chips",
                items: [
                  "Den Analyzer · Free, instant, deterministic",
                  "AI Analyzer · Real model calls, real cost",
                ],
                on: [0],
                hl: true,
              },
            ],
          },
        },
      ],
      checks: [
        {
          id: "g-bt-what-1",
          prompt: "What does “no lookahead” mean in the backtest?",
          options: [
            "At each step the engine only sees candles that existed at that moment",
            "It never looks at the past",
            "It only tests the last candle",
            "It hides losing trades",
          ],
          correctIndex: 0,
          explanation: "Future candles are invisible to each step, as they would be live.",
        },
        {
          id: "g-bt-what-2",
          prompt: "Why are AI backtest results usually a small sample?",
          options: [
            "Only the sampled steps (5–60) get a real AI call",
            "AI ignores losses",
            "AI only reads D1",
            "AI results are not saved",
          ],
          correctIndex: 0,
          explanation: "Each AI call costs money, so only a limited number of steps are sampled.",
        },
      ],
    },
    {
      id: "g-bt-inputs",
      title: "Every backtest input",
      summary: "Symbol, timeframes, step, history depth, holdout, costs and candles seen.",
      where: "Backtest",
      access: "admin",
      open: { to: "/backtest", label: "Open Backtest" },
      steps: [
        {
          title: "Symbol, timeframes and the simulation step",
          body: "Tap a symbol and the timeframes to include. Then pick the **Simulation step timeframe**: the timeframe the replay moves through, one candle per step. A 15M step checks for a setup every 15 minutes of history.",
        },
        {
          title: "History depth",
          body: "**History depth per timeframe** (100 to 8,000 candles, default 400) sets how far back the replay goes. More depth means more setups and a more reliable sample, and a slower run.",
          mock: {
            where: "Backtest",
            parts: [
              {
                kind: "slider",
                label: "History depth per timeframe",
                value: "2,000",
                pct: 24,
                hl: true,
              },
              { kind: "slider", label: "Holdout (unseen test %)", value: "30%", pct: 60 },
            ],
          },
        },
        {
          title: "Holdout",
          body: "**Holdout (unseen test %)** (0 to 50%, default 30%) reserves the last part of the timeline as an unseen test. “Judge strategies by holdout Avg R, not the full-sample number.” 0 turns it off.",
        },
        {
          title: "Spread + commission",
          body: "**Spread + commission per trade (in price)** is charged on every filled trade, for example 0.0002 on EURUSD or 0.30 on XAUUSD. It is converted to R by each trade's own stop size. Leave it at 0 and the app warns: “No costs included: results will look better than real trading.”",
          mock: {
            where: "Backtest",
            parts: [
              {
                kind: "field",
                label: "Spread + commission per trade (in price)",
                value: "0.30",
                hint: "e.g. 0.0002 on EURUSD, 0.30 on XAUUSD",
                hl: true,
              },
            ],
          },
        },
        {
          title: "Candles the engine sees",
          body: "For Den, **Candles the engine sees per timeframe** (50 to 300, default 150) is how many candles each step analyses. Keep it equal to what you use live, so the backtest tests the same read you trade from. History depth only sets how far back the replay goes.",
        },
        {
          title: "Run",
          body: "Tap **Run Den backtest** (or **Run AI backtest**). A toast reports how many setups were found across how many simulated steps.",
        },
      ],
      checks: [
        {
          id: "g-bt-inputs-1",
          prompt:
            "You trade live with 150 candles per timeframe. What should “Candles the engine sees” be?",
          options: ["150", "8,000", "10", "It does not matter"],
          correctIndex: 0,
          explanation: "Match the live setting so the backtest tests the same read.",
        },
        {
          id: "g-bt-inputs-2",
          prompt: "Spread + commission is left at 0. What is true?",
          options: [
            "Results will look better than real trading",
            "Results are exact",
            "The backtest refuses to run",
            "Costs are guessed automatically",
          ],
          correctIndex: 0,
          explanation: "Every real trade pays costs. Without them the numbers are flattered.",
        },
      ],
    },
    {
      id: "g-bt-rules",
      title: "The trade rules the replay follows",
      summary: "Fills, exits, ties, costs and the limits that keep R honest.",
      where: "Backtest (and Check open trades)",
      access: "admin",
      open: { to: "/backtest", label: "Open Backtest" },
      steps: [
        {
          title: "An entry must fill first",
          body: "A setup becomes a trade only if price actually trades at the entry. The pending order lives for 30 bars. If price runs to the target or the stop first, or the order expires, the setup is **Not filled** and never counts as a win or a loss.",
        },
        {
          title: "Exit at TP1, stop wins ties",
          body: "A filled trade exits at TP1 (a win) or at the stop (a loss), whichever price reaches first. If one candle touches both, the stop is assumed to come first, because a candle does not show which happened first.",
        },
        {
          title: "Costs and limits",
          body: "Each filled trade pays your spread + commission, converted to R by its stop size, so a loss can be a bit worse than -1R. Setups with the stop on the wrong side or a stop smaller than about 0.05% of price are thrown out. Results are capped between -3R and +10R so one strange level cannot dominate the average.",
        },
        {
          title: "Same rules for open trades",
          body: "**Check open trades** in History uses the same fill-then-stop-or-TP1 rules on your real journal trades, so your live records and backtests are measured the same way.",
        },
      ],
      checks: [
        {
          id: "g-bt-rules-1",
          prompt:
            "Price hits the target without ever trading at the pullback entry. What is the result?",
          options: ["Not filled: it is not counted", "A win", "A loss", "Breakeven"],
          correctIndex: 0,
          explanation: "Without a fill there was no trade, so it cannot count as a win.",
        },
        {
          id: "g-bt-rules-2",
          prompt: "One candle touches both the stop and TP1. How is it scored?",
          options: ["As a loss: the stop wins ties", "As a win", "As breakeven", "It is ignored"],
          correctIndex: 0,
          explanation: "A single candle cannot show the order, so the cautious answer is used.",
        },
      ],
    },
    {
      id: "g-bt-tools",
      title: "Checklist editor, Auto Optimize and cross-symbol check",
      summary: "Try other rules without touching your saved rulebook.",
      where: "Backtest",
      access: "admin",
      open: { to: "/backtest", label: "Open Backtest" },
      steps: [
        {
          title: "Edit Checklist for Backtest",
          body: "Tap **Edit Checklist for Backtest** to open a copy of the rulebook (components and numbers). “Changes here only affect this backtest run. They do not change your global Settings unless you save a preset inside the editor.” **Hide Checklist Editor** folds it.",
        },
        {
          title: "Auto Optimize Rules",
          body: "**Auto Optimize Rules** runs a set of ready-made component combinations (Simple Mode, Structure Heavy, Sweep Reversal, Order Block Focus, Full SMC, Minimal, Fib Entry, No Fibonacci, With FVG, OB + FVG, Strict SMC, AMD Focus) on the same data. Results are ranked by average R, win rate and sample size.",
          bullets: [
            "Rows with 80 or more finished setups are marked **Reliable**; others say **Small sample**.",
            "“Produced exactly the same trades as …” means two combinations behave identically on this data.",
            "**Apply** loads that combination into the checklist editor; the second button saves that combination's run to history.",
          ],
          mock: {
            where: "Backtest › Auto Optimize Results",
            parts: [
              {
                kind: "rows",
                rows: [
                  { left: "Sweep Reversal · Reliable", right: "+0.42R · 51%", tone: "bull" },
                  { left: "Full SMC · Small sample", right: "+0.65R · 58%", tone: "muted" },
                ],
              },
              { kind: "button", label: "Apply", tone: "secondary", hl: true },
            ],
          },
          tip: "A small-sample row with a great number is usually luck. Prefer Reliable rows.",
        },
        {
          title: "Quick cross-symbol check",
          body: "**Quick cross-symbol check (current settings, live)** tests the same rulebook and timeframes on every symbol you have data for. It is a gut-check that your rules are not tuned to one market, not a replacement for your saved statistics.",
        },
      ],
      checks: [
        {
          id: "g-bt-tools-1",
          prompt:
            "You change numbers in Edit Checklist for Backtest. Does the Den screen use them?",
          options: [
            "No, they only affect this backtest run",
            "Yes, immediately",
            "Yes, after one hour",
            "Only for members",
          ],
          correctIndex: 0,
          explanation: "The backtest editor is a private copy for that run.",
        },
        {
          id: "g-bt-tools-2",
          prompt: "What does “Reliable” mean in Auto Optimize?",
          options: [
            "The combination has 80 or more finished setups",
            "It will win in the future",
            "It has the highest win rate",
            "It was saved before",
          ],
          correctIndex: 0,
          explanation: "Reliable is about sample size, not a promise of future results.",
        },
      ],
    },
    {
      id: "g-bt-results",
      title: "Reading backtest results",
      summary: "Holdout first, then the whole test, outliers, and the breakdown tables.",
      where: "Backtest › Results",
      access: "admin",
      open: { to: "/backtest", label: "Open Backtest" },
      steps: [
        {
          title: "Holdout block first",
          body: "**Holdout test: last 30% of history** shows **Holdout resolved**, **Holdout win rate**, **Holdout Avg R** and **Train Avg R**. If the holdout is much worse than train, the rules fit the past and not the future.",
          mock: {
            where: "Backtest › Results",
            parts: [
              { kind: "title", text: "Holdout test: last 30% of history" },
              {
                kind: "stats",
                items: [
                  ["Holdout resolved", "38"],
                  ["Holdout win rate", "47%"],
                  ["Holdout Avg R", "+0.18R"],
                  ["Train Avg R", "+0.24R"],
                ],
                hl: true,
              },
            ],
          },
        },
        {
          title: "Whole test numbers",
          body: "The full sample (train plus holdout):",
          bullets: [
            "**Setups found**, **Win rate (full)**, **Average R (full sample)**, **Total R**.",
            "**Median R** and **Avg R without best trade**: if these are much lower than Average R, one outlier is doing the work.",
            "**Worst losing streak**, **Max drawdown (R)**, **Profit factor** (gross wins ÷ gross losses).",
            "**Signals that never filled**: setups that never traded at their entry.",
          ],
        },
        {
          title: "Costs line",
          body: "A line under the numbers says either “Each filled trade paid … in spread and commission.” or “No spread or commission was charged, so real results would be lower.”",
        },
        {
          title: "Breakdowns",
          body: "**By direction and score** shows win rate and Avg R for longs and shorts at each score band, so you can see whether higher scores really did better. **By calendar month** shows finished trades month by month.",
        },
      ],
      checks: [
        {
          id: "g-bt-results-1",
          prompt: "Average R is +0.5R but Avg R without best trade is -0.1R. What does it mean?",
          options: [
            "One outlier trade carries the result",
            "The strategy is robust",
            "Costs were not charged",
            "The holdout is off",
          ],
          correctIndex: 0,
          explanation:
            "Remove one trade and the edge disappears, so treat the headline with caution.",
        },
        {
          id: "g-bt-results-2",
          prompt: "Which number should decide whether you trust a rulebook change?",
          options: ["Holdout Avg R", "Total R", "Setups found", "Signals that never filled"],
          correctIndex: 0,
          explanation: "The holdout is history the tuning never saw.",
        },
      ],
    },
    {
      id: "g-bt-save",
      title: "Saving runs, reloading them and Backtest stats",
      summary: "Keep runs, reuse their settings, and see practice statistics.",
      where: "Backtest › Save, Journal › History › Backtest runs, Journal › Backtest stats",
      access: "admin",
      open: { to: "/journal", tab: "practice", label: "Open Backtest stats" },
      steps: [
        {
          title: "Save this run to history",
          body: "Under the results, type an optional label (for example “Full SMC, D1-H1”) and tap **Save this run to history** (“Saved to Backtest History.”). The run stores its settings, rulebook and every trade.",
        },
        {
          title: "Find saved runs",
          body: "Open **Journal › History** and pick **Backtest runs** in the source chips. **Sort by** Most recent, Win rate, Average R, Total R or Setups found. Tap a run to see its full results.",
          mock: {
            where: "Journal › History",
            parts: [
              {
                kind: "chips",
                items: ["My reads", "Admin reads", "Backtest runs"],
                on: [2],
                hl: true,
              },
              {
                kind: "chips",
                label: "Sort by",
                items: ["Most recent", "Win rate", "Average R", "Total R", "Setups found"],
                on: [0],
              },
              {
                kind: "buttons",
                items: [
                  { label: "Apply to Market Analyze", tone: "secondary" },
                  { label: "Reload into Backtest", tone: "secondary" },
                ],
              },
            ],
          },
        },
        {
          title: "Reuse a run",
          body: "**Reload into Backtest** opens the Backtest screen with every setting from that run filled in (“Loaded settings from your saved backtest run.”). **Apply to Market Analyze** opens the Den screen with that run's symbol, timeframes and engine. **Delete this run** removes it for good.",
          tip: "Careful: Apply to Market Analyze also saves that run's rulebook as your saved Den rulebook, replacing the current one. Note your current numbers first if you may want them back.",
        },
        {
          title: "Journal › Backtest stats",
          body: "The **Backtest stats** tab shows live-style statistics from saved backtest setups that hit take-profit or stop: the numbers, average R per practice trade, **Practice equity** and **Which checklist items help you**. Use **All symbols** or **Show one symbol**. It never mixes with your real Stats tab.",
          tip: "Older runs only kept totals. Re-run and save to fill this tab with individual trades.",
        },
      ],
      checks: [
        {
          id: "g-bt-save-1",
          prompt: "Where do saved backtest runs appear?",
          options: [
            "Journal › History › Backtest runs",
            "Journal › Notes",
            "Home › Shared signals",
            "Academy › Quizzes",
          ],
          correctIndex: 0,
          explanation: "Backtest runs is one of the History sources for admins.",
        },
        {
          id: "g-bt-save-2",
          prompt: "Are backtest trades counted in your Stats tab?",
          options: [
            "No, they only appear in Backtest stats",
            "Yes, mixed with real trades",
            "Only winners",
            "Only if you tap Reload",
          ],
          correctIndex: 0,
          explanation: "Practice results stay in Backtest stats so your live numbers stay honest.",
        },
      ],
    },
  ],
};
