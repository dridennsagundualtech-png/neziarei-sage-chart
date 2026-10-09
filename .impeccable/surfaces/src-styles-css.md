---
version: 1
slug: "src-styles-css"
primary_target: "src/styles.css"
related_targets: ["src/components/AppShell.tsx","src/components/ResultView.tsx"]
---

# Surface brief: ChartPilot app (all screens)

Scope: whole app shell and every screen (Home, Analyze + result, Academy, Journal, Settings, Admin). Visitor mode: Operate. Code-led.

## Direction contract

THESIS: Every chart runs the preflight card before a trade is even considered. The app refuses the category default of a near-black dashboard with glowing cards and one neon accent.

OWN-WORLD: Night flight-deck navy ground (#0E141C), flat navy surfaces with hairline rules, checklist yellow (#F4C430) for the one primary action and the active state, condensed caps (Barlow Condensed) for card headers and states, Manrope for everything read, tabular numbers right-aligned. Cards are checklist cards: a header band with a condensed caps title, then ruled challenge-and-response rows. No gradients, no glow.

STORY: The trader sees the verdict first, understands which checklist items passed and which failed in plain words, and only then reads the conditional plan. They leave knowing whether to wait.

FIRST VIEWPORT: Result screen: header with wordmark; the state strip READY / WAIT / NO TRADE across the full width with the active segment filled in its state colour (green / yellow / red); asset, timeframes and score 11/16 under it; then the checklist card, each row name left, mark right (2/2), a one-line note under the name. Primary action (Analyze setup / Save result) is the only yellow button. Mobile bottom tab bar; on desktop the same five tabs sit in the header.

FORM: Preflight Card, my list's top-ranked candidate (IMPECCABLE'S PICK), seed key 399f45b1. Translation: the pinned GO / HOLD / NO-GO becomes READY / WAIT / NO TRADE so the strip never reads as an instruction to trade.

SIGNATURE: the state strip, plus checklist rows that tick in once, in order, when a result lands (reduced motion: instant).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
