# Development log

Newest entry first. Add an entry after every milestone: what changed, why,
what was found, what is still wrong. Keep entries short and factual. Git has the
full detail (`git log`); this file holds the reasons and the findings.

## 2026-11-14: "My trade", a check for a trade of your own

**Changed**

- Analyze has a third mode, **My trade**. The trader types a symbol, a side, an
  entry, a stop and a target; the app answers with a headline and one line each
  for Plan, Stop, Size, Odds with no edge and To break even. No AI is called.
- Logic in `src/lib/own-trade.ts`, screen in `src/components/OwnTradeCheck.tsx`.
  It reuses `checkPlan`, `probabilityCheck`, `sizePosition`, `planOdds` and the
  At a glance rows (`glanceRows` with `mode: "own"`), so a typed trade and an
  app read are judged by the same code.
- New server function `getDailyContext` (`src/lib/daily-context.functions.ts`)
  returns a symbol's typical day and price map from stored daily bars. Same
  access as an analysis (premium, or the owner).
- `/analyze?mode=own` opens the mode directly.
- App guide: a lesson "My trade: check an idea of your own".

**Why.** The report card found the signals have no edge but the sizing, stop
check and odds are reliable. The owner wanted a useful second opinion; this
turns the reliable parts on the owner's own ideas.

**Decisions**

- It never has a view on direction, and says so on the screen.
- "To break even" is shown as extra wins in 100 over chance
  (`costR / (1 + R:R)`), not as two percentages, because the odds are rounded to
  5% and two rounded figures would not subtract cleanly.
- The headline only says "check out" when the stop and the size really were
  checked. With no daily data or no exchange rate it says "Nothing fails, but
  not everything could be checked", and the At a glance Stop line now names
  what could not be checked (this also applies to analysis results).
- Not saved to the journal yet. That is the next milestone, because a typed
  trade has no checklist score and the Journal has to learn to show it.

**Checked.** Types, trading check (new cases for a sound long, the same trade
short, a tight stop, low R:R, a stop on the wrong side, an unknown symbol, a
missing rate, price parsing), result-screen check, production build, and a real
browser at phone width: validation messages in order, submit by Enter key,
comma decimals, each case above, no sideways scroll.

**Not checked.** Signed in. In the browser test the daily-data lookup and the
exchange-rate lookup both failed (no account, no outside network), which showed
the "could not be checked" paths work; the paths where they succeed are covered
by the logic tests only. The Analyze page itself sits behind the premium gate,
so the third button was not clicked on that page.

## 2026-11-14: Correction. The edge search was already done in October

**What happened.** Earlier today an agent (this log's author) recommended
uploading years of candles so rule sets could be "tested fairly", believing the
only evidence was five small saved backtests. That was wrong. The owner then
shared the **ChartPilot tool report card**, made on 2026-10-25 in another
session: https://claude.ai/artifact/ABmEQjs1xpET4KKKe4xK86 (private to the
owner). It is not in the repo, which is why it was missed. Read it before
proposing any test.

**What the report card tested** (history read straight from the owner's MT5
terminal, plan and pass rules written before any result, costs charged on every
trade, judged on 2017–2022 with 2023–2026 held back):

- 43 candidates, 598 backtests, 23 markets, 361,164 trades replayed. **0 passed.**
- The Den on the five traded symbols, 2023-01 to 2026-10, average per trade
  after costs: D1 −0.07R (346 trades), H4 −0.11R (1,976), H1 −0.08R (3,720),
  M30 −0.09R (10,480), M15 −0.08R (14,368).
- All 12 Auto Optimize rule sets lost, −0.03R to −0.08R; six of them place
  exactly the same trades as another, so there are really six.
- Filters: VWAP side −0.06R, London + NY overlap −0.07R, grade A −0.01R on H1
  and −0.14R on H4. Quality gate: only 81 H1 trades, too few to judge.
- Six published strategies (RSI(2), Double 7s, IBS, turn of the month,
  15-minute opening range, London breakout): none makes money that could be
  kept. London breakout was about break-even.
- The edge verdict itself was checked on random trades: it called 46 of 1,000
  an edge at a single-test bar (4.6%, the limit is 5%) and 0 of 200 once costs
  were charged.
- Reliable tools: position sizing, the trade plan and steps, the edge verdict,
  price map odds, typical day's range, the probability check, journal and stats.
- Not tested: the AI analyzer's reads.

**Consequences**

- The "more candle history" milestone is withdrawn (`TASK_TRACKER.md` ›
  Decided against). It would have repeated a larger test on less data.
- The earlier line in this log, "no rule set can reach Ready on this much
  history", is true of the app's own stored candles but beside the point: the
  rules were judged on far more history outside the app and lost.
- The At a glance card built today uses only the tools the report card found
  reliable, so it stands.

**Also found today**

- The live database trims `ohlc_data` to the newest 2,000 candles per symbol
  and timeframe after every insert (trigger `trim_ohlc_data_after_insert`,
  function `trim_ohlc_data`). It is not in `supabase/migrations/`. This is why
  every timeframe holds at most 2,000 rows whatever the uploader sends.
- The owner's uploader, `mt5_data_auto.py`, deletes a symbol's rows and
  re-inserts them on every run, and asks for more bars than the database keeps
  (for example 5,000 M15). It also has the Supabase secret key written inside
  it; the owner was told to replace the key and keep it out of the script.

## 2026-11-14: At a glance summary and a simple view on the result screen

**Changed**

- New "At a glance" card under the verdict on every result: up to five lines
  (Rules, Plan, Stop, Size, Odds with no edge). Logic in `src/lib/glance.ts`,
  card in `src/components/GlanceCard.tsx`.
- The result now opens in a simple view: verdict, At a glance, plain-English
  summary, missing context, the trade plan with its steps, copy tools,
  confirmation, invalidation and the journal form. "Show all details" opens the
  rest in place (score and evidence boxes, quality gate, price map, Chances at
  your levels, Setup checklist, Why this read, Historical evidence, Risk
  management). The choice is remembered on the device
  (`localStorage` key `chartpilot.result.details`).
- App guide lesson "Reading an analysis result" describes both.

**Why.** The owner asked for a result that is simple to follow and built only on
what is proven. The card calculates nothing new: every figure is one the
sections below already work out (`checkPlan`, `probabilityCheck`,
`sizePosition`, `planOdds`), so it cannot disagree with them. It states "No edge
is proven for this read" unless a track record or the journal shows one.

**Decisions**

- With "Show all details" open, the screen is the old screen plus the card, in
  the old order. Nothing was removed or reordered, only folded by default.
- A failing line uses the caution colour, not red: `DESIGN.md` keeps red for
  trade outcomes.
- Members see this change too. `ResultView.tsx` is shared by Analyze, Journal
  history and the owner's Den view.

**Checked.** Types, trading check (new cases for the five lines), result-screen
check (card present, simple view by default, no unproven edge claim),
production build, and a real browser at phone and desktop width: the button
opens and folds the details, the choice survives a reload, it works from the
keyboard, there are no console errors and nothing scrolls sideways.

**Not checked.** Signed-in use with real analyses, since agents have no account.

## 2026-11-14: Owner switch for the edge requirement, and project memory files

**Changed**

- Commit `996f792`. New setting "Require a proven edge" in Settings › Analysis,
  shown to the owner only, on by default.
  - On: unchanged. A Den result shows Ready only with a measured edge.
  - Off: Ready lights when the rules and the quality gate pass. A line under the
    strip says no edge is proven, and step 1 of "How to follow this plan" states
    it without failing the check ("demo account only" no longer appears).
  - Shared signals and alerts keep their "No measured edge" line either way.
- Database: column `settings.require_edge boolean NOT NULL DEFAULT true`, added
  to the live project and saved as migration `20261114090000_…`.
- New check `scripts/result-view-check.tsx`: renders the real result screen and
  asserts what it says. `scripts/trading-check.ts` covers the plan steps with
  the switch on and off.
- Added `PROJECT_CONTEXT.md`, `FEATURE_MAP.md`, `DEVELOPMENT_LOG.md`,
  `TASK_TRACKER.md`, `TESTING_GUIDE.md` at the owner's request, so any agent
  (Claude or GPT) can continue without redoing the discovery.

**Why.** The owner asked for a button that controls whether an edge is
required. The switch changes a label, never a verdict; turning it off does not
change the odds of any trade.

**Found (state of the evidence on this date)**

- No directional edge has been proven. See "Research results" below.
- Five saved Den backtests (all AUDUSD, 2026-10-25) averaged about −0.06R per
  trade after costs, on 50 to 102 trades each. Too few trades to judge.
- The live database holds about 2,000 candles per timeframe for AUDUSD, EURUSD,
  USDJPY, XAGUSD and XAUUSD (`.r` symbols), pushed in one upload on 2026-11-13:
  M15 covers about a month, H1 about four months, H4 a year, D1 three years.
  The edge verdict needs roughly 1,500 to 2,600 finished trades, so no rule set
  can reach "Ready" on this much history.
- `edge_checks` has no rows in the new Supabase project. Runs saved before the
  move show `tests: 0`. Not investigated further; worth confirming the log
  writes after the next backtest.
- The owner's journal has 5 saved reads, 1 finished.
- The long MT5 exports used for the research (daily bars since 2006) are not in
  Supabase or in the repo. They were files on the owner's PC.

**Known issues**

- `AGENTS.md` points at `antislop.md`, which is not in the repo.
- About 1,045 lint errors repo-wide, nearly all automatic formatting. Not
  touched, to keep real changes readable.
- `README.md` is the original build prompt, not a description of the app as it
  is now.
- `bun install` cannot reach the package cache named in `bun.lock` from some
  agent sandboxes. Workaround in `TESTING_GUIDE.md`.

**Tried and stopped**

- Downloading free price history from Dukascopy's data feed so the owner would
  not have to export from MT5. The session's safety check refused the download.
  A cloud environment named `neziarei-sage-chart` that allows that one host
  exists; whether to use it is the owner's call. Nothing was downloaded.

## Before this log: summary from git history

| Date       | What                                                                         | Commit                                     |
| ---------- | ---------------------------------------------------------------------------- | ------------------------------------------ |
| 2026-11-08 | App pointed at the owner's own Supabase project                              | `3bf27a4`                                  |
| 2026-10-30 | Coin flip mode for the Den; refuse plans whose target rounds onto the entry  | `87054d2`                                  |
| 2026-10-25 | Owner-only EA check in Settings                                              | `3dfb271`                                  |
| 2026-10-25 | Trade plan as steps you can follow                                           | `cb4f584`                                  |
| 2026-10-25 | Probability check, level chances, 0.01 lot rounding, "Your edge vs the odds" | `2e4a23d`, `6e74ced`, `cf9fb41`, `9ba1082` |
| 2026-10-25 | Price map on every result, with its calibration check                        | `0a3b81c`, `df7fc43`                       |
| 2026-10-25 | Edge verdict made impossible to pass by luck, tuning or re-checking          | `5ce03b3`                                  |
| 2026-10-24 | Den "Ready" only with a track record that shows an edge                      | `93a6440`                                  |
| 2026-10-24 | Full course added to the Academy                                             | `0ddf8a5`                                  |
| 2026-10-13 | App guide course; admin market analysis moved to Analyze › Market data       | `82c251b`, `14d22e2`                       |
| 2026-10-12 | Android app pointed at the live backend                                      | `faf5b1e`                                  |

## Research results (details in `docs/research/`)

| Question                                                                           | Result                                                                                      | File                     |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------ |
| Does 12-month trend following have an edge on the broker's 49 markets after costs? | No. Fails all three conditions                                                              | `trend-following.md`     |
| Does a model forecast tomorrow's range better than the 20-day average?             | Not proven. Passed on 2024–2026, did not replicate on older years                           | `range-forecast.md`      |
| Do the price map's odds come true as often as they say?                            | Yes. All three claims pass. It does not pick a direction                                    | `price-map.md`           |
| Do Den checklist grades win more often than a coin flip?                           | Testing found they do about the same (see the coin flip mode in Settings and the App guide) | App guide, Den lessons   |
| Does the Den make money on any timeframe (five symbols, 2023–2026)?                | No. −0.07R to −0.11R a trade after costs on D1, H4, H1, M30 and M15                         | report card (link above) |
| Do any of the 12 Auto Optimize rule sets make money (23 markets, 2017–2022)?       | No. −0.03R to −0.08R                                                                        | report card              |
| Do six published strategies make money on the broker's history?                    | No. Best was break-even                                                                     | report card              |
| Does the edge verdict call luck an edge?                                           | No more than it should: 4.6% of random strategies at a single-test bar                      | report card              |
