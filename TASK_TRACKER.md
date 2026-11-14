# Task tracker

One list for every agent. Move a task between sections as its state changes and
give the commit when it is done. Last updated: 2026-11-14.

## Now

Nothing in progress. Waiting for the owner's go-ahead on the next milestone.

## Next milestone (planned, needs the owner's yes)

**A one-glance summary at the top of the result screen.** Asked for by the owner
on 2026-11-14 ("make the result simpler to follow, using only what is proven").

- Add one card under the verdict strip with five lines: rules, plan and R:R,
  stop against spread and noise, lot size and money at risk, odds with no edge.
  Every figure already exists lower on the page; nothing new is calculated.
- Decide with the owner whether the long sections below fold under "Details".
- Shared part: `ResultView.tsx` is used by Analyze, Journal history and the
  owner's Den view, so all three change together.
- Risks: the Academy's App guide describes this screen block by block and must
  be updated to match; members see the change too, not only the owner.
- Checks: extend `scripts/result-view-check.tsx`, plus the usual checks.

## Pending (not started)

| Task                                  | Notes                                                                                                                                                                                                                                                                                               |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| More candle history                   | The edge verdict needs about 1,500 to 2,600 finished trades; the database has about a month of M15. Simplest route: the owner's MT5 uploader sends more bars (suggested M15 50,000, H1 15,000, H4 4,000). The uploader script is not in the repo, so the owner has to share it or change the number |
| A fair test of a few simple rule sets | Only after more history. Plan each test before running it and count it, as `docs/research/` does                                                                                                                                                                                                    |
| Confirm the test log writes           | `edge_checks` is empty in the new Supabase project. Run one Den backtest with enough trades and check a row appears                                                                                                                                                                                 |
| Rewrite `README.md`                   | It is still the original build prompt                                                                                                                                                                                                                                                               |
| Supply or remove `antislop.md`        | `AGENTS.md` refers to it and it is not in the repo                                                                                                                                                                                                                                                  |
| Formatting clean-up                   | About 1,045 automatic lint fixes. Do it as its own commit with no other change, and only with the owner's yes                                                                                                                                                                                       |

## Ideas the owner has mentioned (no decision yet)

- A playable game inside the app. If it goes ahead: build it as its own module,
  separate from the trading logic, and agree the kind of game and the technology
  first. Nothing has been designed or chosen.
- Letting members use the EA check. It is owner only today.

## Blocked

| Task                                     | Blocked by                                                                                                    |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Downloading price history from Dukascopy | The agent session's safety check refused it. The owner decides whether to allow it or use MT5 history instead |
| Finding an edge                          | Not enough stored history (see "More candle history")                                                         |

## Done

| Date       | Task                                             | Commit                     |
| ---------- | ------------------------------------------------ | -------------------------- |
| 2026-11-14 | Owner switch "Require a proven edge"             | `996f792`                  |
| 2026-11-14 | Project memory files and the result-screen check | the commit after `996f792` |
