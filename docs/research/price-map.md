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

## Result

Not run yet.
