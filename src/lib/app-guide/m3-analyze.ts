import type { GuideModule } from "./types";

export const M3_ANALYZE: GuideModule = {
  id: "analyze",
  title: "Analyze: running a chart",
  blurb:
    "Getting screenshots in, locking your own bias, and what can stop an analysis from running.",
  lessons: [
    {
      id: "g-an-modes",
      title: "The Analyze screen and its three modes",
      summary: "Screenshots, market data or a trade of your own, and the balance card.",
      where: "Analyze",
      access: "premium",
      open: { to: "/analyze", label: "Open Analyze" },
      steps: [
        {
          title: "Premium first",
          body: "Chart analysis uses AI, so it needs premium. Without it you see **Chart analysis is premium** with a sign-in button and a **Premium code** box. Academy lessons, History and Stats stay free.",
        },
        {
          title: "Screenshots, Market data or My trade",
          body: "Three buttons sit at the top. **Screenshots** reads chart images you upload. **Market data** reads the latest stored candles for a symbol instead, with no images. **My trade** checks an entry, stop and target you type in yourself; it has its own lesson below. Market data shows a lock until an admin turns it on for your account (“Market data analysis is locked: ask an admin to enable it for your account.”).",
          mock: {
            where: "Analyze",
            parts: [
              { kind: "title", text: "Analyze", sub: "Run a setup through the fixed checklist." },
              {
                kind: "buttons",
                items: [
                  { label: "Screenshots", tone: "primary" },
                  { label: "🔒 Market data", tone: "secondary" },
                  { label: "My trade", tone: "secondary" },
                ],
                hl: true,
              },
            ],
          },
        },
        {
          title: "The Account balance card",
          body: "Before you run anything, the **Account balance** card lets you update your balance. It is the same number as in Settings and feeds the position size on every plan and your journal risk.",
          tip: "If the plan later says “Set balance”, this number is 0.",
        },
      ],
      checks: [
        {
          id: "g-an-modes-1",
          prompt: "Market data on Analyze shows a lock. What does that mean?",
          options: [
            "An admin has not enabled market data for your account",
            "You have no screenshots yet",
            "Your premium expired today",
            "The market is closed",
          ],
          correctIndex: 0,
          explanation: "Market data mode is switched on per account by an admin.",
        },
        {
          id: "g-an-modes-2",
          prompt: "Where does the position size on a plan get your balance from?",
          options: [
            "The Account balance (Analyze card or Settings, same number)",
            "Your broker account automatically",
            "The last trade in History",
            "It always assumes 1,000",
          ],
          correctIndex: 0,
          explanation:
            "Both places edit one stored balance. The app never connects to your broker.",
        },
      ],
    },
    {
      id: "g-an-upload",
      title: "Getting your charts in",
      summary: "The screenshot compiler, direct upload, timeframe tags and the asset box.",
      where: "Analyze › Your charts",
      access: "premium",
      open: { to: "/analyze", label: "Open Analyze" },
      steps: [
        {
          title: "Screenshot compiler (recommended)",
          body: "Tap **Open screenshot compiler**. Choose up to 5 images, put them in top-down order (1D → 4H → 1H → 15M → 5M) with **Move up** / **Move down**, pick **Stacked (vertical)** or **Side by side**, and the compiler merges them into one clean picture. Tap **Use in Analyzer** to add it.",
          mock: {
            where: "Analyze › Screenshot compiler",
            parts: [
              {
                kind: "title",
                text: "Screenshot compiler",
                sub: "They are combined in the order shown below.",
              },
              {
                kind: "rows",
                rows: [
                  { left: "1. Daily", right: "↑ ↓" },
                  { left: "2. 4H", right: "↑ ↓" },
                  { left: "3. 15M", right: "↑ ↓" },
                ],
              },
              { kind: "chips", items: ["Stacked (vertical)", "Side by side"], on: [0] },
              { kind: "button", label: "Use in Analyzer", tone: "primary", hl: true },
            ],
          },
          tip: "The compiler needs at least two images. One image? Use direct upload instead.",
        },
        {
          title: "Or upload directly",
          body: "Tap **Or upload screenshots directly (optional)** to show the drop zone. You can add up to 6 images to one analysis. Each image gets a timeframe box: pick its timeframe (from your watchlist timeframes) or leave **Let ChartPilot read the timeframe**. Reorder with **Move earlier** / **Move later**, or remove one with **Remove screenshot**.",
        },
        {
          title: "What makes a good screenshot",
          body: "The analyzer scores only what it can see. Give it what a trader would need:",
          bullets: [
            "A higher timeframe for structure and at least one lower timeframe for the entry.",
            "Prices visible on the right axis, so entry, stop and targets can be read.",
            "The symbol visible, or typed in the asset box.",
            "Volume shown if you want the Volume item scored.",
          ],
        },
        {
          title: "The asset box",
          body: "Under the button, **Asset (optional: helps if the ticker is cropped)** takes a symbol like XAUUSD or EURUSD. It also tells position sizing which currency the chart is priced in.",
          mock: {
            where: "Analyze",
            parts: [
              {
                kind: "field",
                label: "Asset (optional: helps if the ticker is cropped)",
                value: "XAUUSD",
                hl: true,
              },
            ],
          },
        },
      ],
      checks: [
        {
          id: "g-an-upload-1",
          prompt: "What is the most images one analysis accepts?",
          options: ["6", "2", "10", "Unlimited"],
          correctIndex: 0,
          explanation:
            "Six screenshots is the maximum. The compiler merges up to 5 into one of those slots.",
        },
        {
          id: "g-an-upload-2",
          prompt: "Your chart crops off the ticker. What should you do?",
          options: [
            "Type the symbol in the Asset box",
            "Nothing, the AI always knows",
            "Upload it twice",
            "Turn on Beginner mode",
          ],
          correctIndex: 0,
          explanation: "The asset box fills the gap and lets sizing know the quote currency.",
        },
      ],
    },
    {
      id: "g-an-bias",
      title: "Your bias first, then Human vs AI",
      summary: "Why the app makes you commit before it shows you anything.",
      where: "Analyze › Your bias first",
      access: "premium",
      open: { to: "/analyze", label: "Open Analyze" },
      steps: [
        {
          title: "Lock in your own read",
          body: "Once a chart is added, **Your bias first** appears. Pick **Long** (I expect price to go up), **Short** (down), **Wait** (setup forming, not ready) or **No trade** (no valid setup), write a line of reasoning, and tap **Lock in my bias**. **Analyze setup** stays greyed out until you do.",
          mock: {
            where: "Analyze › Your bias first",
            parts: [
              { kind: "chips", items: ["Long", "Short", "Wait", "No trade"], on: [2] },
              {
                kind: "field",
                label: "Why",
                value: "HTF bullish, waiting for a sweep of equal lows on M5",
              },
              { kind: "button", label: "Lock in my bias", tone: "primary", hl: true },
            ],
          },
        },
        {
          title: "Why it matters",
          body: "Committing first stops you copying the app. After the result you can compare: if you keep agreeing only after seeing ChartPilot's answer, you are not learning to read charts. “I don't know” is a valid answer; use Wait or No trade for it.",
        },
        {
          title: "Your analysis first (learning mode)",
          body: "With **Learning mode** on in Settings, a longer form follows: direction, market structure, where orders rest, whether liquidity was swept, your entry zone, where the idea is wrong, the next liquidity area and your confidence. Blank or “unclear” is allowed. Tap **Lock in my analysis**. After the result, **Compare and score my reasoning** grades your answers field by field.",
          tip: "The learning score grades reasoning, not trading results. It says nothing about whether the trade would win.",
        },
      ],
      checks: [
        {
          id: "g-an-bias-1",
          prompt: "Why is Analyze setup greyed out after you add a chart?",
          options: [
            "You have not locked in your own bias yet",
            "Premium has run out",
            "The chart is too small",
            "Strict mode is on",
          ],
          correctIndex: 0,
          explanation:
            "The bias step is required, so you form your own view before seeing the app's.",
        },
        {
          id: "g-an-bias-2",
          prompt: "Which setting adds the longer Human vs AI form?",
          options: ["Learning mode", "Strict mode", "Require volume confirmation", "Beginner mode"],
          correctIndex: 0,
          explanation:
            "Learning mode adds the walkthroughs, concept cards and Human vs AI on every analysis.",
        },
      ],
    },
    {
      id: "g-an-run",
      title: "Running it, and what can block it",
      summary: "The Analyze setup button, the progress stages, and the guards that pause you.",
      where: "Analyze",
      access: "premium",
      open: { to: "/analyze", label: "Open Analyze" },
      steps: [
        {
          title: "Tap Analyze setup",
          body: "Tap **Analyze setup**. While it works you see **Reading your charts carefully** with stages: reading the chart, checking image quality, mapping structure, finding liquidity, checking AMD, confirming MSS/BOS, evaluating entry and calculating historical statistics. The round arrow button next to it (**Start over**) clears everything.",
        },
        {
          title: "It saves itself",
          body: "When the analysis finishes it is saved to **Journal › History** automatically, with your screenshots. You do not need a save button. You record how it ended later.",
        },
        {
          title: "Things that stop a run",
          body: "Each guard tells you exactly why:",
          bullets: [
            "“Add at least one chart screenshot.” or “Lock in your own bias above…”",
            "“Outside your selected trading sessions: analysis is paused.” (Home session filter)",
            "**Daily loss limit reached**: today's finished trades add up to your limit. You can tap **I understand, analyze anyway**; the override lasts for this session.",
            "“Market data analysis is not enabled for your account.” in Market data mode.",
          ],
          mock: {
            where: "Analyze",
            parts: [
              {
                kind: "note",
                text: "Daily loss limit reached · You are at -3.0R today",
                tone: "warn",
              },
              {
                kind: "button",
                label: "I understand, analyze anyway",
                tone: "secondary",
                hl: true,
              },
              { kind: "button", label: "Analyze setup", tone: "primary" },
            ],
          },
          tip: "Before you hit the limit, a quieter line shows how much you are down today against the limit.",
        },
      ],
      checks: [
        {
          id: "g-an-run-1",
          prompt: "An analysis finished. What do you need to do to keep it?",
          options: [
            "Nothing: it is saved to Journal › History automatically",
            "Tap Save in Settings",
            "Copy the plan to Notes",
            "Take a screenshot",
          ],
          correctIndex: 0,
          explanation: "Every finished analysis is stored in History with its screenshots.",
        },
        {
          id: "g-an-run-2",
          prompt: "You override the daily loss limit. How long does the override last?",
          options: [
            "For this session",
            "Forever",
            "Until midnight UTC tomorrow",
            "For one analysis",
          ],
          correctIndex: 0,
          explanation:
            "The override is for this session only. The limit itself lives in Settings › Risk.",
        },
      ],
    },
    {
      id: "g-an-data",
      title: "Market data mode and the model picker",
      summary: "Analyze a symbol from stored candles, and choose Den or an AI model.",
      where: "Analyze › Market data",
      access: "market-data",
      open: { to: "/analyze", label: "Open Analyze" },
      steps: [
        {
          title: "Pick a symbol and timeframes",
          body: "In **Market data** mode, **Analyze from stored market data** lists the symbols in your price feed. Tap one, then tap up to 6 timeframes. The analysis uses the most recent 150 candles per timeframe. No screenshots are needed.",
          tip: "Admins see the full Den screen in this mode instead, with candle counts, the rulebook and backtesting (see the Den Analyzer module).",
          mock: {
            where: "Analyze › Market data",
            parts: [
              {
                kind: "chips",
                label: "Pick a symbol",
                items: ["XAUUSD", "EURUSD", "BTCUSD"],
                on: [0],
              },
              {
                kind: "chips",
                label: "Timeframes (one setup across timeframes)",
                items: ["D1", "H4", "H1", "M15"],
                on: [1, 2, 3],
                hl: true,
              },
              { kind: "note", text: "Last candle: 3 minutes ago", tone: "info" },
            ],
          },
        },
        {
          title: "Check freshness",
          body: "Under each timeframe the app shows when the last candle arrived. **No candles stored** means that timeframe has no data. If data is very old you get a warning before the run: results may be based on old candles.",
          tip: "Only closed candles count. A candle that is still forming is ignored, so a 4H read changes only when a 4H bar closes.",
        },
        {
          title: "Choose the engine",
          body: "The model picker offers **Den Analyzer (recommended)**, which is rule-based and free, **Automatic (AI cascade)**, which tries AI models in order until one answers, or a specific Gemini model. **Check availability** tests whether the AI models respond right now.",
          mock: {
            where: "Analyze › Market data",
            parts: [
              {
                kind: "rows",
                rows: [
                  { left: "Den Analyzer (recommended)", right: "●" },
                  { left: "Automatic (AI cascade)", right: "○", tone: "muted" },
                  { left: "Gemini 2.5 Pro", right: "○", tone: "muted" },
                ],
              },
              { kind: "button", label: "Check availability", tone: "ghost", hl: true },
            ],
          },
        },
      ],
      checks: [
        {
          id: "g-an-data-1",
          prompt: "How many candles per timeframe does Market data mode on Analyze read?",
          options: [
            "The latest 150",
            "Every candle ever stored",
            "The latest 10",
            "It depends on your balance",
          ],
          correctIndex: 0,
          explanation: "Analyze reads the most recent 150 candles for each selected timeframe.",
        },
        {
          id: "g-an-data-2",
          prompt: "Which engine needs no AI credits?",
          options: [
            "Den Analyzer",
            "Automatic (AI cascade)",
            "Gemini 2.5 Pro",
            "Gemini 2.5 Flash-Lite",
          ],
          correctIndex: 0,
          explanation:
            "Den applies fixed rules to the candles in code. The other choices call AI models.",
        },
      ],
    },
    {
      id: "g-an-own",
      title: "My trade: check an idea of your own",
      summary:
        "Type your own entry, stop and target and have the plan, stop, size and odds checked.",
      where: "Analyze › My trade",
      access: "premium",
      open: { to: "/analyze", label: "Open Analyze" },
      steps: [
        {
          title: "What it is for",
          body: "**My trade** is a second opinion on a trade you thought of yourself. You bring the idea; the app checks only what it can honestly check: whether the levels form a trade, whether the stop is wide enough, how big the position should be, and the odds chance alone gives. It has no view on which way price goes, and it uses no AI credits.",
        },
        {
          title: "Fill in your trade",
          body: "Type the **Symbol**, choose **Long (buy)** or **Short (sell)**, then the **Entry**, **Stop** and **Target** as prices. Tap **Check this trade**. A comma works as a decimal point.",
          mock: {
            where: "Analyze › My trade",
            parts: [
              { kind: "field", label: "Symbol", value: "EURUSD" },
              { kind: "chips", items: ["Long (buy)", "Short (sell)"], on: [0] },
              { kind: "field", label: "Entry", value: "1.0850" },
              { kind: "field", label: "Stop", value: "1.0840" },
              { kind: "field", label: "Target", value: "1.0870" },
              { kind: "button", label: "Check this trade", tone: "primary", hl: true },
            ],
          },
        },
        {
          title: "Reading the answer",
          body: "A headline says whether anything needs fixing. Under it, **Your trade, checked** has one line per check. A tick passes, a cross fails, a dash is information only.",
          bullets: [
            "**Plan**: R:R measured from your levels, against your minimum. A stop on the wrong side of the entry is not a trade, and nothing else is shown.",
            "**Stop**: too tight when the spread costs more than 0.05R a trade or a normal day would reach it. It then gives the closest stop that passes.",
            "**Size**: the lots for your risk per trade, and the money at risk.",
            "**Odds with no edge**: how often the target comes before the stop by chance, and the average result, which is the spread.",
            "**To break even**: how many more trades in 100 than chance you must win just to cover the spread.",
          ],
          mock: {
            where: "Analyze › My trade",
            parts: [
              { kind: "title", text: "Long EURUSD", sub: "One thing to fix before placing this." },
              {
                kind: "rows",
                rows: [
                  { left: "Plan", right: "R:R 2" },
                  { left: "Stop", right: "Too tight", tone: "bear" },
                  { left: "Size", right: "1.00 lots" },
                  { left: "Odds with no edge", right: "about 35%", tone: "muted" },
                  { left: "To break even", right: "3 extra wins in 100", tone: "muted" },
                ],
              },
            ],
          },
          tip: "When the app has no daily data or no exchange rate for a symbol, the line says what it could not check instead of passing it.",
        },
        {
          title: "What it does not do",
          body: "It does not save the trade to your journal yet, and a pass is not a reason to take the trade. Every test so far found no way to predict direction, so the odds shown are the ones chance gives. The check keeps a good idea from being wasted on a bad stop, a wrong size or too much spread.",
        },
      ],
      checks: [
        {
          id: "g-an-own-1",
          prompt:
            "My trade says the plan, the stop and the size check out. What does that tell you?",
          options: [
            "The trade is built soundly; direction is still your call",
            "The trade is likely to win",
            "The app agrees with your direction",
            "You should double your size",
          ],
          correctIndex: 0,
          explanation: "It checks the plan, not the idea. It has no view on which way price goes.",
        },
        {
          id: "g-an-own-2",
          prompt: "The Stop line says Too tight. What is the usual fix?",
          options: [
            "Use a stop at least as far as the closest one it suggests, or skip the trade",
            "Move the target closer",
            "Trade a bigger size",
            "Ignore it if the R:R is high",
          ],
          correctIndex: 0,
          explanation:
            "A tight stop pays a large share of its risk in spread and sits inside normal noise. A wider stop means a smaller size for the same risk.",
        },
      ],
    },
  ],
};
