import type { GuideModule } from "./types";

export const M6_RULEBOOK: GuideModule = {
  id: "rulebook",
  title: "Den rulebook",
  blurb:
    "Every switch and number in the Den Analyzer rulebook: what it measures, its default, and what changing it does.",
  lessons: [
    {
      id: "g-rb-open",
      title: "Opening, saving and resetting the rulebook",
      summary: "Where the rulebook lives, what it changes, and ATR as the unit.",
      where: "Den screen › Den Analyzer rulebook",
      access: "admin",
      open: { to: "/analyze", mode: "data", label: "Open the Den screen" },
      steps: [
        {
          title: "Open it",
          body: "On the Den screen, tap **Den Analyzer rulebook** (the bar with the sliders icon) to unfold the editor. It opens with your saved values.",
          mock: {
            where: "Den screen",
            parts: [
              { kind: "button", label: "Den Analyzer rulebook  ▾", tone: "secondary", hl: true },
              { kind: "button", label: "Save rulebook", tone: "secondary" },
            ],
          },
        },
        {
          title: "What it changes",
          body: "“Den Analyzer is not an AI. It reads the stored candles and applies the fixed rules below.” Edit and save a number and the maths changes on your next Den run. The AI models ignore these values completely.",
        },
        {
          title: "Save, or reset",
          body: "Den runs read the rulebook saved with your account, so an edit does nothing until you tap **Save rulebook** under the editor (“Den Analyzer rulebook saved.”). **Reset** at the top puts every value back to the defaults; save afterwards to make the reset stick.",
          tip: "Saved rules are also what Analyze › Market data, Batch Den and the backtest use by default. The rulebook inside the Backtest screen is separate: changes there only affect that backtest run.",
        },
        {
          title: "ATR: the unit almost everything uses",
          body: "Most distances are measured in ATR (average true range: the average size of a candle's full range over the ATR period). Because ATR grows on a volatile market and shrinks on a quiet one, the same rule adapts to gold, EURUSD or a crypto pair without new numbers.",
          bullets: ["Example: “0.8 x ATR” on gold with an ATR of 6 dollars means 4.8 dollars."],
        },
      ],
      checks: [
        {
          id: "g-rb-open-1",
          prompt:
            "You edit the rulebook and run Den with Gemini 2.5 Pro picked. Do your numbers matter?",
          options: [
            "No, the AI models ignore the rulebook",
            "Yes, always",
            "Only the components",
            "Only after you tap Reset",
          ],
          correctIndex: 0,
          explanation: "Only the Den Analyzer engine reads the rulebook.",
        },
        {
          id: "g-rb-open-2",
          prompt: "Why are most distances written as “x ATR”?",
          options: [
            "So rules adapt to how volatile each market is",
            "Because ATR is a price target",
            "To make results look better",
            "Because MT5 needs it",
          ],
          correctIndex: 0,
          explanation:
            "ATR scales with volatility, so one setting works across very different markets.",
        },
      ],
    },
    {
      id: "g-rb-components",
      title: "Active components and presets",
      summary: "Simple mode, Full SMC mode, custom selections and your own saved presets.",
      where: "Den rulebook › Active components",
      access: "admin",
      open: { to: "/analyze", mode: "data", label: "Open the Den screen" },
      steps: [
        {
          title: "Only switched-on components count",
          body: "“Only the components switched on are calculated, scored and allowed to vote on the final direction.” The checklist total adapts: the line **Active checklist total: N points** under the switches shows the new maximum, and grades scale to it.",
        },
        {
          title: "The 14 components",
          body: "Each switch has a short note:",
          bullets: [
            "**HTF Structure**: higher-timeframe trend from swing highs and lows.",
            "**Support / Resistance**: zones where price has reacted before.",
            "**Liquidity**: equal highs and lows where stops are resting.",
            "**Liquidity Sweep**: price taking a prior high or low, then reversing.",
            "**MSS / BOS**: break of structure / market structure shift.",
            "**Change of Character**: first break of structure against the current trend.",
            "**Displacement**: one decisive, wide-bodied candle showing intent.",
            "**AMD Model**: strict, needs accumulation + manipulation + distribution.",
            "**Order Block**: last opposing candle before the move that broke structure.",
            "**FVG / Imbalance**: three-candle imbalance left by a fast move.",
            "**Breaker Block**: an order block that failed and was later retested.",
            "**Fibonacci & Premium/Discount**: dealing range, retracements, extensions, premium vs discount.",
            "**Volume**: expansion on the move, quiet on the pullback.",
            "**Risk / Reward**: entry, stop and targets against your minimum R:R.",
          ],
          tip: "Tap **See it** on a row to show that concept's picture; **Hide picture** folds it.",
        },
        {
          title: "Simple mode and Full SMC mode",
          body: "**Simple mode** (the default) turns on seven: HTF Structure, Liquidity, Liquidity Sweep, MSS / BOS, Displacement, Fibonacci & Premium/Discount and Risk / Reward. **Full SMC mode** turns on all 14. Change any switch yourself and the label becomes **Custom selection**.",
          mock: {
            where: "Den rulebook › Active components",
            parts: [
              { kind: "chips", items: ["Simple mode", "Full SMC mode"], on: [0], hl: true },
              {
                kind: "toggle",
                label: "Liquidity Sweep",
                on: true,
                hint: "Price taking a prior high or low, then reversing.",
              },
              {
                kind: "toggle",
                label: "Order Block",
                on: false,
                hint: "Last opposing candle before the move that broke structure.",
              },
              { kind: "note", text: "Active checklist total: 12 points.", tone: "info" },
            ],
          },
        },
        {
          title: "Save your own preset",
          body: "Set the switches, type a name in **Preset name** and tap **Save** (“Preset saved.”). Your preset appears as a chip next to Simple and Full; tap it to apply it, or tap its delete icon to remove it. Presets are stored with your account.",
        },
      ],
      checks: [
        {
          id: "g-rb-components-1",
          prompt: "Which component is NOT part of Simple mode?",
          options: ["Order Block", "Liquidity Sweep", "Displacement", "Risk / Reward"],
          correctIndex: 0,
          explanation:
            "Simple mode leaves out Support / Resistance, CHoCH, AMD, Order Block, FVG, Breaker Block and Volume.",
        },
        {
          id: "g-rb-components-2",
          prompt: "You switch Volume off. What happens to the checklist maximum?",
          options: [
            "It drops by Volume's points and grades scale to the new total",
            "It stays at 16, so every grade falls",
            "The run refuses to start",
            "Volume still scores, it just doesn't vote",
          ],
          correctIndex: 0,
          explanation:
            "Switched-off components are not calculated or scored, and the total adapts.",
        },
      ],
    },
    {
      id: "g-rb-structure",
      title: "Swings & structure",
      summary: "Swing width, ATR period and the structure-break lookback.",
      where: "Den rulebook › Swings & structure",
      access: "admin",
      open: { to: "/analyze", mode: "data", label: "Open the Den screen" },
      steps: [
        {
          title: "How Den finds swings",
          body: "A swing high is a candle whose high is the highest within N candles on each side (a swing low is the mirror). The last three swings decide the trend: higher highs and higher lows = bullish, lower highs and lower lows = bearish, anything else = ranging.",
        },
        {
          title: "The three numbers",
          body: "Defaults in brackets:",
          bullets: [
            "**Swing width** (2 candles, range 1–6): candles needed on each side before a high or low counts as a swing. Higher = fewer, bigger swings.",
            "**ATR period** (14 candles, 5–50): how many candles are averaged for ATR, the unit most other rules use.",
            "**Structure-break lookback** (20 candles, 5–120): how far back Den looks for a break of a prior swing. A close beyond scores 2; a wick through scores 1.",
          ],
          mock: {
            where: "Den rulebook › Swings & structure",
            parts: [
              {
                kind: "field",
                label: "Swing width",
                value: "2 candles",
                hint: "Higher = fewer, bigger swings.",
                hl: true,
              },
              { kind: "field", label: "ATR period", value: "14 candles" },
              { kind: "field", label: "Structure-break lookback", value: "20 candles" },
            ],
          },
        },
        {
          title: "When to change them",
          body: "If Den calls every small wiggle a trend change on a low timeframe, raise **Swing width** to 3. If it misses breaks that happened a while ago, raise **Structure-break lookback**. Change one number at a time, then backtest.",
        },
      ],
      checks: [
        {
          id: "g-rb-structure-1",
          prompt: "You raise Swing width from 2 to 4. What happens?",
          options: [
            "Fewer, bigger swings are detected",
            "More, smaller swings",
            "ATR doubles",
            "Only longs are allowed",
          ],
          correctIndex: 0,
          explanation: "A swing now needs 4 candles on each side, so only larger turns qualify.",
        },
        {
          id: "g-rb-structure-2",
          prompt: "A break where price only wicks through the swing scores…",
          options: ["1 point", "2 points", "0 points", "3 points"],
          correctIndex: 0,
          explanation: "A close beyond scores 2; a wick through scores 1.",
        },
      ],
    },
    {
      id: "g-rb-levels",
      title: "Support, resistance & liquidity",
      summary: "How levels are merged, when price is “at” a level, equal highs and sweeps.",
      where: "Den rulebook › Support, resistance & liquidity",
      access: "admin",
      open: { to: "/analyze", mode: "data", label: "Open the Den screen" },
      steps: [
        {
          title: "Levels and pools",
          body: "Swing points close together are merged into one level. Levels below price are support, above are resistance. A level touched twice or more becomes a liquidity pool.",
        },
        {
          title: "Level numbers",
          body: "Defaults in brackets:",
          bullets: [
            "**Level merge tolerance** (0.35 x ATR): swings closer than this are one level.",
            "**Minimum merge tolerance** (0.0005 x price = 0.05%): a floor so very quiet markets still group levels.",
            "**Reacting-at-level distance** (0.8 x ATR): price must be this close to the nearest level to score Support / Resistance.",
            "**Flipped-level zone** (1.5 x ATR): broken resistance still counts as support while price stays within this distance above it.",
          ],
        },
        {
          title: "Equal highs and lows",
          body: "**Equal-highs tolerance** (0.2 x ATR) decides when two highs (or lows) count as equal, which marks resting liquidity. **Minimum equal-highs tolerance** (0.0003 x price) is its floor.",
        },
        {
          title: "Sweeps",
          body: "A sweep is price trading beyond a prior swing and then closing back inside.",
          bullets: [
            "**Sweep lookback** (25 candles): how far back Den searches for sweeps.",
            "**Sweep reclaim window** (3 candles, including the sweep candle): time allowed to close back inside. Staying outside longer is a breakout, not a sweep.",
            "A reclaimed sweep scores 2 and votes on direction. A fresh breach still waiting to reclaim scores 1 and does not vote.",
          ],
          mock: {
            where: "Den rulebook › Support, resistance & liquidity",
            parts: [
              { kind: "field", label: "Sweep lookback", value: "25 candles" },
              {
                kind: "field",
                label: "Sweep reclaim window",
                value: "3 candles",
                hint: "Past this, staying outside is a breakout, not a sweep.",
                hl: true,
              },
            ],
          },
        },
      ],
      checks: [
        {
          id: "g-rb-levels-1",
          prompt:
            "Price pokes below a swing low and closes back above on the next candle. With the default reclaim window, what is it?",
          options: [
            "A reclaimed sweep (2 points, votes)",
            "A breakout",
            "Nothing",
            "An order block",
          ],
          correctIndex: 0,
          explanation: "It closed back inside within 3 candles, so it is a reclaimed sweep.",
        },
        {
          id: "g-rb-levels-2",
          prompt: "What does Reacting-at-level distance control?",
          options: [
            "How close price must be to a level to score Support / Resistance",
            "How many candles a sweep can take",
            "The size of the stop buffer",
            "The minimum R:R",
          ],
          correctIndex: 0,
          explanation: "Price within 0.8 ATR (default) of the nearest level earns the point.",
        },
      ],
    },
    {
      id: "g-rb-momentum",
      title: "Momentum, AMD, gaps and volume",
      summary: "Displacement size, accumulation, fair value gaps and the volume test.",
      where: "Den rulebook › Momentum and Volume",
      access: "admin",
      open: { to: "/analyze", mode: "data", label: "Open the Den screen" },
      steps: [
        {
          title: "Displacement",
          body: "Displacement is one decisive candle. All three must hold:",
          bullets: [
            "**Displacement lookback** (12 candles): how far back Den looks for it.",
            "**Displacement body size** (1.3 x ATR): the body must be at least this big.",
            "**Displacement body-to-range** (0.6): the body must be at least 60% of the candle's full range, so long-wicked candles are rejected.",
          ],
        },
        {
          title: "AMD",
          body: "AMD scores 2 only when accumulation (a tight range), manipulation (a sweep) and distribution (expansion after that sweep) all appear, and 1 when two of the three do.",
          bullets: [
            "**Accumulation window** (25 candles): where Den looks for the tight range. The newest third is skipped so the expansion is not measured as the range.",
            "**Accumulation tightness** (3.2 x ATR): the whole range must fit inside this to count as accumulation.",
          ],
        },
        {
          title: "Fair value gaps",
          body: "**Fair value gap lookback** (30 candles) is where Den searches for three-candle gaps (candle 1's high below candle 3's low, or the mirror). **Minimum gap size** (0.15 x ATR) ignores smaller gaps as noise. Only unfilled gaps score.",
        },
        {
          title: "Volume",
          body: "Volume is scored only when the symbol stores tick volume. The point is given when the move expands on volume and the pullback goes quiet:",
          bullets: [
            "**Volume baseline window** (20 candles): candles averaged for normal volume.",
            "**Expansion multiple** (1.2 x average): the displacement candle's volume must beat the baseline by this much.",
            "**Pullback quiet multiple** (1.1 x average): the last three candles' average volume must stay under the baseline times this.",
          ],
          mock: {
            where: "Den rulebook › Volume",
            parts: [
              { kind: "field", label: "Expansion multiple", value: "1.2 x average", hl: true },
              { kind: "field", label: "Pullback quiet multiple", value: "1.1 x average" },
            ],
          },
        },
      ],
      checks: [
        {
          id: "g-rb-momentum-1",
          prompt:
            "A candle has a big body but long wicks: body is 40% of its range. Is it displacement by default?",
          options: [
            "No, the body must be at least 60% of the range",
            "Yes, size is all that matters",
            "Only on H4",
            "Only with volume",
          ],
          correctIndex: 0,
          explanation: "Displacement body-to-range defaults to 0.6, so wick-heavy candles fail.",
        },
        {
          id: "g-rb-momentum-2",
          prompt: "Only manipulation and distribution are found. What does AMD score?",
          options: ["1", "2", "0", "It forces No trade"],
          correctIndex: 0,
          explanation: "Two of the three phases score 1. All three are needed for 2.",
        },
      ],
    },
    {
      id: "g-rb-direction",
      title: "Direction, trade plan & gating",
      summary: "How Den votes on a direction, places stops and targets, and labels the stage.",
      where: "Den rulebook › Direction, trade plan & gating",
      access: "admin",
      open: { to: "/analyze", mode: "data", label: "Open the Den screen" },
      steps: [
        {
          title: "Seven signals vote",
          body: "Up to seven signals can vote: HTF bias, a reclaimed sweep, a closed structure break, displacement direction, CHoCH, order block side and Fibonacci zone. Only switched-on components vote. The side with enough votes, and more than the other side, sets the direction.",
          bullets: [
            "**Signals needed for a direction** (3, range 1–7): votes needed for a long or short. With one or fewer active signals on both sides the answer is No trade.",
          ],
        },
        {
          title: "Stops and targets",
          body: "Den builds the plan from recent swings:",
          bullets: [
            "**Stop/target swing window** (20 candles): the recent high and low used for stops and targets.",
            "**Stop buffer** (0.2 x ATR): extra room beyond the swing or swept level.",
            "**Minimum stop distance** (0.5 x ATR): a closer stop is pushed out to this, so a tiny stop cannot fake a huge R:R.",
            "**Second target extension** (1.5 x ATR): TP2 sits this far beyond TP1 / the swing extreme.",
          ],
          tip: "Every plan is checked before it is shown: stop beyond the entry, target in front of it. If not, the call drops to Wait.",
        },
        {
          title: "Stage and evidence labels",
          body: "Four scores turn the checklist total into labels:",
          bullets: [
            "**Entry-available score** (12 / 16): at or above it, the stage is Entry available instead of Setup confirmed.",
            "**Strict-mode floor** (7 / 16): with Strict mode on in Settings, a directional call below this becomes Wait.",
            "**HIGH evidence score** (12 / 16) and **MEDIUM evidence score** (8 / 16): below Medium the evidence is Low.",
          ],
          mock: {
            where: "Den rulebook › Direction, trade plan & gating",
            parts: [
              {
                kind: "field",
                label: "Signals needed for a direction",
                value: "3 signals",
                hl: true,
              },
              { kind: "field", label: "Minimum stop distance", value: "0.5 x ATR" },
              { kind: "field", label: "Strict-mode floor", value: "7 / 16" },
            ],
          },
        },
      ],
      checks: [
        {
          id: "g-rb-direction-1",
          prompt: "Why does Minimum stop distance exist?",
          options: [
            "So a tiny stop cannot fake a huge R:R",
            "To make every trade a winner",
            "To set the take-profit",
            "To decide the trend",
          ],
          correctIndex: 0,
          explanation: "A stop closer than 0.5 ATR is pushed out, keeping R:R honest.",
        },
        {
          id: "g-rb-direction-2",
          prompt: "Strict mode is on and Den scores a long at 6/16. What is the call?",
          options: ["Wait", "Potential long", "Entry available", "No trade forever"],
          correctIndex: 0,
          explanation:
            "Below the strict-mode floor (7 by default), a directional call is downgraded to Wait.",
        },
      ],
    },
    {
      id: "g-rb-smc",
      title: "Smart Money Concepts settings",
      summary: "CHoCH, order blocks, breakers and the Fibonacci dealing range.",
      where: "Den rulebook › Smart Money Concepts",
      access: "admin",
      open: { to: "/analyze", mode: "data", label: "Open the Den screen" },
      steps: [
        {
          title: "Definitions Den uses",
          body: "An order block is the last opposing candle before a displacement that broke structure. A breaker block is an order block price went straight through and later came back to retest. CHoCH is the first break against the current trend. The dealing range runs from the recent swing high to swing low: below 50% is discount, above is premium.",
        },
        {
          title: "CHoCH, order blocks and breakers",
          body: "Defaults in brackets:",
          bullets: [
            "**CHoCH lookback** (30 candles): where Den looks for a counter-trend break. A close beyond scores 2, a wick 1.",
            "**Order block lookback** (40 candles): how far back it searches for the displacement whose origin becomes the order block.",
            "**Order block proximity** (1.5 x ATR): price within this of a fresh order block earns the full 2 points.",
            "**Breaker retest distance** (1.5 x ATR): a failed order block scores once price returns within this.",
          ],
        },
        {
          title: "Fibonacci",
          body: "Fibonacci levels themselves are fixed (retracements 0.382, 0.5, 0.618, 0.705, 0.786; extensions 1.272, 1.618, 2.0, 2.618). You set:",
          bullets: [
            "**Dealing range window** (40 candles): candles used to find the swing high and low.",
            "**Equilibrium band** (0.03 = 3% of the range): how close to 50% counts as equilibrium, neither premium nor discount.",
            "**Extension used for target 2** (1.618): which extension becomes TP2 when Fibonacci is active.",
          ],
          mock: {
            where: "Den rulebook › Smart Money Concepts",
            parts: [
              { kind: "field", label: "Dealing range window", value: "40 candles" },
              {
                kind: "field",
                label: "Extension used for target 2",
                value: "1.618 x range",
                hl: true,
              },
            ],
          },
        },
      ],
      checks: [
        {
          id: "g-rb-smc-1",
          prompt:
            "A long is proposed with price at 70% of the dealing range. What does Fibonacci say?",
          options: [
            "Price is in premium, the wrong side for a long",
            "Price is in discount, ideal for a long",
            "It is equilibrium",
            "Fibonacci ignores direction",
          ],
          correctIndex: 0,
          explanation: "Above 50% is premium, which favours shorts. Longs want discount.",
        },
        {
          id: "g-rb-smc-2",
          prompt: "Which of these can you NOT edit in the rulebook?",
          options: [
            "The Fibonacci retracement ratios themselves",
            "The extension used for TP2",
            "The equilibrium band",
            "The dealing range window",
          ],
          correctIndex: 0,
          explanation:
            "The ratios are fixed. You choose the window, the band and which extension sets TP2.",
        },
      ],
    },
    {
      id: "g-rb-vwap",
      title: "The VWAP side filter",
      summary:
        "What VWAP is, how the Den uses it, and how to find out whether it helps before you rely on it.",
      where: "Den rulebook › Filters › VWAP side",
      access: "admin",
      open: { to: "/analyze", mode: "data", label: "Open the Den screen" },
      steps: [
        {
          title: "What VWAP is",
          body: "**VWAP** (volume-weighted average price) is the average price paid since the trading day started, weighted by how much traded at each price. It's one line that follows price through the day. Above it, buyers are paying up; below it, sellers are in control. Big funds measure their fills against it, which is why so many traders watch it.",
          tip: "Forex and gold have no central exchange, so MT5 only knows tick volume: how often the price changed. The app's VWAP uses that, like an MT5 chart does.",
        },
        {
          title: "Switch it on",
          body: "Open the **Den rulebook**, find **Filters** and turn on **VWAP side**. From then on the Den only lets you take a long when the last closed bar is above today's VWAP, and a short when it's below. It doesn't change the score; a plan on the wrong side just drops to **Wait**.",
          mock: {
            where: "Den rulebook › Filters",
            parts: [
              {
                kind: "toggle",
                label: "VWAP side",
                on: true,
                hint: "Longs only above today's VWAP, shorts only below.",
                hl: true,
              },
            ],
          },
        },
        {
          title: "How it's measured",
          body: "The VWAP starts at the beginning of the trading day, where your daily candles start, and is built from your shortest timeframe's closed bars. That timeframe must be **H1 or shorter**; with only H4 or D1 there's no day to average over, so no plan passes. There's nothing to tune on purpose: a setting you can adjust until a backtest looks good is how luck passes for skill.",
        },
        {
          title: "Read it on a result",
          body: "Every Den result shows **Price vs VWAP** in the quality-gate box, for example “above, 0.70340 vs 0.70310 (last closed M15 bar)”. With the filter on, a plan on the wrong side lists the reason under **Doesn't pass your quality gate yet**, and **Why this read** says which side price is on.",
          mock: {
            where: "Analyze › Market data › Den result",
            parts: [
              {
                kind: "card",
                title: "Doesn't pass your quality gate yet",
                lines: [
                  "VWAP side rule: a long needs price above today's VWAP; the last close 0.70290 is below it (0.70310).",
                  "Price vs VWAP: below, 0.70290 vs 0.70310 (last closed M15 bar)",
                ],
              },
            ],
          },
        },
        {
          title: "Test it once before trusting it",
          body: "There's no good evidence that VWAP gives retail forex traders an edge after costs; its proven use is executing big orders. So treat the filter as a question. Run one backtest with your usual rules, then one with **VWAP side** on, on the same symbol and timeframes. Compare the **trades the app would let you take** verdict, not the win rate. Both runs are counted as tests, which keeps the verdict honest.",
          tip: "If the filter only cuts trades without lifting the result after costs, switch it off. Fewer trades on its own isn't better.",
        },
      ],
      checks: [
        {
          id: "g-rb-vwap-1",
          prompt:
            "With VWAP side on, the Den finds a long while price is below today's VWAP. What happens?",
          options: [
            "The plan is shown but isn't tradable: it drops to Wait with the VWAP reason",
            "The Den flips it to a short",
            "The score goes down by one point",
            "Nothing, VWAP is only shown",
          ],
          correctIndex: 0,
          explanation:
            "The filter doesn't change the score or direction. It decides which plans the app lets you take.",
        },
        {
          id: "g-rb-vwap-2",
          prompt: "How do you find out whether the VWAP filter helps?",
          options: [
            "Backtest the same setup once with it off and once with it on, and compare the verdicts after costs",
            "Turn it on and see if the next trade wins",
            "Check that the win rate went up",
            "Many traders use it, so it must help",
          ],
          correctIndex: 0,
          explanation:
            "One trade proves nothing and a higher win rate can still lose money. The verdict after costs over many trades is the test.",
        },
      ],
      task: "Turn on VWAP side, run one Den backtest on a symbol you trade, and compare its verdict with the same backtest without it.",
    },
    {
      id: "g-rb-tuning",
      title: "Tuning the rulebook safely",
      summary: "A method that improves rules without fooling yourself.",
      where: "Den rulebook + Backtest",
      access: "admin",
      open: { to: "/backtest", label: "Open Backtest" },
      steps: [
        {
          title: "One change at a time",
          body: "Write down the number you change and why. Change one value, run a backtest on the same symbol and timeframes, and compare. Changing five things at once tells you nothing about which one helped.",
        },
        {
          title: "Judge by the holdout",
          body: "Keep **Holdout** at 30% in the backtest. Tuning on the whole history makes the rules fit the past. The holdout is history the tuning never saw; its Avg R is the number to trust.",
        },
        {
          title: "Check costs and sample",
          body: "Enter your real spread plus commission. A run without costs can't show an edge. Ignore results the verdict calls **Too little history**: seeing a real +0.10R edge usually takes 1,200 or more finished trades. Re-check on a second symbol with **Quick cross-symbol check**, and remember every run you try is logged and makes the bar stricter.",
        },
        {
          title: "Then save",
          body: "When a change holds up on the holdout, set the same value on the Den screen and tap **Save rulebook**. Save the backtest run too, with a label that names the change, so you can find it later in **Journal › History › Backtest runs**.",
        },
      ],
      checks: [
        {
          id: "g-rb-tuning-1",
          prompt:
            "A new setting improves the full-sample Avg R but the holdout Avg R turns negative. What does that suggest?",
          options: [
            "The setting is fitted to the past; do not trust it",
            "It is a strong edge",
            "The holdout is wrong",
            "Save it immediately",
          ],
          correctIndex: 0,
          explanation: "A weak holdout means the improvement does not carry to unseen data.",
        },
        {
          id: "g-rb-tuning-2",
          prompt: "Why change one rulebook number at a time?",
          options: [
            "So you know which change caused the difference",
            "Because the app only allows one",
            "To save AI credits",
            "It makes the backtest faster",
          ],
          correctIndex: 0,
          explanation: "Several changes at once make the result impossible to attribute.",
        },
      ],
    },
  ],
};
