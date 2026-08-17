# Chart Navigator

Build a responsive mobile-first web app called ChartPilot — an AI-assisted trading chart analysis and journaling application.

The core purpose is:

User uploads one or more trading-chart screenshots → AI determines whether there is enough information → asks for additional screenshots if needed → performs a structured A+ trading setup analysis → produces a setup score, possible trade plan, confidence level, and historical win probability when sufficient backtested data exists.

IMPORTANT:
This application must NOT falsely claim that an AI chart prediction has a guaranteed accuracy percentage. Separate:

Setup Quality Score

AI Confidence in the visual analysis

Historical Win Probability

Historical Win Probability must ONLY be displayed when sufficient actual historical/backtest data exists for comparable setups. Otherwise display:
"Insufficient historical data to calculate a statistically meaningful win probability."

Include a clear disclaimer that the application is an educational/analysis tool and does not guarantee trading results.

DESIGN

Create a cute, modern, polished mobile-first UI.

Visual style:

clean dark trading interface

soft rounded cards

subtle gradients

friendly/cute visual personality

excellent mobile usability

large upload area

smooth animations

clear green/red/neutral states

avoid making it look like a complicated professional trading terminal

Main navigation:

Analyze

History

Statistics

Settings

SCREEN 1 — ANALYZE

Large card:

"Analyze a Chart"

Subtitle:
"Upload your TradingView screenshot and I'll check whether I have enough information."

Large drag/drop and mobile upload area.

Allow:

camera/photo upload

image upload

multiple screenshots

remove/reorder screenshots

Show uploaded images as thumbnails.

Button:
"Analyze Chart"

IMAGE SUFFICIENCY CHECK

Before running the full analysis, the AI must determine whether the screenshots contain enough information.

Check for:

ticker/asset

timeframe

readable price scale

sufficient candles

market structure

relevant swing highs/lows

support/resistance

liquidity areas

volume if visible

enough context around the potential setup

If insufficient, DO NOT fabricate missing information.

Instead display:

"More information needed"

Explain exactly what is missing.

Examples:

"Please upload the 1H chart so I can determine the higher-timeframe bias."

"Please upload a 5M chart around the setup so I can confirm the MSS/BOS."

"Please provide a wider screenshot showing at least 100 candles."

"Volume is not visible. Please upload a chart with volume enabled if you want volume confirmation."

Provide:
"Upload Another Screenshot"

The user should be able to continue uploading images until the AI determines there is sufficient information.

MULTI-TIMEFRAME ANALYSIS

Support multiple screenshots.

Typical workflow:

Daily → 4H → 1H → 15M → 5M

The AI should identify which timeframe each screenshot represents when possible.

Use higher timeframes for directional bias and lower timeframes for entry confirmation.

Do NOT assume a timeframe if it cannot be reliably determined. Ask the user.

A+ SETUP CHECKLIST

Once sufficient information exists, analyze the chart using this exact framework:

1. HIGHER-TIMEFRAME STRUCTURE

Determine:

Higher High

Higher Low

Lower High

Lower Low

range

bullish structure

bearish structure

unclear structure

Score:
0–2 points.

2. SUPPORT & RESISTANCE

Identify:

major support

major resistance

previous day high

previous day low

previous week high

previous week low

major swing highs/lows

Determine whether the potential entry occurs near a meaningful level.

Score:
0–1 points.

3. LIQUIDITY

Identify:

buy-side liquidity

sell-side liquidity

equal highs

equal lows

obvious swing liquidity

previous highs/lows

Score:
0–2 points.

4. AMD MODEL

Evaluate whether there is evidence of:

Accumulation → Manipulation → Distribution

Do not force AMD onto a chart.

If the pattern is unclear, mark it as unclear rather than inventing it.

Score:
0–2 points.

5. LIQUIDITY SWEEP

Determine whether price swept:

sell-side liquidity
OR

buy-side liquidity

Record:

level swept

approximate price

rejection strength

A sweep by itself must NOT be treated as a trade signal.

Score:
0–2 points.

6. MSS / BOS

Determine whether there is:

bullish MSS/BOS

bearish MSS/BOS

no confirmed structure shift

Score:
0–2 points.

7. DISPLACEMENT

Look for:

strong candle body

decisive movement

structure break

momentum

volume expansion when visible

Score:
0–1 points.

8. FVG / IMBALANCE

Identify potential:

bullish FVG

bearish FVG

FVG retracement

no clear FVG

Score:
0–1 points.

9. VOLUME

If volume is visible, evaluate:

above average

below average

expansion

contraction

confirmation

divergence

If volume isn't visible, explicitly say:
"Volume unavailable."

Never fabricate volume information.

Score:
0–1 points.

10. TARGET & RISK/REWARD

Identify:

logical invalidation level

potential stop

nearest meaningful liquidity target

potential take-profit levels

estimated R:R

Minimum preferred R:R:
2:1

If less than 2:1:
flag as unfavorable.

Score:
0–2 points.

TOTAL SCORE

Maximum:
17 points.

Ratings:

15–17:
A+

12–14:
A

9–11:
B

6–8:
C

0–5:
NO TRADE

However, the score alone must NEVER automatically produce a BUY or SELL.

The AI must explain the reasoning.

TRADE DIRECTION

Possible outputs:

LONG
SHORT
WAIT
NO TRADE

Use WAIT when the setup is developing but confirmation is incomplete.

Use NO TRADE when the setup is invalid or information is insufficient.

TRADE PLAN

When appropriate, display:

Direction
Entry Zone
Stop Loss
TP1
TP2
Risk/Reward
Invalidation

Do not give false precision if the screenshot does not provide enough information to determine exact prices.

Use approximate zones when necessary.

HISTORICAL WIN PROBABILITY

This is extremely important.

Never invent an accuracy percentage.

Create a statistical system that stores historical setups.

Each analyzed setup should be stored with:

asset

timeframe

direction

setup score

HTF bias

AMD present

liquidity type

sweep present

MSS/BOS

displacement

FVG

volume confirmation

R:R

entry

stop

target

outcome

R result

timestamp

Possible outcomes:

WIN
LOSS
BREAKEVEN
OPEN
INVALIDATED

The Statistics page should calculate:

total trades

win rate

loss rate

average R

expectancy

profit factor

maximum drawdown

average winner

average loser

performance by setup score

performance by asset

performance by timeframe

performance by long/short

performance by setup component

Only show "Historical Win Probability" when there is enough comparable data.

For example:

"63.4% historical win rate"

"Based on 427 comparable setups."

If fewer than 100 comparable setups exist:

"Insufficient historical data."

Do not estimate a win rate from the AI's visual confidence.

ANALYSIS RESULT UI

Create a beautiful result screen.

Top:

"A+ SETUP"

16 / 17

LONG

Then a visual score card.

Example:

HTF Structure 2/2
Support/Resistance 1/1
Liquidity 2/2
AMD 2/2
Liquidity Sweep 2/2
MSS/BOS 2/2
Displacement 1/1
FVG 1/1
Volume 1/1
Risk/Reward 2/2

Then:

"Historical Win Rate"

63.4%

"427 comparable setups"

If unavailable:

"Not enough historical data"

Then show:

ENTRY
STOP
TP1
TP2
R:R

Then:

"Why this setup qualifies"

Use concise bullet points.

Then:

"What could invalidate this trade?"

List specific conditions.

CHART ANNOTATION

If technically feasible, provide an annotated copy of the uploaded chart showing:

support

resistance

liquidity

sweep

MSS/BOS

FVG

entry

stop

targets

Use different visual labels but keep the chart readable.

HISTORY

Create a journal of previous analyses.

Each card should show:

Ticker
Direction
A+ score
Date
Result
R

Allow the user to open an analysis and see all screenshots and reasoning.

STATISTICS

Create attractive charts for:

cumulative R

win rate

setup score vs win rate

long vs short

asset performance

timeframe performance

monthly performance

SETTINGS

Allow the user to configure:

default risk per trade

preferred minimum R:R

preferred timeframes

preferred assets

whether volume is required

minimum sample size for statistical win probability

Default risk:
1%

Default minimum R:R:
2:1

Default minimum comparable setups:
100

AI BEHAVIOR

The AI should behave like a strict trading analyst, NOT a hype machine.

It should be comfortable saying:

"NO TRADE."

It should never:

invent missing prices

invent volume

invent a liquidity sweep

claim guaranteed profits

claim a setup is 90% accurate without supporting data

treat one indicator as definitive

force an AMD pattern

automatically trade

hide uncertainty

When uncertain, explicitly state what is uncertain and request another screenshot if additional visual information could resolve it.

USER EXPERIENCE

The app should feel like:

"Upload → AI checks → Ask for more images if needed → Analyze → Score → Trade plan → Journal → Learn from results."

Make the interface extremely easy to use on a phone.

Use clear loading states such as:

"Reading chart..."
"Mapping market structure..."
"Finding liquidity..."
"Checking AMD..."
"Confirming MSS..."
"Evaluating entry..."
"Calculating historical statistics..."

Make the loading experience feel polished and friendly.

IMPORTANT ARCHITECTURE

Build the application so the AI analysis layer is separated from the statistics/backtesting layer.

The AI should produce structured JSON for every analysis.

Example conceptual structure:

{
asset,
timeframe,
sufficient_information,
requested_additional_images,
bias,
direction,
checklist,
score,
entry_zone,
stop_loss,
targets,
risk_reward,
invalidation,
reasoning,
confidence,
comparable_setup_count,
historical_win_rate
}

The statistics engine should calculate actual historical results from stored trades rather than allowing the language model to invent them.

Use a clean component architecture and keep the code maintainable.

Build the application fully functional rather than creating a static mockup.


I want you to upgrade the EXISTING ChartPilot application into a complete, strict, evidence-based chart-reading and trade-analysis assistant.

IMPORTANT:

Do NOT rebuild the application from scratch.

Do NOT throw away the existing UI or working features.

Do NOT remove existing functionality unless it is being replaced by a clearly better implementation.

First inspect the existing codebase and understand how everything currently works.

The goal is to make ChartPilot a serious private trading-analysis tool that helps a trader understand a chart and evaluate a potential setup.

ChartPilot must NEVER present an AI analysis as a guaranteed prediction or instruction to trade.

==================================================

1. CORE PHILOSOPHY

==================================================

ChartPilot is a TRADING ANALYSIS ASSISTANT, NOT AN AUTOPILOT.

The application must clearly distinguish between:

- What the chart visually shows

- What the analysis suggests

- What conditions are required before considering a trade

- What would invalidate the setup

- Historical performance of similar completed setups

NEVER say:

"BUY NOW"

"SELL NOW"

"THIS WILL WIN"

"90% GUARANTEED"

"YOU SHOULD DEFINITELY TRADE"

Instead use language such as:

"Potential LONG setup"

"Potential SHORT setup"

"Conditions are currently favorable"

"Wait for confirmation"

"Insufficient evidence"

"Setup invalidated"

"No trade"

The Trade Plan is a CONDITIONAL PLAN, not an instruction.

==================================================

2. ANALYSIS MUST BE MARKET-AGNOSTIC

==================================================

ChartPilot must work with:

- BTCUSD

- ETHUSD

- XAUUSD / Gold

- Forex

- Stocks such as AMD, ADI, AAPL, NVDA, etc.

- Indices

- Other liquid instruments

Do NOT hard-code the analysis specifically for Bitcoin.

The underlying framework should remain consistent while accounting for differences between:

- Crypto

- Stocks

- Forex

- Commodities

- Indices

The user should be able to select or enter the asset.

If the ticker/asset cannot be confidently identified from the screenshot, ASK the user rather than guessing.

==================================================

3. MULTI-SCREENSHOT ANALYSIS

==================================================

The application must support multiple TradingView screenshots.

Users should be able to upload multiple timeframes such as:

- 5m

- 15m

- 1h

- 4h

- 1D

The system should understand that different screenshots may represent different timeframes.

Do NOT treat multiple screenshots as separate unrelated charts.

Combine them into one analysis.

The preferred structure is:

HTF:

1D / 4H

MTF:

1H

LTF:

15M / 5M

The application should determine the directional context from higher timeframes before evaluating lower-timeframe entries.

If the screenshots do not provide enough information to establish the necessary context, DO NOT guess.

Instead display:

"More chart context required."

Then explicitly ask for the missing timeframe.

For example:

"Please upload a 4H or 1H screenshot so I can determine the higher-timeframe structure."

==================================================

4. IMAGE QUALITY AND CONTEXT CHECK

==================================================

Before analyzing anything, inspect the uploaded screenshots.

Check:

- Is the chart readable?

- Are candles visible?

- Are price levels readable?

- Is the timeframe visible?

- Is the asset/ticker visible?

- Is volume visible if required?

- Is enough historical price action visible?

- Are important swing highs/lows visible?

- Are indicators obscuring the chart?

- Is the screenshot cropped too aggressively?

If insufficient:

DO NOT manufacture an analysis.

Instead show:

"Insufficient visual evidence."

Then list exactly what is missing.

Example:

"Please provide:

1. A wider 4H chart showing the previous swing structure.

2. A 15M chart showing the recent liquidity sweep.

3. A screenshot with volume visible."

The system should continue requesting additional screenshots until it has enough evidence OR the user chooses to stop.

==================================================

5. STRUCTURED ANALYSIS CHECKLIST

==================================================

Use the following checklist.

A. HIGHER-TIMEFRAME STRUCTURE

B. SUPPORT / RESISTANCE

C. LIQUIDITY

D. AMD / ACCUMULATION-MANIPULATION-DISTRIBUTION

E. LIQUIDITY SWEEP

F. MSS / BOS

G. DISPLACEMENT

H. FVG

I. VOLUME

J. RISK / REWARD

Each component must have a clearly defined scoring rule.

Do NOT simply give points because the AI "feels" that something is present.

Every score must include:

- Status

- Score

- Evidence

- Confidence

- Missing information, if any

Example:

HTF Structure

2/2

Bullish

Evidence:

"4H structure shows a sequence of higher highs and higher lows."

==================================================

6. HIGHER-TIMEFRAME STRUCTURE

==================================================

Determine whether the market structure is:

- Bullish

- Bearish

- Sideways / ranging

- Unclear

Identify:

- Higher High

- Higher Low

- Lower High

- Lower Low

- Major swing points

Do NOT call a trend bullish simply because the most recent candle is green.

Do NOT call a trend bearish simply because the most recent candle is red.

Structure must be based on meaningful swing points.

If structure cannot be determined:

"HTF structure: UNCONFIRMED"

==================================================

7. SUPPORT AND RESISTANCE

==================================================

Identify meaningful zones rather than pretending a single exact price is always precise.

Consider:

- Previous swing highs

- Previous swing lows

- Repeated reactions

- Breakout/retest areas

- Major consolidation boundaries

Display:

Support zone:

XXXX–XXXX

Resistance zone:

XXXX–XXXX

Explain why the zone matters.

Do NOT invent price levels that are not visible in the screenshot.

==================================================

8. LIQUIDITY

==================================================

Identify obvious areas where liquidity may exist, such as:

- Previous highs

- Previous lows

- Equal highs

- Equal lows

- Range highs

- Range lows

- Obvious stop clusters

Clearly distinguish:

"Observed liquidity"

from

"Possible liquidity."

Never claim to know where actual institutional orders are located from a screenshot.

==================================================

9. LIQUIDITY SWEEP

==================================================

A liquidity sweep should require actual visual evidence.

For a bullish sweep:

- Price takes/sweeps a prior low or sell-side liquidity area

- Then shows rejection or reclaim

- Preferably followed by bullish confirmation

For bearish:

- Price takes/sweeps a prior high or buy-side liquidity area

- Then rejects/reclaims lower

- Preferably followed by bearish confirmation

If only a wick is visible but confirmation is unclear:

"Possible liquidity sweep — confirmation insufficient."

Do NOT automatically classify every wick as a liquidity sweep.

==================================================

10. AMD

==================================================

Analyze Accumulation → Manipulation → Distribution only when the chart provides enough evidence.

Do NOT force AMD onto every chart.

Possible structure:

Accumulation:

Range/consolidation

Manipulation:

Liquidity sweep / false breakout

Distribution:

Strong directional move after the manipulation

If the sequence cannot be established:

"AMD: Not confirmed."

==================================================

11. MSS / BOS

==================================================

Clearly distinguish:

BOS = Break of Structure

MSS = Market Structure Shift

Do not label a random candle breakout as MSS/BOS.

Identify:

- What structure was broken

- Direction of break

- Approximate price level

- Whether displacement accompanied the break

==================================================

12. DISPLACEMENT

==================================================

Look for decisive directional movement.

Consider:

- Candle body size

- Relative movement compared with recent candles

- Structure break

- Follow-through

Do not call a single large candle displacement automatically.

==================================================

13. FVG

==================================================

Identify potential Fair Value Gaps only when the candle structure supports them.

Display:

FVG direction:

Bullish/Bearish

Approximate zone:

XXXX–XXXX

Status:

Open / partially filled / filled / unclear

Do not invent an FVG if the screenshot does not contain enough candle detail.

==================================================

14. VOLUME

==================================================

If volume is visible, analyze it.

Do NOT use the simplistic rule:

"Green volume = buyers won."

Instead consider:

- Relative volume

- Volume expansion

- Volume contraction

- Volume during breakout

- Volume during rejection

- Volume relative to recent average

If volume is unavailable and the analysis requires it:

"Volume context unavailable."

Ask the user for a screenshot with volume if necessary.

==================================================

15. TRADE DIRECTION

==================================================

Possible results:

POTENTIAL LONG

POTENTIAL SHORT

WAIT

NO TRADE

INSUFFICIENT DATA

The system must be allowed to say:

"NO TRADE"

This is extremely important.

Do not force a directional prediction.

==================================================

16. TRADE PLAN

==================================================

The Trade Plan must be CONDITIONAL.

Instead of:

"LONG"

prefer:

"POTENTIAL LONG SETUP"

Then display:

Entry zone

Stop / invalidation

TP1

TP2

Risk/reward

Required confirmation

Invalidation conditions

Example:

POTENTIAL LONG

Entry zone:

4,218–4,224

Invalidation:

Below 4,196 swing low

TP1:

4,270 liquidity

TP2:

4,302 weekly high

R:R:

2.8R

Required confirmation:

- Bullish structure remains intact

- Price accepts/reclaims the swept area

- No strong bearish displacement against the setup

Important:

The application must explicitly say:

"This is a conditional setup, not a guaranteed prediction."

==================================================

17. ENTRY LOGIC

==================================================

Do not automatically recommend entering immediately after a setup is detected.

Differentiate between:

SETUP FORMING

SETUP CONFIRMED

ENTRY AVAILABLE

ENTRY MISSED

SETUP INVALIDATED

NO TRADE

Example:

"Potential LONG setup forming."

Then:

"Wait for retracement into the defined entry zone."

This prevents users from chasing price.

==================================================

18. RISK MANAGEMENT

==================================================

The application should ask the user for:

- Account balance

- Maximum risk percentage per trade

Example:

Account:

₱100,000

Risk:

0.5%

Maximum loss:

₱500

Then calculate position sizing when enough information is available.

The user must be able to configure:

Risk per trade:

0.25%

0.5%

1%

Custom

The system should strongly discourage increasing risk simply because setup quality is high.

==================================================

19. RISK/REWARD

==================================================

Calculate R:R mathematically from:

Entry

Stop

Target

Do NOT claim that a high R:R means a high probability of winning.

Clearly explain:

"R:R measures potential reward relative to defined risk. It does not predict win probability."

==================================================

20. SETUP SCORE

==================================================

FIX THE CURRENT SCORING BUG.

The application currently displays an impossible score such as:

16/10

This must NEVER happen.

Create one clearly defined scoring system.

For example:

HTF Structure       0–2

Support/Resistance  0–1

Liquidity           0–2

AMD                 0–2

Liquidity Sweep     0–2

MSS/BOS             0–2

Displacement       0–1

FVG                 0–1

Volume              0–1

Risk/Reward         0–2

Maximum:

16/16

Make sure the UI, backend, database and statistics all use the SAME scoring system.

Suggested interpretation:

13–16:

A — Strong setup

10–12:

B — Good setup

7–9:

C — Weak / mixed

0–6:

D — Poor / insufficient

IMPORTANT:

The score is NOT a probability.

Never display:

"16/16 = 100% chance."

==================================================

21. AI CONFIDENCE

==================================================

Separate:

SETUP SCORE

from:

AI VISUAL CONFIDENCE

AI confidence should describe confidence in the QUALITY OF THE VISUAL EVIDENCE.

It must NOT mean:

"Probability the trade wins."

Example:

Visual evidence:

HIGH

Meaning:

"The uploaded screenshots provide clear visual evidence for the identified structure."

Not:

"90% chance of winning."

==================================================

22. HISTORICAL ACCURACY

==================================================

This is one of the most important features.

DO NOT calculate "accuracy" from AI confidence.

DO NOT claim historical accuracy until there are enough completed trades.

Every analyzed setup should be journaled.

Store:

- Asset

- Market type

- Date

- Timeframes

- Direction

- Setup score

- Individual checklist scores

- Entry

- Stop

- TP1

- TP2

- R:R

- Outcome

- Result in R

- Whether setup was valid

- Reason for invalidation

- Screenshot references if possible

After enough completed comparable setups, calculate:

Total trades

Wins

Losses

Breakevens

Win rate

Average winner

Average loser

Expectancy

Profit factor

Maximum drawdown

Average R

Cumulative R

Also allow filtering by:

- Asset

- Direction

- Setup score

- Timeframe

- Setup type

- Date range

==================================================

23. MINIMUM SAMPLE SIZE

==================================================

Do NOT show a meaningful "accuracy rate" from 1–5 trades.

Use sample-size warnings.

Example:

0–19:

"Insufficient evidence"

20–49:

"Early sample — highly uncertain"

50–99:

"Developing evidence"

100+:

"More meaningful historical sample"

Make the threshold configurable.

The user must understand:

"100 trades does not guarantee future performance."

==================================================

24. COMPARABLE SETUPS

==================================================

Historical performance should compare similar setups.

For example:

A bullish liquidity sweep + MSS + FVG setup on BTC 15M should not automatically be mixed with completely different setups on XAUUSD 4H.

Allow statistics to be grouped by:

Asset

Timeframe

Direction

Setup score

Setup components

Show:

"Comparable setups: 37"

rather than pretending the entire database represents the same strategy.

==================================================

25. JOURNAL

==================================================

Improve the journal so every setup can be followed through completion.

Statuses:

OPEN

WIN

LOSS

BREAKEVEN

INVALIDATED

MISSED

NO TRADE

Allow the user to enter:

Result in R

Example:

+2.8R

-1R

0R

The statistics page should automatically update when a result is recorded.

==================================================

26. "WHY THIS READ" SECTION

==================================================

Keep this section.

But make it much more educational.

Instead of generic statements, explain the setup in plain English.

Example:

"1. The 4H structure is bullish because price is making higher highs and higher lows.

2. Price moved below a previous swing low, suggesting a sell-side liquidity sweep.

3. Price then reclaimed the level and broke the local lower high.

4. The break occurred with strong displacement.

5. A bullish FVG remains below current price and provides a potential retracement zone.

6. The setup becomes invalid if price closes below the swept low."

This should teach the user WHY the setup exists.

==================================================

27. INVALIDATION WATCH

==================================================

Keep and improve this.

Every potential setup should have explicit invalidation conditions.

Examples:

- Close below swept low

- Bearish MSS

- Failure to reclaim level

- Entry zone no longer valid

- Risk/reward falls below minimum

- Major structure changes

If invalidated:

Display:

"SETUP INVALIDATED"

Do not continue showing:

"POTENTIAL LONG"

==================================================

28. USER EDUCATION MODE

==================================================

Add an optional "Learning Mode."

When enabled, ChartPilot should teach the user.

For every setup ask:

"What do you think the market structure is?"

Possible answers:

Bullish

Bearish

Sideways

Unclear

Then:

"Where is the liquidity?"

Then:

"Was there a liquidity sweep?"

Then:

"Did MSS/BOS occur?"

Then:

"Where would the setup become invalid?"

After the user answers, reveal the analysis and explain mistakes.

This should turn ChartPilot into both:

- A chart analysis tool

- A trading education tool

==================================================

29. NO-HALLUCINATION RULE

==================================================

This is critical.

NEVER invent:

- Price levels

- Swing highs

- Swing lows

- Liquidity

- FVGs

- Volume

- Indicators

- Timeframes

- Asset names

- Support/resistance

- Entry prices

If something cannot be observed:

"Not visible."

If something is uncertain:

"Unclear."

If more context is required:

"Upload another screenshot."

Accuracy is more important than producing an answer.

==================================================

30. UI IMPROVEMENTS

==================================================

Keep the existing ChartPilot visual identity.

Maintain the clean, modern, slightly cute aesthetic.

Make the most important information immediately understandable.

At the top of the result page show:

DIRECTION

SETUP QUALITY

VISUAL EVIDENCE

HISTORICAL EDGE

Use clear labels.

For example:

POTENTIAL LONG

A — Strong setup

High visual evidence

Historical edge: 58% across 84 comparable setups

But ONLY show the historical percentage if the database actually contains enough comparable completed setups.

==================================================

31. RESULT PAGE ORDER

==================================================

Organize the analysis page in this order:

1. Overall result

2. Simple explanation

3. Trade Plan

4. Required confirmation

5. Invalidation

6. Setup checklist

7. Why this read

8. Historical evidence

9. Risk management

10. Journal

The user should not need to understand advanced trading terminology just to understand the result.

Add short explanations/tooltips for:

HTF

Liquidity

Liquidity Sweep

AMD

MSS

BOS

Displacement

FVG

R

R:R

==================================================

32. SETTINGS

==================================================

Allow configuration of:

Preferred assets

Preferred timeframes

Minimum R:R

Risk per trade

Minimum sample size

Volume requirement

Learning Mode

Strict Mode

Strict Mode should be ON by default.

Strict Mode means:

"When evidence is insufficient, WAIT."

==================================================

33. STRICT DECISION RULE

==================================================

The most important rule:

WHEN IN DOUBT → WAIT.

The application should prefer:

WAIT

over:

GUESS

The application should prefer:

NO TRADE

over:

FORCED SETUP

The application should prefer:

MORE CONTEXT REQUIRED

over:

INVENTED INFORMATION

==================================================

34. TESTING

==================================================

After implementing the improvements, test the entire application.

Test:

- One screenshot

- Multiple screenshots

- Missing timeframe

- Missing volume

- Poor quality screenshot

- BTC

- XAUUSD

- AMD

- ADI

- Bullish setup

- Bearish setup

- Sideways market

- No setup

- Invalidated setup

- Completed WIN

- Completed LOSS

- BREAKEVEN

- Historical statistics

- R:R calculations

- Position sizing

- Journal updates

- Mobile UI

- Desktop UI

Specifically test that:

1. Scores can never exceed their maximum.

2. "16/10" or similar impossible scores can never occur.

3. Historical win rate cannot appear before enough data exists.

4. AI confidence cannot be displayed as trade probability.

5. The system can return WAIT.

6. The system can return NO TRADE.

7. The system can request more screenshots.

8. The system cannot invent price levels.

9. Invalidated setups are clearly marked.

10. Trade plans are clearly described as conditional suggestions.

==================================================

35. IMPORTANT FUTURE REQUIREMENT

==================================================

The long-term goal is for this application to run on a private company computer rather than requiring a recurring Replit hosting subscription.

DO NOT migrate or rewrite the application for local hosting yet.

For now, simply keep the architecture clean and document:

- Frontend dependencies

- Backend dependencies

- AI API dependencies

- Database dependencies

- Environment variables

- External services

Do not expose API keys in the frontend.

Make it possible to migrate the application to a company PC/local server later.

==================================================

36. FINAL REQUIREMENT

==================================================

After making the changes, provide a clear report with:

1. What you changed

2. What was already working

3. What you fixed

4. How the scoring works

5. How historical accuracy works

6. What happens when screenshots are insufficient

7. What the Trade Plan means

8. What the AI confidence means

9. What the application NEVER claims

10. Which parts still depend on external services

11. What would be required to make the entire application run locally

Do not claim the system is "perfect" or "guaranteed accurate."

The objective is:

STRICT.

TRANSPARENT.

EVIDENCE-BASED.

EDUCATIONAL.

MARKET-AGNOSTIC.

RISK-AWARE.

And above all:

WHEN THE CHART DOES NOT PROVIDE ENOUGH EVIDENCE, SAY SO.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://chart-oracle-28.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/fafa43d0-9071-4598-8b69-41ed74c70740).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
