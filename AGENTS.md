<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

<!-- antislop:start -->
## Project memory (read before every task, whichever agent you are)

This project is worked on by more than one AI agent. Do not rely on chat history.

1. Read `PROJECT_CONTEXT.md`, `FEATURE_MAP.md`, `DEVELOPMENT_LOG.md` and `TASK_TRACKER.md`, then run `git status` and `git log -5`.
2. Work in small milestones: plan, say which files change and what could break, change only the agreed scope, run the checks in `TESTING_GUIDE.md`, update those files, commit.
3. Before changing a shared part, list every page that uses it (`FEATURE_MAP.md` › Shared parts).
4. Never discard someone else's uncommitted work, force-push, reset or rebase pushed commits.
5. Ask the owner before removing a feature, replacing a major technology, dropping or changing database columns or tables, adding a paid service, or anything that cannot be undone.
6. Report honestly: verified, implemented but not fully tested, known issues. The owner is not a programmer; explain in plain language.

## antislop
For UI, copy, people, mobile layout, or code comments work, read `antislop.md` (core) as the filter and `DESIGN.md` for direction.
Before starting, ask the user when antislop applies: during the work, or after it is done.
<!-- antislop:end -->

## Trading core rules (keep these when editing)

- Stored candle `time` is the bar OPEN time (MT5). A bar counts only after `candleCloseMs` (src/lib/freshness.ts); live Den signals read closed bars, backtests only see bars closed by the step's close.
- Every Den or AI trade plan must have the stop beyond the entry and TP1 in front of it; R:R is measured from the levels (`checkPlan` in stats.ts), never taken from a model.
- Backtests: pullback entries must fill before they count (`NOT_FILLED` otherwise), exit at TP1, stop wins same-bar ties, costs are charged per trade.
- Position size converts the quote-currency stop into the account currency (`sizePosition` in src/lib/instruments.ts); never show a size without the rate.
- A Den result only shows "Ready" when the trades the app would let you take have a measured edge (`edgeVerdict` in src/lib/edge-verdict.ts: enough trades to see a +0.10R edge, positive after costs, a per-day coin flip matching it less often than 5% split across every test logged in `edge_checks`). Backtests replay every signal mirrored for that check, and every backtest is judged on the server by `judgeBacktest` (src/lib/edge-checks.server.ts); keep both. Nothing gets called an edge without costs or without its tests counted.
- One exception, added at the owner's request (2026-11-14): Settings › "Require a proven edge" (`settings.require_edge`, default on, shown to the owner only). Off lets "Ready" light on the rules alone. The result must then say that no edge is proven, the plan steps state it without failing the check, and shared signals and alerts keep their "No measured edge" line. The switch never changes a verdict.
- Run `npx tsx scripts/trading-check.ts` after touching the Den engine, backtests, sizing or stats.
