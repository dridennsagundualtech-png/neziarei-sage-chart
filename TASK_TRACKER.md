# Task tracker

One list for every agent. Move a task between sections as its state changes and
give the commit when it is done. Last updated: 2026-11-14.

## Now

Nothing in progress.

## Next milestone (suggested, needs the owner's yes)

**More candle history, so rules can be tested fairly.** See the first row of
"Pending". It needs the owner's MT5 uploader script or one bigger upload from
the owner; nothing can be judged an edge before that.

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

| Date       | Task                                                                    | Commit                     |
| ---------- | ----------------------------------------------------------------------- | -------------------------- |
| 2026-11-14 | Owner switch "Require a proven edge"                                    | `996f792`                  |
| 2026-11-14 | Project memory files and the result-screen check                        | the commit after `996f792` |
| 2026-11-14 | At a glance summary on the result screen, with a simple and a full view | the commit after `50a792c` |
