/**
 * Breakthrough chapters 11–15: order flow, macro, risk maths, psychology and the TradingView toolkit.
 */
import { buildScene, go, heikinAshi, k } from "./scene";
import { calc, flow, scene, type BreakthroughChapter } from "./types";

// Same price path drawn twice: once as normal candles, once as Heikin Ashi.
const HA_BASE = buildScene({
  start: 50,
  items: [go(56, 5), go(53, 3), go(58, 4)],
  steps: [],
}).candles;
const HA_CANDLES = heikinAshi(HA_BASE);

export const CH_MICRO: BreakthroughChapter = {
  id: "bt-11-orderflow",
  title: "Order flow and market mechanics",
  topic: "volume",
  summary:
    "The order book, who you trade against, real vs tick volume, slippage, delta and liquidations.",
  mistake:
    "Using volume-based tools on a feed with no real volume and reading the output as if it were exchange data.",
  terms: [
    {
      term: "Order book and depth of market",
      aka: "DOM, Level 2",
      meaning:
        "The list of resting limit orders at each price: bids (buyers) below, asks (sellers) above. The gap between the best bid and best ask is the spread. A market order fills against whatever is resting there.",
      spot: "Thin books mean a large market order has to climb through several prices to fill. Drag the slider to see it happen.",
      tv: "Depth of market is available for some exchange-traded symbols when a supported broker is connected. Spot forex and CFD charts don't have a central book.",
      caution:
        "Displayed orders can be pulled before price reaches them (spoofing). The book shows intentions, not commitments.",
      visual: { kind: "dom" },
    },
    {
      term: "Market makers and liquidity providers",
      aka: "A-book, B-book",
      meaning:
        "Firms that quote both a bid and an ask and earn the spread. In retail forex and CFDs, your broker either passes your order to liquidity providers (A-book) or takes the other side itself (B-book), or mixes both.",
      spot: "Your broker's execution policy document says which model it uses. It explains why spreads, fills and prices can differ between brokers.",
      caution:
        "Neither model is automatically a scam, and neither guarantees fair fills. Watch your actual slippage and spread in your trade history.",
      visual: flow({
        nodes: [
          { label: "You click Buy", tone: "primary" },
          {
            label: "Your broker",
            note: "Checks margin, then either fills you itself or routes the order on.",
          },
          {
            label: "A-book: routed to liquidity providers",
            note: "Banks and market makers quote prices; the broker earns a markup or commission.",
          },
          {
            label: "B-book: broker takes the other side",
            note: "The broker is your counterparty and manages the combined risk of all clients.",
          },
          {
            label: "Fill price comes back",
            note: "Compare it with the price you clicked: that difference is your slippage.",
          },
        ],
      }),
    },
    {
      term: "Tick volume vs real volume",
      meaning:
        "Futures, stocks and crypto exchanges count every contract or coin traded: real volume. Spot forex has no central exchange, so most forex and CFD charts show tick volume: how many times the price changed.",
      spot: "Tick volume still rises when markets get busy, so relative spikes are useful. Absolute numbers are not comparable between brokers.",
      tv: "For a real-volume view of a currency, traders sometimes check the matching futures contract, such as euro futures for EURUSD.",
      caution: "Volume profile, VWAP and delta tools built on tick volume are approximations.",
      visual: flow({
        layout: "grid",
        nodes: [
          {
            label: "Exchange markets: real volume",
            note: "Futures, stocks, crypto exchanges. Every trade is counted in one place.",
            tone: "bull",
          },
          {
            label: "Spot forex and CFDs: tick volume",
            note: "No central exchange. The chart counts price changes from your data provider.",
            tone: "warn",
          },
        ],
        caption: "Same word on the chart, two very different numbers.",
      }),
    },
    {
      term: "Slippage, gaps and stop orders",
      meaning:
        "Slippage is the difference between the price you expected and the price you got. A stop-loss becomes a market order when it triggers, so in a fast move or a gap it fills at the next available price, which can be worse than your stop.",
      spot: "Expect more slippage around news, at the weekly open and in thin markets. Some brokers offer guaranteed stops for a fee.",
      caution: "Your risk is only as fixed as your fills. Size positions with some room for this.",
      visual: scene({
        start: 55,
        items: [go(51, 5), k(50.5, 51, 50, 50.4, "fri"), k(46, 47, 45.5, 46.5, "gap"), go(48, 3)],
        lines: [{ y: 49, label: "your stop at 49", tone: "bear", labelAt: "start" }],
        marks: [{ at: "gap", y: 45.5, text: "filled at 46", dir: "up", tone: "warn" }],
        steps: [
          { upTo: "fri", text: "A long position with a stop at 49. The week closes at 50.4." },
          { upTo: "gap", text: "The new week opens at 46, straight past the stop." },
          {
            upTo: 99,
            text: "The stop triggers and fills at 46, not 49. The loss is bigger than planned.",
          },
        ],
      }),
    },
    {
      term: "Delta and cumulative volume delta",
      aka: "CVD",
      meaning:
        "Delta is the volume traded at the ask (buyers hitting) minus the volume traded at the bid (sellers hitting) in a candle. Cumulative volume delta adds it up over time. It shows whether aggressive buyers or sellers did more of the work.",
      spot: "Price making a higher high while CVD makes a lower high suggests the push came with less aggressive buying, a possible sign of absorption.",
      tv: "Volume delta and CVD indicators exist; they need lower-timeframe or tick data and some are on paid plans.",
      caution:
        "Only meaningful with real traded volume. Aggressive orders aren't always smart orders.",
      visual: scene({
        start: 50,
        items: [go(56, 6, "h1"), go(53, 3), go(57, 4, "h2"), go(51, 4)],
        lines: [{ y: 56.5, y2: 57.5, from: "h1", to: "h2" }],
        panel: {
          name: "CVD",
          kind: "line",
          series: [
            {
              values: [0, 6, 12, 18, 24, 30, 26, 23, 21, 23, 25, 26, 25, 20, 15, 12, 10],
              tone: "primary",
            },
          ],
        },
        marks: [{ at: "h2", y: 57.5, text: "higher high", dir: "down", tone: "warn" }],
        steps: [
          {
            upTo: "h1",
            text: "Price rallies and CVD rises with it: aggressive buyers are doing the work.",
          },
          {
            upTo: "h2",
            text: "Price makes a higher high, but CVD makes a lower high. Less aggressive buying behind the new high.",
          },
          { upTo: 99, text: "The push fades." },
        ],
      }),
    },
    {
      term: "Footprint chart",
      meaning:
        "A chart that splits each candle by price and shows how much traded at the bid and at the ask at every level. Traders look for imbalances (one side far outweighing the other) and for absorption.",
      spot: "Stacked buying imbalances on several prices in a row suggest strong aggressive demand. Tap the rows to read each price.",
      tv: "Volume footprint charts are available on higher-tier plans for symbols with suitable data.",
      caution:
        "Footprints are dense. They help most for fine timing on liquid exchange markets, not for finding direction.",
      visual: { kind: "footprint" },
    },
    {
      term: "Open interest and funding",
      aka: "OI, funding rate",
      meaning:
        "Open interest is the number of futures or perpetual contracts still open. Funding is a regular payment between longs and shorts on crypto perpetuals that keeps their price near spot: when longs pay, the market is leaning long.",
      spot: "Read open interest together with price. The four combinations are below; tap each.",
      caution:
        "These are clues about positioning, not signals. Crowded positioning can stay crowded for a long time.",
      visual: flow({
        layout: "grid",
        nodes: [
          {
            label: "Price up, OI up",
            note: "New positions opening in the direction of the move: new longs.",
            tone: "bull",
          },
          {
            label: "Price up, OI down",
            note: "Positions closing: often shorts buying back (short covering).",
            tone: "warn",
          },
          { label: "Price down, OI up", note: "New positions opening: new shorts.", tone: "bear" },
          { label: "Price down, OI down", note: "Longs closing and leaving.", tone: "warn" },
        ],
      }),
    },
    {
      term: "Liquidations and cascades",
      meaning:
        "When a leveraged trader's margin runs out, the platform closes the position by force. Many liquidations at nearby prices can chain together: each forced sale pushes price into the next cluster, creating a sudden long wick.",
      spot: "A violent wick into an obvious cluster of stops or liquidation levels, followed by a fast recovery, is the classic picture, especially in crypto.",
      caution:
        "Ties back to margin and leverage: the higher the leverage, the closer your own liquidation price sits.",
      visual: scene({
        start: 55,
        items: [go(53, 5), k(53, 53.5, 44, 46, "casc"), k(46, 52, 45.5, 51.5), go(55, 4)],
        zones: [{ from: 0, top: 50, bottom: 47, tone: "bear", label: "long liquidations" }],
        marks: [{ at: "casc", y: 44, text: "cascade", dir: "up", tone: "warn" }],
        steps: [
          {
            upTo: 4,
            text: "Many leveraged longs have their liquidation prices clustered just under the market.",
          },
          {
            upTo: "casc",
            text: "A dip triggers the first ones; their forced selling triggers the next: a cascade.",
          },
          { upTo: 99, text: "Once the forced selling is done, price snaps back." },
        ],
      }),
    },
  ],
};

export const CH_MACRO: BreakthroughChapter = {
  id: "bt-12-macro",
  title: "Macro and the news traders watch",
  topic: "trade_planning",
  summary: "Rates, inflation, jobs, the dollar, yields, risk mood and the economic calendar.",
  mistake:
    "Holding a full-size position through a high-impact release without checking the calendar.",
  terms: [
    {
      term: "Central banks and interest rates",
      meaning:
        "Central banks such as the Fed, ECB, Bank of England and Bank of Japan set short-term interest rates. Higher expected rates make a currency more attractive to hold, so currencies tend to move on rate expectations.",
      spot: "What matters is the surprise compared with what markets expected, not the decision itself.",
      caution:
        "A rate hike that everyone expected can move the currency down. Expectations, not headlines.",
      visual: flow({
        nodes: [
          { label: "Central bank signals higher rates", tone: "primary" },
          {
            label: "Bonds in that currency pay more",
            note: "Investors earn more for holding assets in that currency.",
          },
          { label: "Money flows into the currency", note: "Demand for the currency rises." },
          {
            label: "The currency tends to strengthen",
            note: "If markets had already expected it, much of this has happened before the announcement.",
            tone: "bull",
          },
        ],
      }),
    },
    {
      term: "FOMC, dot plot and forward guidance",
      meaning:
        "The FOMC is the Federal Reserve committee that sets US rates. It has eight scheduled meetings a year. The statement comes out at 14:00 New York time, followed by a press conference. Four times a year it also publishes projections, including the 'dot plot' of where members expect rates to go.",
      spot: "The biggest moves often come during the press conference, when the chair answers questions and hints at future policy (forward guidance).",
      caution: "Expect spreads to widen and fast reversals in the minutes after the statement.",
      visual: flow({
        nodes: [
          {
            label: "14:00 New York: statement and decision",
            note: "The rate decision and the written statement. Changes in wording are scrutinised.",
            tone: "primary",
          },
          {
            label: "Projections and dot plot (4 meetings a year)",
            note: "Members' projections for rates, growth and inflation. Each dot is one member's rate expectation.",
          },
          {
            label: "14:30 New York: press conference",
            note: "The chair's answers about the path ahead often move markets more than the decision.",
          },
          { label: "Market reprices rate expectations", tone: "warn" },
        ],
      }),
    },
    {
      term: "Inflation data",
      aka: "CPI, core CPI, PCE",
      meaning:
        "CPI measures how consumer prices change; core CPI excludes food and energy. The Fed's preferred gauge is the PCE price index. Inflation surprises change rate expectations, which move currencies, gold and stocks.",
      spot: "Compare the actual number with the forecast on the calendar. A hotter number than forecast usually means 'rates higher for longer'.",
      caution: "The first move after the release often reverses as traders digest the details.",
      visual: flow({
        nodes: [
          { label: "US CPI comes in hotter than forecast", tone: "warn" },
          { label: "Markets expect higher US rates for longer" },
          { label: "US yields rise" },
          {
            label: "USD tends to rise; gold and stocks tend to fall",
            note: "Typical first reaction, not a rule. Other news can override it.",
            tone: "primary",
          },
        ],
      }),
    },
    {
      term: "Jobs data",
      aka: "NFP, nonfarm payrolls",
      meaning:
        "The US employment report, usually released on the first Friday of the month at 08:30 New York time. It includes nonfarm payrolls, the unemployment rate and wage growth.",
      spot: "Expect a spike in volatility at the release. Many traders wait for the first 15-minute candle to close before considering anything.",
      caution:
        "Whipsaws are common: a fast move one way, then the other. Spreads widen right at the release.",
      visual: scene({
        start: 50,
        items: [
          go(51, 3, undefined, 1),
          go(50.5, 3, undefined, 1),
          k(50.5, 56, 50.2, 55, "nfp"),
          k(55, 55.5, 48, 48.6, "whip"),
          go(46, 4),
        ],
        marks: [
          { at: "nfp", y: 56, text: "08:30 release", dir: "down", tone: "primary" },
          { at: "whip", y: 48, text: "whipsaw", dir: "up", tone: "warn" },
        ],
        steps: [
          { upTo: 5, text: "Quiet trade before the release." },
          { upTo: "nfp", text: "The number is out: price spikes up in seconds." },
          {
            upTo: 99,
            text: "Then it reverses through the start of the spike. Both sides got stopped out.",
          },
        ],
      }),
    },
    {
      term: "Dollar index and correlations",
      aka: "DXY",
      meaning:
        "The US Dollar Index measures the dollar against a basket of six major currencies, weighted heavily toward the euro. Because of that weighting, EURUSD usually moves roughly opposite to DXY.",
      spot: "Before a EURUSD long, glance at DXY: buying EURUSD while DXY is breaking out higher means fighting the dollar.",
      tv: "Symbol DXY (ICE data), or TVC:DXY.",
      caution: "Correlations change over time and can break during big news.",
      visual: scene({
        start: 50,
        items: [go(56, 6), go(52, 4), go(58, 6)],
        panel: (c) => ({
          name: "DXY (moves opposite)",
          kind: "line",
          series: [{ values: c.map((x) => 110 - x.c), tone: "primary" }],
        }),
        steps: [
          { upTo: 5, text: "EURUSD rises (top) while the dollar index falls (bottom)." },
          { upTo: 99, text: "Their mirror image is what 'negative correlation' looks like." },
        ],
      }),
    },
    {
      term: "Yields and real yields",
      meaning:
        "The yield is the return on government bonds, such as the US 10-year. The real yield is the yield minus expected inflation. Gold pays no interest, so when real yields rise, holding gold costs more in missed return.",
      tv: "Symbol US10Y shows the US 10-year yield. Put it under a gold chart to compare.",
      spot: "Rising US yields often support the dollar and weigh on gold and growth stocks.",
      caution:
        "These links are tendencies that strengthen and weaken over the years. Check the current relationship before relying on it.",
      visual: flow({
        nodes: [
          { label: "Real yield = bond yield − expected inflation", tone: "primary" },
          { label: "Real yields rise", note: "Safe bonds now pay more after inflation." },
          {
            label: "Holding gold costs more",
            note: "Gold pays nothing, so the return you give up by holding it grows.",
          },
          {
            label: "Gold tends to fall",
            note: "A tendency, not a rule: central-bank buying or fear can override it.",
            tone: "warn",
          },
        ],
      }),
    },
    {
      term: "Risk-on and risk-off",
      meaning:
        "Risk-on: calm markets and growth optimism, when investors buy stocks and higher-yielding currencies such as AUD and NZD. Risk-off: fear, when money moves to perceived safe havens such as USD, JPY, CHF, gold and government bonds.",
      spot: "On big-fear days, many charts move together. A safe-haven rally can break normal technical levels.",
      caution: "Safe-haven behaviour isn't fixed; it shifts with each crisis.",
      visual: flow({
        nodes: [
          {
            label: "Calm, growth: risk-on",
            note: "Stocks up; AUD, NZD and other higher-yielding currencies tend to strengthen.",
            tone: "bull",
          },
          {
            label: "Shock, fear: risk-off",
            note: "USD, JPY, CHF, gold and bonds tend to strengthen as money seeks safety.",
            tone: "bear",
          },
        ],
        loop: true,
      }),
    },
    {
      term: "Economic calendar and impact",
      meaning:
        "A schedule of data releases and central-bank events, each with an impact rating, a forecast, the previous value and, once released, the actual value.",
      spot: "Check it every morning. Mark high-impact events on your chart's time axis.",
      tv: "The Economic Calendar is in the TradingView app; you can filter by country and impact.",
      caution:
        "Release times are usually given in your selected time zone. Double-check during daylight-saving changes.",
      visual: flow({
        nodes: [
          { label: "Morning: check the calendar", tone: "primary" },
          {
            label: "Mark high-impact events",
            note: "Rate decisions, CPI, NFP, central-bank speeches.",
          },
          {
            label: "Before: no new entries",
            note: "Many traders avoid opening trades roughly 15 to 30 minutes before a high-impact release, or reduce size.",
          },
          { label: "During: spreads widen", note: "Stops may fill worse than planned." },
          {
            label: "After: wait for a candle close",
            note: "Let the first reaction finish before judging direction.",
            tone: "bull",
          },
        ],
      }),
    },
    {
      term: "Priced in",
      aka: "buy the rumour, sell the news",
      meaning:
        "Markets move on expectations. If good news was widely expected, price may already have risen before it arrives, and the actual release can trigger profit-taking instead.",
      spot: "A long run-up into an event plus an 'as expected' result is the classic set-up for a sell-the-news move.",
      caution:
        "Sometimes good news is simply good news. 'Priced in' is easy to say after the fact.",
      visual: scene({
        start: 45,
        items: [
          go(56, 10, "run"),
          k(56, 57.5, 55.5, 57, "news"),
          k(57, 57.2, 52, 52.5, "sell"),
          go(49, 4),
        ],
        marks: [
          { at: "news", y: 57.5, text: "good news", dir: "down", tone: "bull" },
          { at: "sell", y: 52, text: "sell the news", dir: "up", tone: "bear" },
        ],
        steps: [
          {
            upTo: "run",
            text: "Everyone expects good news, and price climbs for days ahead of it.",
          },
          { upTo: "news", text: "The good news arrives, exactly as expected." },
          {
            upTo: 99,
            text: "Buyers take profit. Price falls on good news because it was already priced in.",
          },
        ],
      }),
    },
  ],
};

export const CH_RISK: BreakthroughChapter = {
  id: "bt-13-risk-math",
  title: "Risk, expectancy and the maths",
  topic: "risk_management",
  summary:
    "R-multiples, break-even win rate, expectancy, drawdown, losing streaks, Kelly and sample size. Move the sliders.",
  mistake: "Judging a strategy on ten trades.",
  terms: [
    {
      term: "R-multiple",
      meaning:
        "One R is the amount you risk on a trade: the money lost if the stop is hit. Results are written in R: a full stop-out is −1R, a win of twice the risk is +2R.",
      spot: "Thinking in R makes trades comparable across position sizes and accounts. ChartPilot's journal and statistics use R for this reason.",
      caution: "R only means something if the stop is real and you actually honour it.",
      visual: calc("rmultiple"),
    },
    {
      term: "Break-even win rate",
      meaning:
        "The win rate you need just to break even at a given reward-to-risk, before costs: 1 ÷ (1 + R:R). At 1:1 you need 50%; at 2:1, 33.3%; at 3:1, 25%.",
      spot: "Use it to sanity-check a plan. If your honest win rate for a setup is below the break-even rate, the setup loses money.",
      caution:
        "Spread and commission push the real break-even rate higher, especially for tight targets.",
      visual: calc("breakeven"),
    },
    {
      term: "Expectancy",
      meaning:
        "The average result per trade, in R: (win rate × average win) − (loss rate × average loss). 40% winners averaging +2R and 60% losers averaging −1R gives 0.8 − 0.6 = +0.2R per trade.",
      spot: "Expectancy combines win rate and payoff into one number. A low win rate can be profitable; a high win rate can lose.",
      caution:
        "Your measured expectancy is only an estimate until you have a large sample. See sample size below.",
      visual: calc("expectancy"),
    },
    {
      term: "Profit factor",
      meaning:
        "Total money from winning trades divided by total money lost on losing trades. Above 1 means winners outweigh losers; exactly 1 is break-even.",
      spot: "Useful for comparing strategies or periods. ChartPilot's statistics page shows it for your journal.",
      caution: "A handful of big winners can inflate it on a small sample.",
      visual: calc("profitfactor"),
    },
    {
      term: "Drawdown",
      aka: "maximum drawdown",
      meaning:
        "The fall from an equity peak to a later low, usually in percent. Maximum drawdown is the biggest such fall. Losses need bigger gains to recover: −20% needs +25%, −50% needs +100%.",
      spot: "Decide in advance the drawdown at which you stop and review, before it happens.",
      caution:
        "Recovery maths is unforgiving, which is why small risk per trade matters more than big winners.",
      visual: calc("drawdown"),
    },
    {
      term: "Losing streaks and risk of ruin",
      meaning:
        "Even a profitable strategy has long losing runs. With a 40% win rate, a streak of 5 losses somewhere in 100 trades is more likely than not. Risk of ruin is the chance of losing so much you can't continue.",
      spot: "Use the sliders: losing streaks are survivable at 1% risk per trade and brutal at 10%.",
      caution: "Streaks don't 'make a win due'. Each trade is roughly independent.",
      visual: calc("streak"),
    },
    {
      term: "Position sizing and correlation",
      meaning:
        "Position size = (account × risk %) ÷ (stop distance × value per point). Correlated trades add up: three dollar-short trades at 1% each behave more like one 3% bet on the dollar.",
      spot: "Before adding a trade, ask whether it's really a new idea or the same idea in another pair. Tap the trades below.",
      caution:
        "Correlations are approximate and change, but they rarely help you in a sudden move.",
      visual: calc("correlation"),
    },
    {
      term: "Kelly criterion",
      meaning:
        "A formula for the fraction of capital that maximises long-run growth given your edge: f = W − (1 − W) ÷ R, where W is the win rate and R is average win ÷ average loss. With 45% winners and R of 2, full Kelly is 17.5% per trade.",
      spot: "Its main lesson is how sensitive sizing is to small errors in your win-rate estimate. Traders who use it take a small fraction (a quarter or less).",
      caution:
        "Full Kelly produces huge drawdowns, and your inputs are only estimates. Not a reason to risk more.",
      visual: calc("kelly"),
    },
    {
      term: "Prop firm rules",
      aka: "daily loss limit, trailing drawdown",
      meaning:
        "Funded-account programmes set rules such as a daily loss limit, a maximum total drawdown (static or trailing), minimum trading days and sometimes consistency rules. Breaking one rule usually fails the account, even if it's in profit.",
      spot: "A trailing drawdown follows your equity peak upward, so profits raise the line you must stay above. Move the sliders to compare.",
      caution:
        "Rules differ between firms, and details such as end-of-day vs intraday trailing matter. Read the exact rules of your programme.",
      visual: calc("trailing"),
    },
    {
      term: "Sample size",
      meaning:
        "Results from a few trades say very little. With 30 trades, a measured 50% win rate is consistent with a true rate anywhere from roughly 32% to 68%. With 300 trades, the band narrows to roughly 44% to 56%.",
      spot: "ChartPilot shows a minimum-sample note on statistics for this reason. Collect enough trades per setup before drawing conclusions.",
      caution: "Changing rules every few trades resets your sample to zero.",
      visual: calc("sample"),
    },
  ],
};

export const CH_PSYCH: BreakthroughChapter = {
  id: "bt-14-psychology",
  title: "Psychology and process",
  topic: "risk_management",
  summary:
    "The loops that wreck accounts, the biases behind them, and the routines that break them.",
  mistake:
    "Treating discipline as willpower instead of building rules and routines that make the right action the easy one.",
  terms: [
    {
      term: "FOMO",
      aka: "fear of missing out",
      meaning: "The urge to jump into a move you didn't plan for because it's leaving without you.",
      spot: "Signs: entering without a stop, entering far from your zone, sizing up to 'catch up'.",
      caution:
        "The fix is a rule, not a feeling: no entry without a pre-written plan. Missed moves cost nothing.",
      visual: flow({
        nodes: [
          { label: "Big move without you", tone: "bull" },
          { label: "Fear of missing out", note: "The mind treats a missed gain like a loss." },
          {
            label: "Chase at a bad price",
            note: "Entry far from the zone, stop placed wherever it feels OK.",
          },
          { label: "Normal pullback stops you out", tone: "bear" },
        ],
        loop: true,
      }),
    },
    {
      term: "Revenge trading",
      meaning: "Trading to win back a loss immediately, usually bigger and with a worse setup.",
      spot: "Signs: a new trade within minutes of a loss, larger size than usual, a setup you wouldn't normally take.",
      caution:
        "Set a cooling-off rule: after a loss, no new trade for a fixed time, such as 30 minutes.",
      visual: flow({
        nodes: [
          { label: "A loss", tone: "bear" },
          {
            label: "Anger: 'win it back'",
            note: "The goal quietly changes from following the plan to repairing your ego.",
          },
          { label: "Bigger size, worse setup" },
          { label: "Bigger loss", tone: "bear" },
        ],
        loop: true,
      }),
    },
    {
      term: "Overtrading",
      meaning: "Taking more trades than your plan produces, out of boredom or a need for action.",
      spot: "Compare your trade count with the number of setups that met all your rules. The difference is overtrading.",
      caution:
        "Each extra trade pays spread and commission and dilutes your edge. Set a maximum number of trades per day.",
      visual: flow({
        nodes: [
          { label: "Boredom or need for action", tone: "warn" },
          { label: "Lower-quality setups" },
          {
            label: "Costs add up",
            note: "Spread and commission are paid on every trade, good or bad.",
          },
          { label: "Edge diluted", tone: "bear" },
        ],
      }),
    },
    {
      term: "Loss aversion and the disposition effect",
      meaning:
        "In studies, losses feel roughly twice as strong as equal gains (Kahneman and Tversky's prospect theory). In trading this shows up as the disposition effect: cutting winners early to feel relief and holding losers hoping to break even.",
      spot: "Check your journal: is your average winner smaller than your average loser even though your targets were bigger?",
      caution: "Pre-set stops and targets, and avoid watching every tick of an open trade.",
      visual: flow({
        nodes: [
          { label: "Losses hurt more than gains please", tone: "warn" },
          {
            label: "Winners closed early",
            note: "Taking profit relieves the fear of it disappearing.",
          },
          {
            label: "Losers held 'until it comes back'",
            note: "Closing would make the loss feel real.",
          },
          {
            label: "Small wins, big losses",
            note: "Negative expectancy even with a decent win rate.",
            tone: "bear",
          },
        ],
      }),
    },
    {
      term: "Outcome bias",
      aka: "results-oriented thinking",
      meaning:
        "Judging a decision by its result instead of by its quality. A good trade can lose and a bad trade can win; only many trades reveal whether a process works.",
      spot: "Grade every trade on process (did I follow the plan?) separately from outcome. ChartPilot's post-trade review asks exactly this.",
      caution: "The most dangerous trade is the bad-process win: it teaches you the wrong lesson.",
      visual: flow({
        layout: "grid",
        nodes: [
          { label: "Good process, win", note: "Deserved. Repeat the process.", tone: "bull" },
          {
            label: "Good process, loss",
            note: "Still a good trade. Losses are part of any edge.",
            tone: "bull",
          },
          {
            label: "Bad process, win",
            note: "Dangerous luck. It rewards a habit that will cost you later.",
            tone: "bear",
          },
          {
            label: "Bad process, loss",
            note: "Deserved lesson. Fix the process, not the market.",
            tone: "bear",
          },
        ],
      }),
    },
    {
      term: "Confirmation bias",
      meaning:
        "Noticing evidence that supports what you already believe and ignoring evidence against it.",
      spot: "Before entering, write the strongest case against the trade. If you can't, you haven't looked.",
      caution:
        "Your invalidation level is the antidote: decide in advance what would prove you wrong.",
      visual: flow({
        nodes: [
          { label: "Decide 'it's going up'", tone: "primary" },
          { label: "Notice only bullish clues" },
          {
            label: "Explain away the invalidation",
            note: "'It's just a wick', 'it'll come back'.",
          },
          { label: "Hold far too long", tone: "bear" },
        ],
      }),
    },
    {
      term: "Hindsight bias",
      meaning:
        "Once you know the outcome, the chart looks as if it was obvious all along. It wasn't.",
      spot: "Practise in Bar Replay, deciding before each new candle. It's the only honest way to test your reading.",
      caution: "Marked-up charts on social media are almost always drawn after the fact.",
      visual: scene({
        start: 55,
        items: [go(50, 5), k(50, 50.4, 47.5, 48, "amb"), go(49, 2), go(56, 5)],
        lines: [{ y: 48.6, label: "old low", labelAt: "start" }],
        steps: [
          {
            upTo: "amb",
            text: "Live: is this a sweep, or the start of a breakdown? From here, you can't know.",
          },
          {
            upTo: 99,
            text: "Afterwards it looks like an obvious sweep. That 'I knew it' feeling is hindsight bias.",
          },
        ],
      }),
    },
    {
      term: "Tilt and stop rules",
      meaning:
        "Tilt is trading while emotionally compromised: frustrated, rushed or overconfident. Stop rules end the session before tilt does damage.",
      spot: "Common rules: pause after two losses in a row; stop for the day at a daily loss limit (for example 2R); stop after a big win too.",
      caution:
        "Write the rules down before the session. Rules made in the moment get broken in the moment.",
      visual: flow({
        nodes: [
          { label: "Two losses in a row", tone: "warn" },
          {
            label: "Pause 30 minutes, step away",
            note: "Leave the screen. Come back only if the plan still makes sense.",
          },
          { label: "Daily loss limit hit (for example 2R)", tone: "bear" },
          {
            label: "Done for the day",
            note: "Close the platform. The market will be there tomorrow.",
          },
        ],
      }),
    },
    {
      term: "Journal and review loop",
      meaning:
        "Plan, trade, record, review, adjust. Improvement comes from the review step, where patterns in your own results show up.",
      spot: "Record the screenshot, the plan, the R result and the process grade for every trade. Review weekly, change one thing at a time.",
      tv: "Take chart snapshots with the camera icon in the top toolbar and save them to your ChartPilot journal.",
      caution: "A journal you never review is just a diary.",
      visual: flow({
        nodes: [
          {
            label: "Plan before the trade",
            note: "Bias, zone, entry, stop, targets, invalidation.",
            tone: "primary",
          },
          { label: "Execute the plan", note: "No changes mid-trade unless the plan said so." },
          { label: "Record it", note: "Screenshot, numbers, R result, process grade." },
          {
            label: "Review weekly",
            note: "Which setups and sessions make or lose R? Which mistakes repeat?",
          },
          {
            label: "Adjust one rule",
            note: "One change at a time, so you know what made the difference.",
            tone: "bull",
          },
        ],
        loop: true,
      }),
    },
  ],
};

export const CH_TV: BreakthroughChapter = {
  id: "bt-15-tradingview",
  title: "The TradingView toolkit",
  topic: "platform_basics",
  summary:
    "Bar Replay, drawing tools, the position tool, layouts, alerts, Pine Script, chart types and data feeds.",
  mistake:
    "Trusting a smooth strategy-tester equity curve without checking fills, costs and repainting.",
  terms: [
    {
      term: "Bar Replay",
      meaning:
        "Replays history candle by candle so you can practise decisions without seeing the future. It's the best way to test a setup by hand and to check whether an indicator repaints.",
      spot: "Decide before every step forward, and log your entries as if they were real.",
      tv: "Replay button in the top toolbar, then click the candle to start from. Available timeframes depend on your plan.",
      caution:
        "It's easy to cheat by peeking at the right side. Hide it by zooming in before you start.",
      visual: flow({
        nodes: [
          { label: "Top toolbar: Replay", tone: "primary" },
          { label: "Click the starting candle", note: "Everything to the right disappears." },
          { label: "Step one candle at a time", note: "Or press play and set the speed." },
          {
            label: "Decide before each step",
            note: "Write the entry, stop and target before revealing the next candle.",
          },
          { label: "Jump back to real time to exit", tone: "bull" },
        ],
      }),
    },
    {
      term: "Drawing tools worth knowing",
      meaning: "A handful of drawing tools cover almost everything in this lesson.",
      spot: "Keep one colour per meaning (for example green for bullish zones, red for bearish, amber for targets) and save it in a template.",
      tv: "Left toolbar. Magnet mode (the magnet icon) snaps drawings to candle highs, lows, opens and closes.",
      caution: "Delete old drawings. A cluttered chart makes every level look important.",
      visual: flow({
        layout: "grid",
        nodes: [
          { label: "Horizontal ray", note: "Levels: old highs and lows, opens, equilibrium." },
          { label: "Rectangle", note: "Zones: order blocks, fair value gaps, ranges." },
          { label: "Trend line and channel", note: "Slopes, wedges, flags, trendline liquidity." },
          { label: "Fib retracement", note: "Pullback levels, OTE, premium and discount." },
          {
            label: "Long and short position",
            note: "Entry, stop and target with the reward-to-risk shown.",
          },
          { label: "Text and notes", note: "Why you drew it. Future you will forget." },
        ],
      }),
    },
    {
      term: "Long and short position tool",
      meaning:
        "Draws the entry, stop and target as coloured boxes and shows the reward-to-risk, and, if you enter your account size and risk, the position size.",
      spot: "Drag the stop to your invalidation and the target to the next liquidity. If the ratio is below your minimum, skip the trade.",
      tv: "Left toolbar, forecasting and measurement tools, Long Position or Short Position. Settings hold account size and risk.",
      caution:
        "It's a planning drawing, not an order, unless your broker is connected and you place one.",
      visual: scene({
        start: 52,
        items: [go(48, 4), k(48, 50.5, 47.4, 50, "in"), go(54, 4), go(52, 2), go(57.2, 4)],
        zones: [
          { from: "in", top: 57, bottom: 50, tone: "bull", label: "target +2R" },
          { from: "in", top: 50, bottom: 46.5, tone: "bear", label: "stop −1R" },
        ],
        lines: [{ y: 50, from: "in", label: "entry", tone: "primary" }],
        steps: [
          {
            upTo: "in",
            text: "Entry at 50, stop at 46.5 (3.5 risk), target at 57 (7 reward): 2:1.",
          },
          {
            upTo: 99,
            text: "The tool shows the same thing as two boxes. Here the target was reached.",
          },
        ],
      }),
    },
    {
      term: "Multi-chart layouts and sync",
      meaning:
        "Several charts in one window, so you can read daily, 1-hour and 5-minute side by side. Symbol, interval, crosshair and time can be synced.",
      spot: "Read left to right: higher timeframe for direction, then the zone, then the trigger.",
      tv: "Layout icon in the top toolbar. The number of charts per layout depends on your plan.",
      caution: "More screens don't mean more edge. Two or three timeframes are enough.",
      visual: flow({
        nodes: [
          { label: "Choose a 2–4 chart layout", tone: "primary" },
          { label: "Set daily, 1H and 5M" },
          {
            label: "Sync symbol, crosshair and time",
            note: "Moving the crosshair on one chart shows the same moment on the others.",
          },
          { label: "Read top-down, left to right", tone: "bull" },
        ],
      }),
    },
    {
      term: "Alerts",
      meaning:
        "Notifications when price, an indicator or a drawing meets a condition, sent to the app, email, a pop-up or a webhook.",
      spot: "Set alerts where your plan starts (the sweep level, the edge of your zone) so you don't have to watch the screen.",
      tv: "Right-click the chart and choose Add alert, or press Alt+A. The trigger setting 'Once Per Bar Close' ignores wick pokes. Alert numbers and webhooks depend on your plan.",
      caution: "An alert is a reason to look, not a reason to enter.",
      visual: flow({
        nodes: [
          { label: "Add alert at your level (Alt+A)", tone: "primary" },
          { label: "Condition: crossing, or close above/below" },
          {
            label: "Trigger: once per bar close",
            note: "Fires only after the candle closes, so a quick wick through the level doesn't wake you up.",
          },
          { label: "Notification: app, email, webhook" },
          {
            label: "When it fires: check the plan",
            note: "Is the setup there? If not, do nothing.",
            tone: "bull",
          },
        ],
      }),
    },
    {
      term: "Pine Script and the Strategy Tester",
      meaning:
        "Pine Script is TradingView's programming language for indicators and strategies. The Strategy Tester runs a strategy on history and reports net profit, drawdown, win rate and the full trade list.",
      spot: "Set commission and slippage in the strategy's properties before reading any result.",
      tv: "Pine Editor and Strategy Tester tabs at the bottom of the chart.",
      caution:
        "Backtests can look great because of unrealistic fills, missing costs, repainting or look-ahead (using data that wasn't available at the time).",
      visual: flow({
        nodes: [
          { label: "Write or load a strategy", tone: "primary" },
          {
            label: "Set commission and slippage",
            note: "Zero costs make almost any scalping strategy look profitable.",
          },
          {
            label: "Check for repainting and look-ahead",
            note: "Watch signals in Bar Replay. Signals that move or appear late invalidate the backtest.",
          },
          {
            label: "Read drawdown and trade count, not just profit",
            note: "A small number of trades is the same sample-size problem as in your journal.",
          },
          { label: "Forward-test before trusting it", tone: "bull" },
        ],
      }),
    },
    {
      term: "Chart types",
      aka: "candles, Heikin Ashi, Renko, line",
      meaning:
        "Candlesticks show real open, high, low and close. Heikin Ashi averages them into smoother candles. Renko draws fixed-size bricks and ignores time. Line charts join the closes.",
      spot: "Use regular candles for everything in this lesson. Heikin Ashi can make trends easier to see, but its opens and closes are calculated averages, not prices you could have traded.",
      tv: "Chart type menu in the top toolbar.",
      caution: "Never place entries or stops from Heikin Ashi or Renko prices.",
      visual: scene({
        items: [
          ...HA_BASE.map((c) => k(c.o, c.h, c.l, c.c)),
          ...HA_CANDLES.map((c) => k(c.o, c.h, c.l, c.c)),
        ],
        zones: [
          { from: 0, to: HA_BASE.length - 1, top: 61, bottom: 60, tone: "muted", label: "candles" },
          { from: HA_BASE.length, top: 61, bottom: 60, tone: "primary", label: "Heikin Ashi" },
        ],
        steps: [
          { upTo: HA_BASE.length - 1, text: "Normal candles for a small up-down-up path." },
          {
            upTo: 99,
            text: "The same path in Heikin Ashi: smoother and fewer colour flips, but the prices are averages.",
          },
        ],
      }),
    },
    {
      term: "Data feeds and time zones",
      meaning:
        "TradingView shows prices from the data provider you pick; MetaTrader shows your broker's own feed. They can differ by a few pips, and each may start the trading day at a different time.",
      spot: "Draw your final levels on the feed you actually trade, or check the difference first. Set the chart time zone so session times line up with your plan.",
      tv: "Change the time zone from the clock label at the bottom right of the chart. Pick a symbol from your broker if it's listed.",
      caution: "A sweep on one feed can be a near-miss on another.",
      visual: flow({
        nodes: [
          { label: "TradingView symbol from provider A", tone: "primary" },
          {
            label: "MT5 symbol from your broker",
            note: "Different liquidity providers and markups mean slightly different prices.",
          },
          {
            label: "Prices can differ by a few pips",
            note: "Highs, lows and 'yesterday's high' may not match exactly.",
            tone: "warn",
          },
          { label: "Mark final levels on the feed you trade", tone: "bull" },
        ],
      }),
    },
    {
      term: "Auto-SMC indicators",
      meaning:
        "Community indicators that draw BOS, CHoCH, order blocks and gaps automatically. They're algorithms with settings such as swing length, so different settings draw different maps of the same chart.",
      spot: "Use them to check your own marking, not to replace it. Note that swing-based labels appear only after the swing is confirmed, several candles later.",
      tv: "Indicators, search 'smart money concepts'. Open the settings and note the swing length.",
      caution:
        "Labels drawn back in time make the indicator look smarter on history than it is live.",
      visual: scene({
        start: 48,
        items: [go(56, 4), k(56, 58, 55.5, 57, "pivot"), go(52, 5, "conf"), go(50, 2)],
        marks: [
          {
            at: "pivot",
            y: 58,
            text: "label appears late",
            dir: "down",
            tone: "primary",
            appear: "conf",
          },
        ],
        steps: [
          { upTo: "pivot", text: "Live: the high prints. No label yet." },
          {
            upTo: "conf",
            text: "Five candles later the swing is confirmed and the indicator draws its label back on the high.",
          },
          {
            upTo: 99,
            text: "On history it looks as if the indicator knew. Live, it told you five candles late.",
          },
        ],
      }),
    },
  ],
};
