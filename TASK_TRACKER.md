# Task tracker

One list for every agent. Move a task between sections as its state changes and
give the commit when it is done. Last updated: 2026-11-14.

## Now

Nothing in progress.

## Waiting on the owner

| What                                                                                         | Why                                                                                                      |
| -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Merge pull request `dridennsagundualtech-png/neziarei-sage-chart#8`, then publish in Lovable | Everything in "Done" below is on the branch `claude/focused-ptolemy-wc11e8`. The live app follows `main` |
| Run the signed-in click-through in `TESTING_GUIDE.md` after it is live                       | Agents have no account, so nothing was tried signed in                                                   |
| Replace the Supabase secret key used by `mt5_data_auto.py`                                   | The script, with the key inside it, was pasted into a chat on 2026-11-14                                 |

## Next milestone

Nothing is waiting for approval. The three milestones the owner approved on
2026-11-14 (the journal that fills itself in, the guard rails, the weekly cost
line) are done; see "Done" below. Ideas for what could come next, none of them
agreed:

- A "placed trades only" switch on the Stats tab, now that the journal knows
  which trades were really placed.
- Letting the journal form record the size and the money result of a placed
  trade, so costs and results can be shown in the account currency exactly.

## Pending (not started)

| Task                                    | Notes                                                                                                                                                                                                 |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Confirm the test log writes             | `edge_checks` is empty in the new Supabase project. Run one Den backtest with enough trades and check a row appears                                                                                   |
| Record the candle trim rule in the repo | The live database has a trigger, `trim_ohlc_data`, that keeps only the newest 2,000 candles per symbol and timeframe. It is not in `supabase/migrations/`                                             |
| Uploader key                            | The owner's `mt5_data_auto.py` has the Supabase secret key written inside it. Move the key to a separate file that is never shared, and replace the key, since the script has been pasted into a chat |
| Rewrite `README.md`                     | It is still the original build prompt                                                                                                                                                                 |
| Supply or remove `antislop.md`          | `AGENTS.md` refers to it and it is not in the repo                                                                                                                                                    |
| Formatting clean-up                     | About 1,045 automatic lint fixes. Do it as its own commit with no other change, and only with the owner's yes                                                                                         |

## Decided against

| Task                                                         | Why                                                                                                                                                                                                                                                        |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Uploading years of candles to Supabase to search for an edge | Already answered. The October report card tested the Den on about four years of M15, M30, H1, H4 and D1 for the same five symbols (14,368 trades on M15 alone) straight from MT5: no edge on any timeframe. Repeating it on less history would add nothing |
| Downloading price history from Dukascopy                     | Same reason, and the agent session's safety check refused the download                                                                                                                                                                                     |
| Trying more rule sets until one passes                       | 43 candidates, 0 passed. Each extra try makes a lucky pass more likely, which is why the app's bar gets stricter with every test                                                                                                                           |

## Ideas the owner has mentioned (no decision yet)

- A playable game inside the app. If it goes ahead: build it as its own module,
  separate from the trading logic, and agree the kind of game and the technology
  first. Nothing has been designed or chosen.
- Letting members use the EA check. It is owner only today.

## Open questions the tests have not settled

| Question                                     | State                                                                                                     |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Do the AI analyzer's reads have an edge?     | Not tested. A backtest costs API credits for every read                                                   |
| Does the quality gate help?                  | Too few trades: 81 on H1 in six years across 23 markets (+0.09R, a coin flip did as well 16% of the time) |
| Does the owner's own judgement have an edge? | Unknown. The journal has 1 finished trade. Only logged trades can answer it                               |

## Done

| Date       | Task                                                                                   | Commit                     |
| ---------- | -------------------------------------------------------------------------------------- | -------------------------- |
| 2026-11-14 | Owner switch "Require a proven edge"                                                   | `996f792`                  |
| 2026-11-14 | Project memory files and the result-screen check                                       | the commit after `996f792` |
| 2026-11-14 | At a glance summary on the result screen, with a simple and a full view                | the commit after `50a792c` |
| 2026-11-14 | Recorded the October report card and withdrew the "more history" plan                  | the commit after `9093f2f` |
| 2026-11-14 | "My trade": check a trade of your own on the Analyze page                              | the commit after `254f91e` |
| 2026-11-14 | Journal that fills itself in: save a typed trade, "I placed this", automatic recording | the commit after `87b02a4` |
| 2026-11-14 | Guard rails: trades per day and a pause after a loss                                   | the commit after `a9d7f70` |
| 2026-11-14 | Weekly cost line on the Stats tab                                                      | the commit after `8e3c242` |
| 2026-11-15 | Result check no longer judges a trade from candles that start after it                 | the commit after `3e25245` |
