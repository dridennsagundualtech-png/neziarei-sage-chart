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
## antislop
For UI, copy, people, mobile layout, or code comments work, read `antislop.md` (core) as the filter and `DESIGN.md` for direction.
Before starting, ask the user when antislop applies: during the work, or after it is done.
<!-- antislop:end -->

## Trading core rules (keep these when editing)

- Stored candle `time` is the bar OPEN time (MT5). A bar counts only after `candleCloseMs` (src/lib/freshness.ts); live Den signals read closed bars, backtests only see bars closed by the step's close.
- Every Den or AI trade plan must have the stop beyond the entry and TP1 in front of it; R:R is measured from the levels (`checkPlan` in stats.ts), never taken from a model.
- Backtests: pullback entries must fill before they count (`NOT_FILLED` otherwise), exit at TP1, stop wins same-bar ties, costs are charged per trade.
- Position size converts the quote-currency stop into the account currency (`sizePosition` in src/lib/instruments.ts); never show a size without the rate.
- Run `npx tsx scripts/trading-check.ts` after touching the Den engine, backtests, sizing or stats.
