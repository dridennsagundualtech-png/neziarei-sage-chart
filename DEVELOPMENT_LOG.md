# Development log

Newest entry first. Add an entry after every milestone: what changed, why,
what was found, what is still wrong. Keep entries short and factual. Git has the
full detail (`git log`); this file holds the reasons and the findings.

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

| Question                                                                           | Result                                                                                      | File                   |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ---------------------- |
| Does 12-month trend following have an edge on the broker's 49 markets after costs? | No. Fails all three conditions                                                              | `trend-following.md`   |
| Does a model forecast tomorrow's range better than the 20-day average?             | Not proven. Passed on 2024–2026, did not replicate on older years                           | `range-forecast.md`    |
| Do the price map's odds come true as often as they say?                            | Yes. All three claims pass. It does not pick a direction                                    | `price-map.md`         |
| Do Den checklist grades win more often than a coin flip?                           | Testing found they do about the same (see the coin flip mode in Settings and the App guide) | App guide, Den lessons |
