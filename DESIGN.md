---
name: ChartPilot
description: A strict, evidence-based chart-reading assistant styled as a preflight checklist card.
colors:
  flight-deck: "#0e141c"
  card-navy: "#141c27"
  band-navy: "#1a2431"
  popover-navy: "#18212d"
  rule: "#263345"
  input-edge: "#2c3a4e"
  ink: "#f2f5f9"
  ink-muted: "#9fadbf"
  checklist-yellow: "#f4c430"
  on-yellow: "#10161f"
  ready-green: "#4fd394"
  no-trade-red: "#ff6b5e"
  caution-orange: "#ff9f43"
  neutral-slate: "#93a7c2"
  series-blue: "#6cb6ff"
  series-violet: "#c39bff"
typography:
  display:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.005em"
  band:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "0.95rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.08em"
  body:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: "normal"
  label:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "normal"
rounded:
  sm: "6px"
  md: "9px"
  lg: "12px"
  xl: "14px"
  2xl: "18px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "20px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.checklist-yellow}"
    textColor: "{colors.on-yellow}"
    rounded: "{rounded.xl}"
    height: "44px"
    padding: "0 16px"
  button-secondary:
    backgroundColor: "{colors.band-navy}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    height: "44px"
  button-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.flight-deck}"
    rounded: "{rounded.xl}"
    height: "44px"
  input:
    backgroundColor: "{colors.band-navy}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    height: "44px"
  checklist-card:
    backgroundColor: "{colors.card-navy}"
    rounded: "{rounded.xl}"
  card-band:
    backgroundColor: "{colors.band-navy}"
    typography: "{typography.band}"
    padding: "8px 16px"
---

# Design System: ChartPilot

## Overview

ChartPilot runs every chart through a preflight card before a trade is even considered. The analysis is strict; the face stays calm and plain-spoken. The look borrows four things from aviation checklist cards (type, palette, density and one signature move) and nothing else: navigation, forms and controls stay the standard web ones, so it never becomes a cockpit costume.

Traders use it at night during the London and New York sessions, often on a phone, so the ground is a dark flight-deck navy, not black.

The signature move is the **state strip**: READY / WAIT / NO TRADE across the top of a result, one segment lit in its state colour. It reports where the checklist landed. It is never an instruction to trade, which is why the aviation GO / NO-GO wording became READY / WAIT / NO TRADE.

## Colors

### Primary
- **Checklist yellow** `#f4c430` on **on-yellow** `#10161f`: the one primary action on a screen (Analyze setup, Sign in, Save result), the active bottom tab, the active desktop tab underline, and the WAIT segment of the state strip. Never decoration.

### Neutral
- **Flight deck** `#0e141c` page ground, **card navy** `#141c27` cards, **band navy** `#1a2431` card header bands, inputs and secondary buttons, **rule** `#263345` hairlines.
- **Ink** `#f2f5f9` text, **ink muted** `#9fadbf` secondary text (7:1 on the ground).

### State
- **Ready green** `#4fd394`: READY, potential long, wins, full checklist marks.
- **No-trade red** `#ff6b5e`: NO TRADE, potential short, losses, invalidation, stops.
- **Caution orange** `#ff9f43`: partial marks and warnings. Kept apart from yellow so a warning never looks like the primary action.
- **Neutral slate** `#93a7c2`: WAIT-type directions and unknowns.

### Named Rules
- **One yellow.** If two elements on a screen are yellow, one of them is wrong. Toggles use the white `selected` button, not yellow.
- **States are not decoration.** Green and red only ever mean a trade outcome or verdict. Trading sessions use the series colours (blue, violet, slate, white), never green or red.

## Typography

- **Barlow Condensed** (500/600/700) is the checklist voice: page titles, card header bands in caps, the state strip, big figures (11/16, 2/2).
- **Manrope** (400–800) is everything people read. Body text is tabular-figured app-wide so prices and marks line up.

### Hierarchy
- Page title: Barlow Condensed 700, 36px, one per page, with a 15px Manrope subtitle under it.
- Card band: Barlow Condensed 700, 15px, caps, 0.08em tracking.
- Body 15px; small text never below 12px.

### Named Rules
- **No eyebrows.** Nothing sits above a heading; asset, timeframe and stage go under the verdict.

## Layout

- Mobile first. Content column max 768px, header bar max 1024px, 16px gutters.
- Phones: five-tab bottom bar with safe-area padding; pages leave 112px at the bottom for it.
- Desktop (≥768px): the same five tabs sit in the header with a yellow underline on the active one; the bottom bar hides.
- Lists are ruled rows (`divide-y`), with the label left and the value right in a figures column.

## Elevation & Depth

Flat. Cards are separated by a 1px rule and a one-step lighter surface, never by glow or gradients. Only floating layers (popovers, menus, dialogs, toasts) take the one shadow, `0 8px 24px -12px` black at 70%.

## Shapes

12px base radius; cards and buttons 14px; dialogs 18px. The state strip and stat blocks share the card radius.

## Components

### Buttons
Primary is yellow, 44px tall, 14px radius, semibold. Secondary is band navy with a hairline. `selected` (white on navy) marks the chosen option in a toggle group and carries `aria-pressed`. All buttons press to 98% scale.

### Checklist card
`card-soft` surface with a `card-band` header: icon in muted ink, title in condensed caps. Body rows are ruled; checklist marks are big condensed figures coloured green (full), orange (partial) or muted (zero), and the rows tick in once, 60ms apart, when a result lands.

### State strip
Three equal segments in a band-navy track; the lit segment fills with green, yellow or red and pops in once.

### Inputs
44px, band navy fill, yellow focus edge with a soft yellow ring.

### Navigation
Bottom bar on phones (yellow pill behind the active icon), header tabs on desktop.

## Do's and Don'ts

- Do keep one yellow element per screen.
- Do say WAIT and NO TRADE plainly; the strip is a verdict, not advice.
- Do use condensed caps only for card bands and states, never for paragraphs.
- Don't use gradients, glows or gradient text.
- Don't put green or red on anything that isn't a trade outcome.
- Don't put labels above headings.
- Don't shrink text below 12px.
