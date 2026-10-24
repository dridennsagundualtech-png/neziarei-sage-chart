import type { GuideModule } from "./types";

export const M5_DEN: GuideModule = {
  id: "den",
  title: "Den Analyzer",
  blurb:
    "The rule-based market analysis screen: setting up a run, reading the chart and tables, and backtesting the setup you are looking at.",
  lessons: [
    {
      id: "g-den-what",
      title: "What the Den Analyzer is",
      summary: "Fixed rules over your stored candles, not an AI. Where to find it.",
      where: "Analyze › Market data (admin)",
      access: "admin",
      open: { to: "/analyze", mode: "data", label: "Open the Den screen" },
      steps: [
        {
          title: "Rules, not a model",
          body: "Den reads the candles stored in your market-data table (fed from MT5) and applies the fixed rules in the Den Analyzer rulebook. The same candles and the same rules always give the same answer. It costs no AI credits and never invents a level.",
        },
        {
          title: "Only closed candles",
          body: "Each stored candle is stamped with the time the bar opened. Den only uses a bar after it has closed, so a forming candle can never change a signal half-way. A 4H read updates when a 4H bar closes.",
        },
        {
          title: "Where to open it",
          body: "Open **Analyze** and tap **Market data**. For admins this mode is the full Den screen. Members with market data access get a simpler Market data screen on the same page, where they can still pick **Den Analyzer (recommended)** in the model picker. Old links to the Market page now open here too.",
          mock: {
            where: "Analyze (admin)",
            parts: [
              {
                kind: "buttons",
                items: [
                  { label: "Screenshots", tone: "secondary" },
                  { label: "Market data", tone: "primary" },
                ],
                hl: true,
              },
              {
                kind: "title",
                text: "Admin · market data engine",
                sub: "Multi-timeframe read from live candle data",
              },
            ],
          },
        },
        {
          title: "Same checklist, more components",
          body: "Den scores the same items as the AI checklist and can add four Smart Money extras: Change of Character, Order Block, Breaker Block, and Fibonacci & Premium/Discount. Which ones count is up to you, in the rulebook's **Active components**.",
        },
      ],
      checks: [
        {
          id: "g-den-what-1",
          prompt:
            "You run Den twice on the same closed candles with the same rulebook. What do you get?",
          options: [
            "The same answer both times",
            "Two different answers",
            "An error",
            "A random grade",
          ],
          correctIndex: 0,
          explanation: "Den is deterministic: fixed rules over fixed data.",
        },
        {
          id: "g-den-what-2",
          prompt: "A 1H candle is still forming. Does Den use it?",
          options: [
            "No, only closed candles count",
            "Yes, always",
            "Only for the stop",
            "Only on Fridays",
          ],
          correctIndex: 0,
          explanation: "A bar counts only after it closes, so signals never change mid-candle.",
        },
      ],
    },
    {
      id: "g-den-run",
      title: "Setting up a Den run",
      summary: "Symbol, timeframes, candle presets, candle counts, freshness and the engine.",
      where: "Den screen",
      access: "admin",
      open: { to: "/analyze", mode: "data", label: "Open the Den screen" },
      steps: [
        {
          title: "Symbol and timeframes",
          body: "Tap a symbol chip, then tap the timeframes to include. The timeframe list comes straight from what you store, so a new timeframe you start saving (1M, 30M…) appears automatically.",
          mock: {
            where: "Den screen",
            parts: [
              { kind: "chips", label: "Symbol", items: ["XAUUSD", "EURUSD", "GBPUSD"], on: [0] },
              {
                kind: "chips",
                label: "Timeframes",
                items: ["D1", "H4", "H1", "M15", "M5"],
                on: [1, 2, 3],
                hl: true,
              },
            ],
          },
        },
        {
          title: "Candle presets",
          body: "**Candle presets** set timeframes and candle counts in one tap:",
          bullets: [
            "**Scalper**: M1, M5, M15 (30 / 30 / 40 candles).",
            "**Day Trader**: M5, M15, M30, H1 (60 / 80 / 80 / 100).",
            "**Swing Trader**: H1, H4, D1 (150 / 180 / 200).",
          ],
          tip: "Set your own mix and tap **Save as Preset** with a name. Your presets are saved on this device.",
        },
        {
          title: "Candles per timeframe",
          body: "Each selected timeframe gets a slider from 10 to 300 candles (150 if you leave it). Fewer candles focus on recent price; more candles show broader structure. **Last candle updated** shows how fresh each timeframe is.",
          mock: {
            where: "Den screen › Candles per timeframe",
            parts: [
              { kind: "slider", label: "H4", value: "180", pct: 58 },
              { kind: "slider", label: "M15", value: "150", pct: 48, hl: true },
            ],
          },
        },
        {
          title: "Engine and rulebook",
          body: "Pick the engine in the model picker (Den, Automatic or a Gemini model). Open **Den Analyzer rulebook** to tune the rules (next module). With an AI model you can switch on **Double-check this analysis**: it runs twice and forces Wait if the two runs disagree on direction, at about double the AI cost.",
        },
        {
          title: "Balance, your bias, then run",
          body: "Under the engine, check your **Account balance** (it sizes the plan). Then fill in **Your bias first** (Long, Short, Wait or No trade, with a reason) and tap **Lock in my bias**. **Analyze market data** stays greyed out until you do. Picking another symbol asks for a new bias. Tap **Analyze market data**; if any timeframe's candles are very old you get a warning first.",
          mock: {
            where: "Analyze › Market data (admin)",
            parts: [
              { kind: "field", label: "Account balance", value: "1,000 USD" },
              {
                kind: "chips",
                label: "Your bias first",
                items: ["Long", "Short", "Wait", "No trade"],
                on: [0],
              },
              { kind: "button", label: "Lock in my bias", tone: "secondary" },
              {
                kind: "buttons",
                items: [
                  { label: "Analyze market data", tone: "primary" },
                  { label: "↺", tone: "secondary" },
                ],
                hl: true,
              },
            ],
          },
          tip: "The round arrow (**Start over**) clears the result and your bias. The daily loss limit and the session filter apply here too.",
        },
      ],
      checks: [
        {
          id: "g-den-run-1",
          prompt: "What range can you set for candles per timeframe on the Den screen?",
          options: ["10 to 300", "1 to 50", "100 to 8,000", "Always 150"],
          correctIndex: 0,
          explanation: "Each timeframe's slider goes from 10 to 300; 150 is the default.",
        },
        {
          id: "g-den-run-2",
          prompt: "Double-check finds the two AI runs disagree on direction. What does it do?",
          options: [
            "Forces the direction to Wait",
            "Picks the higher score",
            "Shows both and lets you choose",
            "Deletes the run",
          ],
          correctIndex: 0,
          explanation: "Disagreement means the read is unreliable, so the direction becomes Wait.",
        },
      ],
    },
    {
      id: "g-den-read",
      title: "Reading Den's output",
      summary: "The summary, the chart, the timeframe reads and the measured statistics.",
      where: "Den screen › Result",
      access: "admin",
      open: { to: "/analyze", mode: "data", label: "Open the Den screen" },
      steps: [
        {
          title: "Market summary",
          body: "The result opens with the symbol and “data as of” time, a **Market summary**, the resistance levels above price and support levels below, and a **Momentum** note.",
        },
        {
          title: "The chart",
          body: "The chart draws the candles with the setup on top. Switch layers with the chips **Trade plan**, **Setup steps**, **Support & resistance** and **All candles**. Pinch or use **Zoom in**, **Zoom out** and **Reset zoom**. The plan box shows risk in red and reward to each target in green, with R labels, measured from the last candle.",
          mock: {
            where: "Den screen › Chart",
            parts: [
              {
                kind: "chips",
                items: ["Trade plan", "Setup steps", "Support & resistance", "All candles"],
                on: [0, 1, 2],
                hl: true,
              },
              {
                kind: "card",
                title: "How the setup built up",
                lines: [
                  "1 · Sweep of equal lows · M15",
                  "2 · Break of structure · M15",
                  "3 · Fair value gap · M15 · tap to switch timeframe",
                ],
              },
            ],
          },
        },
        {
          title: "Setup steps",
          body: "Under the chart, **How the setup built up** numbers each step (sweep, break, gap…) in order, and **Levels to watch** lists the rest. Tap a step to focus the chart on it; a step from another timeframe says “tap to switch timeframe”.",
        },
        {
          title: "Timeframe by timeframe and measured statistics",
          body: "**Timeframe by timeframe** gives one read per timeframe. **Measured statistics** (“Computed in code from the candles, not from the model.”) is a table: TF, Close, Trend, EMA20/50, ATR14, Range, Pos% (where the close sits inside the range) and Volume.",
        },
        {
          title: "The usual result blocks",
          body: "Below that comes the same result as a screenshot analysis: verdict strip, grade, plan, checklist, sizing, copy tools and **Journal this setup**, so you can record how the trade ended right there. Each run is saved to **Journal › History › Admin reads**. When Den says Wait, it tells you exactly what to wait for instead of a bare “wait”.",
        },
      ],
      checks: [
        {
          id: "g-den-read-1",
          prompt: "Where do the Measured statistics numbers come from?",
          options: [
            "Calculated in code from the candles",
            "The AI model's opinion",
            "Your journal",
            "TradingView",
          ],
          correctIndex: 0,
          explanation: "The table is computed directly from the stored candles.",
        },
        {
          id: "g-den-read-2",
          prompt: "What does tapping a numbered setup step do?",
          options: [
            "Focuses the chart on that step",
            "Deletes the step",
            "Shares it with members",
            "Starts a backtest",
          ],
          correctIndex: 0,
          explanation:
            "Steps are tappable so you can see exactly where each piece of evidence sits.",
        },
      ],
    },
    {
      id: "g-den-setup-bt",
      title: "Track record, and saving a screenshot",
      summary: "What these exact rules earned on all stored history, against a coin flip.",
      where: "Den screen › Result",
      access: "admin",
      open: { to: "/analyze", mode: "data", label: "Open the Den screen" },
      steps: [
        {
          title: "Track record",
          body: "Under every Den result, **Track record** replays the same rules over all stored history for that symbol and timeframes, with typical spread and commission. It runs by itself (“Replaying these rules over all stored history…”).",
        },
        {
          title: "Two verdicts",
          body: "One card judges **Trades the app would have let you take**, the other **Every long or short read**. Each says **Edge on this history**, **Not proven**, **No edge** or **Too little history**. An edge needs at least 30 finished trades, a positive average after costs, and a coin flip on direction matching it no more than 5% of the time.",
          mock: {
            where: "Track record",
            parts: [
              {
                kind: "card",
                title: "Every long or short read",
                lines: ["No edge", "No edge: −0.13R per trade over 72 trades, after costs."],
                hl: true,
              },
            ],
          },
        },
        {
          title: "Why Ready waits for it",
          body: "**Ready** only lights up when the first card shows an edge. Until then the strip says **Wait** and explains why: the rules are met, but trades like this haven't earned money on this symbol's history. Paper-trade them instead.",
        },
        {
          title: "Save screenshot to journal",
          body: "**Save screenshot to journal** captures the chart and result and stores it in **Journal › Screenshots**, where you can rename or delete it.",
        },
      ],
      checks: [
        {
          id: "g-den-setup-bt-1",
          prompt:
            "The track record shows +0.10R per trade over 60 trades, but a coin flip did as well 30% of the time. What is the verdict?",
          options: ["Not proven", "Edge on this history", "No edge", "Too little history"],
          correctIndex: 0,
          explanation:
            "Positive, but luck alone matches it too often. An edge needs a coin flip to match it no more than 5% of the time.",
        },
        {
          id: "g-den-setup-bt-2",
          prompt: "Where does Save screenshot to journal put the picture?",
          options: ["Journal › Screenshots", "Journal › Notes", "Settings", "Academy › Books"],
          correctIndex: 0,
          explanation: "Saved chart pictures live in the Screenshots tab of the Journal.",
        },
      ],
    },
  ],
};
