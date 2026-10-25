# Trend-following (12-month time-series momentum)

Question: does going with each market's 12-month trend, one month at a time,
have an edge on FP Markets' markets after costs? This is the most widely
documented directional edge in published research (Moskowitz, Ooi & Pedersen,
2012; Hurst, Ooi & Pedersen, 2017), and published edges usually shrink after
publication (McLean & Pontiff, 2016), so the bar stays strict.

## Plan, fixed before the data it runs on arrived

Code: `src/lib/trend-following.ts` and `scripts/trend-study.ts`, committed
together with this file. Data: the full `mt5_export_history.py` export (D1
bars from 2006 for every market the account offers, plus `symbols.csv`), run
once when it arrives. The partial exports already uploaded (EURUSD, AUDUSD,
XAUUSD) were not run through this study.

- **Prior look:** an earlier ChartPilot test already tried 12-month momentum on
  this broker's history (positive, didn't clear the coin flip after swap), so
  this is the second look and the bar is 0.05 / 2 = **0.025**.
- **Markets:** every `SYMBOL_D1.csv` with a `symbols.csv` row, a known swap mode
  and at least 36 months traded. Weekdays only.
- **Rule:** at each month end, long if the close is above the close 12 month ends
  earlier, short if below; hold to the next month end.
- **Sizing:** each trade is scored in risk units, its return divided by its
  expected one-month standard deviation (EWMA of daily returns, 60-day centre of
  mass, at least 120 days of history). The book's month is the average over the
  markets traded that month.
- **Costs (deliberately harsh):** a full round trip every month on every
  position (spread capped at 0.5%, plus commission on FX and metals), and
  today's swap rates applied to every month. In the primary version swap
  credits are ignored (costs only).
- **Pass (all three):** average monthly result above zero; coin flip (one coin
  per month picks the book or its mirror, 20,000 runs, +1 corrected) matches it
  at most 2.5% of the time; average above zero both before 2016 and from 2016.
- Versions with no financing and with full swap, and per-group and per-market
  rows, are description only.
- Checked first on synthetic data only: signals never read the month they
  trade, swap and spread convert as intended, and pure random walks don't pass.

## Pre-run corrections (made before any result was seen)

Found on 2026-10-25 while checking the cost inputs of the full export, before
the study ran. Nothing else changed: the rule, sizing, markets, cost model and
pass rule are as planned.

1. **Swap modes 2 and 3** were converted as if a lot were always worth the
   contract size. That holds for FX (EUR per lot of 100,000 EUR) but not for
   indices, which quote swap in money per lot: US30's −4.89 USD a day would
   have read as −489% of the price a day instead of about −3.4% a year. Fixed:
   when the swap money is the quote currency, a lot is worth contract × price
   (`swapMoneyIsQuote` in `src/lib/trend-following.ts`, with a test).
2. **Closed-market quotes.** The export ran on a Sunday: 43 of 51 symbols had
   no price, so no spread (the plan's fallback would charge 0.5% every month),
   and the 8 with a price showed closed-market spreads. The run waits for a
   `symbols.csv` saved while the market is open
   (`python mt5_export_history.py costs`); the D1 bars from this export are
   used as they are.
3. **Spreads without waiting for live prices.** At the owner's request to
   proceed on 2026-10-25 instead of waiting for Monday, the closed-market
   spreads are not used at all. Every market is charged a fixed round-trip
   spread for its group, set on the high side of raw-account spreads before
   the run: FX 0.03%, metals 0.10%, energies 0.20%, stock indices 0.05%,
   softs and grains 0.30% (plus commission on FX and metals, as planned).
   Charged every month on every position, that is already harsher than a
   trader who holds a position for months would pay. If a `symbols.csv` saved
   with live prices arrives later, its spreads are reported as a check on
   these figures only; the verdict stands on this run.

## Result

Not run yet.
