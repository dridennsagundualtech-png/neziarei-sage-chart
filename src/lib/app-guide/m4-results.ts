import type { GuideModule } from "./types";

export const M4_RESULTS: GuideModule = {
  id: "results",
  title: "Reading an analysis result",
  blurb:
    "Every block of the result, top to bottom: verdict, grade, plan, checklist, sizing, copy tools and the learning extras.",
  lessons: [
    {
      id: "g-res-verdict",
      title: "The verdict, grade and evidence",
      summary: "Ready / Wait / No trade, the A–D grade, and what the numbers do not mean.",
      where: "Analyze › Result",
      access: "premium",
      open: { to: "/analyze", label: "Open Analyze" },
      steps: [
        {
          title: "The three-part strip",
          body: "The strip at the top lights one of **Ready**, **Wait** or **No trade**. It states where the checklist landed, never an instruction to trade.",
          bullets: [
            "**Ready**: a Potential long or short, stage Setup confirmed or Entry available, score at least 12 and at least 70% of the maximum, and it passes your quality gate.",
            "**Wait**: direction is forming or confirmation is missing. A Ready setup that fails your quality gate is shown as Wait.",
            "**No trade**: No trade, insufficient data, or the setup was invalidated.",
          ],
          mock: {
            where: "Analyze › Result",
            parts: [
              { kind: "chips", items: ["Ready", "Wait", "No trade"], on: [1], hl: true },
              { kind: "title", text: "Potential long", sub: "XAUUSD · 4H + 15M · Setup forming" },
            ],
          },
        },
        {
          title: "Direction and stage",
          body: "The big heading is the direction: **Potential long**, **Potential short**, **Wait**, **No trade** or **Insufficient data**. The line under it shows the asset, timeframes and stage: Setup forming, Setup confirmed, Entry available, Entry missed, Setup invalidated or No trade.",
        },
        {
          title: "Setup quality and grade",
          body: "**Setup quality** is the checklist score, out of 16 for AI analyses (Den may use a different maximum when you switch components off). Grades are proportional:",
          bullets: [
            "**A**: 13 or more of 16 (strong).",
            "**B**: 10–12 (good).",
            "**C**: 7–9 (weak or mixed).",
            "**D**: below 7 (poor or insufficient).",
          ],
        },
        {
          title: "Visual evidence, HTF bias and historical edge",
          body: "**Visual evidence** (High, Medium, Low) is how clear the screenshots are. It is not a probability that the trade wins. **HTF bias** is the higher-timeframe direction. **Historical edge** shows a win rate only once you have enough comparable finished setups in your own journal (your **Minimum setups before showing a win rate** in Settings); before that it says how many you have.",
          mock: {
            where: "Analyze › Result",
            parts: [
              {
                kind: "stats",
                items: [
                  ["Setup quality", "11/16"],
                  ["Visual evidence", "medium"],
                  ["HTF bias", "Bullish"],
                ],
              },
              {
                kind: "note",
                text: "Historical edge: Not enough history yet: 7 comparable setups, insufficient evidence. A win rate appears at 100.",
                tone: "info",
                hl: true,
              },
            ],
          },
        },
        {
          title: "Quality gate, plain English and missing context",
          body: "A box says **Passes your quality gate** or **Doesn't pass your quality gate yet** with the reasons. **In plain English** summarises the read in simple words. **More chart context required** lists what the analyzer could not see and the screenshots it wants; “Nothing was invented to fill these gaps.”",
        },
      ],
      checks: [
        {
          id: "g-res-verdict-1",
          prompt: "A result scores 13/16 but fails your quality gate. What does the strip show?",
          options: ["Wait", "Ready", "No trade", "Nothing"],
          correctIndex: 0,
          explanation: "A setup that would be Ready but fails the quality gate is shown as Wait.",
        },
        {
          id: "g-res-verdict-2",
          prompt: "Visual evidence says High. What does that tell you?",
          options: [
            "The screenshots show the evidence clearly",
            "The trade has a high chance to win",
            "The R:R is high",
            "The AI is confident it will hit TP2",
          ],
          correctIndex: 0,
          explanation:
            "Visual evidence rates how readable the chart is. It is never a win probability.",
        },
      ],
    },
    {
      id: "g-res-plan",
      title: "The conditional trade plan",
      summary:
        "Entry, stop, targets, R:R, confirmation and invalidation, and when a plan is rejected.",
      where: "Analyze › Result › Conditional trade plan",
      access: "premium",
      open: { to: "/analyze", label: "Open Analyze" },
      steps: [
        {
          title: "The plan rows",
          body: "**Conditional trade plan** lists **Entry zone**, **Stop / invalidation**, **TP1**, **TP2** and **R:R**. A level the analyzer could not read shows **Not visible**; it never guesses.",
          mock: {
            where: "Conditional trade plan",
            parts: [
              {
                kind: "rows",
                rows: [
                  { left: "Entry zone", right: "2,318.0 – 2,320.5" },
                  { left: "Stop / invalidation", right: "2,311.8", tone: "bear" },
                  { left: "TP1", right: "2,334.0", tone: "bull" },
                  { left: "TP2", right: "2,346.0", tone: "bull" },
                  { left: "R:R", right: "1.9R" },
                ],
                hl: true,
              },
            ],
          },
        },
        {
          title: "R:R is measured, not taken from the AI",
          body: "The app recalculates reward-to-risk from the levels themselves: the distance from the middle of the entry zone to TP1, divided by the distance to the stop. If the stop is not beyond the entry, or TP1 is not in front of it, the plan is flagged: “These levels don't form a valid trade: … Don't place it as written.” A ratio below your minimum gets “Reward-to-risk is below your minimum of 2:1, flagged as unfavourable.”",
        },
        {
          title: "Risk rules for this plan",
          body: "Under the plan, **Risk rules for this plan** turns your Settings into reminders: how much of your account this trade risks (with the size if it can be calculated), when to move the stop to break-even, and your daily soft stop.",
          tip: "No reminders? Set “Move stop to break-even” and “Daily loss limit” under Settings › Risk.",
        },
        {
          title: "Confirmation and invalidation",
          body: "**Required confirmation before considering entry** lists what must happen first (“Do not chase price. Wait for these conditions.”). **Invalidation watch** lists what kills the idea (“If any of these happen, the setup is dead.”). If confirmation never happens, there is no trade.",
        },
      ],
      checks: [
        {
          id: "g-res-plan-1",
          prompt: "A long plan shows the stop above the entry. What does the app do?",
          options: [
            "Flags that the levels don't form a valid trade",
            "Swaps the stop and the target",
            "Accepts it if the AI says so",
            "Deletes the analysis",
          ],
          correctIndex: 0,
          explanation:
            "Every plan is checked: the stop must sit beyond the entry and TP1 in front of it.",
        },
        {
          id: "g-res-plan-2",
          prompt: "Where does the R:R number come from?",
          options: [
            "It is measured from the entry, stop and TP1 levels",
            "The AI model's own estimate",
            "Your Settings minimum",
            "The average of your journal",
          ],
          correctIndex: 0,
          explanation: "R:R is recalculated from the levels, so a model cannot inflate it.",
        },
      ],
    },
    {
      id: "g-res-checklist",
      title: "The setup checklist and Why this read",
      summary: "The ten scored items, what earns each point, and the step-by-step reasoning.",
      where: "Analyze › Result › Setup checklist",
      access: "premium",
      open: { to: "/analyze", label: "Open Analyze" },
      steps: [
        {
          title: "Ten items, 16 points",
          body: "**Setup checklist** scores each item and caps it at its maximum:",
          bullets: [
            "**HTF Structure** (2): a clear bullish or bearish swing sequence on the highest timeframe.",
            "**Support / Resistance** (1): the entry sits at a respected zone, not mid-range.",
            "**Liquidity** (2): liquidity behind the entry and at the target.",
            "**AMD Model** (2): accumulation, manipulation and distribution all visible. Never forced.",
            "**Liquidity Sweep** (2): a sweep plus a visible rejection or reclaim.",
            "**MSS / BOS** (2): a swing level broken and closed beyond.",
            "**Displacement** (1): a decisive expansion with follow-through.",
            "**FVG / Imbalance** (1): a clear unfilled gap usable as an entry zone.",
            "**Volume** (1): volume visible and supporting the read.",
            "**Risk / Reward** (2): 2 at or above your minimum, 1 below it, 0 if not measurable.",
          ],
        },
        {
          title: "How each row reads",
          body: "Each row shows the points earned out of the maximum and a short note on what was or was not seen. If volume is not visible, that row says volume context is unavailable; with **Require volume confirmation** on in Settings, that counts as unmet.",
          mock: {
            where: "Setup checklist",
            parts: [
              {
                kind: "rows",
                rows: [
                  { left: "Liquidity Sweep", right: "2/2", tone: "bull" },
                  { left: "MSS / BOS", right: "1/2" },
                  { left: "Volume", right: "0/1", tone: "muted" },
                ],
                hl: true,
              },
            ],
          },
        },
        {
          title: "Why this read",
          body: "**Why this read** (“Learn the logic, step by step.”) explains the reasoning in order. Tap **Show reasoning** to open it and **Hide reasoning** to fold it. Read it even when you agree: it shows which evidence carried the score.",
        },
      ],
      checks: [
        {
          id: "g-res-checklist-1",
          prompt: "Your R:R is measurable but below your minimum. How many Risk / Reward points?",
          options: ["1", "2", "0", "It is not scored"],
          correctIndex: 0,
          explanation:
            "2 at or above your minimum, 1 when measurable but below it, 0 when not measurable.",
        },
        {
          id: "g-res-checklist-2",
          prompt: "Which item is worth only 1 point?",
          options: ["Displacement", "Liquidity Sweep", "HTF Structure", "MSS / BOS"],
          correctIndex: 0,
          explanation:
            "Support / Resistance, Displacement, FVG and Volume are 1 point each. The others are 2.",
        },
      ],
    },
    {
      id: "g-res-sizing",
      title: "Risk management and position size",
      summary: "How the size is calculated, why it needs a rate, and when it refuses.",
      where: "Analyze › Result › Risk management",
      access: "premium",
      open: { to: "/analyze", label: "Open Analyze" },
      steps: [
        {
          title: "The three numbers",
          body: "**Risk management** shows **Risk per trade** (your % from Settings), **Max loss** (that % of your balance, in your account currency) and **Position size**. “Never scale risk up because a score looks good.”",
          mock: {
            where: "Risk management",
            parts: [
              {
                kind: "stats",
                items: [
                  ["Risk per trade", "1%"],
                  ["Max loss", "10.00 USD"],
                ],
              },
              {
                kind: "card",
                title: "Position size",
                lines: [
                  "0.15 lots (15,000 units)",
                  "Risk per unit 0.00065 USD",
                  "1 lot = 100,000 units; confirm your broker's contract size",
                ],
                hl: true,
              },
            ],
          },
        },
        {
          title: "How the size is worked out",
          body: "Size = money at risk ÷ (stop distance × conversion rate). The stop distance is in the chart's quote currency (USD for XAUUSD and EURUSD, JPY for USDJPY). If your account is in another currency, the app converts with the day's reference rate and shows it, for example “1 USD = 57.9 PHP (daily reference rate)”.",
          bullets: [
            "Forex: 1 lot = 100,000 units.",
            "Gold (XAU): 1 lot = 100 ounces. Silver (XAG): 5,000 ounces.",
            "Crypto, indices and stocks: sized in units.",
          ],
        },
        {
          title: "When it refuses to give a size",
          body: "A wrong size is worse than none, so the box says why instead:",
          bullets: [
            "**Not calculable**: exact entry and stop prices are not readable.",
            "**Unknown currency**: the app cannot tell what the asset is priced in. Size it in your platform.",
            "**Rate unavailable**: the conversion rate could not be loaded. Check your connection and reopen the result.",
            "**Set balance**: your balance is 0.",
          ],
        },
        {
          title: "The 0.01-lot floor",
          body: "Most brokers' smallest trade is 0.01 lot. If even 0.01 lot at this stop risks more than your limit, the app says “Smaller than the usual 0.01-lot minimum” and shows what the smallest trade would really risk, in money and as a % of your account. Skip it, or take the larger risk knowingly.",
          tip: "Always confirm your broker's contract size before sending an order.",
        },
      ],
      checks: [
        {
          id: "g-res-sizing-1",
          prompt: "Your account is in PHP and you trade XAUUSD. What does the app need to size it?",
          options: [
            "The USD → PHP rate, which it loads and shows",
            "Nothing: gold is always priced in PHP",
            "Your broker login",
            "The TP2 level",
          ],
          correctIndex: 0,
          explanation:
            "The stop is measured in USD, so it converts to PHP with the daily reference rate before sizing.",
        },
        {
          id: "g-res-sizing-2",
          prompt: "The size box says “Rate unavailable”. What should you do?",
          options: [
            "Check your connection and reopen the result, or size it in your platform",
            "Use the last size you remember",
            "Trade 1 lot",
            "Lower your risk to 0%",
          ],
          correctIndex: 0,
          explanation:
            "Without the rate a size would be wrong, so the app refuses rather than guesses.",
        },
      ],
    },
    {
      id: "g-res-copy",
      title: "Copy plan & alerts",
      summary: "Copy the plan as text, or copy a TradingView alert idea.",
      where: "Analyze › Result › Copy plan & alerts",
      access: "premium",
      open: { to: "/analyze", label: "Open Analyze" },
      steps: [
        {
          title: "Full plan",
          body: "Under **Copy plan & alerts**, **Full plan** copies the direction, levels, R:R and conditions as plain text for your journal, Discord or Telegram.",
          mock: {
            where: "Copy plan & alerts",
            parts: [
              {
                kind: "buttons",
                items: [
                  { label: "Full plan", tone: "secondary" },
                  { label: "Pine alert idea", tone: "secondary" },
                ],
                hl: true,
              },
            ],
          },
        },
        {
          title: "Pine alert idea",
          body: "**Pine alert idea** copies a short TradingView Pine Script that plots the readable levels so you can set an alert. It is not an automated EA and does not place orders. If entry or stop could not be read, the button says it cannot build the alert idea.",
          tip: "“Always confirm live.” Levels from a screenshot are approximate.",
        },
      ],
      checks: [
        {
          id: "g-res-copy-1",
          prompt: "What does the Pine alert idea do?",
          options: [
            "Plots the readable levels in TradingView so you can set an alert",
            "Places the trade on MT5",
            "Moves your stop automatically",
            "Shares the signal with members",
          ],
          correctIndex: 0,
          explanation: "It is a small plotting script. It never places or manages orders.",
        },
        {
          id: "g-res-copy-2",
          prompt: "The entry and stop are “Not visible”. What happens with the Pine button?",
          options: [
            "It cannot build the alert idea",
            "It guesses the levels",
            "It copies an empty chart",
            "It uses yesterday's levels",
          ],
          correctIndex: 0,
          explanation: "Without readable levels there is nothing honest to plot.",
        },
      ],
    },
    {
      id: "g-res-learn",
      title: "Learning extras on a result",
      summary: "The educational plan, Teach me this chart, and your score against the AI.",
      where: "Analyze › Result (Learning mode)",
      access: "premium",
      open: { to: "/analyze", label: "Open Analyze" },
      steps: [
        {
          title: "Educational trade plan",
          body: "With **Learning mode** on, a screenshot result adds an **Educational trade plan**: the same plan written as conditions (“Only if price reaches … AND the confirmation below happens first.”). It ends with a test: could you explain each line in your own words? If not, use Teach me this chart first.",
        },
        {
          title: "Teach me this chart",
          body: "Tap **Start the walkthrough**. Ten steps go through your own screenshot: Market structure, Important levels, Liquidity, Liquidity sweep, MSS / BOS, Displacement, FVG, Trade setup, Risk and Target. Each step asks you first (“Write what YOU see first.”), then **Show the explanation** gives the evidence, what would invalidate it and the beginner mistake. Rate how close you were, then **Next step**.",
          mock: {
            where: "Teach me this chart",
            parts: [
              {
                kind: "title",
                text: "Step 4 of 10 · Liquidity sweep",
                sub: "Did price actually sweep that liquidity — and reclaim it?",
              },
              {
                kind: "field",
                label: "Your answer",
                value: "Swept the Asian low, closed back above",
              },
              { kind: "button", label: "Show the explanation", tone: "primary", hl: true },
            ],
          },
          tip: "Your honest ratings feed your topic strength in the Academy.",
        },
        {
          title: "Your analysis vs ChartPilot",
          body: "If you filled in **Your analysis first**, tap **Compare and score my reasoning**. Each field is graded with an explanation and a **Learning score**, plus **The concept you missed**. Disagreeing is not automatically wrong: defensible reasoning counts.",
        },
        {
          title: "What ChartPilot will never claim",
          body: "The last card restates the rules: a score is not a prediction, AI confidence is not win probability, and one win or loss does not prove the analysis right or wrong. When evidence is thin or conflicting: wait.",
        },
      ],
      checks: [
        {
          id: "g-res-learn-1",
          prompt: "What does each Teach me this chart step do first?",
          options: [
            "Asks for your own answer before explaining",
            "Shows the AI's answer",
            "Places a demo trade",
            "Changes your settings",
          ],
          correctIndex: 0,
          explanation:
            "Every step asks you first, then explains the evidence, the invalidation and the common mistake.",
        },
        {
          id: "g-res-learn-2",
          prompt:
            "Which setting must be on to see the Educational trade plan and Teach me this chart?",
          options: ["Learning mode", "Strict mode", "Telegram", "Session filter"],
          correctIndex: 0,
          explanation: "Learning mode adds the teaching tools to screenshot results.",
        },
      ],
    },
  ],
};
