import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { ModelPicker } from "@/components/ModelPicker";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useAccess } from "@/lib/account";
import { DEFAULT_ANALYSIS_MODEL } from "@/lib/ai-models";
import { runAIBacktest, runBacktest } from "@/lib/backtest.functions";
import type { BacktestResult } from "@/lib/backtest-shared.server";
import { listMarketSymbols, listMarketTimeframes } from "@/lib/market.functions";
import { cn } from "@/lib/utils";

type Engine = "den" | "ai";

function pct(value: number | null): string {
  return value === null ? "–" : `${value.toFixed(1)}%`;
}

function rr(value: number | null): string {
  return value === null ? "–" : `${value >= 0 ? "+" : ""}${value.toFixed(2)}R`;
}

export function BacktestSection() {
  const { access, loading } = useAccess();
  const isAdmin = Boolean(access?.isAdmin);

  const symbolsFn = useServerFn(listMarketSymbols);
  const timeframesFn = useServerFn(listMarketTimeframes);
  const backtestFn = useServerFn(runBacktest);
  const aiBacktestFn = useServerFn(runAIBacktest);

  const [engine, setEngine] = useState<Engine>("den");
  const [model, setModel] = useState<string>(DEFAULT_ANALYSIS_MODEL);
  const [maxSamples, setMaxSamples] = useState(20);
  const [symbol, setSymbol] = useState("");
  const [timeframes, setTimeframes] = useState<string[]>([]);
  const [stepTf, setStepTf] = useState("");
  const [candleCount, setCandleCount] = useState(400);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<BacktestResult | null>(null);

  const symbolsQuery = useQuery({
    queryKey: ["market-symbols"],
    enabled: isAdmin,
    queryFn: () => symbolsFn({}) as Promise<string[]>,
  });

  const timeframesQuery = useQuery({
    queryKey: ["market-timeframes", symbol],
    enabled: isAdmin && Boolean(symbol),
    queryFn: () => timeframesFn({ data: { symbol } }) as Promise<string[]>,
  });

  useEffect(() => {
    if (!symbol && symbolsQuery.data?.length) setSymbol(symbolsQuery.data[0]!);
  }, [symbol, symbolsQuery.data]);

  const availableTfs = timeframesQuery.data ?? [];

  useEffect(() => {
    if (!availableTfs.length) return;
    setTimeframes((current) => {
      const kept = current.filter((tf) => availableTfs.includes(tf));
      return kept.length ? kept : availableTfs.slice(0, 3);
    });
  }, [timeframesQuery.data]);

  useEffect(() => {
    if (timeframes.length && !timeframes.includes(stepTf)) {
      setStepTf(timeframes[timeframes.length - 1]!);
    }
  }, [timeframes, stepTf]);

  const toggleTf = (tf: string) =>
    setTimeframes((current) =>
      current.includes(tf) ? current.filter((item) => item !== tf) : [...current, tf],
    );

  const run = async () => {
    setRunning(true);
    setResult(null);
    try {
      const data =
        engine === "ai"
          ? ((await aiBacktestFn({
              data: { symbol, timeframes, stepTimeframe: stepTf, candleCount, model, maxSamples },
            })) as BacktestResult)
          : ((await backtestFn({
              data: { symbol, timeframes, stepTimeframe: stepTf, candleCount },
            })) as BacktestResult);
      setResult(data);
      toast.success(
        engine === "ai"
          ? `${data.totalSetups} setups from ${data.modelCallsMade ?? data.steps} sampled AI calls (${data.modelErrors ?? 0} failed).`
          : `${data.totalSetups} setups found across ${data.steps} simulated steps.`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Backtest failed.");
    } finally {
      setRunning(false);
    }
  };

  if (loading) {
    return (
      <p className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Checking access…
      </p>
    );
  }

  if (!isAdmin) {
    return (
      <div className="card-soft space-y-2 p-6">
        <ShieldCheck className="size-5 text-primary" />
        <h1 className="font-display text-lg font-semibold">Admin only</h1>
        <p className="text-sm text-muted-foreground">
          The Den Analyzer backtest is restricted to admin accounts.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="card-soft space-y-4 p-5">
        <div>
          <h1 className="font-display text-lg font-semibold">Backtest</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Walk-forward replay: at every step the engine only sees candles that existed at that
            moment, on every timeframe, no lookahead.
          </p>
        </div>

        <div className="space-y-1.5">
          <span className="text-sm font-medium">Engine</span>
          <div className="flex flex-wrap gap-2">
            {[
              { id: "den" as const, label: "Den Analyzer", note: "Free, instant, deterministic" },
              { id: "ai" as const, label: "AI Analyzer", note: "Real model calls, real cost" },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setEngine(item.id)}
                className={cn(
                  "rounded-lg border px-3 py-2 text-left text-xs transition-colors",
                  engine === item.id
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border bg-elevated text-muted-foreground",
                )}
              >
                <span className="block font-semibold">{item.label}</span>
                <span className="block text-[10px] opacity-80">{item.note}</span>
              </button>
            ))}
          </div>
        </div>

        {engine === "ai" && (
          <div className="panel space-y-3 p-3">
            <ModelPicker value={model} onChange={setModel} />
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">Sampled steps (real model calls)</span>
                <span className="text-xs font-semibold text-primary">{maxSamples}</span>
              </div>
              <Slider
                value={[maxSamples]}
                min={5}
                max={60}
                step={5}
                onValueChange={(value) => setMaxSamples(value[0] ?? 20)}
                aria-label="Sampled steps"
              />
              <p className="text-[11px] text-muted-foreground">
                Steps are spread evenly across the history depth below, not every candle: each one
                is a real, billed model call, so this stays capped instead of walking the full range
                like the free Den engine does.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <span className="text-sm font-medium">Symbol</span>
          <div className="flex flex-wrap gap-2">
            {(symbolsQuery.data ?? []).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setSymbol(item)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs transition-colors",
                  item === symbol
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border bg-elevated text-muted-foreground",
                )}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <span className="text-sm font-medium">Timeframes</span>
          <div className="flex flex-wrap gap-2">
            {availableTfs.map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => toggleTf(tf)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs transition-colors",
                  timeframes.includes(tf)
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border bg-elevated text-muted-foreground",
                )}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <span className="text-sm font-medium">Simulation step timeframe</span>
          <div className="flex flex-wrap gap-2">
            {timeframes.map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => setStepTf(tf)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs transition-colors",
                  tf === stepTf
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border bg-elevated text-muted-foreground",
                )}
              >
                {tf}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Each closed candle on this timeframe advances the simulation clock.
          </p>
        </div>

        <div className="panel space-y-2 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold">History depth per timeframe</span>
            <span className="text-xs font-semibold text-primary">{candleCount}</span>
          </div>
          <Slider
            value={[candleCount]}
            min={100}
            max={2000}
            step={50}
            onValueChange={(value) => setCandleCount(value[0] ?? 400)}
            aria-label="History depth"
          />
        </div>

        <Button
          onClick={run}
          disabled={running || !symbol || timeframes.length === 0}
          className="w-full"
        >
          {running ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />{" "}
              {engine === "ai" ? "Sampling history…" : "Replaying history…"}
            </>
          ) : (
            `Run ${engine === "ai" ? "AI" : "Den"} backtest`
          )}
        </Button>
        {running && (
          <p className="text-[11px] text-muted-foreground">
            {engine === "ai"
              ? "Running sampled steps in small batches; this can take a while and makes real model calls."
              : "The engine re-analyses every step in a single request; this can take a few seconds."}
          </p>
        )}
      </section>

      {result && (
        <>
          <section className="card-soft space-y-4 p-5">
            <h2 className="font-display text-base font-semibold">Results</h2>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Setups found", value: String(result.totalSetups) },
                { label: "Win rate", value: pct(result.winRate) },
                { label: "Average R", value: rr(result.avgR) },
              ].map((item) => (
                <div key={item.label} className="panel p-3 text-center">
                  <p className="text-lg font-semibold text-primary">{item.value}</p>
                  <p className="text-[11px] text-muted-foreground">{item.label}</p>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">
              {result.engine === "ai"
                ? `${result.modelCallsMade ?? result.steps} sampled AI calls`
                : `${result.steps} simulated steps`}{" "}
              on {result.stepTimeframe} ({result.from?.slice(0, 16)} → {result.to?.slice(0, 16)}).{" "}
              {result.wins} wins, {result.losses} losses, {result.unresolved} unresolved. Total{" "}
              {rr(result.totalR)}.
              {result.engine === "ai" && (result.modelErrors ?? 0) > 0
                ? ` ${result.modelErrors} sample${result.modelErrors === 1 ? "" : "s"} failed and were skipped.`
                : ""}
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-muted-foreground">
                  <tr>
                    <th className="py-1 pr-3">Group</th>
                    <th className="py-1 pr-3">Setups</th>
                    <th className="py-1 pr-3">Resolved</th>
                    <th className="py-1 pr-3">Win rate</th>
                    <th className="py-1">Avg R</th>
                  </tr>
                </thead>
                <tbody>
                  {[...result.byDirection, ...result.byScore].map((row) => (
                    <tr key={row.label} className="border-t border-border/60">
                      <td className="py-1.5 pr-3 font-medium">{row.label}</td>
                      <td className="py-1.5 pr-3">{row.setups}</td>
                      <td className="py-1.5 pr-3">{row.resolved}</td>
                      <td className="py-1.5 pr-3">{pct(row.winRate)}</td>
                      <td className="py-1.5">{rr(row.avgR)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="card-soft space-y-3 p-5">
            <h2 className="font-display text-base font-semibold">Individual setups</h2>
            {result.setups.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No long or short setups were proposed over this history.
              </p>
            ) : (
              <div className="max-h-[28rem] space-y-2 overflow-y-auto pr-1">
                {result.setups.map((setup) => (
                  <div key={`${setup.time}-${setup.direction}`} className="panel space-y-1 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold">
                        {setup.time.slice(0, 16).replace("T", " ")}
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                          setup.outcome === "STOP"
                            ? "bg-destructive/15 text-destructive"
                            : setup.outcome === "UNRESOLVED"
                              ? "bg-muted text-muted-foreground"
                              : "bg-bull/15 text-bull",
                        )}
                      >
                        {setup.outcome === "STOP"
                          ? "Loss"
                          : setup.outcome === "UNRESOLVED"
                            ? "Unresolved"
                            : `Win ${setup.outcome}`}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                      <span
                        className={cn(
                          "font-semibold",
                          setup.direction === "POTENTIAL LONG" ? "text-bull" : "text-destructive",
                        )}
                      >
                        {setup.direction === "POTENTIAL LONG" ? "Long" : "Short"}
                      </span>
                      <span>Score {setup.score}</span>
                      <span>{rr(setup.realizedR)}</span>
                      <span>
                        E {setup.entry} · SL {setup.stop} · TP1 {setup.tp1}
                      </span>
                    </div>
                    {setup.components.length > 0 && (
                      <p className="text-[10px] text-muted-foreground">
                        {setup.components.map((c) => `${c.key} (${c.score})`).join(" · ")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
