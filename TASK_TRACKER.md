# Task tracker

One list for every agent. Move a task between sections as its state changes and
give the commit when it is done. Last updated: 2026-11-14.

## Now

Nothing in progress.

## Next milestone (suggested, needs the owner's yes)

**A journal that fills itself in.** The October report card (see
`DEVELOPMENT_LOG.md`) found the journal is the one place an edge of the owner's
own could show, and the owner wants as little manual work as possible. Den reads
are already saved as open trades and `lib/trade-check.functions.ts` already
works out which ones hit the stop or TP1. The milestone: apply those results
without the owner having to open each trade. Plan it and list the risks before
building; it writes to the `analyses` table.

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

| Date       | Task                                                                    | Commit                     |
| ---------- | ----------------------------------------------------------------------- | -------------------------- |
| 2026-11-14 | Owner switch "Require a proven edge"                                    | `996f792`                  |
| 2026-11-14 | Project memory files and the result-screen check                        | the commit after `996f792` |
| 2026-11-14 | At a glance summary on the result screen, with a simple and a full view | the commit after `50a792c` |
| 2026-11-14 | Recorded the October report card and withdrew the "more history" plan   | the commit after `9093f2f` |
