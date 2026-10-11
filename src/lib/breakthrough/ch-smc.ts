/**
 * Breakthrough chapters 1–6: smart-money concepts in depth.
 * Definitions follow common ICT/SMC teaching; where teachers disagree, the text says so.
 */
import { go, k } from "./scene";
import { clock, flow, scene, type BreakthroughChapter } from "./types";

export const CH_ZONES: BreakthroughChapter = {
  id: "bt-01-zones",
  title: "Zones: order blocks, breakers and gaps",
  topic: "fvg",
  summary: "The zones smart-money traders mark, and the rules that make one worth watching.",
  mistake:
    "Marking every last opposite candle as an order block and trading the first touch, instead of requiring a sweep, a structure break and an untouched zone.",
  terms: [
    {
      term: "Order block",
      aka: "OB",
      meaning:
        "The last opposite-coloured candle before a strong move that breaks structure. A bullish OB is the last down candle before a sharp rally; a bearish OB is the last up candle before a sharp drop.",
      spot: "Three things must be present: the candle sits at the very start of the move, the move after it is displacement (big, fast candles), and that move closes beyond a recent swing. Some traders mark only the body, others the whole candle with wicks. Pick one rule and keep it.",
      tv: "Draw a Rectangle from the candle's open to its low (bullish) or high (bearish) and extend it to the right. Give bullish and bearish zones different colours.",
      caution:
        "Every move has a last opposite candle, so most order blocks you could draw are noise. Only the ones that also took liquidity and broke structure deserve attention, and none of them is a guaranteed bounce.",
      visual: scene({
        start: 70,
        items: [
          go(60, 4),
          k(60, 64.8, 59.6, 64.2, "pb"),
          go(55, 3, "d2"),
          k(55, 55.6, 51.5, 52.5, "ob"),
          k(52.5, 60, 52.2, 59.6, "disp1"),
          k(59.6, 67, 59.3, 66.6, "disp2"),
          go(68, 2),
          go(55.5, 3, "ret"),
          go(66, 4),
        ],
        zones: [{ from: "ob", top: 55, bottom: 52.5, tone: "bull", label: "OB", appear: "disp2" }],
        lines: [{ y: 64.8, from: "pb", to: "disp2", label: "swing high" }],
        marks: [
          { at: "disp2", y: 67, text: "BOS", dir: "down", tone: "primary" },
          { at: "ret", y: 55.2, text: "retest", dir: "up", tone: "bull", appear: "ret" },
        ],
        steps: [
          { upTo: "d2", text: "Price is falling and keeps making new lows." },
          { upTo: "ob", text: "This last down candle is the one to remember." },
          {
            upTo: "disp2",
            text: "Two big up candles break the last swing high: displacement plus a break of structure. Now that down candle counts as a bullish order block.",
          },
          {
            upTo: "ret",
            text: "Price comes back into the zone. A plan would look for an entry here, with the stop below the zone.",
          },
          {
            upTo: 99,
            text: "This time it held. It doesn't always, which is exactly why the stop exists.",
          },
        ],
      }),
    },
    {
      term: "Mitigated vs unmitigated",
      aka: "used vs fresh zones",
      meaning:
        "A zone is mitigated once price has come back and traded into it. An unmitigated zone has not been revisited yet. Fresh zones are the ones traders wait for.",
      spot: "Scan from the zone to the right edge of the chart. If any candle has already traded into it, mark it as used.",
      tv: "Shorten or delete a rectangle once it is touched, so the chart only shows fresh zones.",
      caution:
        "Used zones can still react, but treat a second or third touch as weaker evidence than the first. That is a chart-reading habit, not a measured law.",
      visual: scene({
        items: [
          k(42.5, 43, 39.5, 40, "a"),
          k(40, 47, 39.8, 46.6),
          go(52, 3),
          k(52, 52.5, 49, 49.5, "b"),
          k(49.5, 57, 49.3, 56.6),
          go(61, 3),
          go(50.6, 4, "dip"),
          go(63, 4),
        ],
        zones: [
          { from: "a", top: 42.5, bottom: 40, tone: "bull", label: "Zone A" },
          { from: "b", top: 52, bottom: 49.5, tone: "bull", label: "Zone B" },
        ],
        marks: [{ at: "dip", y: 50.4, text: "B touched", dir: "up", tone: "warn" }],
        steps: [
          { upTo: 11, text: "Two bullish zones form on the way up. Both are fresh." },
          { upTo: "dip", text: "Price dips into zone B. B is now mitigated (used)." },
          {
            upTo: 99,
            text: "Zone A was never touched, so it stays fresh: the better candidate if price ever comes that low.",
          },
        ],
      }),
    },
    {
      term: "Breaker block",
      meaning:
        "An order block that failed and flipped. A bullish OB that price smashes through, after first sweeping a high, becomes a bearish breaker: when price comes back up into it, sellers may defend it.",
      spot: "Sequence: (1) price takes liquidity beyond the old high, (2) it falls through the old OB and breaks structure, (3) it retraces back into that broken zone. Without steps 1 and 2 it is just a broken zone.",
      tv: "Keep the old OB rectangle, change its colour once the break prints, and add a text label 'breaker' so you remember which way it now points.",
      caution:
        "It is the old 'broken support becomes resistance' idea with SMC vocabulary. Treat it as a conditional zone, not a signal.",
      visual: scene({
        start: 40,
        items: [
          go(48, 3),
          k(48, 48.5, 45, 45.5, "ob"),
          k(45.5, 53, 45.2, 52.6),
          k(52.6, 56, 52.2, 55.4, "h1"),
          go(52, 2),
          k(52, 58, 51.6, 57.4, "sweep"),
          k(57.4, 57.8, 51, 51.4),
          go(43, 3, "mss"),
          go(47.5, 3, "retest"),
          go(39, 4),
        ],
        zones: [
          { from: "ob", to: "mss", top: 48, bottom: 45.5, tone: "bull", label: "OB" },
          { from: "mss", top: 48, bottom: 45.5, tone: "bear", label: "Breaker" },
        ],
        lines: [{ y: 56, from: "h1", to: "sweep", label: "old high" }],
        marks: [
          { at: "sweep", y: 58, text: "sweep", dir: "down", tone: "warn" },
          { at: "mss", y: 43, text: "MSS", dir: "up", tone: "bear" },
        ],
        steps: [
          { upTo: "h1", text: "An uptrend leaves a bullish order block behind." },
          {
            upTo: "sweep",
            text: "Price pokes above the old high and takes the stops resting there.",
          },
          {
            upTo: "mss",
            text: "Then it falls straight through the order block and breaks the last higher low. The OB has failed.",
          },
          {
            upTo: "retest",
            text: "Price climbs back into the failed zone from below. Old support, now a bearish breaker.",
          },
          { upTo: 99, text: "Sellers defended it this time." },
        ],
      }),
    },
    {
      term: "Mitigation block",
      meaning:
        "A cousin of the breaker. In a breaker, price first takes the liquidity beyond the old extreme, then breaks structure. In a mitigation block, price fails to reach that extreme (it makes a lower high instead), then breaks structure, and the failed zone is marked.",
      spot: "Look for the failure to make a new extreme before the break. If the extreme was swept, call it a breaker instead.",
      tv: "Same drawing as a breaker. Label it so your journal can compare the two.",
      caution:
        "Naming differs between teachers. What matters is that you write down the sequence you saw, not the label.",
      visual: scene({
        start: 40,
        items: [
          go(48, 3),
          k(48, 48.5, 45, 45.5, "ob"),
          k(45.5, 53, 45.2, 52.6),
          k(52.6, 56, 52.2, 55.4, "h1"),
          go(51, 2),
          k(51, 54.2, 50.7, 53.6, "lh"),
          go(43, 4, "mss"),
          go(47.5, 3, "retest"),
          go(39, 4),
        ],
        zones: [
          { from: "ob", to: "mss", top: 48, bottom: 45.5, tone: "bull", label: "OB" },
          { from: "mss", top: 48, bottom: 45.5, tone: "bear", label: "Mitigation" },
        ],
        lines: [{ y: 56, from: "h1", label: "old high, not taken" }],
        marks: [{ at: "lh", y: 50.7, text: "lower high", dir: "up", tone: "warn" }],
        steps: [
          { upTo: "h1", text: "Same start: an uptrend with a bullish order block." },
          {
            upTo: "lh",
            text: "This time price fails to reach the old high. It prints a lower high: no liquidity taken.",
          },
          { upTo: "mss", text: "Then it breaks down through the order block." },
          { upTo: 99, text: "The retest of the failed zone is the mitigation block." },
        ],
      }),
    },
    {
      term: "Fair value gap anatomy",
      aka: "FVG, imbalance, consequent encroachment (CE)",
      meaning:
        "A fair value gap is a three-candle pattern where the wicks of candle 1 and candle 3 don't overlap. It has a top edge, a bottom edge and a midpoint called consequent encroachment (CE), the 50% level.",
      spot: "Measure the gap between candle 1's wick and candle 3's wick. Mark CE as a dotted line. Afterwards, note whether price reacted at the CE, filled the whole gap, or ignored it.",
      tv: "Rectangle for the gap plus a horizontal ray at the midpoint. Community FVG indicators automate this; check their minimum gap size setting.",
      caution:
        "On low timeframes tiny gaps appear constantly. Filter by size (for example, bigger than a fraction of ATR) or you will mark noise.",
      visual: scene({
        start: 46,
        items: [
          go(50, 3),
          k(50, 51.5, 49.5, 51, "c1"),
          k(51, 58, 50.8, 57.5),
          k(57.5, 59.5, 55, 59, "c3"),
          go(61, 2),
          go(53.4, 3, "ce"),
          go(62, 4),
        ],
        zones: [{ from: "c1", top: 55, bottom: 51.5, tone: "bull", label: "FVG", appear: "c3" }],
        lines: [{ y: 53.25, from: "c1", label: "CE 50%", appear: "c3" }],
        marks: [{ at: "ce", y: 53.25, text: "CE tap", dir: "up", tone: "bull" }],
        steps: [
          { upTo: "c1", text: "Candle 1. Note its high." },
          {
            upTo: "c3",
            text: "Candle 2 sprints up. Candle 3's low stays above candle 1's high. The space between is the gap.",
          },
          {
            upTo: "ce",
            text: "Price returns and reacts right at the midpoint: consequent encroachment.",
          },
          {
            upTo: 99,
            text: "The gap held. A body close below its bottom edge would have meant it failed.",
          },
        ],
      }),
    },
    {
      term: "Inversion fair value gap",
      aka: "IFVG",
      meaning:
        "A fair value gap that price closes straight through with a candle body. After that, it flips role: a failed bearish gap can act as support on a retest from above, and the reverse.",
      spot: "Wait for a body close through the whole gap, not a wick poke. Then watch the retest from the other side.",
      tv: "Keep the original rectangle, recolour it after the body close, and label it IFVG.",
      caution:
        "It behaves like a breaker for gaps. Judge it with the same patience: the flip is a hypothesis until the retest holds.",
      visual: scene({
        start: 62,
        items: [
          go(58, 2),
          k(58, 58.5, 56, 56.5, "c1"),
          k(56.5, 57, 50, 50.5),
          k(50.5, 53, 49.5, 52.5, "c3"),
          go(49, 2),
          go(54.5, 2),
          k(54.5, 59, 54, 58.5, "close"),
          go(61, 2),
          go(56.6, 3, "retest"),
          go(64, 3),
        ],
        zones: [
          {
            from: "c1",
            to: "close",
            top: 56,
            bottom: 53,
            tone: "bear",
            label: "FVG",
            appear: "c3",
          },
          { from: "close", top: 56, bottom: 53, tone: "bull", label: "IFVG" },
        ],
        marks: [{ at: "close", y: 59, text: "body close", dir: "down", tone: "primary" }],
        steps: [
          { upTo: "c3", text: "A fast drop leaves a bearish fair value gap." },
          {
            upTo: "close",
            text: "Later, one candle closes its body above the whole gap. The gap has failed.",
          },
          {
            upTo: "retest",
            text: "Price returns to it from above. What was resistance is now tested as support.",
          },
          { upTo: 99, text: "It held: an inversion fair value gap." },
        ],
      }),
    },
    {
      term: "Balanced price range",
      aka: "BPR",
      meaning:
        "The overlap between a bearish and a bullish fair value gap that form close together in opposite directions. Only the shared band counts. Traders treat it as a stronger reaction zone because both sides left an imbalance there.",
      spot: "Find a gap from a fast drop and a gap from a fast rally that share some price. The BPR is the overlap only.",
      tv: "Draw both gaps, then a third rectangle over the overlap and delete the other two once you've marked it.",
      caution: "Rare and often tiny. Don't hunt for it; recognise it when it shows up.",
      visual: scene({
        items: [
          k(60, 60.5, 58, 58.5, "a1"),
          k(58.5, 59, 52, 52.5),
          k(52.5, 55, 51.5, 54.5, "a3"),
          k(54.5, 55, 51, 51.5, "b1"),
          k(51.5, 60, 51.3, 59.5),
          k(59.5, 61, 57, 60.5, "b3"),
          go(62, 2),
          go(56, 3, "ret"),
          go(64, 3),
        ],
        zones: [
          { from: "a1", to: "b3", top: 58, bottom: 55, tone: "bear", label: "Gap 1", appear: "a3" },
          { from: "b1", to: "b3", top: 57, bottom: 55, tone: "bull", appear: "b3" },
          { from: "b3", top: 57, bottom: 55, tone: "primary", label: "BPR" },
        ],
        marks: [{ at: "ret", y: 55.8, text: "reaction", dir: "up", tone: "bull" }],
        steps: [
          { upTo: "a3", text: "A fast drop leaves a bearish gap (gap 1)." },
          { upTo: "b3", text: "Right after, a fast rally leaves a bullish gap that overlaps it." },
          { upTo: "ret", text: "The overlap is the balanced price range. Price returns into it." },
          { upTo: 99, text: "And reacts." },
        ],
      }),
    },
    {
      term: "Liquidity void and volume imbalance",
      meaning:
        "A liquidity void is a run of one-way candles with almost no overlap: a stretch of price traded only once, quickly. A volume imbalance is smaller: two candle bodies don't overlap even though their wicks touch.",
      spot: "A void looks like a clean ladder of same-colour candles. A volume imbalance is a body-to-body gap with overlapping wicks, common at session opens and after fast candles.",
      tv: "Shade the void with a rectangle from the first candle's open to the last candle's close.",
      caution:
        "Fast moves happen after news too. A void is context for where price may revisit, not a target by itself.",
      visual: scene({
        start: 40,
        items: [
          go(42, 3),
          k(42, 46, 41.8, 45.8, "v1"),
          k(45.8, 50, 45.6, 49.8),
          k(49.8, 54.5, 49.6, 54.3),
          k(54.3, 58.6, 54.1, 58.4),
          k(58.4, 62, 58.2, 61.8, "v5"),
          k(62.4, 64, 61.6, 63.6, "vi"),
          go(64, 1),
          go(51, 5, "back"),
          go(58, 3),
        ],
        zones: [
          {
            from: "v1",
            to: "v5",
            top: 61.8,
            bottom: 42,
            tone: "primary",
            label: "Void",
            appear: "v5",
          },
          { from: "vi", top: 62.4, bottom: 61.8, tone: "warn", label: "VI", appear: "vi" },
        ],
        marks: [{ at: "back", y: 51, text: "revisit", dir: "up", tone: "bull" }],
        steps: [
          {
            upTo: "v5",
            text: "Five candles in a row, each starting where the last one ended: a liquidity void.",
          },
          {
            upTo: "vi",
            text: "Next candle's body opens above the last close while the wicks still touch: a volume imbalance (VI).",
          },
          { upTo: "back", text: "Price later comes back into the thinly traded stretch." },
          { upTo: 99, text: "And finds buyers there. Not guaranteed, but common enough to watch." },
        ],
      }),
    },
  ],
};

export const CH_LIQUIDITY: BreakthroughChapter = {
  id: "bt-02-liquidity",
  title: "Liquidity, deeper",
  topic: "liquidity",
  summary: "Where orders likely rest, how price is pulled toward them, and the traps around them.",
  mistake:
    "Calling every wick past a level a sweep and entering before the reclaim candle has closed.",
  terms: [
    {
      term: "Internal vs external range liquidity",
      aka: "IRL / ERL",
      meaning:
        "External range liquidity sits beyond the edges of the current range: stops above the high and below the low. Internal range liquidity sits inside: gaps, order blocks and other unfilled zones. Price is often described as travelling from one to the other.",
      spot: "Draw the range from its major high to its major low. Everything outside the edges is external; the gaps and zones in between are internal.",
      caution: "A framing tool. It helps answer 'where is price likely heading next', not 'when'.",
      visual: scene({
        start: 55,
        items: [
          k(55, 70.4, 54.6, 69.8, "rh"),
          go(48, 3),
          go(58, 3),
          go(41, 3),
          k(41, 41.4, 38.6, 40.2, "sweep"),
          k(40.2, 47, 40, 46.6),
          go(53.4, 3, "irl"),
          go(49, 2),
          go(71, 5, "erl"),
        ],
        zones: [{ from: 4, top: 55, bottom: 52, tone: "primary", label: "IRL (gap)" }],
        lines: [
          { y: 70.4, label: "ERL high" },
          { y: 39.6, label: "ERL low" },
        ],
        marks: [{ at: "sweep", y: 38.6, text: "ERL taken", dir: "up", tone: "warn" }],
        steps: [
          {
            upTo: 9,
            text: "A range forms. Stops rest beyond its high and low (external). An unfilled gap sits inside (internal).",
          },
          { upTo: "sweep", text: "Price takes the external low first." },
          { upTo: "irl", text: "Then it travels up to the internal gap." },
          { upTo: 99, text: "And on to the external high. External, internal, external." },
        ],
      }),
    },
    {
      term: "Draw on liquidity",
      aka: "DOL",
      meaning:
        "The level price seems pulled toward next: yesterday's high, a set of equal lows, an unfilled gap. It is your answer to 'where is this most likely going?'",
      spot: "Write your draw in one sentence before you look for an entry: 'The draw is yesterday's high.' If you can't name one, there's no trade yet.",
      tv: "Mark the draw with a horizontal ray in a colour you only use for targets.",
      caution:
        "A draw stated in advance is a plan. A draw named after the move is a story. Only the first one teaches you anything.",
      visual: scene({
        start: 50,
        items: [go(60, 4, "pdh"), go(48, 5), go(55, 3, "now"), go(61, 4, "hit")],
        lines: [{ y: 60.6, from: "pdh", label: "draw: yesterday's high", tone: "primary" }],
        steps: [
          { upTo: 8, text: "Before today's move, write it down: 'The draw is yesterday's high.'" },
          { upTo: "now", text: "Price starts heading up." },
          {
            upTo: 99,
            text: "It reaches the draw. Because you wrote it first, this counts as a plan, not hindsight.",
          },
        ],
      }),
    },
    {
      term: "Equal highs and equal lows",
      aka: "EQH / EQL, relative equal highs",
      meaning:
        "Two or more swing highs (or lows) at nearly the same price. 'Relative' equal means close, not identical. Traders who trade double tops place stops just beyond them, which makes them a clean pool of liquidity.",
      spot: "Use a tolerance (for example a small fraction of ATR) instead of eyeballing. Three touches make a more obvious pool than two.",
      tv: "Horizontal ray across the highs. Some community SMC indicators label equal highs and lows with a threshold setting.",
      caution:
        "Once a pool has been swept it is gone. Don't keep targeting a level that was cleared two sessions ago.",
      visual: scene({
        start: 50,
        items: [
          go(59.5, 3),
          k(59.5, 60.2, 57.5, 58, "h1"),
          go(54, 2),
          go(59.6, 3),
          k(59.6, 60.1, 57.8, 58.2, "h2"),
          go(55, 2),
          go(59.4, 2),
          k(59.4, 60.25, 57.6, 58, "h3"),
          go(56, 2),
          k(56, 61.8, 55.8, 59, "spike"),
          k(59, 59.3, 54, 54.5),
          go(49, 3),
        ],
        lines: [{ y: 60.2, from: "h1", to: "spike" }],
        marks: [
          { at: "h1", y: 60.2, text: "1" },
          { at: "h2", y: 60.2, text: "2" },
          { at: "h3", y: 60.2, text: "3" },
          { at: "spike", y: 61.8, text: "stops taken", dir: "down", tone: "warn" },
        ],
        steps: [
          {
            upTo: "h3",
            text: "Three highs at almost the same price. Everyone can see them, so stops pile up just above.",
          },
          {
            upTo: "spike",
            text: "Price spikes through, fills those stops, and closes back below.",
          },
          { upTo: 99, text: "The pool is used. Price drops away." },
        ],
      }),
    },
    {
      term: "Previous day, week and month highs and lows",
      aka: "PDH / PDL, PWH / PWL, PMH / PML",
      meaning:
        "The high and low of the previous period. Every trader sees them, so they hold resting orders and often act as targets or sweep points.",
      spot: "Mark them at the start of each day or week. Note which ones were already taken; the untaken ones are the live candidates.",
      tv: "Built-in or community 'previous day high/low' indicators draw them automatically. Many forex feeds roll the day at 17:00 New York time; check where your feed starts the day.",
      caution:
        "Different brokers start the day at different times, so 'yesterday's high' can differ between TradingView and MetaTrader.",
      visual: scene({
        start: 50,
        items: [
          go(57.2, 5, "d1h"),
          go(46, 5, "d1l"),
          go(52, 3, "today"),
          go(45, 2, "swp"),
          k(45, 51, 44.6, 50.5),
          go(57.6, 5, "pdh"),
        ],
        lines: [
          { y: 62, label: "PWH (not reached)" },
          { y: 57.6, label: "PDH" },
          { y: 45.6, label: "PDL" },
        ],
        marks: [{ at: "swp", y: 44.8, text: "PDL swept", dir: "up", tone: "warn" }],
        steps: [
          {
            upTo: "d1l",
            text: "Yesterday: its high (PDH) and low (PDL) are marked. Last week's high (PWH) is higher still.",
          },
          {
            upTo: "swp",
            text: "Today, price first dips under yesterday's low and takes the stops there.",
          },
          {
            upTo: 99,
            text: "Then it runs to yesterday's high. Last week's high is the next pool if it keeps going.",
          },
        ],
      }),
    },
    {
      term: "Inducement",
      aka: "IDM",
      meaning:
        "A small pullback low (or high) that forms in front of the real zone and lures early entries. Price often takes it, stopping those traders out, before tapping the real point of interest.",
      spot: "Between the structure break and the zone you want, find the nearest minor swing. If price takes it and then taps your zone, that's the pattern.",
      tv: "Mark the minor swing with a short horizontal ray labelled IDM.",
      caution:
        "Almost any small swing can be called inducement after the fact. Name it before price gets there or don't count it.",
      visual: scene({
        start: 40,
        items: [
          go(44, 2),
          k(44, 44.5, 41, 41.5, "ob"),
          k(41.5, 50, 41.3, 49.5),
          go(54, 2, "bos"),
          k(54, 54.3, 50.2, 50.6, "idm"),
          go(53, 2),
          go(49.4, 2, "take"),
          go(43.6, 3, "tap"),
          go(58, 5),
        ],
        zones: [{ from: "ob", top: 44, bottom: 41.5, tone: "bull", label: "OB", appear: "bos" }],
        lines: [{ y: 50.2, from: "idm", to: "take", label: "IDM", tone: "warn" }],
        marks: [{ at: "tap", y: 43.6, text: "real zone", dir: "up", tone: "bull" }],
        steps: [
          { upTo: "bos", text: "A bullish break leaves an order block lower down." },
          {
            upTo: "idm",
            text: "A small pullback low forms above the OB. Early buyers enter here with stops under it.",
          },
          {
            upTo: "take",
            text: "Price takes that small low: the inducement. Early buyers are stopped out.",
          },
          { upTo: 99, text: "Then price taps the real zone and moves." },
        ],
      }),
    },
    {
      term: "Sweep vs run",
      aka: "stop hunt, raid, breakout",
      meaning:
        "A sweep takes the orders beyond a level and closes back inside. A run (a real breakout) takes them and stays beyond. 'Stop hunt' is an emotional label people use for either.",
      spot: "After price passes the level, watch the next one to three closes. Back inside means sweep. Holding beyond means run. The closes decide, not the wick.",
      caution:
        "The same first candle can become either one. Deciding before the close is guessing.",
      visual: scene({
        start: 52,
        items: [
          go(59.4, 3),
          k(59.4, 61.5, 58, 59, "sw"),
          go(54, 3),
          go(59.5, 3),
          k(59.5, 63, 59.2, 62.5, "run"),
          go(64, 2),
          go(61, 2, "hold"),
          go(67, 3),
        ],
        lines: [{ y: 60, label: "level" }],
        marks: [
          { at: "sw", y: 61.5, text: "sweep", dir: "down", tone: "warn" },
          { at: "hold", y: 60.8, text: "holds", dir: "up", tone: "bull" },
        ],
        steps: [
          {
            upTo: "sw",
            text: "First try: a wick above the level, but the close is back below. That's a sweep.",
          },
          { upTo: "run", text: "Second try: the candle closes above the level." },
          { upTo: 99, text: "It retests and holds above. That's a run, a real break." },
        ],
      }),
    },
    {
      term: "Turtle soup",
      meaning:
        "A false-breakout pattern named by Linda Raschke and Larry Connors as a play on the famous Turtle traders, who bought 20-day breakouts. Turtle soup fades the breakout that fails: a new 20-day low that quickly closes back above the old low. In SMC circles the name is used for any sweep-and-reverse at an obvious level.",
      spot: "Price makes a new low beyond an obvious prior low, then closes back above it within a candle or two.",
      tv: "The built-in Donchian Channels indicator (length 20) shows the 20-bar high and low.",
      caution:
        "Strong trends break levels and keep going. The reclaim close is the whole point; without it, it's just a breakout.",
      visual: scene({
        start: 55,
        items: [
          go(46, 4),
          go(53, 4),
          k(46.2, 46.6, 45.2, 45.6, "prior"),
          go(51, 3),
          go(46.4, 3),
          k(46.4, 46.8, 42.6, 43.6, "new"),
          k(43.6, 47.6, 43.3, 47.1, "back"),
          go(55, 4),
        ],
        lines: [{ y: 45.2, from: "prior", to: "back", label: "20-bar low" }],
        marks: [
          { at: "new", y: 42.6, text: "new low", dir: "up", tone: "warn" },
          { at: "back", y: 47.6, text: "reclaimed", dir: "down", tone: "bull" },
        ],
        steps: [
          { upTo: "prior", text: "An obvious low forms." },
          {
            upTo: "new",
            text: "Price breaks below it to a fresh 20-bar low. Breakout sellers jump in.",
          },
          {
            upTo: "back",
            text: "The next candle closes back above the old low. The breakout failed.",
          },
          { upTo: 99, text: "Turtle soup: the failed break fuels the move the other way." },
        ],
      }),
    },
    {
      term: "Judas swing",
      meaning:
        "A false move at a session or day open that goes against the day's eventual direction, then reverses. Named after the betrayal story because the first move misleads.",
      spot: "Mark the open (for example, midnight New York). Watch the first push away from it toward an obvious level, then look for the sweep and a structure shift back the other way.",
      tv: "Horizontal ray at the open price, plus your session shading.",
      caution:
        "It belongs to the same family as 'manipulation' in AMD: a pattern candidate, never a certainty. Plenty of days simply trend from the open.",
      visual: scene({
        start: 50,
        items: [
          go(52, 3),
          k(52, 52.4, 51.6, 52, "open"),
          go(48.2, 3),
          k(48.2, 48.4, 46.5, 47, "sw"),
          k(47, 51, 46.8, 50.6),
          go(53.5, 2),
          go(58, 4),
        ],
        lines: [{ y: 52, from: "open", label: "midnight open" }],
        marks: [
          { at: "sw", y: 46.5, text: "Judas low", dir: "up", tone: "warn" },
          { at: 13, y: 58.4, text: "real move", dir: "down", tone: "bull" },
        ],
        steps: [
          { upTo: "open", text: "The day opens here." },
          {
            upTo: "sw",
            text: "The first move is down, below the open, taking stops under a nearby low.",
          },
          {
            upTo: 99,
            text: "Then price reverses through the open and makes the day's real move up.",
          },
        ],
      }),
    },
  ],
};

export const CH_STRUCTURE: BreakthroughChapter = {
  id: "bt-03-structure",
  title: "Structure and the dealing range",
  topic: "market_structure",
  summary: "Swings, internal vs swing structure, CHoCH, CISD, and premium vs discount.",
  mistake:
    "Reading a lower-timeframe CHoCH as a trend reversal while the higher-timeframe structure hasn't changed at all.",
  terms: [
    {
      term: "Swing points and fractals",
      meaning:
        "A swing high is a candle whose high is higher than the N candles on each side; a swing low is the mirror. Bill Williams' fractal uses two candles on each side, a five-candle pattern. Many SMC indicators let you choose a bigger N.",
      spot: "A bigger N gives fewer, more important swings, but they are confirmed later. 'Confirmed' means N candles have already printed after the swing.",
      tv: "Williams Fractals is a built-in indicator. Community SMC indicators call this setting 'swing length'.",
      caution:
        "Every pivot label arrives N candles late. That's why marked-up screenshots look so much cleaner than live trading.",
      visual: scene({
        items: [
          k(48, 50, 47, 49.5),
          k(49.5, 52, 49, 51.5),
          k(51.5, 55, 51, 53, "pivot"),
          k(53, 53.5, 50.5, 51),
          k(51, 51.8, 49, 49.5, "r2"),
          go(45, 3),
          go(45.2, 2),
          k(45, 45.5, 42, 43.5, "lp"),
          k(43.5, 46, 43.2, 45.6),
          k(45.6, 47.5, 44.6, 47, "lpc"),
        ],
        marks: [
          { at: "pivot", y: 55, text: "swing high", dir: "down", tone: "primary", appear: "r2" },
          { at: "lp", y: 42, text: "swing low", dir: "up", tone: "primary", appear: "lpc" },
        ],
        steps: [
          {
            upTo: "pivot",
            text: "This high is the highest so far, but it isn't a swing high yet.",
          },
          {
            upTo: "r2",
            text: "Two lower highs print after it. Now it's confirmed: a five-candle fractal.",
          },
          { upTo: 99, text: "Same for lows. Notice the label always arrives two candles late." },
        ],
      }),
    },
    {
      term: "Internal vs swing structure",
      aka: "minor vs major structure",
      meaning:
        "Swing structure uses the bigger pivots; internal structure uses the small ones inside them. Internal breaks happen often and give early hints. Swing breaks are rarer and carry more weight.",
      spot: "If internal structure turns against the swing structure, you're most likely in a pullback inside the bigger trend, not a reversal.",
      tv: "Community SMC indicators draw both, often with internal labels smaller or dashed.",
      caution: "Mixing the two is the most common way to 'see' a reversal that isn't there.",
      visual: scene({
        start: 40,
        items: [
          go(55, 5),
          k(55, 55.4, 47.6, 48, "sl1"),
          go(65, 5),
          k(65, 65.3, 61, 61.4, "i1"),
          go(63.5, 2),
          go(58.6, 2, "ibrk"),
          go(72, 5),
        ],
        lines: [
          { y: 47.6, from: "sl1", label: "swing low", tone: "bull" },
          { y: 61, from: "i1", to: "ibrk", label: "internal low" },
        ],
        marks: [{ at: "ibrk", y: 58.6, text: "internal break", dir: "up", tone: "warn" }],
        steps: [
          { upTo: "i1", text: "Swing structure: a clear higher low and higher highs." },
          { upTo: "ibrk", text: "Inside, a small low breaks. Internal structure turns bearish." },
          {
            upTo: 99,
            text: "The swing low never broke. It was a pullback, and the trend carried on.",
          },
        ],
      }),
    },
    {
      term: "Strong and weak highs and lows",
      aka: "protected vs unprotected swings",
      meaning:
        "The swing that launched a break of structure is called strong, or protected: breaking it would cancel the move. The opposite extreme is weak, because it hasn't proven anything and is more likely to be taken.",
      spot: "In an uptrend after a bullish break, the low that started the leg is the strong low; the latest high is the weak high.",
      caution:
        "The labels come from community indicators. The real question underneath is simple: which swing, if broken, kills the idea?",
      visual: scene({
        start: 40,
        items: [
          go(52, 4, "h1"),
          k(52, 52.3, 44.6, 45, "low"),
          go(56, 4, "bos"),
          k(56, 58.5, 55.6, 58, "wh"),
          go(53, 3),
          go(59.6, 3, "take"),
        ],
        lines: [{ y: 52.4, from: "h1", to: "bos", label: "old high" }],
        marks: [
          { at: "low", y: 44.6, text: "strong low", dir: "up", tone: "bull", appear: "bos" },
          { at: "wh", y: 58.5, text: "weak high", dir: "down", tone: "warn" },
        ],
        steps: [
          {
            upTo: "bos",
            text: "Price breaks the old high. The low that launched it becomes the strong (protected) low.",
          },
          { upTo: 15, text: "The newest high hasn't proven anything: a weak high." },
          {
            upTo: 99,
            text: "Weak highs tend to get taken. Strong lows are where the idea dies if broken.",
          },
        ],
      }),
    },
    {
      term: "Change of character",
      aka: "CHoCH",
      meaning:
        "The first break against the trend: in a downtrend, a close above the most recent lower high. Many traders use CHoCH and MSS as the same thing. ICT-style MSS usually also insists on displacement; community indicators label CHoCH from the break alone.",
      spot: "Use closes, not wicks, and name the exact swing that broke.",
      caution: "The first CHoCH after a long trend is a warning, not a reversal. It fails often.",
      visual: scene({
        start: 70,
        items: [
          go(60, 3),
          go(65, 2),
          go(55, 3),
          k(55, 59.3, 54.8, 58.9, "lh2"),
          go(50, 3, "ll"),
          go(56, 2),
          go(53, 2),
          k(53, 61, 52.8, 60.5, "choch"),
          go(63, 2),
        ],
        lines: [{ y: 59.3, from: "lh2", to: "choch", label: "last lower high" }],
        marks: [
          { at: "ll", y: 49.6, text: "lower low", dir: "up", tone: "bear" },
          { at: "choch", y: 61, text: "CHoCH", dir: "down", tone: "primary" },
        ],
        steps: [
          { upTo: "ll", text: "A downtrend: lower highs and lower lows." },
          { upTo: 14, text: "Price bounces. The line marks the last lower high." },
          {
            upTo: 99,
            text: "A candle closes above it: a change of character. First evidence of a turn, not proof.",
          },
        ],
      }),
    },
    {
      term: "Change in state of delivery",
      aka: "CISD",
      meaning:
        "A lower-timeframe cue from ICT teaching. Price has been delivering in one direction with a run of same-coloured candles. CISD is the first candle that closes beyond the open of that run, in the other direction.",
      spot: "Find the run of candles that made the last leg. Mark the open of the first candle in that run. A close beyond it is the CISD.",
      tv: "Horizontal ray at the open of the first candle in the run.",
      caution:
        "A newer term with several versions. Check your teacher's exact definition and stick to one.",
      visual: scene({
        start: 62,
        items: [
          go(58.2, 2),
          k(58, 58.4, 55.6, 56, "first"),
          k(56, 56.3, 54, 54.4),
          k(54.4, 54.7, 52, 52.4),
          k(52.4, 55, 52, 54.8),
          k(54.8, 58.9, 54.5, 58.6, "cisd"),
          go(61, 3),
        ],
        lines: [{ y: 58, from: "first", label: "open of the run" }],
        marks: [{ at: "cisd", y: 58.9, text: "CISD", dir: "down", tone: "primary" }],
        steps: [
          {
            upTo: 4,
            text: "Three down candles in a row deliver price lower. Note the open of the first one.",
          },
          { upTo: "cisd", text: "A candle closes above that open. Delivery has changed state." },
          { upTo: 99, text: "Price follows through higher." },
        ],
      }),
    },
    {
      term: "Dealing range, equilibrium, premium and discount",
      aka: "EQ, 50%",
      meaning:
        "The dealing range is the swing low to swing high you're trading inside. Its midpoint is equilibrium (EQ). Above it is premium, below it is discount. Smart-money traders look to buy in discount and sell in premium, in the direction of the bias.",
      spot: "Draw a Fib from the range low to the range high; the 0.5 line is equilibrium.",
      tv: "Fib Retracement with only the 0, 0.5 and 1 levels switched on makes a clean premium/discount tool.",
      caution:
        "Buying in discount doesn't make a trade good. It only improves the reward-to-risk if the idea turns out right.",
      visual: scene({
        items: [k(42, 43, 39.5, 41, "lo"), go(70, 6, "hi"), go(50, 5, "disc"), go(68, 4)],
        zones: [
          { from: "hi", top: 70, bottom: 55, tone: "bear", label: "Premium" },
          { from: "hi", top: 55, bottom: 39.5, tone: "bull", label: "Discount" },
        ],
        lines: [{ y: 55, from: "hi", label: "EQ 50%", tone: "primary" }],
        marks: [{ at: "disc", y: 49.6, text: "in discount", dir: "up", tone: "bull" }],
        steps: [
          { upTo: "hi", text: "A leg from a swing low to a swing high: the dealing range." },
          {
            upTo: "disc",
            text: "Split it in half. Price pulls back into the lower half, discount.",
          },
          { upTo: 99, text: "For a bullish bias, discount is where buying makes more sense." },
        ],
      }),
    },
    {
      term: "The four phases of price delivery",
      meaning:
        "ICT teaching describes price alternating between consolidation (a range), expansion (a fast move), retracement (a pullback) and reversal (a change of direction).",
      spot: "Label the phase before choosing a tool: gap entries suit retracements, range edges suit consolidation, and breakouts out of consolidation often fail.",
      caution:
        "Phases are obvious afterwards and blurry in real time. Label what has happened, not what you expect.",
      visual: scene({
        start: 50,
        items: [
          go(52, 2),
          go(49, 2),
          go(51.5, 2),
          go(49.5, 2, "cons"),
          go(65, 4, "exp", 0.2),
          go(59, 3, "ret"),
          go(68, 3),
          go(56, 5, "rev"),
        ],
        marks: [
          { at: 4, y: 47.5, text: "consolidation", dir: "up", tone: "muted" },
          { at: "exp", y: 65.6, text: "expansion", dir: "down", tone: "bull" },
          { at: "ret", y: 58.4, text: "retracement", dir: "up", tone: "warn" },
          { at: "rev", y: 55.4, text: "reversal", dir: "up", tone: "bear" },
        ],
        steps: [
          { upTo: "cons", text: "Consolidation: price goes sideways." },
          { upTo: "exp", text: "Expansion: a fast move out of the range." },
          { upTo: "ret", text: "Retracement: a pullback against the move." },
          { upTo: 99, text: "A second push, then reversal: price turns and breaks back down." },
        ],
      }),
    },
  ],
};

export const CH_FIB: BreakthroughChapter = {
  id: "bt-04-fibonacci",
  title: "Fibonacci, OTE and projections",
  topic: "trade_planning",
  summary:
    "Retracement levels, the optimal trade entry zone, extensions, and patterns built from ratios.",
  mistake: "Moving the Fib anchors until a level lines up with the entry you already wanted.",
  terms: [
    {
      term: "Fibonacci retracement",
      meaning:
        "Horizontal levels drawn across a move at ratios linked to the Fibonacci sequence: 23.6%, 38.2%, 61.8% and 78.6%. The 50% level isn't a Fibonacci ratio but is included by convention.",
      spot: "Anchor from the start of the impulse to its end (swing low to swing high for a bullish leg), never between two random points.",
      tv: "Left toolbar, Fibonacci tools, Fib Retracement. Click the swing start, then the swing end. Settings let you add or remove levels and extend lines right.",
      caution:
        "There's no proof price respects these ratios beyond the fact that many traders watch them. Treat them as zones, not exact lines.",
      visual: scene({
        items: [k(41, 42, 39.8, 40.5, "a"), go(70, 6, "b"), go(51.6, 5, "pb"), go(66, 3)],
        lines: [
          { y: 70, from: "a", label: "0", appear: "b", labelAt: "start" },
          { y: 62.9, from: "a", label: "23.6%", appear: "b", labelAt: "start" },
          { y: 58.5, from: "a", label: "38.2%", appear: "b", labelAt: "start" },
          { y: 55, from: "a", label: "50%", appear: "b", labelAt: "start" },
          { y: 51.5, from: "a", label: "61.8%", tone: "primary", appear: "b", labelAt: "start" },
          { y: 46.4, from: "a", label: "78.6%", appear: "b", labelAt: "start" },
        ],
        steps: [
          { upTo: "b", text: "An impulse from 40 to 70. Draw the tool from the low to the high." },
          { upTo: "pb", text: "The pullback stalls near the 61.8% level." },
          { upTo: 99, text: "Price turns up again. Useful as a zone, not a promise." },
        ],
      }),
    },
    {
      term: "Optimal trade entry",
      aka: "OTE",
      meaning:
        "ICT's name for the 62% to 79% retracement zone of an impulse, with 70.5% as the middle. It's where they look for entries after a structure shift.",
      spot: "Draw the Fib on the displacement leg that broke structure. An OTE zone that also contains a fair value gap or order block is more interesting than the percentage alone.",
      tv: "In Fib Retracement settings, add custom levels 0.62, 0.705 and 0.79 and save it as a template.",
      caution:
        "A deeper entry means a tighter stop but also more chance the move has already failed. Many pullbacks never reach OTE.",
      visual: scene({
        items: [k(41, 42, 39.8, 40.5, "a"), go(70, 6, "b"), go(49, 5, "pb"), go(73, 5)],
        zones: [{ from: "b", top: 51.4, bottom: 46.3, tone: "primary", label: "OTE 62–79%" }],
        lines: [{ y: 48.85, from: "b", label: "70.5%" }],
        marks: [{ at: "pb", y: 48.6, text: "entry area", dir: "up", tone: "bull" }],
        steps: [
          { upTo: "b", text: "A displacement leg from 40 to 70 breaks structure." },
          { upTo: "pb", text: "Price retraces into the 62–79% band, near the 70.5% line." },
          { upTo: 99, text: "The rally resumes. The stop would sit below the leg's start." },
        ],
      }),
    },
    {
      term: "Fibonacci extensions",
      aka: "trend-based Fib extension, 1.272, 1.618",
      meaning:
        "Levels beyond 100% of a move, used for targets. The trend-based tool uses three points: the start of the leg (A), its end (B) and the pullback (C). The 1.0 level projects AB again from C; 1.618 projects it 1.618 times.",
      spot: "Use them as rough target areas, then check whether real liquidity (an old high, equal highs) sits nearby. Liquidity first, ratios second.",
      tv: "Left toolbar, Fibonacci tools, Trend-Based Fib Extension. Click A, then B, then C.",
      caution: "A projected level has no orders behind it unless something else is there too.",
      visual: scene({
        items: [
          k(41, 41.5, 39.8, 40.3, "A"),
          go(60, 5, "B"),
          go(50, 4, "C"),
          go(70.5, 6, "t1"),
          go(68, 2),
          go(80, 4),
        ],
        lines: [
          { y: 70, from: "C", label: "1.0", appear: "C" },
          { y: 82.4, from: "C", label: "1.618", appear: "C", tone: "primary" },
        ],
        marks: [
          { at: "A", y: 39.8, text: "A", dir: "up" },
          { at: "B", y: 60.6, text: "B", dir: "down" },
          { at: "C", y: 49.6, text: "C", dir: "up" },
        ],
        steps: [
          { upTo: "C", text: "Leg A to B, pullback to C. Project the leg's size from C." },
          { upTo: "t1", text: "Price reaches the 1.0 projection." },
          { upTo: 99, text: "After a pause it pushes toward the 1.618 projection." },
        ],
      }),
    },
    {
      term: "Confluence",
      meaning:
        "When several independent reasons point at the same price: a Fib level, a fair value gap and an old high, for example.",
      spot: "Count independent reasons only. Three indicators measuring the same momentum are one reason, not three. Two or three truly independent reasons make a decent zone.",
      caution: "More drawings make anything look confirmed. Stack evidence, not lines.",
      visual: scene({
        start: 40,
        items: [
          k(48, 52.3, 47.6, 51.8, "oldh"),
          go(46, 2),
          go(50, 2),
          k(50, 51, 49.5, 50.5, "c1"),
          k(50.5, 60, 50.3, 59.5),
          k(59.5, 63, 54, 62.5, "c3"),
          go(66, 3, "top"),
          go(53, 4, "tap"),
          go(70, 4),
        ],
        zones: [{ from: "c1", top: 54, bottom: 51, tone: "bull", label: "FVG", appear: "c3" }],
        lines: [
          { y: 52.3, from: "oldh", label: "old high", labelAt: "start" },
          { y: 53.6, from: "top", label: "61.8%", tone: "primary" },
        ],
        marks: [{ at: "tap", y: 52.8, text: "3 reasons", dir: "up", tone: "bull" }],
        steps: [
          {
            upTo: "c3",
            text: "An old high, then a rally that leaves a fair value gap right above it.",
          },
          {
            upTo: "top",
            text: "The 61.8% retracement of the whole leg also lands inside the gap.",
          },
          { upTo: 99, text: "Three independent reasons in one band. Price reacts there." },
        ],
      }),
    },
    {
      term: "Measured move",
      aka: "AB=CD",
      meaning:
        "A pattern where the second leg of a move is about the same size as the first, after a pullback. The rough target is the end of the pullback (C) plus the length of the first leg (AB).",
      spot: "Measure AB, add it to C. Treat the result as an area to watch, not a line.",
      tv: "The XABCD and ABCD pattern tools in the left toolbar draw it and show the ratios.",
      caution:
        "Legs are rarely exactly equal. It's a rough guide for targets, not an entry signal.",
      visual: scene({
        items: [
          k(40.5, 41, 39.5, 40, "A"),
          go(55, 4, "B"),
          go(48, 3, "C"),
          go(63, 4, "D"),
          go(58, 3),
        ],
        lines: [{ y: 63, from: "C", label: "C + AB", tone: "primary", appear: "C" }],
        marks: [
          { at: "A", y: 39.5, text: "A", dir: "up" },
          { at: "B", y: 55.5, text: "B", dir: "down" },
          { at: "C", y: 47.6, text: "C", dir: "up" },
          { at: "D", y: 63.4, text: "D", dir: "down" },
        ],
        steps: [
          { upTo: "B", text: "First leg: A to B, 15 points." },
          { upTo: "C", text: "Pullback to C. Add 15 points to C for a rough target." },
          { upTo: 99, text: "Price reaches D near that target, then pauses." },
        ],
      }),
    },
    {
      term: "Harmonic patterns",
      aka: "Gartley, Bat, Butterfly, Crab",
      meaning:
        "Five-point patterns (X, A, B, C, D) defined by Fibonacci ratios between the legs. Each name has its own ratio rules. The D point marks a potential reversal zone.",
      spot: "Measure each leg with the XABCD tool and compare with the pattern's ratio table. If the ratios don't fit, it isn't the pattern.",
      tv: "Left toolbar, patterns, XABCD Pattern. Auto-detect harmonic indicators exist too.",
      caution:
        "Tolerances are loose, so patterns can be found in almost any chart after the fact. An advanced, low-priority tool.",
      visual: scene({
        items: [
          k(40.5, 41, 39.5, 40, "X"),
          go(60, 4, "A"),
          go(47.6, 3, "B"),
          go(55, 3, "C"),
          go(44.3, 4, "D"),
          go(54, 4),
        ],
        zones: [{ from: "D", top: 45.5, bottom: 43.2, tone: "primary", label: "D zone" }],
        marks: [
          { at: "X", y: 39.5, text: "X", dir: "up" },
          { at: "A", y: 60.5, text: "A", dir: "down" },
          { at: "B", y: 47.2, text: "B", dir: "up" },
          { at: "C", y: 55.4, text: "C", dir: "down" },
        ],
        steps: [
          { upTo: "B", text: "X to A, then B retraces about 61.8% of XA." },
          {
            upTo: "D",
            text: "C bounces, then D reaches about 78.6% of XA: the reversal zone in a Gartley-type pattern.",
          },
          { upTo: 99, text: "Price reacts from D. Without a reaction, the pattern simply failed." },
        ],
      }),
    },
  ],
};

export const CH_TIME: BreakthroughChapter = {
  id: "bt-05-time",
  title: "Time: sessions, kill zones and opens",
  topic: "trade_planning",
  summary:
    "When the market is busy, how the opens are used, and time-boxed setups. Tap the hour picker to see your own clock.",
  mistake:
    "Forcing a trade because the clock says it's a kill zone, instead of waiting for a sweep, a shift and a zone.",
  terms: [
    {
      term: "Trading sessions",
      aka: "Asia, London, New York",
      meaning:
        "Forex trades around the clock, but activity moves with the big financial centres: Asia (Tokyo, Sydney), London and New York. Most volume for major pairs comes in London and New York hours. Asia matters most for yen, Aussie and Kiwi pairs.",
      spot: "ChartPilot uses these UTC hours: Asian 00:00–09:00, London 08:00–17:00, New York 13:00–22:00, with the London–New York overlap 13:00–17:00.",
      tv: "Set your chart time zone from the clock label at the bottom right of the chart. Session-shading indicators colour the hours for you.",
      caution:
        "The US and UK change clocks on different dates, so for a few weeks each year the overlap shifts by an hour. If your country has no daylight saving, market hours move against your clock twice a year.",
      visual: clock({
        bands: [
          { label: "Asian session", start: 0, end: 9, tz: "utc", tone: "muted" },
          { label: "London session", start: 8, end: 17, tz: "utc", tone: "primary" },
          { label: "New York session", start: 13, end: 22, tz: "utc", tone: "primary" },
          { label: "London–NY overlap", start: 13, end: 17, tz: "utc", tone: "warn" },
        ],
        caption: "These are the fixed UTC hours ChartPilot uses for its session badge.",
      }),
    },
    {
      term: "Kill zones",
      meaning:
        "Narrow windows inside the sessions where ICT teachers look for setups, because activity tends to be highest. Usually quoted in New York time: Asia 20:00–00:00, London 02:00–05:00, New York 07:00–10:00, London close 10:00–12:00.",
      spot: "New York time is UTC−5 in US winter and UTC−4 in US summer. Convert once, write it on a sticky note, and use the switch above to check.",
      caution:
        "The windows come from teaching material, not a market rule, and teachers shift them by an hour. Treat them as a schedule, not a signal.",
      visual: clock({
        bands: [
          { label: "Asia kill zone", start: 20, end: 0, tz: "ny", tone: "muted" },
          { label: "London kill zone", start: 2, end: 5, tz: "ny", tone: "primary" },
          { label: "New York kill zone", start: 7, end: 10, tz: "ny", tone: "primary" },
          { label: "London close", start: 10, end: 12, tz: "ny", tone: "warn" },
        ],
        caption: "Switch between US winter and summer time to see the windows move an hour.",
      }),
    },
    {
      term: "Asian range",
      meaning:
        "The high and low made during the Asian session. It's usually narrow, so its edges become obvious liquidity for London to take.",
      spot: "Mark the Asian high and low when the session ends. Watch London's first push for a sweep of one side, then a reversal or a continuation.",
      tv: "Rectangle over the Asian candles, or a session high/low indicator.",
      caution:
        "Sometimes London takes one side and simply keeps going. The reclaim decides whether it was a sweep.",
      visual: scene({
        items: [
          k(50, 51, 49.3, 50.6),
          k(50.6, 51.8, 50.1, 51.2),
          k(51.2, 52.2, 50.4, 50.8),
          k(50.8, 51.2, 49, 49.6),
          k(49.6, 50.7, 48.9, 50.4),
          k(50.4, 51.5, 49.8, 51.1),
          k(51.1, 51.9, 50.3, 50.5, "aend"),
          k(50.5, 53.5, 50.2, 53, "lsw"),
          k(53, 53.4, 48.5, 49),
          go(44, 4),
        ],
        zones: [{ from: 0, to: "aend", top: 52.2, bottom: 48.9, tone: "muted", label: "Asia" }],
        lines: [
          { y: 52.2, from: "aend", label: "Asia high" },
          { y: 48.9, from: "aend", label: "Asia low" },
        ],
        marks: [{ at: "lsw", y: 53.5, text: "London sweep", dir: "down", tone: "warn" }],
        steps: [
          { upTo: "aend", text: "Asia trades in a tight box. Mark its high and low." },
          { upTo: "lsw", text: "London opens and spikes above the Asian high." },
          {
            upTo: 99,
            text: "It closes back inside and falls through the Asian low: a sweep, then the real move.",
          },
        ],
      }),
    },
    {
      term: "Daily open and midnight open",
      aka: "true day open",
      meaning:
        "The opening price of the day under a chosen convention. ICT uses 00:00 New York time (the midnight open). For the day, above the open counts as premium and below it as discount.",
      spot: "In a bullish day, the low is often made below the open before price closes above it. Bearish days mirror that.",
      tv: "Horizontal ray at the open price, or an opening-price indicator set to New York time.",
      caution:
        "Different conventions (17:00 New York, 00:00 UTC, 00:00 New York) give different opens. Pick one and keep it.",
      visual: scene({
        items: [k(50, 50.5, 49.6, 50.2, "open"), go(53, 3), go(47.4, 4, "below"), go(56, 5)],
        zones: [
          { from: "open", top: 57, bottom: 50, tone: "bear", label: "above open" },
          { from: "open", top: 50, bottom: 46.5, tone: "bull", label: "below open" },
        ],
        lines: [{ y: 50, from: "open", label: "00:00 NY open", tone: "primary" }],
        marks: [{ at: "below", y: 47.2, text: "low below open", dir: "up", tone: "bull" }],
        steps: [
          { upTo: "open", text: "The day opens here. Draw a line." },
          { upTo: "below", text: "Price dips below the open: discount for the day." },
          { upTo: 99, text: "Then it closes well above. A classic bullish-day shape." },
        ],
      }),
    },
    {
      term: "Power of three",
      aka: "PO3, daily AMD",
      meaning:
        "The AMD cycle inside a single candle: the open (accumulation), a false move against the day's direction (manipulation), then the real move into the close (distribution). A bullish day shows a long lower wick and a close near the high.",
      spot: "Watch the intraday chart: open, a dip under the open, then expansion up. On the daily chart that day prints as one candle with a lower wick.",
      caution: "Many days fit nothing neatly. Label it only when you can see all three parts.",
      visual: scene({
        items: [
          k(50, 50.6, 49.5, 50.1, "o"),
          go(50.4, 2, "acc"),
          go(46.2, 3, "man"),
          go(58, 6, "dist"),
          go(57.2, 1),
        ],
        lines: [{ y: 50, from: "o", label: "open" }],
        marks: [
          { at: "acc", y: 51.6, text: "A", dir: "down", tone: "muted" },
          { at: "man", y: 45.8, text: "M", dir: "up", tone: "warn" },
          { at: "dist", y: 58.6, text: "D", dir: "down", tone: "bull" },
        ],
        steps: [
          { upTo: "acc", text: "Accumulation: quiet trade around the open." },
          { upTo: "man", text: "Manipulation: a drop below the open that traps sellers." },
          {
            upTo: 99,
            text: "Distribution: the real move up into the close. As one daily candle: long lower wick, close near the high.",
          },
        ],
      }),
    },
    {
      term: "Opening gaps",
      aka: "NWOG, NDOG",
      meaning:
        "The gap between one period's close and the next period's open. The new week opening gap (NWOG) is Friday's close to Sunday's open; ICT also marks daily ones (NDOG). Traders keep them as reference zones and watch whether price returns.",
      spot: "Mark the band between the two prices. Note whether later price fills it, reacts at its edges, or ignores it.",
      tv: "Rectangle between Friday's close and the first Sunday price. Gaps look different from feed to feed.",
      caution:
        "Spot forex gaps are often small, and some broker feeds barely show them. Futures and CFDs show them more clearly.",
      visual: scene({
        start: 46,
        items: [
          go(50, 5, "fri"),
          k(52.5, 53.5, 52, 53, "sun"),
          go(57, 4),
          go(51, 5, "back"),
          go(58, 4),
        ],
        zones: [
          { from: "fri", top: 52.5, bottom: 50, tone: "primary", label: "NWOG", appear: "sun" },
        ],
        marks: [{ at: "back", y: 50.8, text: "gap revisited", dir: "up", tone: "bull" }],
        steps: [
          { upTo: "fri", text: "Friday closes at 50." },
          {
            upTo: "sun",
            text: "Sunday opens at 52.5. The empty band is the new week opening gap.",
          },
          { upTo: 99, text: "Later in the week price returns into the gap and reacts." },
        ],
      }),
    },
    {
      term: "Silver Bullet",
      meaning:
        "A time-boxed ICT routine: inside a one-hour window, look for a fair value gap entry toward a nearby draw on liquidity. Windows in New York time: 03:00–04:00, 10:00–11:00 and 14:00–15:00.",
      spot: "Before the window starts, know your draw. Inside the window, wait for a sweep, a shift and a gap in the direction of that draw.",
      caution:
        "Online statistics about named setups usually come from hand-picked charts. Test it yourself in Bar Replay before trusting it.",
      visual: clock({
        bands: [
          { label: "London Silver Bullet", start: 3, end: 4, tz: "ny", tone: "primary" },
          { label: "AM Silver Bullet", start: 10, end: 11, tz: "ny", tone: "primary" },
          { label: "PM Silver Bullet", start: 14, end: 15, tz: "ny", tone: "primary" },
        ],
        caption: "One-hour windows. They move with US daylight saving.",
      }),
    },
  ],
};

export const CH_MODELS: BreakthroughChapter = {
  id: "bt-06-models",
  title: "Putting zones to work: models and entries",
  topic: "trade_planning",
  summary:
    "Top-down analysis, entry styles, SMT divergence and a complete entry-stop-target blueprint.",
  mistake:
    "Switching between aggressive and conservative entries from trade to trade, so your journal can never tell which one works.",
  terms: [
    {
      term: "Point of interest and PD arrays",
      aka: "POI",
      meaning:
        "A point of interest is any zone you've decided is worth watching: an order block, a gap, a breaker. PD array is ICT's name for these zones sorted by where they sit: in discount for longs, in premium for shorts.",
      spot: "In a bullish leg, list only the zones below equilibrium. Zones in premium are not long entries, however pretty they look.",
      caution: "Too many POIs means none of them is special. Two or three per chart is plenty.",
      visual: scene({
        items: [
          k(42, 42.5, 40, 40.5, "ob"),
          k(40.5, 47, 40.3, 46.7, "c1"),
          k(46.7, 52.6, 46.5, 52.3),
          k(52.3, 55, 49.5, 54.6, "c3"),
          go(70, 5, "hi"),
          go(60, 3),
        ],
        zones: [
          { from: "ob", top: 42, bottom: 40.5, tone: "bull", label: "OB", appear: "hi" },
          { from: "c1", top: 49.5, bottom: 47, tone: "bull", label: "FVG", appear: "hi" },
          { from: "hi", top: 70, bottom: 55, tone: "bear", label: "Premium" },
        ],
        lines: [{ y: 55, from: "hi", label: "EQ", tone: "primary" }],
        steps: [
          {
            upTo: "hi",
            text: "A bullish leg leaves an order block and a gap, both below the 50% line.",
          },
          {
            upTo: 99,
            text: "Those are your discount PD arrays: the POIs for longs. Anything above EQ is premium.",
          },
        ],
      }),
    },
    {
      term: "Top-down analysis",
      aka: "multi-timeframe alignment",
      meaning:
        "Direction from the higher timeframe, the zone from the middle timeframe, the trigger from the lower timeframe. Each step narrows the one before.",
      spot: "Write one line per timeframe. If the daily is bullish and the 5-minute is bearish, you're most likely watching a pullback: wait for the lower timeframe to turn back at your zone.",
      tv: "A multi-chart layout with daily, 1H and 5M side by side, with symbol sync on.",
      caution:
        "If you change your higher-timeframe bias every time the 5-minute chart moves, you don't have a bias.",
      visual: flow({
        nodes: [
          {
            label: "Daily: which way?",
            note: "Higher highs or lower lows? Which liquidity pool is the draw?",
            tone: "primary",
          },
          {
            label: "4H / 1H: where?",
            note: "The POI in discount (for longs) or premium (for shorts) on the way to the draw.",
          },
          {
            label: "15M: wait",
            note: "Do nothing until price reaches the POI. Most of trading is this step.",
          },
          {
            label: "5M / 1M: trigger",
            note: "Inside the POI: a sweep and a structure shift in the daily direction.",
            tone: "bull",
          },
          {
            label: "Plan: entry, stop, target",
            note: "Entry on the retrace, stop beyond the sweep, target the draw from step one.",
          },
        ],
      }),
    },
    {
      term: "Aggressive vs conservative entry",
      aka: "risk entry vs confirmation entry",
      meaning:
        "An aggressive entry is a limit order at the zone before any confirmation: better price, smaller stop, more trades that fail. A conservative entry waits for a lower-timeframe structure shift inside the zone: worse price, wider stop, usually fewer failures.",
      spot: "Choose one style per setup type and log it, so your journal can compare them fairly.",
      caution: "Neither is better by default. The numbers in your own journal decide.",
      visual: scene({
        start: 60,
        items: [
          go(52, 4),
          go(50, 2, "touch"),
          go(48.4, 2),
          go(49.8, 1),
          go(48.8, 1),
          k(48.8, 52.5, 48.6, 52.2, "mss"),
          go(51, 2, "conf"),
          go(58, 4),
        ],
        zones: [{ from: 0, top: 50, bottom: 47, tone: "bull", label: "zone" }],
        marks: [
          { at: "touch", y: 50, text: "aggressive", dir: "up", tone: "warn" },
          { at: "conf", y: 50.8, text: "conservative", dir: "up", tone: "bull" },
        ],
        steps: [
          {
            upTo: "touch",
            text: "Price reaches the zone. The aggressive trader's limit order fills right at its edge.",
          },
          {
            upTo: "mss",
            text: "The conservative trader waits. Inside the zone, a small high breaks: a lower-timeframe shift.",
          },
          {
            upTo: "conf",
            text: "Their entry comes on the pullback after the shift: a higher price, but with evidence.",
          },
          {
            upTo: 99,
            text: "Both won here. On a day the zone fails, only the aggressive trader loses.",
          },
        ],
      }),
    },
    {
      term: "SMT divergence",
      aka: "smart money technique",
      meaning:
        "Two markets that usually move together (EURUSD and GBPUSD, or the S&P 500 and Nasdaq futures) disagree at an extreme: one makes a new low, the other doesn't. ICT reads the failure to confirm as weakness in the move.",
      spot: "Put both charts side by side on the same timeframe. One makes a lower low while the other holds a higher low: flag SMT, then wait for your normal entry rules.",
      tv: "Multi-chart layout with crosshair and time sync, or add the second symbol with the compare tool.",
      caution:
        "Small differences between feeds can create fake divergences. SMT is a supporting clue, never an entry on its own.",
      visual: scene({
        start: 55,
        items: [go(48, 4, "l1"), go(53, 3), go(46, 4, "l2"), go(56, 5)],
        panel: {
          name: "GBPUSD",
          kind: "line",
          series: [
            {
              values: [50, 43, 36, 30, 36, 41, 45, 42, 39, 37, 35, 40, 45, 49, 52, 55],
              tone: "primary",
            },
          ],
        },
        marks: [
          { at: "l1", y: 47.6, text: "low", dir: "up", tone: "muted" },
          { at: "l2", y: 45.6, text: "lower low", dir: "up", tone: "warn" },
        ],
        steps: [
          { upTo: "l1", text: "EURUSD (top) and GBPUSD (bottom) both make a low." },
          {
            upTo: "l2",
            text: "EURUSD makes a lower low. GBPUSD holds above its previous low. They disagree: SMT.",
          },
          { upTo: 99, text: "Both rally. The divergence hinted the selling was weak." },
        ],
      }),
    },
    {
      term: "Entry, stop and target blueprint",
      meaning:
        "The full SMC plan in one picture: sweep, shift, gap entry, stop beyond the sweep, first target at internal liquidity, second target at external liquidity.",
      spot: "Write the four numbers before entering: entry, stop, TP1, TP2. Allow for spread when placing the stop beyond the sweep.",
      tv: "The Long Position tool draws all of it and shows the reward-to-risk.",
      caution:
        "The blueprint describes a plan, not an outcome. Most of the work is skipping charts that don't fit it.",
      visual: scene({
        start: 60,
        items: [
          go(64, 2),
          go(52, 4),
          k(52, 52.5, 48.5, 50, "sw"),
          k(50, 51.5, 49.8, 51.2, "c1"),
          k(51.2, 57, 51, 56.6),
          k(56.6, 58.5, 54, 58, "c3"),
          go(60, 2),
          go(53.4, 3, "entry"),
          go(66.6, 6),
        ],
        zones: [{ from: "c1", top: 54, bottom: 51.5, tone: "bull", label: "FVG", appear: "c3" }],
        lines: [
          { y: 66, from: "c3", label: "TP2: external high", tone: "bull" },
          { y: 60.4, from: "c3", label: "TP1: internal high", tone: "bull" },
          { y: 53.5, from: "c3", label: "entry", tone: "primary" },
          { y: 48, from: "c3", label: "stop", tone: "bear" },
        ],
        marks: [{ at: "sw", y: 48.5, text: "sweep", dir: "up", tone: "warn" }],
        steps: [
          { upTo: "sw", text: "Price sweeps a low." },
          {
            upTo: "c3",
            text: "A fast move up breaks structure and leaves a gap. Now the plan is drawn: entry in the gap, stop under the sweep, two targets.",
          },
          { upTo: "entry", text: "Price retraces into the gap: entry." },
          { upTo: 99, text: "TP1, then TP2. Planned before, not after." },
        ],
      }),
    },
    {
      term: "Break-even and partials",
      meaning:
        "Break-even means moving the stop to the entry price once the trade has moved in your favour. A partial means closing part of the position at a first target.",
      spot: "Decide both before entering and write them in the plan. Changing them mid-trade is how emotion sneaks in.",
      tv: "Drag the stop line on the order (if your broker is connected) or update the stop on MT5.",
      caution:
        "Moving to break-even too early turns many trades that would have won into zero-R exits. Check your journal before making it a rule.",
      visual: scene({
        start: 47,
        items: [go(50, 2, "in"), go(54.2, 4, "tp1"), go(50, 4, "be"), go(58, 5)],
        lines: [
          { y: 58, from: "in", label: "TP2", tone: "bull" },
          { y: 54, from: "in", to: "tp1", label: "TP1", tone: "bull" },
          { y: 50, from: "in", label: "entry", tone: "primary" },
          { y: 46, from: "in", to: "tp1", label: "stop", tone: "bear" },
        ],
        marks: [{ at: "be", y: 49.8, text: "stopped at entry", dir: "up", tone: "warn" }],
        steps: [
          { upTo: "in", text: "Long at 50, stop at 46, targets 54 and 58." },
          {
            upTo: "tp1",
            text: "TP1 hits: half the position is closed and the stop moves up to the entry.",
          },
          { upTo: "be", text: "Price dips back to the entry. The rest closes at zero." },
          {
            upTo: 99,
            text: "Then price runs to TP2 without you. Break-even protects you, and it also costs you.",
          },
        ],
      }),
    },
    {
      term: "Reaction vs reversal",
      meaning:
        "A reaction is a bounce from a zone that lasts a few candles. A reversal changes structure on the timeframe you trade. Zones produce reactions far more often than reversals.",
      spot: "After the bounce, ask: did it break a swing on my timeframe? If not, it was a reaction. Take partials at reactions; hold for reversals only with structure.",
      caution:
        "Calling every bounce a reversal is how traders end up buying the top of a pullback.",
      visual: scene({
        start: 65,
        items: [
          go(55, 4),
          k(55, 55.5, 52.5, 53, "t1"),
          go(58.2, 3, "bounce"),
          go(50, 4, "fail"),
          go(46, 3),
        ],
        zones: [{ from: 0, top: 54, bottom: 51, tone: "bull", label: "zone" }],
        lines: [{ y: 61, label: "swing to break" }],
        marks: [
          { at: "bounce", y: 58.6, text: "reaction", dir: "down", tone: "bull" },
          { at: "fail", y: 49.8, text: "no reversal", dir: "up", tone: "bear" },
        ],
        steps: [
          { upTo: "t1", text: "Price drops into a zone." },
          { upTo: "bounce", text: "It bounces: a reaction. But it never breaks the swing above." },
          { upTo: 99, text: "Then it falls through the zone. A reaction, not a reversal." },
        ],
      }),
    },
  ],
};
