import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { History, Loader2, Save, Settings2, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { BacktestResultView } from "@/components/BacktestResultView";
import { DenRulesEditor } from "@/components/DenRulesEditor";
import { ModelPicker } from "@/components/ModelPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { useAccess } from "@/lib/account";
import { DEFAULT_ANALYSIS_MODEL, DEN_MODEL } from "@/lib/ai-models";
import { runAIBacktest, runBacktest } from "@/lib/backtest.functions";
import { getBacktestRun, saveBacktestRun } from "@/lib/backtest-history.functions";
import type { BacktestResult } from "@/lib/backtest-shared.server";
import type { DenRules } from "@/lib/den-rules";
import { listMarketSymbols, listMarketTimeframes } from "@/lib/market.functions";
import { cn } from "@/lib/utils";
import { runAutoOptimize, type OptimizeResult } from "@/lib/auto-optimize";
import { RULE_COMBINATIONS } from "@/lib/rule-combinations";

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
  const saveRunFn = useServerFn(saveBacktestRun);
  const getRunFn = useServerFn(getBacktestRun);
  const navigate = useNavigate();

  const [engine, setEngine] = useState<Engine>("den");
  const [model, setModel] = useState<string>(DEFAULT_ANALYSIS_MODEL);
  const [maxSamples, setMaxSamples] = useState(20);
  const [symbol, setSymbol] = useState("");
  const [timeframes, setTimeframes] = useState<string[]>([]);
  const [stepTf, setStepTf] = useState("");
  const [candleCount, setCandleCount] = useState(400);
  const [holdoutPct, setHoldoutPct] = useState(30);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<BacktestResult | null>(null);

  // Local checklist / rulebook that only affects this backtest run
  const [showRules, setShowRules] = useState(false);
  const [localRules, setLocalRules] = useState<Partial<DenRules>>({});

  // Auto Optimize state
  const [optimizing, setOptimizing] = useState(false);
  const [optimizeProgress, setOptimizeProgress] = useState("");
  const [optimizeResults, setOptimizeResults] = useState<OptimizeResult[] | null>(null);

  // Save this run to Backtest History
  const [saveLabel, setSaveLabel] = useState("");
  const [saving, setSaving] = useState(false);

  // "Reload into Backtest" from a saved history run: ?reload=<id>
  const reloadedRef = useRef(false);

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

  // Prefill everything from a saved history run when arriving as ?reload=<id>
  useEffect(() => {
    if (reloadedRef.current) return;
    const id = new URLSearchParams(window.location.search).get("reload");
    if (!id) return;
    reloadedRef.current = true;
    (async () => {
      try {
        const saved = await getRunFn({ data: { id } });
        if (!saved) {
          toast.error("That saved backtest run could not be found.");
          return;
        }
        setEngine(saved.engine);
        if (saved.model) setModel(saved.model);
        setSymbol(saved.symbol);
        setTimeframes(saved.timeframes);
        setStepTf(saved.step_timeframe);
        setCandleCount(saved.candle_count);
        if (saved.den_rules) {
          setLocalRules(saved.den_rules);
          setShowRules(true);
        }
        toast.success("Loaded settings from your saved backtest run.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not load that saved run.");
      }
    })();
  }, [getRunFn]);

  const run = async () => {
    setRunning(true);
    setResult(null);
    try {
      const data =
        engine === "ai"
          ? ((await aiBacktestFn({
              data: {
                symbol,
                timeframes,
                stepTimeframe: stepTf,
                candleCount,
                model,
                maxSamples,
              },
            })) as BacktestResult)
          : ((await backtestFn({
              data: {
                symbol,
                timeframes,
                stepTimeframe: stepTf,
                candleCount,
                denRules: Object.keys(localRules).length > 0 ? localRules : undefined,
                holdoutPct,
              },
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

  const runOptimize = async () => {
    if (!symbol || timeframes.length === 0) {
      toast.error("Pick a symbol and at least one timeframe first.");
      return;
    }

    setOptimizing(true);
    setOptimizeResults(null);
    setOptimizeProgress("Starting…");

    try {
      const results = await runAutoOptimize({
        runOne: async (components) => {
          const data = (await backtestFn({
            data: {
              symbol,
              timeframes,
              stepTimeframe: stepTf,
              candleCount,
              denRules: { components },
              holdoutPct,
            },
          })) as BacktestResult;
          return data;
        },
        onProgress: (current, total, name) => {
          setOptimizeProgress(`Testing ${current} of ${total}: ${name}`);
        },
      });

      setOptimizeResults(results);
      if (results.length > 0) {
        toast.success(`Tested ${results.length} combinations. Best: ${results[0]!.combination.name}`);
      } else {
        toast.error("No combinations produced usable results.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Auto optimize failed.");
    } finally {
      setOptimizing(false);
      setOptimizeProgress("");
    }
  };

  const saveRun = async (
    runResult: BacktestResult,
    options?: { denRules?: Partial<DenRules>; label?: string },
  ) => {
    setSaving(true);
    try {
      await saveRunFn({
        data: {
          engine: runResult.engine,
          label: options?.label ?? saveLabel,
          symbol,
          timeframes,
          stepTimeframe: stepTf,
          candleCount,
          minRR: null,
          model: runResult.engine === "ai" ? model : null,
          denRules:
            runResult.engine === "ai"
              ? null
              : (options?.denRules ?? (Object.keys(localRules).length > 0 ? localRules : null)),
          result: runResult,
        },
      });
      toast.success("Saved to Backtest History.");
      setSaveLabel("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save this run.");
    } finally {
      setSaving(false);
    }
  };

  const applyCombination = (combo: (typeof RULE_COMBINATIONS)[number]) => {
    setLocalRules({ components: combo.components });
    setShowRules(true);
    toast.success(`Applied “${combo.name}” to the checklist editor.`);
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
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-lg font-semibold">Backtest</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Walk-forward replay: at every step the engine only sees candles that existed at that
              moment, on every timeframe, no lookahead.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 rounded-lg"
            onClick={() => navigate({ to: "/journal" })}
          >
            <History className="size-3.5" /> History
          </Button>
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
        </div>

        <div className="panel space-y-2 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold">History depth per timeframe</span>
            <span className="text-xs font-semibold text-primary">{candleCount}</span>
          </div>
          <Slider
            value={[candleCount]}
            min={100}
            max={8000}
            step={100}
            onValueChange={(value) => setCandleCount(value[0] ?? 400)}
            aria-label="History depth"
          />
        </div>

        <div className="panel space-y-2 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold">Holdout (unseen test %)</span>
            <span className="text-xs font-semibold text-primary">{holdoutPct === 0 ? "Off" : `${holdoutPct}%`}</span>
          </div>
          <Slider
            value={[holdoutPct]}
            min={0}
            max={50}
            step={5}
            onValueChange={(value) => setHoldoutPct(value[0] ?? 30)}
            aria-label="Holdout percent"
          />
          <p className="text-[11px] text-muted-foreground">
            Last N% of the timeline is reserved as an unseen test. Judge strategies by holdout Avg R,
            not the full-sample number. 0 turns holdout off. 30% is a solid default.
          </p>
        </div>


        {engine === "den" && (
          <div className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setShowRules((v) => !v)}
              >
                <Settings2 className="mr-2 size-4" />
                {showRules ? "Hide Checklist Editor" : "Edit Checklist for Backtest"}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="flex-1"
                disabled={optimizing || running}
                onClick={runOptimize}
              >
                {optimizing ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Optimizing…
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 size-4" />
                    Auto Optimize Rules
                  </>
                )}
              </Button>
            </div>

            {optimizing && (
              <p className="text-xs text-muted-foreground">{optimizeProgress}</p>
            )}

            {showRules && (
              <div className="rounded-xl border border-border/60 p-1">
                <DenRulesEditor value={localRules} onChange={setLocalRules} />
                <p className="px-3 pb-3 text-[11px] text-muted-foreground">
                  Changes here only affect this backtest run. They do not change your global Settings
                  unless you save a preset inside the editor.
                </p>
              </div>
            )}
          </div>
        )}

        <Button
          onClick={run}
          disabled={running || optimizing || !symbol || timeframes.length === 0}
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
      </section>

      {/* Auto Optimize Results */}
      {optimizeResults && optimizeResults.length > 0 && (
        <section className="card-soft space-y-4 p-5">
          <h2 className="font-display text-base font-semibold">Auto Optimize Results</h2>
          <p className="text-xs text-muted-foreground">
            Ranked by Average R, win rate, and sample size. Combinations with 80+ resolved setups
            are marked <span className="font-medium text-primary">Reliable</span>. Prefer those.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="py-1 pr-3">Rank</th>
                  <th className="py-1 pr-3">Combination</th>
                  <th className="py-1 pr-3">Setups</th>
                  <th className="py-1 pr-3">Win rate</th>
                  <th className="py-1 pr-3">Avg R</th>
                  <th className="py-1 pr-3">Trust</th>
                  <th className="py-1">Action</th>
                </tr>
              </thead>
              <tbody>
                {optimizeResults.map((row, index) => (
                  <tr
                    key={row.combination.id}
                    className={cn(
                      "border-t border-border/60",
                      row.isReliable && "bg-primary/5",
                    )}
                  >
                    <td className="py-1.5 pr-3 font-medium">#{index + 1}</td>
                    <td className="py-1.5 pr-3">
                      <div className="font-medium">{row.combination.name}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {row.combination.description}
                      </div>
                    </td>
                    <td className="py-1.5 pr-3">{row.backtest.resolved}</td>
                    <td className="py-1.5 pr-3">{pct(row.backtest.winRate)}</td>
                    <td className="py-1.5 pr-3">{rr(row.backtest.avgR)}</td>
                    <td className="py-1.5 pr-3">
                      {row.isReliable ? (
                        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">
                          Reliable
                        </span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">Small sample</span>
                      )}
                    </td>
                    <td className="py-1.5">
                      <div className="flex gap-1.5">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 text-[11px]"
                          onClick={() => applyCombination(row.combination)}
                        >
                          Apply
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 text-[11px]"
                          disabled={saving}
                          onClick={() =>
                            saveRun(row.backtest, {
                              denRules: { components: row.combination.components },
                              label: row.combination.name,
                            })
                          }
                        >
                          <Save className="size-3" /> Save
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {result && (
        <section className="card-soft space-y-4 p-5">
          <h2 className="font-display text-base font-semibold">Results</h2>
          <BacktestResultView result={result} />

          <div className="flex flex-col gap-2 border-t border-border/60 pt-3 sm:flex-row">
            <Input
              placeholder="Optional label, e.g. “Full SMC, D1-H1”"
              className="h-10 flex-1 rounded-xl text-xs"
              value={saveLabel}
              onChange={(e) => setSaveLabel(e.target.value)}
            />
            <Button
              type="button"
              variant="secondary"
              className="h-10 rounded-xl"
              disabled={saving}
              onClick={() => saveRun(result)}
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save this run to history
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
