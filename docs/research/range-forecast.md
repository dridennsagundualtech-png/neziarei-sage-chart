# Daily range forecast

Question: does a model forecast tomorrow's daily range (ln high/low) better
than the 20-day average an ATR-style stop assumes? It says nothing about
direction.

Models, loss and pass rule are fixed in `src/lib/range-forecast.ts` and
`scripts/range-forecast-study.ts`, committed in `7d0fe71` before any real data
was looked at. A model passes only with a one-sided Diebold–Mariano p ≤ 0.025
and a pooled loss at least 5% below the average's.

## Study 1: stored D1 bars, Sep 2023 to Oct 2026

Data: `ohlc_data` D1 for AUDUSD, EURUSD, USDJPY, XAGUSD, XAUUSD (`.r`),
weekdays only, copied with exact count, sum and position-weighted checksums.
Scored days: 2,635 symbol-days, Oct 2024 to Oct 2026. Run once, on 2026-10-25.

| Model | Loss vs average | p | Result |
|---|---|---|---|
| EWMA | 3.9% lower | 0.0004 | Fail (below the 5% minimum) |
| HAR | 9.2% lower | 0.0002 | **Pass** |

HAR was better on every symbol: XAUUSD 14.5%, USDJPY 11.9%, EURUSD 8.2%,
AUDUSD 6.7%, XAGUSD 3.4%. Daily ranges stay noisy: on 8 of 10 days the actual
range was 0.62× to 1.69× HAR's forecast.

## Study 2 (replication), planned before running: H4 history, May 2020 to Sep 2023

The claim being checked is Study 1's pass: HAR beats the 20-day average.

- Data: MT5 H4 exports for EURUSD.r and XAUUSD.r, grouped into daily ranges by
  `scripts/mt5-daily-ranges.ts` (weekdays, each file's first date dropped),
  dates before 2023-09-19 only. None of these days were in Study 1.
- The H4-built ranges were checked first against the stored D1 bars on the
  overlap (Sep 2023 to Oct 2026): all 799 days match exactly for both symbols.
- Analysis: `scripts/range-forecast-study.ts` exactly as committed in
  `7d0fe71`, run once. The replication passes if the HAR line says PASS.
  The EWMA line is reported but is not a claim.
