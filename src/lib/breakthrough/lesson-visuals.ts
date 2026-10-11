/**
 * Illustrations for the core Academy lessons (Units 0–7), keyed by lesson id.
 * Chart scenes have one step per lesson step, so the picture advances with the text.
 */
import { go, k } from "./scene";
import { calc, flow, scene, type Visual } from "./types";

const blank = (...upTo: (number | string)[]) => upTo.map((u) => ({ upTo: u, text: "" }));

export const LESSON_VISUALS: Record<string, Visual> = {
  // —— Unit 0: platform & account ——
  "l0-balance-equity": calc("equity"),
  "l0-margin": calc("margin"),
  "l0-leverage": calc("leverage"),
  "l0-lots-pips": calc("pipvalue"),
  "l0-spread-swap": calc("spread"),
  "l0-mt5-tv": flow({
    nodes: [
      {
        label: "TradingView: plan and mark levels",
        note: "Charts, drawings, alerts, replay. Nothing here is an order.",
        tone: "primary",
      },
      {
        label: "MT5 or broker app: place the order",
        note: "Market, limit or stop order, with stop-loss and take-profit attached.",
      },
      { label: "Position open", note: "MT5 shows balance, equity, margin and the live position." },
      {
        label: "ChartPilot: log the result",
        note: "Screenshot, plan, R result and a process grade in your journal.",
        tone: "bull",
      },
    ],
  }),
  "l0-order-types": scene({
    start: 52,
    items: [go(50, 5, "now"), go(46.2, 4, "lim"), go(52, 4), go(55, 4, "stp"), go(57.5, 3)],
    lines: [
      { y: 54, label: "buy stop (above price)", tone: "primary", labelAt: "start" },
      { y: 46, label: "buy limit (below price)", tone: "bull" },
    ],
    marks: [
      { at: "now", y: 51.4, text: "market order fills now", dir: "down", tone: "muted" },
      { at: "lim", y: 45.8, text: "limit fills", dir: "up", tone: "bull" },
      { at: "stp", y: 55.4, text: "stop fills", dir: "down", tone: "primary" },
    ],
    steps: blank("now", "lim", "stp", 99),
  }),

  // —— Unit 1: foundations ——
  "l1-candles": scene({
    items: [k(48, 57, 46, 56, "a"), k(56, 57, 49, 50, "b"), k(50, 58.5, 49.5, 51, "c")],
    marks: [
      { at: "a", y: 57, text: "high", dir: "down", tone: "muted" },
      { at: "a", y: 46, text: "low", dir: "up", tone: "muted" },
      { at: "b", y: 49, text: "closed lower", dir: "up", tone: "bear" },
      { at: "c", y: 58.5, text: "rejected wick", dir: "down", tone: "warn" },
    ],
    steps: blank("a", "c", "c"),
  }),
  "l1-timeframes": flow({
    nodes: [
      {
        label: "Daily / 4H: direction",
        note: "The big picture. Decides which way you are allowed to trade.",
        tone: "primary",
      },
      { label: "1H: the bridge", note: "Where the zone you care about sits." },
      {
        label: "15M / 5M: timing only",
        note: "More noise, more false signals. Never lets it overrule the daily.",
        tone: "warn",
      },
    ],
  }),
  "l1-structure": scene({
    start: 40,
    items: [
      go(48, 3, "h1"),
      go(44, 2, "l1"),
      go(53, 3, "h2"),
      go(49, 2, "l2"),
      go(58, 3, "h3"),
      go(54, 2, "l3"),
      go(59, 3),
    ],
    marks: [
      { at: "h2", y: 53.5, text: "HH", dir: "down", tone: "bull" },
      { at: "l2", y: 48.6, text: "HL", dir: "up", tone: "bull" },
      { at: "h3", y: 58.5, text: "HH", dir: "down", tone: "bull" },
      { at: "l3", y: 53.6, text: "HL", dir: "up", tone: "bull" },
    ],
    steps: blank("l1", "l2", 99),
  }),
  "l1-sr": scene({
    start: 55,
    items: [
      go(45.2, 4, "t1"),
      go(52, 3),
      go(45.4, 3, "t2"),
      go(51, 3),
      go(45.1, 3, "t3"),
      go(53, 4),
    ],
    zones: [{ from: 0, top: 46, bottom: 44, tone: "bull", label: "support zone" }],
    steps: blank("t1", "t2", 99),
  }),
  "l1-volume": scene({
    start: 50,
    items: [
      go(52, 3),
      go(49, 3),
      go(51.5, 3),
      go(49.5, 2),
      k(49.5, 56, 49.3, 55.6, "brk"),
      go(57, 3),
    ],
    panel: {
      name: "Volume",
      kind: "bars",
      series: [{ values: [3, 2.5, 3, 2.6, 2.4, 2.8, 2.5, 2.2, 2.6, 2.3, 2.1, 8, 4, 3.5, 3] }],
    },
    marks: [{ at: "brk", y: 56, text: "breakout on high volume", dir: "down", tone: "bull" }],
    steps: blank(10, "brk", 99),
  }),

  // —— Unit 2: liquidity ——
  "l2-what": scene({
    start: 50,
    items: [
      go(57.6, 3, "h1"),
      go(53, 2),
      go(57.8, 3, "h2"),
      go(53.5, 2),
      go(57.7, 2, "h3"),
      go(55, 2),
    ],
    zones: [
      {
        from: "h1",
        top: 59.6,
        bottom: 58.3,
        tone: "warn",
        label: "stops likely here",
        appear: "h2",
      },
    ],
    steps: blank("h1", "h3", 99),
  }),
  "l2-sides": scene({
    start: 50,
    items: [go(56, 3), go(47, 4), go(55.8, 4), go(47.2, 4), go(51, 3)],
    zones: [
      {
        from: 0,
        top: 58.6,
        bottom: 56.8,
        tone: "primary",
        label: "buy-side liquidity (short stops)",
      },
      {
        from: 0,
        top: 46.4,
        bottom: 44.4,
        tone: "primary",
        label: "sell-side liquidity (long stops)",
        appear: 7,
      },
    ],
    steps: blank(7, 15, 99),
  }),
  "l2-equal": scene({
    start: 55,
    items: [
      go(48.2, 3, "l1"),
      go(53, 2),
      go(48.1, 3, "l2"),
      go(52, 2),
      k(52, 52.3, 46, 48.8, "sw"),
      go(55, 3),
      go(50, 3),
    ],
    lines: [{ y: 48, from: "l1", to: "sw", label: "equal lows" }],
    marks: [{ at: "sw", y: 46, text: "pool taken", dir: "up", tone: "warn" }],
    steps: blank("l2", "sw", 99),
  }),
  "l2-sweeps": scene({
    start: 55,
    items: [
      go(50.6, 4),
      go(52.5, 2),
      k(52.5, 53, 48.5, 49.5, "pen"),
      k(49.5, 52.8, 49.2, 52.4, "rec"),
      go(57, 4),
    ],
    lines: [{ y: 50, label: "level", labelAt: "start" }],
    marks: [
      { at: "pen", y: 48.5, text: "penetration", dir: "up", tone: "warn" },
      { at: "rec", y: 52.8, text: "reclaim close", dir: "down", tone: "bull" },
    ],
    steps: blank("pen", "rec", 99),
  }),

  // —— Unit 3: structure ——
  "l3-bos": scene({
    start: 40,
    items: [
      k(40, 50.3, 39.8, 49.6, "h1"),
      go(45, 3),
      k(45, 52.5, 44.8, 52, "bos"),
      go(49, 3, "ret"),
      go(56, 4),
    ],
    lines: [{ y: 50.3, from: "h1", to: "bos", label: "swing high" }],
    marks: [
      { at: "bos", y: 52.5, text: "BOS (close)", dir: "down", tone: "bull" },
      { at: "ret", y: 48.6, text: "retracement", dir: "up", tone: "primary" },
    ],
    steps: blank(3, "bos", 99),
  }),
  "l3-mss": scene({
    start: 65,
    items: [
      go(56, 3),
      k(56, 60.4, 55.6, 59.8, "lh"),
      go(52, 3),
      k(52, 52.4, 48.6, 50.5, "sw"),
      go(55, 2),
      k(55, 61, 54.8, 60.6, "mss"),
      go(63, 2),
    ],
    lines: [{ y: 60.4, from: "lh", to: "mss", label: "last lower high" }],
    marks: [
      { at: "sw", y: 48.6, text: "sweep", dir: "up", tone: "warn" },
      { at: "mss", y: 61, text: "MSS", dir: "down", tone: "primary" },
    ],
    steps: blank("sw", "mss", 99),
  }),
  "l3-ranges": scene({
    start: 50,
    items: [
      go(55, 3),
      go(46, 3),
      go(54.5, 3),
      k(54.5, 57.5, 54, 54.6, "fb1"),
      go(46.5, 3),
      k(46.5, 47, 43.5, 46.2, "fb2"),
      go(52, 3),
    ],
    lines: [
      { y: 55.6, label: "range high", labelAt: "start" },
      { y: 45.6, label: "range low", labelAt: "start" },
    ],
    marks: [
      { at: "fb1", y: 57.5, text: "false break", dir: "down", tone: "warn" },
      { at: "fb2", y: 43.5, text: "false break", dir: "up", tone: "warn" },
    ],
    steps: blank("fb1", "fb2", 99),
  }),

  // —— Unit 4: price delivery ——
  "l4-displacement": scene({
    start: 50,
    items: [go(52, 8, undefined, 0.8), k(52, 60, 51.8, 59.6, "disp"), go(61, 3)],
    panel: (c) => ({
      name: "Candle range",
      kind: "bars",
      series: [{ values: c.map((x) => x.h - x.l) }],
    }),
    marks: [{ at: "disp", y: 60, text: "far bigger than average", dir: "down", tone: "bull" }],
    steps: blank(7, "disp", 99),
  }),
  "l4-fvg": scene({
    start: 46,
    items: [
      go(50, 3),
      k(50, 51.5, 49.5, 51, "c1"),
      k(51, 58, 50.8, 57.5),
      k(57.5, 59.5, 55, 59, "c3"),
      go(61, 2),
      go(53.4, 3, "ret"),
      go(62, 4),
    ],
    zones: [{ from: "c1", top: 55, bottom: 51.5, tone: "bull", label: "FVG", appear: "c3" }],
    marks: [{ at: "ret", y: 53.2, text: "retracement", dir: "up", tone: "bull" }],
    steps: blank("c3", "ret", 99),
  }),
  "l4-premium": scene({
    items: [k(42, 43, 39.5, 41, "lo"), go(70, 6, "hi"), go(50, 5, "disc"), go(68, 4)],
    zones: [
      { from: "hi", top: 70, bottom: 55, tone: "bear", label: "premium" },
      { from: "hi", top: 55, bottom: 39.5, tone: "bull", label: "discount" },
    ],
    lines: [{ y: 55, from: "hi", label: "midpoint", tone: "primary" }],
    steps: blank("hi", "disc", 99),
  }),

  // —— Unit 5: AMD ——
  "l5-phases": scene({
    start: 50,
    items: [
      go(52, 2),
      go(48.5, 2),
      go(51.5, 2),
      go(49, 2, "acc"),
      k(49, 49.4, 45.5, 46.2, "man"),
      k(46.2, 50.5, 46, 50.2, "rec"),
      go(60, 5),
    ],
    zones: [{ from: 0, to: "acc", top: 52.6, bottom: 48, tone: "muted", label: "accumulation" }],
    marks: [
      { at: "man", y: 45.5, text: "manipulation", dir: "up", tone: "warn" },
      { at: 14, y: 60.4, text: "distribution", dir: "down", tone: "bull" },
    ],
    steps: blank("acc", "rec", 99),
  }),
  "l5-notforcing": scene({
    start: 40,
    items: [go(60, 18, undefined, 0.7)],
    marks: [
      {
        at: 17,
        y: 60.4,
        text: "no range, no false break: not AMD",
        dir: "down",
        tone: "muted",
        appear: 17,
      },
    ],
    steps: blank(6, 12, 99),
  }),

  // —— Unit 6: trade management ——
  "l6-stops": scene({
    start: 55,
    items: [
      go(49, 3),
      k(49, 49.4, 47, 48.4, "sw"),
      k(48.4, 53, 48.2, 52.6, "in"),
      go(51, 3),
      k(51, 51.3, 48.1, 48.2, "inv"),
      go(47.6, 3),
    ],
    lines: [
      { y: 52.6, from: "in", label: "entry", tone: "primary" },
      { y: 48.5, from: "in", label: "invalidation: close below", tone: "warn" },
      { y: 46.4, from: "in", label: "stop (beyond the sweep)", tone: "bear" },
    ],
    marks: [{ at: "inv", y: 51.3, text: "idea broken: exit", dir: "down", tone: "warn" }],
    steps: blank("in", "inv", 99),
  }),
  "l6-targets": scene({
    start: 50,
    items: [
      go(55, 3),
      go(51, 2),
      go(55.1, 2),
      go(48, 3, "in"),
      go(56, 4, "tp1"),
      go(53, 2),
      go(60, 4),
    ],
    lines: [
      { y: 60.3, from: "in", label: "TP2: range high", tone: "bull" },
      { y: 55.5, from: "in", label: "TP1: equal highs", tone: "bull" },
      { y: 48, from: "in", label: "entry", tone: "primary" },
      { y: 46, from: "in", label: "stop", tone: "bear" },
    ],
    steps: blank("in", "tp1", 99),
  }),
  "l6-sizing": calc("sizing"),

  // —— Unit 7: complete setups ——
  "l7-model": scene({
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
      { y: 66, from: "c3", label: "target: next liquidity", tone: "bull" },
      { y: 48, from: "c3", label: "stop beyond the sweep", tone: "bear" },
    ],
    marks: [
      { at: "sw", y: 48.5, text: "sweep", dir: "up", tone: "warn" },
      { at: "entry", y: 56, text: "entry", dir: "down", tone: "primary" },
    ],
    steps: blank("c3", "entry", 99),
  }),
  "l7-notrade": flow({
    layout: "grid",
    nodes: [
      { label: "Evidence insufficient", note: "WAIT. Not enough to judge.", tone: "muted" },
      {
        label: "Evidence conflicting",
        note: "WAIT. Timeframes or signals disagree.",
        tone: "warn",
      },
      {
        label: "Setup invalidated",
        note: "NO TRADE. The level that kills the idea broke.",
        tone: "bear",
      },
      {
        label: "Mid-range, no sweep, unclear chart",
        note: "Stand aside. There is nothing to trade yet.",
        tone: "muted",
      },
    ],
  }),
};
