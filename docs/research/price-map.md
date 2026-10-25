# Price map

Question: do the price map's numbers come true as often as they say? The map
never picks a direction; it says where price could realistically be, and how
likely a level is to be touched, treating up and down as equally likely (no
test found a way to tilt them: `trend-following.md`, `range-forecast.md`).

## Plan, fixed before the check was run on real data

Code: `src/lib/price-map.ts` and `scripts/price-map-study.ts`, committed with
this file. Data: the FP Markets D1 export already used for the trend test (50
markets, 2006–2026, weekdays with high > low > 0). Every figure is made at a
day's close from that close and earlier, and checked against the bars after.

Settings: daily volatility by EWMA (λ = 0.94); bands from the last 1,000 past
moves measured in volatility units (normal-curve quantiles until 250 exist).

Three claims, pooled across all markets and both directions:

1. **Bands:** the close 1 and 5 trading days later lands in the half band 50%
   of the time and in the 8-in-10 band 80% of the time.
2. **Race:** with the stop k and the target m daily volatilities away
   (k = 0.5, 1, 2; m = 1, 2, 4), from every close, long and short, the target
   is touched first with chance k / (k + m). A day touching both counts as
   half (the order inside a day is unknown); races untouched after 60 days are
   left out.
3. **Reach:** a level x × volatility × √n away (x = 0.5, 1, 1.5; n = 1, 5), up
   and down, is touched within n days with chance 2 × (1 − Φ(x)).

**A claim passes when every one of its cells is within 3 percentage points of
its promise. Only claims that pass are shown in the app.** Rows by group and
period are description only.

Checked first on synthetic random walks: bands and race pass with 96 price
steps a day; reach passes once the steps are fine enough (2,000 a day), since
coarse steps miss extremes (at 96 steps "0.5 in 1 day" read 57.9%, matching
the known discrete-monitoring correction of 57.6%). Real highs and lows come
from every tick.

## Result: run once, on 2026-10-25

51 D1 files (the 50 markets plus the earlier XAUUSD export), about 193,000
band checks and 385,000 race and reach checks per cell. **All three claims
pass.**

| Claim | Cell               | Promised | Happened |
| ----- | ------------------ | -------- | -------- |
| Bands | 1 day, half        | 50.0%    | 50.0%    |
|       | 1 day, 8 in 10     | 80.0%    | 80.0%    |
|       | 5 days, half       | 50.0%    | 50.0%    |
|       | 5 days, 8 in 10    | 80.0%    | 79.9%    |
| Race  | stop 0.5, target 1 | 33.3%    | 34.8%    |
|       | stop 0.5, target 2 | 20.0%    | 20.1%    |
|       | stop 0.5, target 4 | 11.1%    | 10.8%    |
|       | stop 1, target 1   | 50.0%    | 50.0%    |
|       | stop 1, target 2   | 33.3%    | 33.3%    |
|       | stop 1, target 4   | 20.0%    | 19.7%    |
|       | stop 2, target 1   | 66.7%    | 66.7%    |
|       | stop 2, target 2   | 50.0%    | 50.0%    |
|       | stop 2, target 4   | 33.3%    | 32.9%    |
| Reach | 0.5 in 1 day       | 61.7%    | 60.0%    |
|       | 1 in 1 day         | 31.7%    | 30.2%    |
|       | 1.5 in 1 day       | 13.4%    | 14.0%    |
|       | 0.5 in 5 days      | 61.7%    | 60.4%    |
|       | 1 in 5 days        | 31.7%    | 30.7%    |
|       | 1.5 in 5 days      | 13.4%    | 14.0%    |

Description only: by group, every band cell was within 1 point except softs
and grains over 5 days (−3.4 and −2.0, on short histories). Race cells were
within 2 points in every group. Reach runs a little low at short distances,
most in stock indices (−5.2 points for 0.5 in 1 day, −3.7 for 1 in 1 day) and
energies (about −3); the app words these as "about". Before and after 2016
look alike.

## Conclusion

The map's bands, race odds and reach odds come true about as often as they say,
across 50 markets and 20 years, so the app can show them. They describe where
price can realistically go and how likely a level is to be touched; they
don't say which way it goes, and a trade only makes money on top of these odds
if the trader's read beats chance.
