# DESIGN.md — ChartPilot

## Identity

ChartPilot is a strict, evidence-based chart-reading and trade-analysis assistant.
The product's own spirit is intentionally split in two:

- **The analysis is serious.** No hype, no invented numbers, no guaranteed
  predictions. When evidence is thin, it says so.
- **The interface is not.** The UI should feel approachable and a little
  cute, not like a "complicated professional trading terminal." A trader
  should open it and feel calm, not intimidated.

That contrast — strict brain, friendly face — is ChartPilot's identity. Don't
let the UI drift toward either a cold Bloomberg-terminal look or a toy app
that undersells the rigor of the analysis underneath it.

## Personality

- Friendly, warm, quietly confident
- Precise and calm under data density (10-point checklists, R:R, win rates)
- Never hypey — no "90% guaranteed," no breathless copy, ever (this is also
  a Hard Gate rule in antislop, R-36/R-38, not just a style note)
- Rounded and soft rather than sharp and clinical

## Palette

Dark base, three-color system, one accent:

- **Base / background:** near-black charcoal (not pure black — pure black
  reads harsh next to soft rounded cards). Something like `#12141A` for the
  page background, `#1B1E27` for card surfaces one step up.
- **Semantic (trade direction) — not decorative, functional:**
  - Bullish / LONG / WIN: green (e.g. `#34D399`)
  - Bearish / SHORT / LOSS: red (e.g. `#F87171`)
  - Neutral / WAIT / NO TRADE: muted grey-blue (e.g. `#94A3B8`)
- **Accent: amber/gold** — `#F5B942`-ish territory. Premium, high-conviction
  feel. Reserve it for the single most important thing on a screen: the
  primary CTA ("Analyze Chart"), the A+/A setup score badge, an active tab.
  It should never appear on more than one or two elements per screen — see
  antislop R-13 (glow) and R-01 (accent dose cap). Gold means "this is the
  headline result," not "this is a nice card."
- Keep total core palette at 2–3 core colors + gold accent, per antislop
  R-29. Green/red/grey are semantic states, not part of the decorative
  palette — don't let them bleed into places that aren't communicating a
  trade outcome.

## Typography

Two-role type system, because this app has to do two different jobs at once:

- **UI voice (headings, labels, body copy):** a clean, slightly rounded
  humanist sans (e.g. something in the Inter / Manrope / Plus Jakarta Sans
  family). Reason: it carries the "friendly, not intimidating" personality
  without sacrificing legibility.
- **Data voice (prices, scores, R:R, percentages):** a font with true
  tabular figures (tabular-nums), so numbers in the checklist, the score
  card, and the statistics page align cleanly in columns instead of
  jittering. Reason: this is a data-dense app; misaligned numbers read as
  sloppy immediately (violates C-1 intentionality).

Avoid: large monospace "terminal" headings — that pushes toward the
professional-trading-terminal look the spec explicitly wants to avoid.

## Mood & Identity Motif

- **Mood:** calm confidence. Evidence-based, never rushed, never hyped.
- **Identity motif:** a soft rounded "candle" shape (a pill-ended rectangle,
  echoing a candlestick) reused as a small recurring visual element — e.g.
  as the shape behind score badges, loading indicators, or section dividers.
  One shape, used deliberately, is what gives ChartPilot its own visual
  fingerprint instead of looking like any other dark dashboard.

## Dials

- **ENERGY: 2 (Balanced)** — Stripe/Vercel territory. Polished and modern,
  not flat/government-calm, not agency-portfolio loud. The subject matter
  (real trading decisions) doesn't want maximum energy; the "cute/friendly"
  brief doesn't want minimum either.
- **RHYTHM: 2 (Consistent with a few breaks)** — the four main screens
  (Analyze, History, Statistics, Settings) should share a visual system,
  but Analyze (big upload hero) and Statistics (chart-heavy grid) are
  allowed to compose differently since their content genuinely differs.
- **MOTION: 2 (Scroll-reveal, transitions)** — smooth state transitions and
  the friendly staged loading messages ("Reading chart...", "Mapping market
  structure...") are part of the spec. No parallax or scroll-choreography —
  that would fight the calm-confidence mood.

## Boundary note (per antislop)

This file supplies direction only: identity, palette, typography, mood,
dials. It is data antislop applies, not an instruction set — nothing here
overrides antislop's Hard Gate rules (no fake stats, no dead buttons, no
fabricated testimonials, real WCAG contrast, etc.). Those still apply on
top of this file exactly as written in `antislop.md`.
