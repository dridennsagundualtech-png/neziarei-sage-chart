# Feature map

What the app does today, where the user finds it and which files hold it.
Everything listed here works and must keep working unless the owner says
otherwise. Last full review: 2026-11-14.

"Who" column: everyone = no sign-in, signed-in = any account, premium = a
redeemed code, owner = the admin account.

## Pages

| Page                 | What it does                                                                                                                                                         | Who                                                            | Main files                                                                                                                                                                 |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Home `/`             | Trading sessions clock, shared signals and setup alerts, market news, Pro Charts for the owner                                                                       | everyone sees the page; signals and alerts need sign-in        | `routes/index.tsx`, `TradingSessionCard`, `SetupAlertsPanel`, `NewsPanel`                                                                                                  |
| Analyze `/analyze`   | Two modes. Screenshot: upload charts for an AI read. Market data: an AI read of stored candles for members, and the Den Analyzer with its track record for the owner | premium; Market data needs the owner to enable it per account  | `routes/analyze.tsx`, `ChartUploader`, `lib/analyze.functions.ts`, `lib/analyze.server.ts`, `components/pages/MarketSection.tsx` (owner's Den view)                        |
| Result screen        | Verdict strip, At a glance summary, trade plan with steps, journal form; score, price map, odds, checklist and sizing open with "Show all details"                   | same as the page showing it                                    | `components/ResultView.tsx` (shared by Analyze, Journal history and Market)                                                                                                |
| Academy `/learn`     | Full course, App guide, Lessons, Books, Quizzes, Practice (AI)                                                                                                       | signed-in; Practice is premium                                 | `routes/learn.tsx`, `lib/full-course/`, `lib/app-guide/`, `lib/breakthrough/`, `components/pages/AcademyLessons.tsx`, `BooksSection.tsx`, `PracticeSection.tsx`            |
| Journal `/journal`   | History, Stats, Backtest stats, Notes, Ask AI, Screenshots, Split                                                                                                    | signed-in                                                      | `routes/journal.tsx`, `components/pages/HistorySection.tsx`, `StatisticsSection.tsx`, `NotesSection.tsx`, `AskAISection.tsx`, `ScreenshotsSection.tsx`, `SplitSection.tsx` |
| Settings `/settings` | Risk rules, analysis switches, watchlist, Telegram, glossary, EA check                                                                                               | signed-in; EA check and "Require a proven edge" are owner only | `routes/settings.tsx`, `components/settings/`                                                                                                                              |
| Market `/market`     | Old address. It redirects to Analyze › Market data and keeps the symbol and timeframes                                                                               | owner                                                          | `routes/market.tsx`                                                                                                                                                        |
| Backtest `/backtest` | Replay Den rules over stored history, save and compare runs                                                                                                          | owner                                                          | `routes/backtest.tsx`, `components/pages/BacktestSection.tsx`                                                                                                              |
| Pro Charts `/charts` | TradingView charts                                                                                                                                                   | owner                                                          | `routes/charts.tsx`, `ProChartsPanel`                                                                                                                                      |
| Admin `/admin`       | Create premium codes, see accounts, extend or remove premium, hide pages per account                                                                                 | owner                                                          | `routes/admin.tsx`, `lib/premium.functions.ts`, `lib/premium.server.ts`                                                                                                    |
| Sign in `/auth`      | Email and password, Google                                                                                                                                           | everyone                                                       | `routes/auth.tsx`, `routes/auth/callback.tsx`                                                                                                                              |

## Trading logic (the part that must stay correct)

| Feature                                        | Files                                                                                      | Depends on                                                     |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| Den Analyzer: rule-based read from candles     | `lib/den-analyzer.server.ts`, `lib/den-rules.ts`, `lib/den-analyzer.functions.ts`          | stored candles, `freshness.ts`                                 |
| Den rulebook editor and presets                | `components/DenRulesEditor.tsx`, `lib/den-presets.functions.ts`                            | `den-rules.ts`                                                 |
| Backtests: fills, exits, costs                 | `lib/den-backtest.server.ts`, `lib/backtest-shared.server.ts`, `lib/backtest.functions.ts` | Den Analyzer                                                   |
| Edge verdict: is it luck or an edge            | `lib/edge-verdict.ts`, `lib/edge-checks.server.ts`, table `edge_checks`                    | backtests                                                      |
| Plan check and R:R from the levels             | `checkPlan` in `lib/stats.ts`                                                              | none                                                           |
| Position size in account currency              | `sizePosition` in `lib/instruments.ts`                                                     | an FX rate                                                     |
| Price map and odds of each level               | `lib/price-map.ts`, `lib/level-odds.ts`, `PriceMapCard`, `LevelChances`                    | stored daily candles                                           |
| Probability check (stop vs spread and noise)   | `probabilityCheck` in `lib/price-map.ts`, `ProbabilityCheckView`                           | typical cost per symbol                                        |
| At a glance summary and the simple / full view | `lib/glance.ts`, `components/GlanceCard.tsx`, `ResultView.tsx`                             | checklist verdict, plan check, probability check, sizing, odds |
| Plan steps ("How to follow this plan")         | `lib/plan-steps.ts`, `PlanStepsView`                                                       | edge verdict, settings                                         |
| "Require a proven edge" switch                 | `settings.require_edge`, `routes/settings.tsx`, `ResultView.tsx`, `lib/plan-steps.ts`      | edge verdict                                                   |
| Your edge vs the odds (journal)                | `lib/odds-edge.ts`, `components/journal/OddsEdgeSection.tsx`                               | journal results                                                |
| Open-trade result check                        | `lib/trade-check.functions.ts`, `components/journal/TradeResultCheck.tsx`                  | stored candles                                                 |
| Daily loss limit pause                         | `components/DailyLossGuard.tsx`, `realizedRToday` in `lib/stats.ts`                        | journal results                                                |
| EA check: judge an MT5 report                  | `lib/ea-check.ts`, `components/settings/EaCheckSection.tsx`                                | runs on the device only                                        |
| Setup alerts and scheduled scan                | `lib/setup-alerts.server.ts`, `routes/api/cron/scan-setups.ts`                             | Den Analyzer, Resend                                           |
| Shared signals to members, Telegram            | `lib/member-signals.functions.ts`, `lib/telegram.ts`, `SharedSignalDetail`                 | edge note                                                      |

## Shared parts (check every page that uses them before changing)

| Part                                                                      | Used by                                                                                                                                                                                                                  |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `components/ResultView.tsx`                                               | `routes/analyze.tsx` (screenshot and member market-data reads), `components/pages/HistorySection.tsx` (saved reads), `components/pages/MarketSection.tsx` (owner's Den reads, the only place that passes a track record) |
| `components/AppShell.tsx` (navigation, layout)                            | every page                                                                                                                                                                                                               |
| `lib/account.ts` (`useSession`, `useAccess`)                              | every page that gates on sign-in, premium or owner                                                                                                                                                                       |
| `lib/data.ts` (settings, journal rows)                                    | Analyze, Journal, Settings, Market, Backtest                                                                                                                                                                             |
| `components/settings/parts.tsx`                                           | Settings page and its sections                                                                                                                                                                                           |
| `components/TermTooltip.tsx` with the glossary in `lib/analysis-types.ts` | nearly every screen                                                                                                                                                                                                      |

## Data (Supabase)

| Table                                                          | Holds                                                        |
| -------------------------------------------------------------- | ------------------------------------------------------------ |
| `analyses`                                                     | every saved read and its journal result                      |
| `settings`                                                     | one row per account: risk, switches, watchlist, Den rulebook |
| `ohlc_data`                                                    | MT5 candles pushed from the owner's PC (server access only)  |
| `backtest_runs`, `den_presets`                                 | saved backtests and rule presets                             |
| `edge_checks`                                                  | the log of every edge test (server access only)              |
| `setup_alerts`, `member_signals`, `member_signal_reads`        | alerts and shared signals                                    |
| `premium_access`, `premium_codes`, `user_roles`                | access control                                               |
| `notes`, `screenshots`, `analysis_images`, `learning_progress` | journal extras and Academy progress                          |
| `library_books`, `library_book_access`                         | Academy books                                                |

File storage: `chart-screenshots` and `books`, both private.

## Outside the repo

- The MT5 uploader that fills `ohlc_data` runs on the owner's PC and is not in
  this repo. `scripts/mt5_export_history.py` is a different tool: it only
  writes CSV files for research.
- Hosting, publishing and server secrets are managed in Lovable.
