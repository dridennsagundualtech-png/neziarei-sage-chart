import { useServerFn } from "@tanstack/react-start";
import { CandlestickChart, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { fmtR } from "@/components/journal/parts";
import { Button } from "@/components/ui/button";
import { useUpdateAnalysis, type AnalysisRow } from "@/lib/data";
import { checkOpenTrades, type TradeCheck } from "@/lib/trade-check.functions";
import { cn } from "@/lib/utils";

const PROPOSAL: TradeCheck["status"][] = ["WIN", "LOSS", "MISSED"];

/**
 * Reads how open trades actually ended from the stored market data, so the
 * journal (and every statistic built on it) does not depend on remembering to
 * type each result. Proposals are shown first; nothing changes until applied.
 */
export function TradeResultCheck({ rows }: { rows: AnalysisRow[] }) {
  const checkFn = useServerFn(checkOpenTrades);
  const update = useUpdateAnalysis();
  const [checking, setChecking] = useState(false);
  const [results, setResults] = useState<TradeCheck[] | null>(null);
  const [applying, setApplying] = useState(false);

  const open = rows.filter(
    (row) =>
      row.outcome === "OPEN" &&
      (row.direction === "POTENTIAL LONG" || row.direction === "POTENTIAL SHORT"),
  );
  if (!open.length && !results) return null;

  const proposals = (results ?? []).filter((item) => PROPOSAL.includes(item.status));

  const run = async () => {
    setChecking(true);
    try {
      const inView = new Set(open.map((row) => row.id));
      const found = ((await checkFn()) as TradeCheck[]).filter((item) => inView.has(item.id));
      setResults(found);
      const n = found.filter((item) => PROPOSAL.includes(item.status)).length;
      toast.success(
        n
          ? `${n} trade${n === 1 ? "" : "s"} finished in the market data.`
          : "No open trade has finished yet.",
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not check your trades.");
    } finally {
      setChecking(false);
    }
  };

  const apply = async (items: TradeCheck[]) => {
    setApplying(true);
    let done = 0;
    for (const item of items) {
      try {
        await update.mutateAsync({
          id: item.id,
          patch: {
            outcome: item.status as "WIN" | "LOSS" | "MISSED",
            r_result: item.status === "MISSED" ? null : item.r,
            closed_at: item.at ?? new Date().toISOString(),
          },
        });
        done += 1;
      } catch {
        /* keep going; the count below says how many landed */
      }
    }
    setApplying(false);
    setResults(
      (current) => current?.filter((item) => !items.some((x) => x.id === item.id)) ?? null,
    );
    if (done === items.length) toast.success(`Recorded ${done} result${done === 1 ? "" : "s"}.`);
    else toast.error(`Recorded ${done} of ${items.length}; try the rest again.`);
  };

  return (
    <section className="card-soft mt-4">
      <h3 className="card-band">
        <CandlestickChart className="size-4 text-muted-foreground" aria-hidden />
        Check open trades
      </h3>
      <div className="space-y-3 p-4">
        <p className="text-sm text-muted-foreground">
          Reads your stored candles from the moment each trade was saved: did the entry fill, and
          did the stop or TP1 come first. Same rules as the backtest. Nothing changes until you
          apply it.
        </p>
        <Button
          type="button"
          variant="secondary"
          className="w-full"
          onClick={run}
          disabled={checking}
        >
          {checking ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <CandlestickChart className="size-4" />
          )}
          {checking
            ? "Reading the market data…"
            : `Check ${open.length} open trade${open.length === 1 ? "" : "s"}`}
        </Button>

        {results && (
          <ul className="divide-y divide-border">
            {results.map((item) => {
              const proposal = PROPOSAL.includes(item.status);
              return (
                <li key={item.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">
                      {item.asset}{" "}
                      <span
                        className={cn(
                          item.status === "WIN" && "text-bull",
                          item.status === "LOSS" && "text-bear",
                          !proposal && "text-muted-foreground",
                        )}
                      >
                        {item.status === "WIN"
                          ? `Win ${fmtR(item.r, 1)}`
                          : item.status === "LOSS"
                            ? `Loss ${fmtR(item.r, 1)}`
                            : item.status === "MISSED"
                              ? "Missed"
                              : item.status === "OPEN"
                                ? "Still open"
                                : "Can't check"}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.note}
                      {item.at && proposal ? ` ${item.at.slice(0, 16).replace("T", " ")} UTC` : ""}
                      {item.timeframe ? ` · ${item.symbol} ${item.timeframe}` : ""}
                    </p>
                  </div>
                  {proposal && (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={applying}
                      onClick={() => apply([item])}
                    >
                      Apply
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {proposals.length > 1 && (
          <Button
            type="button"
            className="w-full"
            disabled={applying}
            onClick={() => apply(proposals)}
          >
            {applying ? <Loader2 className="size-4 animate-spin" /> : null}
            Apply all {proposals.length} results
          </Button>
        )}
      </div>
    </section>
  );
}
