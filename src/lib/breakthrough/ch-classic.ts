/**
 * Breakthrough chapters 7–10: Wyckoff, candlesticks, chart patterns and indicators.
 */
import { atr, closes, ema, go, k, macd, rangeVolume, rsi, sma, stdevBands, vwap } from "./scene";
import { flow, scene, type BreakthroughChapter } from "./types";

export const CH_WYCKOFF: BreakthroughChapter = {
  id: "bt-07-wyckoff",
  title: "Wyckoff: the original liquidity story",
  topic: "amd",
  summary: "Accumulation, distribution, springs and upthrusts: where many SMC ideas came from.",
  mistake:
    "Calling every range an accumulation. Without a climax, a test and a sign of strength, it's just a range.",
  terms: [
    {
      term: "Wyckoff method and the Composite Man",
      meaning:
        "A method from Richard Wyckoff (early 1900s) that reads price and volume to infer accumulation (big buyers building positions) and distribution (big sellers unloading). The Composite Man is a thinking device: imagine one large operator behind every move.",
      spot: "Ask of every range: if one big player were behind this, would they be buying or selling here? Then look for the evidence.",
      caution:
        "It's a model for organising your thinking, not proof that someone is steering the price.",
      visual: flow({
        nodes: [
          {
            label: "Accumulation",
            note: "Price goes sideways after a fall while the big player quietly buys from sellers who are giving up.",
            tone: "bull",
          },
          {
            label: "Markup",
            note: "Supply is used up. Price rises with little resistance.",
            tone: "bull",
          },
          {
            label: "Distribution",
            note: "Price goes sideways at the top while the big player sells to late buyers.",
            tone: "bear",
          },
          {
            label: "Markdown",
            note: "Demand is used up. Price falls until the cycle can start again.",
            tone: "bear",
          },
        ],
        loop: true,
        caption: "Wyckoff's four-stage market cycle.",
      }),
    },
    {
      term: "Trading range",
      aka: "TR",
      meaning:
        "A sideways area between support and resistance where buying and selling roughly balance. In Wyckoff terms, accumulation or distribution happens inside it.",
      spot: "Mark the range once a selling (or buying) climax and the bounce after it have set both edges. Then watch how price behaves at each edge.",
      tv: "Two horizontal rays, or a rectangle across the range.",
      caution:
        "Most ranges resolve in the direction of the prior trend. Assuming a reversal just because price stopped falling is a guess.",
      visual: scene({
        start: 70,
        items: [
          go(50, 5, "down"),
          go(58, 3),
          go(51, 3),
          go(58.3, 3),
          go(50.6, 3),
          go(57.8, 3),
          go(51.2, 2),
        ],
        lines: [
          { y: 58.8, from: "down", label: "resistance" },
          { y: 50, from: "down", label: "support" },
        ],
        steps: [
          { upTo: "down", text: "A downtrend runs out of steam." },
          {
            upTo: 99,
            text: "Price swings between the same two levels: a trading range. Now the question is who is building positions inside it.",
          },
        ],
      }),
    },
    {
      term: "Accumulation phases A to E",
      meaning:
        "Wyckoff splits an accumulation range into five phases. A stops the fall. B builds the 'cause' with back-and-forth trading. C tests supply, often with a spring. D shows strength and pushes to the top of the range. E is the markup out of the range. Distribution mirrors it at the top.",
      spot: "Label events as they happen: PS (preliminary support), SC (selling climax), AR (automatic rally), ST (secondary test), spring, SOS (sign of strength), LPS (last point of support).",
      caution:
        "Real ranges are messier than the textbook drawing. Phase labels are a hypothesis you keep updating, not a map you force.",
      visual: scene({
        start: 75,
        items: [
          go(62, 4),
          k(62, 62.5, 59, 60, "ps"),
          go(63, 2),
          go(52, 3),
          k(52, 52.5, 45, 47, "sc"),
          k(47, 55, 46.6, 54.5),
          go(60, 2, "ar"),
          go(49, 4, "st"),
          go(57, 4),
          go(50, 3),
          go(55.5, 3, "b"),
          go(47.5, 2),
          k(47.5, 48, 43.5, 44.5, "spring"),
          k(44.5, 51, 44.3, 50.5, "back"),
          go(58, 3),
          k(58, 62, 57.8, 61.5, "sos"),
          go(60.5, 3, "lps"),
          go(70, 5),
        ],
        lines: [
          { y: 60.4, from: "ar", to: "sos", label: "range top" },
          { y: 45, from: "sc", to: "back" },
        ],
        marks: [
          { at: "ps", y: 59, text: "PS", dir: "up", tone: "muted" },
          { at: "sc", y: 45, text: "SC", dir: "up", tone: "warn" },
          { at: "ar", y: 60.6, text: "AR", dir: "down", tone: "muted" },
          { at: "st", y: 48.5, text: "ST", dir: "up", tone: "muted" },
          { at: "spring", y: 43.5, text: "Spring", dir: "up", tone: "warn" },
          { at: "sos", y: 62.2, text: "SOS", dir: "down", tone: "bull" },
          { at: "lps", y: 60, text: "LPS", dir: "up", tone: "bull" },
        ],
        steps: [
          {
            upTo: "st",
            text: "Phase A stops the fall: preliminary support, a selling climax, the automatic rally and a secondary test.",
          },
          { upTo: "b", text: "Phase B builds the cause: back and forth inside the range." },
          {
            upTo: "back",
            text: "Phase C: the spring. A dip under the range that is bought straight back.",
          },
          {
            upTo: "lps",
            text: "Phase D: a sign of strength through the top, then a last point of support that holds.",
          },
          { upTo: 99, text: "Phase E: markup. Price leaves the range." },
        ],
      }),
    },
    {
      term: "Selling climax and automatic rally",
      aka: "SC, AR, buying climax (BC)",
      meaning:
        "A selling climax is a wide, high-volume drop where panic selling is absorbed by large buyers. The automatic rally is the sharp bounce that follows, and its high marks the top of the coming range. A buying climax is the mirror at a top.",
      spot: "Look for the biggest candle and the biggest volume of the decline, followed by a fast bounce.",
      tv: "Add the Volume indicator; the climax bar usually stands out clearly.",
      caution:
        "News can create the same picture. One climax doesn't end a trend; the secondary test matters as much.",
      visual: scene({
        start: 70,
        items: [
          go(60, 5),
          go(55, 3),
          k(55, 55.5, 46, 47.5, "sc"),
          k(47.5, 54, 47.2, 53.5),
          go(58, 3, "ar"),
          go(50, 3, "st"),
        ],
        panel: (c) => ({
          name: "Volume (illustration)",
          kind: "bars",
          series: [{ values: rangeVolume(c) }],
        }),
        marks: [
          { at: "sc", y: 46, text: "SC", dir: "up", tone: "warn" },
          { at: "ar", y: 58.6, text: "AR", dir: "down", tone: "bull" },
          { at: "st", y: 49.4, text: "ST", dir: "up", tone: "muted" },
        ],
        steps: [
          {
            upTo: "sc",
            text: "The fall accelerates into one huge candle on the biggest volume: the selling climax.",
          },
          {
            upTo: "ar",
            text: "A sharp automatic rally follows. Its high sets the top of the range.",
          },
          {
            upTo: 99,
            text: "The secondary test returns toward the low on smaller candles and less volume.",
          },
        ],
      }),
    },
    {
      term: "Spring and upthrust",
      aka: "shakeout, UT, UTAD",
      meaning:
        "A spring is a brief break below range support that is quickly bought back inside: it tests whether sellers are exhausted. An upthrust (UT, or UTAD late in distribution) is the mirror above resistance. In SMC language, a spring is a sell-side sweep and an upthrust is a buy-side sweep.",
      spot: "Price closes below support, then closes back inside within a few candles. Volume on the dip is ideally not much higher than recent bars.",
      caution: "A break that keeps going is a breakdown, not a spring. The reclaim decides.",
      visual: scene({
        start: 55,
        items: [
          go(58, 3),
          go(51, 3),
          go(58.2, 3),
          go(50.8, 3),
          go(56, 3),
          go(51.5, 2),
          k(51.5, 52, 47.8, 48.5, "spring"),
          k(48.5, 54, 48.3, 53.6, "back"),
          go(60, 4),
        ],
        lines: [
          { y: 50.4, to: "back", label: "support", labelAt: "start" },
          { y: 58.7, label: "resistance", labelAt: "start" },
        ],
        marks: [{ at: "spring", y: 47.8, text: "spring", dir: "up", tone: "warn" }],
        steps: [
          { upTo: 16, text: "A range with clear support and resistance." },
          {
            upTo: "spring",
            text: "Price drops through support. Sellers think the breakdown has started.",
          },
          { upTo: "back", text: "The next candle closes back inside the range: a spring." },
          { upTo: 99, text: "Supply was exhausted, and price heads for the top of the range." },
        ],
      }),
    },
    {
      term: "Sign of strength and last point of support",
      aka: "SOS, LPS, SOW, LPSY",
      meaning:
        "A sign of strength is a strong move up on rising volume that breaks above the range. The last point of support is the shallow pullback after it that holds above the old resistance, usually on lighter volume. Distribution mirrors these as sign of weakness (SOW) and last point of supply (LPSY).",
      spot: "After the break, the pullback should stay above the old range top and its candles should be smaller.",
      tv: "Volume indicator under the chart; compare the break bars with the pullback bars.",
      caution:
        "A pullback that falls back deep into the range turns the 'SOS' into a failed breakout.",
      visual: scene({
        start: 50,
        items: [
          go(57, 3),
          go(51, 3),
          go(57.5, 3),
          go(52, 3),
          k(52, 60.5, 51.8, 60, "sos1"),
          k(60, 63, 59.8, 62.6, "sos"),
          go(59.4, 3, "lps", 0.3),
          go(66, 4),
        ],
        panel: (c) => ({
          name: "Volume (illustration)",
          kind: "bars",
          series: [{ values: rangeVolume(c) }],
        }),
        lines: [{ y: 58, label: "range top", labelAt: "start" }],
        marks: [
          { at: "sos", y: 63.2, text: "SOS", dir: "down", tone: "bull" },
          { at: "lps", y: 58.8, text: "LPS", dir: "up", tone: "bull" },
        ],
        steps: [
          { upTo: 11, text: "Price is still inside the range." },
          {
            upTo: "sos",
            text: "Two big candles on rising volume break the top: sign of strength.",
          },
          {
            upTo: "lps",
            text: "The pullback holds above the old top on smaller candles: last point of support.",
          },
          { upTo: 99, text: "Markup continues." },
        ],
      }),
    },
    {
      term: "Effort vs result and absorption",
      meaning:
        "Volume is the effort; the price move is the result. They should roughly match. Big effort with little result is absorption: large passive orders are soaking up the pressure. Little effort with a big result means the path is easy.",
      spot: "At the top of a rally, several high-volume candles that barely make progress hint that sellers are absorbing the buying.",
      tv: "Volume indicator; compare bar heights with candle body sizes.",
      caution:
        "Needs reliable volume. Spot forex and most CFD charts show tick volume (number of price changes), which is only a rough stand-in for real traded volume.",
      visual: scene({
        start: 45,
        items: [
          go(55, 5),
          k(55, 56.5, 54.5, 55.6, "a1"),
          k(55.6, 56.6, 54.8, 55.4),
          k(55.4, 56.4, 54.7, 55.8, "a3"),
          go(48, 4),
        ],
        panel: {
          name: "Volume (illustration)",
          kind: "bars",
          series: [{ values: [3, 3, 3.5, 3, 4, 9, 10, 9.5, 5, 4, 4, 3.5] }],
        },
        marks: [{ at: "a3", y: 56.6, text: "big effort, no result", dir: "down", tone: "warn" }],
        steps: [
          { upTo: 4, text: "A normal rally: volume and progress match." },
          {
            upTo: "a3",
            text: "Three candles on huge volume, yet price barely moves. Someone is absorbing the buying.",
          },
          { upTo: 99, text: "The buyers run out and price drops." },
        ],
      }),
    },
    {
      term: "Cause and effect",
      meaning:
        "A longer, wider range builds a bigger 'cause', which can lead to a bigger move afterwards (the 'effect'). Wyckoff traders estimate targets by counting the width of the range, traditionally with point-and-figure charts.",
      spot: "Compare range lengths: a range that lasted weeks has more potential than one that lasted hours. Use it to set expectations, not exact targets.",
      tv: "Point & Figure is available as a chart type if you want to try the classic count.",
      caution:
        "The estimates are loose. Treat a count as one input next to real liquidity targets.",
      visual: scene({
        start: 50,
        items: [
          go(54, 3),
          go(49, 3),
          go(54.5, 3),
          go(49.5, 3),
          go(54, 3, "rend"),
          go(70, 6, "eff"),
        ],
        zones: [{ from: 0, to: "rend", top: 55.2, bottom: 48.6, tone: "primary", label: "cause" }],
        marks: [{ at: "eff", y: 70.5, text: "effect", dir: "down", tone: "bull" }],
        steps: [
          { upTo: "rend", text: "A long range builds: the cause." },
          {
            upTo: 99,
            text: "The move out of it is the effect. Longer ranges tend to fuel larger moves.",
          },
        ],
      }),
    },
  ],
};

export const CH_CANDLES: BreakthroughChapter = {
  id: "bt-08-candles",
  title: "Candlestick language",
  topic: "market_structure",
  summary:
    "What a single candle can and can't tell you, and the named patterns you'll see everywhere.",
  mistake:
    "Trading a named candle pattern in the middle of nowhere because the name sounds reliable.",
  terms: [
    {
      term: "Close location and body size",
      meaning:
        "Where a candle closes inside its own range tells you who won that period. A close near the high means buyers held control to the end; a close near the low means sellers did. A big body relative to the range shows conviction.",
      spot: "Split the candle's range into thirds. Top third close: strong. Middle: undecided. Bottom third after a push up: rejected.",
      caution:
        "One candle covers one slice of time. On a lower timeframe the same move might look completely different.",
      visual: scene({
        items: [k(50, 60, 49.5, 59.4, "a"), k(54, 60, 50, 55, "b"), k(58, 60, 50, 51, "c")],
        marks: [
          { at: "a", y: 60, text: "strong", dir: "down", tone: "bull" },
          { at: "b", y: 60, text: "undecided", dir: "down", tone: "muted" },
          { at: "c", y: 60, text: "rejected", dir: "down", tone: "bear" },
        ],
        steps: [
          {
            upTo: "a",
            text: "Closed at the very top of its range: buyers held control to the end.",
          },
          { upTo: "b", text: "Closed in the middle: neither side won." },
          {
            upTo: "c",
            text: "Reached 60 but closed near the low: sellers won the period, despite the high.",
          },
        ],
      }),
    },
    {
      term: "Pin bars",
      aka: "hammer, shooting star, hanging man, inverted hammer",
      meaning:
        "A small body with one long wick, commonly at least twice the body. A hammer has a long lower wick at a low; a shooting star has a long upper wick at a high. The same shapes in the opposite place are called hanging man (at a high) and inverted hammer (at a low).",
      spot: "The long wick shows where price went and got pushed back. It matters most at a level, after a sweep.",
      tv: "Some built-in candlestick pattern indicators can label hammers and shooting stars for practice.",
      caution: "A pin bar against a strong trend often just marks a pause.",
      visual: scene({
        start: 60,
        items: [
          go(50.5, 4),
          k(50.5, 51.2, 45, 50.9, "hammer"),
          go(58, 4),
          k(58.2, 63, 57.8, 58.6, "star"),
          go(52, 3),
        ],
        marks: [
          { at: "hammer", y: 45, text: "hammer", dir: "up", tone: "bull" },
          { at: "star", y: 63, text: "shooting star", dir: "down", tone: "bear" },
        ],
        steps: [
          {
            upTo: "hammer",
            text: "After a drop: a long lower wick and a small body near the top. A hammer.",
          },
          {
            upTo: "star",
            text: "After a rally: a long upper wick and a small body near the bottom. A shooting star.",
          },
          { upTo: 99, text: "Both show rejection. Both needed the level to matter." },
        ],
      }),
    },
    {
      term: "Engulfing candles",
      meaning:
        "A candle whose body completely covers the previous candle's body, in the opposite colour. Bullish engulfing appears after a drop; bearish engulfing after a rise. Some traders require the whole range, wicks included, to be covered.",
      spot: "Strongest when it also takes the previous candle's low (or high) first, which makes it a small sweep and reclaim.",
      caution:
        "On low timeframes engulfing candles are everywhere. Location matters more than the pattern.",
      visual: scene({
        start: 60,
        items: [
          go(52, 4),
          k(52, 52.4, 50, 50.5, "small"),
          k(50.2, 55.5, 49.6, 55, "eng"),
          go(58, 3),
          k(58, 59, 57.5, 58.8),
          k(59, 59.4, 53.5, 54, "beng"),
          go(51, 3),
        ],
        marks: [
          { at: "eng", y: 49.6, text: "bullish engulfing", dir: "up", tone: "bull" },
          { at: "beng", y: 59.4, text: "bearish engulfing", dir: "down", tone: "bear" },
        ],
        steps: [
          { upTo: "small", text: "A small down candle at the end of a drop." },
          {
            upTo: "eng",
            text: "The next candle dips below it, then closes above its whole body: bullish engulfing.",
          },
          { upTo: 99, text: "The mirror at the top: bearish engulfing." },
        ],
      }),
    },
    {
      term: "Doji family",
      aka: "standard, long-legged, dragonfly, gravestone",
      meaning:
        "A doji opens and closes at almost the same price: indecision. Long-legged doji have long wicks both ways. A dragonfly has a long lower wick; a gravestone has a long upper wick.",
      spot: "A doji says 'balance for now'. The next candle decides which side won.",
      caution: "A doji in the middle of a range means nothing at all.",
      visual: scene({
        items: [
          k(50, 52, 48, 50.05, "d1"),
          k(50, 55, 45, 50, "d2"),
          k(50, 50.2, 45, 50.1, "d3"),
          k(50, 55, 49.8, 49.95, "d4"),
        ],
        marks: [
          { at: "d1", y: 45.5, text: "standard", dir: "up", tone: "muted" },
          { at: "d2", y: 44.6, text: "long-legged", dir: "up", tone: "muted" },
          { at: "d3", y: 55.2, text: "dragonfly", dir: "down", tone: "muted" },
          { at: "d4", y: 44.6, text: "gravestone", dir: "up", tone: "muted" },
        ],
        steps: [
          { upTo: "d1", text: "Standard doji: open and close nearly equal, short wicks." },
          { upTo: "d2", text: "Long-legged: big moves both ways, still closing where it opened." },
          {
            upTo: "d3",
            text: "Dragonfly: sellers pushed far down and buyers brought it all back.",
          },
          { upTo: "d4", text: "Gravestone: buyers pushed far up and sellers brought it all back." },
        ],
      }),
    },
    {
      term: "Inside and outside bars",
      meaning:
        "An inside bar's high and low sit within the previous candle (the 'mother bar'): compression. An outside bar's range is bigger than the previous candle's on both ends: expansion.",
      spot: "Traders mark the mother bar's high and low and watch which side breaks first. Outside bars at a level often act like engulfing candles.",
      caution: "Breakouts from inside bars fail often, especially mid-range.",
      visual: scene({
        start: 50,
        items: [
          go(52, 3),
          k(52, 58, 51, 57, "mother"),
          k(56.5, 57.5, 53, 54, "inside"),
          go(55, 2),
          k(55, 56, 53.5, 54),
          k(54, 57.2, 52.5, 56.8, "outside"),
          go(60, 3),
        ],
        zones: [
          { from: "mother", to: "inside", top: 58, bottom: 51, tone: "muted", label: "mother" },
        ],
        marks: [
          { at: "inside", y: 52.6, text: "inside", dir: "up", tone: "primary" },
          { at: "outside", y: 57.4, text: "outside", dir: "down", tone: "primary" },
        ],
        steps: [
          { upTo: "mother", text: "A big mother bar." },
          {
            upTo: "inside",
            text: "The next candle stays inside its range: an inside bar, compression.",
          },
          {
            upTo: "outside",
            text: "Later, a candle exceeds the previous one on both ends: an outside bar, expansion.",
          },
          { upTo: 99, text: "Compression often comes before expansion." },
        ],
      }),
    },
    {
      term: "Morning star and evening star",
      meaning:
        "Three-candle reversals. Morning star: a long down candle, a small candle (the 'star'), then a long up candle that closes above the middle of the first one. Evening star is the mirror at a top.",
      spot: "Check the third candle's close against the first candle's midpoint. Below the midpoint, the pattern isn't complete.",
      caution:
        "Rare in clean form on forex charts, where candles rarely gap. Judge it by the close of candle three.",
      visual: scene({
        start: 62,
        items: [
          go(56, 3),
          k(56, 56.4, 50, 50.5, "c1"),
          k(50, 50.8, 48.6, 49.6, "star"),
          k(49.8, 55.5, 49.5, 55, "c3"),
          go(58, 3),
        ],
        lines: [{ y: 53.25, from: "c1", to: "c3", label: "midpoint", labelAt: "start" }],
        marks: [{ at: "star", y: 48.6, text: "star", dir: "up", tone: "primary" }],
        steps: [
          { upTo: "c1", text: "A long down candle." },
          { upTo: "star", text: "A small candle: the selling stalls." },
          {
            upTo: "c3",
            text: "A long up candle closes above the first candle's midpoint: morning star complete.",
          },
          { upTo: 99, text: "Price follows through." },
        ],
      }),
    },
    {
      term: "Location beats pattern",
      meaning:
        "A candle pattern only means something at a meaningful place: after a sweep, at a zone, at a range edge, with the next candle confirming. The same hammer in the middle of a range is decoration.",
      spot: "Before naming a pattern, name the location. No location, no pattern.",
      caution: "This one rule removes most bad candlestick trades.",
      visual: scene({
        start: 55,
        items: [
          go(58, 2),
          go(52.5, 2),
          k(53, 53.6, 50.4, 53.3, "h1"),
          go(58, 3),
          go(50.5, 3),
          k(50.5, 51, 46.5, 50.8, "h2"),
          go(58, 4),
        ],
        lines: [{ y: 48, label: "support", labelAt: "start" }],
        marks: [
          { at: "h1", y: 53.6, text: "no context", dir: "down", tone: "muted" },
          { at: "h2", y: 46.5, text: "sweep + hammer", dir: "up", tone: "bull" },
        ],
        steps: [
          { upTo: "h1", text: "A hammer in the middle of nowhere. It means very little." },
          {
            upTo: "h2",
            text: "The same shape after sweeping below support and closing back above it.",
          },
          { upTo: 99, text: "Same pattern, different location, very different meaning." },
        ],
      }),
    },
  ],
};

export const CH_PATTERNS: BreakthroughChapter = {
  id: "bt-09-patterns",
  title: "Chart patterns",
  topic: "support_resistance",
  summary:
    "Doubles, head and shoulders, triangles, flags, wedges and channels, plus what a failed pattern tells you.",
  mistake:
    "Seeing a pattern only after the move, then expecting to spot it in real time just as easily.",
  terms: [
    {
      term: "Double top and double bottom",
      meaning:
        "Two failed attempts at the same level. A double top is confirmed when price closes below the neckline (the low between the two tops). The rough target is the height of the pattern, measured down from the neckline.",
      spot: "Wait for the neckline close. Before that, it's just two highs.",
      caution:
        "Equal highs are also obvious liquidity, so price often pokes above the second top before turning. That's the SMC view of the same shape.",
      visual: scene({
        start: 45,
        items: [
          go(57.8, 4),
          k(57.8, 58.5, 56.6, 57, "t1"),
          go(53, 2),
          k(53, 53.4, 51.8, 52.2, "neck"),
          go(57.6, 3),
          k(57.6, 58.4, 56.4, 56.8, "t2"),
          go(53, 2),
          k(53, 53.2, 50.6, 51, "brk"),
          go(52.4, 2),
          go(45.2, 4),
        ],
        lines: [
          { y: 58.5, from: "t1", to: "t2", label: "two tops" },
          { y: 51.8, from: "neck", label: "neckline" },
          { y: 45.1, from: "brk", label: "target", tone: "primary" },
        ],
        steps: [
          { upTo: "t2", text: "Two tops at the same level." },
          { upTo: "brk", text: "A close below the neckline confirms the double top." },
          {
            upTo: 99,
            text: "Measured target: the pattern's height (about 6.7) projected down from the neckline.",
          },
        ],
      }),
    },
    {
      term: "Head and shoulders",
      aka: "inverse head and shoulders",
      meaning:
        "Three peaks with the middle one highest, and a neckline joining the lows between them. A close below the neckline signals a possible reversal; the rough target is the head-to-neckline distance projected down. The inverse version marks bottoms.",
      spot: "The right shoulder failing below the head is the first warning. The neckline break is the confirmation.",
      tv: "Left toolbar, patterns, Head and Shoulders tool.",
      caution:
        "Necklines often get retested, and many breaks fail. Don't sell the right shoulder before the break.",
      visual: scene({
        start: 45,
        items: [
          go(55, 3),
          k(55, 56, 53.5, 54, "ls"),
          go(50.5, 2),
          k(50.5, 51, 50, 50.4, "n1"),
          go(60, 3),
          k(60, 61, 58.5, 59, "head"),
          go(51, 3),
          k(51, 51.4, 50, 50.6),
          go(55.5, 2),
          k(55.5, 56.2, 54.2, 54.6, "rs"),
          go(49.5, 3, "brk"),
          go(51, 2),
          go(41, 4),
        ],
        lines: [
          { y: 50, from: "n1", label: "neckline", labelAt: "start" },
          { y: 39, from: "brk", label: "target", tone: "primary" },
        ],
        marks: [
          { at: "ls", y: 56, text: "left", dir: "down", tone: "muted" },
          { at: "head", y: 61, text: "head", dir: "down", tone: "muted" },
          { at: "rs", y: 56.2, text: "right", dir: "down", tone: "muted" },
        ],
        steps: [
          { upTo: "head", text: "Left shoulder, then a higher head." },
          { upTo: "rs", text: "The right shoulder fails lower: buyers are weakening." },
          { upTo: "brk", text: "A close below the neckline confirms the pattern." },
          { upTo: 99, text: "A retest of the neckline, then the move toward the measured target." },
        ],
      }),
    },
    {
      term: "Triangles",
      aka: "ascending, descending, symmetrical",
      meaning:
        "Price squeezes between two converging lines. Ascending: flat top, rising lows. Descending: flat bottom, falling highs. Symmetrical: both lines slope toward each other.",
      spot: "Rising lows under a flat top show buyers stepping in earlier each time, and the flat top holds the stops. Wait for a close outside the triangle.",
      tv: "Left toolbar, patterns, Triangle Pattern, or two trend lines.",
      caution:
        "False breakouts from triangles are common. A break that closes back inside is a sweep, not a breakout.",
      visual: scene({
        start: 48,
        items: [
          go(58, 3, "t1"),
          go(50, 3, "l1"),
          go(57.9, 3),
          go(52, 2, "l2"),
          go(58, 2),
          go(54, 2, "l3"),
          go(57.8, 1),
          k(57.8, 62, 57.6, 61.6, "brk"),
          go(64, 3),
        ],
        lines: [
          { y: 58.4, from: "t1", to: "brk", label: "flat top" },
          { y: 49.6, y2: 53.6, from: "l1", to: "l3" },
        ],
        marks: [{ at: "brk", y: 62, text: "breakout", dir: "down", tone: "bull" }],
        steps: [
          { upTo: "l1", text: "A high, then a pullback." },
          {
            upTo: "l3",
            text: "The top stays flat while each low is higher: an ascending triangle.",
          },
          {
            upTo: 99,
            text: "Price closes above the flat top and the stops resting there fuel the breakout.",
          },
        ],
      }),
    },
    {
      term: "Flags and pennants",
      meaning:
        "A short, tight pullback after a strong move (the flagpole). A flag slopes gently against the move; a pennant is a small symmetrical triangle. Both are continuation patterns. The rough target is the pole's length added to the breakout point.",
      spot: "The pullback should be small and orderly compared with the pole, and should not retrace most of it.",
      caution:
        "A 'flag' that retraces more than about half the pole is just a reversal in progress.",
      visual: scene({
        start: 45,
        items: [
          go(47, 2),
          go(60, 3, "pole", 0.2),
          go(58, 2, "f1"),
          go(59, 1),
          go(56.8, 2),
          go(57.6, 1),
          go(55.8, 2, "f2"),
          k(55.8, 61, 55.6, 60.6, "brk"),
          go(70, 4),
        ],
        lines: [
          { y: 60.6, y2: 58.4, from: "pole", to: "f2" },
          { y: 57.4, y2: 55.2, from: "f1", to: "f2" },
          { y: 71, from: "brk", label: "pole length added", tone: "primary" },
        ],
        steps: [
          { upTo: "pole", text: "A strong move up: the flagpole." },
          { upTo: "f2", text: "A small, orderly pullback between two parallel lines: the flag." },
          {
            upTo: 99,
            text: "Breakout. The rough target is the pole's height added to the breakout.",
          },
        ],
      }),
    },
    {
      term: "Wedges",
      aka: "rising wedge, falling wedge",
      meaning:
        "Two lines sloping the same way and converging. A rising wedge (both lines up, narrowing) is usually read as bearish: each push gains less. A falling wedge is the mirror and usually read as bullish.",
      spot: "The lower line in a rising wedge is steeper than the upper: lows rise faster than highs, so momentum is fading. Wait for the break of the lower line.",
      caution: "Wedges can keep grinding for a long time. The break is the signal, not the shape.",
      visual: scene({
        start: 45,
        items: [
          go(52, 3, "h1"),
          go(48, 2, "l1"),
          go(55, 3, "h2"),
          go(52, 2, "l2"),
          go(57, 2, "h3"),
          go(55, 2, "l3"),
          go(57.6, 1, "h4"),
          k(57.6, 58, 51.5, 52, "brk"),
          go(47, 4),
        ],
        lines: [
          { y: 52.6, y2: 58.1, from: "h1", to: "h4" },
          { y: 47.6, y2: 54.6, from: "l1", to: "l3" },
        ],
        marks: [{ at: "brk", y: 51.5, text: "break", dir: "up", tone: "bear" }],
        steps: [
          { upTo: "h2", text: "Price rises in pushes." },
          { upTo: "h4", text: "Each push gains less, and the lines converge: a rising wedge." },
          { upTo: 99, text: "The lower line breaks and price drops." },
        ],
      }),
    },
    {
      term: "Channels and trendlines",
      meaning:
        "A trendline joins at least two swing lows (in an uptrend) or highs (in a downtrend); a third touch confirms it. A channel adds a parallel line on the other side.",
      spot: "Draw through wicks or bodies consistently. Steeper lines break sooner. A clean line also collects stops just beyond it, which SMC calls trendline liquidity.",
      tv: "Trend Line and Parallel Channel tools in the left toolbar. Hold the anchor on swing points, not random candles.",
      caution:
        "Two points always make a line. Trendlines are the most subjective drawing on a chart.",
      visual: scene({
        start: 40,
        items: [
          go(46, 3),
          go(43, 2),
          go(50, 3),
          go(47, 2),
          go(54, 3),
          go(51, 2),
          go(57.5, 3),
          go(52.6, 2, "brk"),
          go(48.5, 3),
        ],
        lines: [
          { y: 42.6, y2: 54.6, from: 4, to: 19 },
          { y: 46.6, y2: 58.6, from: 2, to: 17 },
        ],
        marks: [{ at: "brk", y: 52.4, text: "trendline break", dir: "up", tone: "bear" }],
        steps: [
          { upTo: 9, text: "Two rising lows give a trendline." },
          {
            upTo: 17,
            text: "A third touch confirms it, and a parallel line through the highs makes a channel.",
          },
          {
            upTo: 99,
            text: "Eventually the line breaks: the stops below it get hit and the trend weakens.",
          },
        ],
      }),
    },
    {
      term: "Failed patterns",
      meaning:
        "When a pattern triggers and then quickly reverses, the trapped traders become fuel for the opposite move. A double top that breaks its neckline and then reclaims it can lead to a strong rally.",
      spot: "A break that closes back inside the pattern within a few candles is information, just like a sweep.",
      caution:
        "Pattern books show the winners. Failures are common, so always know where the pattern is proven wrong.",
      visual: scene({
        start: 45,
        items: [
          go(57.8, 4),
          k(57.8, 58.5, 56.6, 57, "t1"),
          go(53, 2),
          k(53, 53.4, 51.8, 52.2, "neck"),
          go(57.6, 3),
          k(57.6, 58.4, 56.4, 56.8, "t2"),
          go(53, 2),
          k(53, 53.2, 50.2, 50.6, "brk"),
          k(50.6, 54.5, 50.4, 54.2, "reclaim"),
          go(64, 5),
        ],
        lines: [
          { y: 51.8, from: "neck", label: "neckline" },
          { y: 58.5, from: "t1", label: "tops", labelAt: "start" },
        ],
        marks: [
          { at: "brk", y: 50.2, text: "break", dir: "up", tone: "bear" },
          { at: "reclaim", y: 54.6, text: "reclaimed", dir: "down", tone: "bull" },
        ],
        steps: [
          { upTo: "t2", text: "A textbook double top." },
          { upTo: "brk", text: "The neckline breaks. Sellers pile in." },
          {
            upTo: "reclaim",
            text: "The next candle closes back above the neckline. The pattern has failed.",
          },
          { upTo: 99, text: "Trapped sellers buy back, and price rallies through both tops." },
        ],
      }),
    },
  ],
};

export const CH_INDICATORS: BreakthroughChapter = {
  id: "bt-10-indicators",
  title: "Indicators you'll meet on TradingView",
  topic: "volume",
  summary:
    "Moving averages, VWAP, RSI, MACD, Bollinger Bands, ATR and volume profile, and how not to drown in them.",
  mistake:
    "Stacking five indicators that all measure the same momentum and calling it confirmation.",
  terms: [
    {
      term: "Moving averages",
      aka: "SMA, EMA, golden cross, death cross",
      meaning:
        "A simple moving average (SMA) averages the last N closes equally. An exponential moving average (EMA) weights recent closes more, so it reacts faster. Common lengths: 9 or 20 for short-term trend, 50, and 200 for the long-term backdrop.",
      spot: "Price above a rising average is a bullish backdrop; below a falling one is bearish. A 50 crossing above the 200 is called a golden cross; below is a death cross.",
      tv: "Indicators, search 'Moving Average' or 'Moving Average Exponential', then set the length in settings.",
      caution:
        "Averages lag by design. Crossovers usually arrive after a good part of the move is done.",
      visual: scene({
        start: 40,
        items: [go(60, 14), go(54, 6), go(66, 10), go(50, 12)],
        series: (c) => [
          { name: "EMA 9", values: ema(closes(c), 9), tone: "primary" },
          { name: "SMA 21", values: sma(closes(c), 21), tone: "muted" },
        ],
        steps: [
          { upTo: 19, text: "Price trends up above both averages." },
          {
            upTo: 31,
            text: "A pullback and a new high: the fast average stays above the slow one.",
          },
          {
            upTo: 99,
            text: "The trend turns. The fast average crosses below the slow one, late but clear.",
          },
        ],
      }),
    },
    {
      term: "VWAP and anchored VWAP",
      meaning:
        "VWAP (volume-weighted average price) is the average price paid since the session started, weighted by volume. Anchored VWAP starts the calculation from a point you choose, such as a swing low or a news candle. Many large traders measure their fills against VWAP.",
      spot: "Above VWAP, buyers are paying up; below it, sellers are in control. Anchor a VWAP to the low that started a move and watch whether pullbacks respect it.",
      tv: "Indicators, search 'VWAP'. Anchored VWAP is also available as a tool you click onto a candle.",
      caution:
        "On forex and CFD feeds VWAP uses tick volume. It's most meaningful on stocks, futures and crypto exchanges.",
      visual: scene({
        start: 50,
        items: [go(53, 5), go(47, 6, "low"), go(56, 8), go(52, 4, "pb"), go(59, 6)],
        series: (c) => [
          { name: "Session VWAP", values: vwap(c, 0), tone: "muted" },
          { name: "VWAP anchored at the low", values: vwap(c, 10), tone: "primary" },
        ],
        marks: [{ at: "pb", y: 51.4, text: "holds anchored VWAP", dir: "up", tone: "bull" }],
        steps: [
          { upTo: "low", text: "The session VWAP tracks the average price paid since the open." },
          { upTo: 23, text: "Anchor a second VWAP to the low that started the rally." },
          { upTo: 99, text: "The pullback finds buyers near the anchored VWAP." },
        ],
      }),
    },
    {
      term: "RSI",
      aka: "relative strength index",
      meaning:
        "A momentum gauge from 0 to 100 (default length 14) comparing average gains with average losses. Above 70 is called overbought and below 30 oversold.",
      spot: "In strong trends RSI can stay above 70 or below 30 for a long time. Many traders use it for divergence and for the 50 line as a trend filter, not as a reversal signal.",
      tv: "Indicators, search 'Relative Strength Index'.",
      caution:
        "'Overbought' is not a sell signal. Shorting every RSI 70 in an uptrend is a classic way to lose.",
      visual: scene({
        start: 41,
        items: [
          go(42, 7, undefined, 0.9),
          go(40, 7, undefined, 0.9),
          go(62, 16, "rally"),
          go(58, 4),
          go(64, 6, "push2"),
          go(48, 12),
        ],
        panel: (c) => ({
          name: "RSI 14",
          kind: "line",
          series: [{ values: rsi(closes(c), 14), tone: "primary" }],
          levels: [30, 70],
          domain: [0, 100],
        }),
        steps: [
          {
            upTo: "rally",
            text: "A strong rally pushes RSI above 70: overbought, and price keeps rising anyway.",
          },
          { upTo: "push2", text: "Momentum stays high through the next push." },
          {
            upTo: 99,
            text: "Only when the trend turns does RSI fall back through 50 and toward 30.",
          },
        ],
      }),
    },
    {
      term: "Divergence",
      aka: "regular and hidden divergence",
      meaning:
        "When price and an oscillator disagree. Regular bearish divergence: price makes a higher high, the oscillator a lower high (momentum fading). Regular bullish is the mirror at lows. Hidden divergence points the other way and is read as trend continuation: price makes a higher low while the oscillator makes a lower low.",
      spot: "Compare swing to swing, not candle to candle. Mark both price swings and both oscillator swings.",
      tv: "Some built-in and community RSI/MACD scripts mark divergences automatically. Check them by eye.",
      caution:
        "Divergence can repeat several times while the trend continues. Treat it as a warning; wait for structure to confirm.",
      visual: scene({
        start: 40,
        items: [go(55, 6, "h1"), go(48, 4), go(57, 6, "h2", 0.2), go(49, 4)],
        lines: [{ y: 55.6, y2: 57.6, from: "h1", to: "h2" }],
        panel: {
          name: "RSI",
          kind: "line",
          series: [
            {
              values: [
                45, 52, 60, 66, 71, 75, 62, 52, 47, 45, 50, 54, 57, 60, 62, 64, 55, 47, 42, 38,
              ],
              tone: "primary",
            },
          ],
          levels: [30, 70],
          domain: [20, 85],
        },
        marks: [{ at: "h2", y: 57.6, text: "higher high", dir: "down", tone: "warn" }],
        steps: [
          { upTo: "h1", text: "Price makes a high; RSI peaks above 70." },
          {
            upTo: "h2",
            text: "Price makes a higher high, but RSI only reaches the low 60s: a lower high. Regular bearish divergence.",
          },
          { upTo: 99, text: "Momentum was fading. Price rolls over." },
        ],
      }),
    },
    {
      term: "MACD",
      meaning:
        "The MACD line is the 12-period EMA minus the 26-period EMA. The signal line is a 9-period EMA of the MACD line. The histogram shows the gap between them. Crosses and zero-line crosses mark momentum shifts.",
      spot: "A shrinking histogram shows momentum fading before the lines cross. The zero line separates bullish and bearish momentum.",
      tv: "Indicators, search 'MACD'. Default settings 12, 26, 9.",
      caution:
        "Built from moving averages, so it lags. It describes momentum; it doesn't predict it.",
      visual: scene({
        start: 41,
        items: [
          go(42, 12, undefined, 0.9),
          go(40, 12, undefined, 0.9),
          go(46, 8),
          go(62, 12, "top"),
          go(56, 8, "fade"),
          go(44, 12),
        ],
        panel: (c) => {
          const m = macd(closes(c));
          return {
            name: "MACD 12 26 9",
            kind: "hist",
            series: [
              { values: m.hist },
              { name: "MACD", values: m.line, tone: "primary" },
              { name: "Signal", values: m.signal, tone: "muted" },
            ],
          };
        },
        steps: [
          {
            upTo: "top",
            text: "As the rally builds, MACD rises above its signal line and above zero.",
          },
          {
            upTo: "fade",
            text: "The histogram shrinks and flips: momentum fades while price is still high.",
          },
          {
            upTo: 99,
            text: "MACD crosses below the signal line and then below zero as the drop develops.",
          },
        ],
      }),
    },
    {
      term: "Bollinger Bands",
      meaning:
        "A 20-period simple moving average with bands two standard deviations above and below. Bands widen when volatility rises and narrow in quiet periods (a 'squeeze').",
      spot: "A squeeze often comes before a bigger move, without saying which direction. In strong trends price can 'walk the band' for a long time.",
      tv: "Indicators, search 'Bollinger Bands'. Defaults: length 20, standard deviation 2.",
      caution: "A touch of the outer band is not a reversal signal by itself.",
      visual: scene({
        start: 47,
        items: [
          go(48, 6, undefined, 0.9),
          go(45, 6, undefined, 0.9),
          go(52, 10),
          go(48, 6),
          go(50, 4, undefined, 0.3),
          go(49, 4, undefined, 0.3),
          go(50, 4, "sq", 0.3),
          go(62, 8, "exp"),
          go(60, 3),
        ],
        series: (c) => {
          const b = stdevBands(closes(c), 20, 2);
          return [
            { name: "Upper band", values: b.up, tone: "muted" },
            { name: "SMA 20", values: b.mid, tone: "primary", dashed: true },
            { name: "Lower band", values: b.dn, tone: "muted" },
          ];
        },
        steps: [
          { upTo: "sq", text: "Price goes quiet and the bands pinch together: a squeeze." },
          {
            upTo: "exp",
            text: "A breakout. The bands widen fast and price walks along the upper band.",
          },
          { upTo: 99, text: "The squeeze said 'a move is coming'. It never said which way." },
        ],
      }),
    },
    {
      term: "ATR",
      aka: "average true range",
      meaning:
        "The average size of a candle's true range over N periods (default 14). True range is the largest of high minus low, or the gap from the previous close to today's high or low. It measures volatility in price units.",
      spot: "Use it for stop distance (for example 1 to 2 × ATR beyond the invalidation), to filter tiny gaps, and to size positions in volatile markets.",
      tv: "Indicators, search 'Average True Range'.",
      caution: "ATR tells you how much price moves, never which direction.",
      visual: scene({
        start: 50,
        items: [
          go(52, 6, undefined, 0.3),
          go(50, 6, undefined, 0.3),
          go(51, 6, "quiet", 0.3),
          go(60, 4, "wild", 1.2),
          go(48, 5, undefined, 1.2),
          go(56, 5, undefined, 1.2),
        ],
        panel: (c) => ({
          name: "ATR 14",
          kind: "line",
          series: [{ values: atr(c, 14), tone: "primary" }],
        }),
        steps: [
          { upTo: "quiet", text: "Small candles: ATR is low." },
          { upTo: "wild", text: "Volatility arrives. Candles grow and ATR climbs." },
          {
            upTo: 99,
            text: "A stop that fit the quiet period would be far too tight now. ATR shows that in numbers.",
          },
        ],
      }),
    },
    {
      term: "Volume profile",
      aka: "POC, value area, HVN, LVN",
      meaning:
        "A sideways histogram showing how much traded at each price. The point of control (POC) is the price with the most volume. The value area holds about 70% of the volume, bounded by VAH (high) and VAL (low). High-volume nodes (HVN) show acceptance; low-volume nodes (LVN) are prices crossed quickly.",
      spot: "Price tends to slow down at high-volume nodes and travel quickly through low-volume ones. Value area edges often act as reaction levels.",
      tv: "Visible Range, Fixed Range and Session Volume Profile. Which ones you get depends on your plan.",
      caution:
        "Profiles built on tick volume (forex, CFDs) are approximations. In ChartPilot's tests on 2019–2022 15-minute data for five symbols, fading back to the POC, the 80% rule and value-area breakouts all lost after costs. Use the levels as context, not as signals.",
      visual: scene({
        start: 52,
        items: [
          go(55, 3),
          go(50, 3),
          go(53, 3),
          go(51, 3),
          go(57, 3),
          go(52, 3),
          go(54, 3),
          go(49, 3),
          go(52.5, 3),
        ],
        profile: {
          bins: [
            { top: 58, bottom: 57, w: 1 },
            { top: 57, bottom: 56, w: 2 },
            { top: 56, bottom: 55, w: 4 },
            { top: 55, bottom: 54, w: 6 },
            { top: 54, bottom: 53, w: 8 },
            { top: 53, bottom: 52, w: 10 },
            { top: 52, bottom: 51, w: 7 },
            { top: 51, bottom: 50, w: 5 },
            { top: 50, bottom: 49, w: 2 },
            { top: 49, bottom: 48, w: 1 },
          ],
        },
        lines: [
          { y: 55, label: "VAH", labelAt: "start" },
          { y: 52.5, label: "POC", tone: "primary", labelAt: "start" },
          { y: 50, label: "VAL", labelAt: "start" },
        ],
        steps: [
          {
            upTo: 99,
            text: "Most trading happened around 52 to 53: the point of control. The value area (about 70% of volume) runs from 50 to 55. Thin rows at the edges are low-volume prices.",
          },
        ],
      }),
    },
    {
      term: "Indicator hygiene",
      meaning:
        "Most indicators are formulas of the same price (and volume). RSI, Stochastic and MACD all measure momentum from the same closes. Three of them agreeing is one piece of evidence, not three. Some scripts also repaint: their past signals change after the fact.",
      spot: "Keep one indicator per job: one for trend, one for momentum, one for volatility. Check any new script in Bar Replay to see whether old signals move.",
      caution:
        "A chart covered in indicators feels thorough and usually hides the price action that matters.",
      visual: flow({
        nodes: [
          {
            label: "Price closes",
            note: "The raw input. Every momentum indicator is calculated from these.",
            tone: "primary",
          },
          {
            label: "RSI, Stochastic, MACD",
            note: "Three formulas run on the same closes. When they agree, it's because they share an input.",
          },
          {
            label: "One piece of evidence",
            note: "Count it once. Look for evidence of a different kind, such as structure, liquidity or volume.",
            tone: "warn",
          },
          {
            label: "Repaint check in Bar Replay",
            note: "Step candle by candle. If yesterday's signal disappears or moves, the script repaints and its backtest is unreliable.",
            tone: "bear",
          },
        ],
      }),
    },
  ],
};
