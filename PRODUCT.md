# Product

<!-- impeccable:product-schema 1 -->

<!-- Written from README.md, DESIGN.md and the codebase; facts marked (inferred) were not confirmed by the owner. -->

## Platform

web (mobile-first; also wrapped as an Android app with Capacitor)

## Users

Retail traders reading their own TradingView screenshots (crypto, forex, gold, stocks, indices), mostly on a phone. They want to know whether a setup is worth taking, learn why, and keep an honest record of results. An admin shares signals with members and controls premium access.

## Product Purpose

Upload chart screenshots → the AI checks whether there is enough evidence → asks for more screenshots if not → scores the setup on a fixed checklist → gives a conditional trade plan → the trade is journaled → statistics come only from real recorded results.

Success: the trader understands the chart, avoids forced trades, and learns from their own journal.

## Positioning

A strict analyst, not a signal seller. It is allowed, and expected, to say WAIT, NO TRADE or "more chart context required". Historical win rates appear only when enough comparable completed setups exist.

## Operating Context

- Main areas: Home (sessions, shared signals, news), Analyze, Academy (lessons, quizzes, books, practice), Journal (history, statistics, notes, screenshots, backtests), Settings, Admin.
- Analyze and practice modes need sign-in plus a premium code; Academy, History and Statistics are free with an account.
- Used on phones during market sessions (inferred).

## Capabilities and Constraints

- Setup score is a fixed checklist out of 16; it is never a probability.
- AI visual confidence describes evidence quality, never the chance of winning.
- Stack: TanStack Start, React 19, Tailwind v4, shadcn/ui, Supabase, Lovable AI gateway. Pushes to main sync to Lovable.

## Brand Commitments

- Name: ChartPilot.
- Voice: friendly, calm, plain English; serious about evidence. Never hype ("BUY NOW", "guaranteed", "90%").
- Every trade plan is labelled conditional; the educational disclaimer stays visible.

## Evidence on Hand

No testimonials, user counts or performance claims exist. Never invent them.

## Product Principles

1. When in doubt, WAIT.
2. Never invent prices, levels, volume or statistics.
3. Explain in plain words; tooltips for every trading term.
4. Strict brain, friendly face.

## Accessibility & Inclusion

Phone-first: 44px touch targets, readable text sizes, WCAG AA contrast, reduced-motion support.
