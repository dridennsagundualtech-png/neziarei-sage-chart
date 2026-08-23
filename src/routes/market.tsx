import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, Database, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { MarketChart } from "@/components/MarketChart";
import { ResultView } from "@/components/ResultView";
import { Button } from "@/components/ui/button";
import { useAccess } from "@/lib/account";
import { DISCLAIMER } from "@/lib/analysis-types";
import { DEFAULT_SETTINGS, LOCAL_USER, useAnalyses, useSettings } from "@/lib/data";
import { analyzeMarketData, listMarketSymbols } from "@/lib/market.functions";
import type { MarketAnalysis } from "@/lib/market-types";

export const Route = createFileRoute("/market")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Live market analysis (admin) — ChartPilot" },
      {
        name: "description",
        content:
          "Admin-only multi-timeframe market analysis built from stored OHLC candles: bias, support and resistance levels, momentum and a conditional plan.",
      },
      { property: "og:title", content: "Live market analysis — ChartPilot" },
      {
        property: "og:description",
        content: "Multi-timeframe D1/H4/H1/M15/M5 read from real candle data.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MarketPage,
});

const TF_LABELS = "D1 80 · H4 100 · H1 120 · M15 150 · M5 150 candles";

function MarketPage() {
  return (
    <AppShell>
      <MarketAnalyze />
    </AppShell>
  );
}

function MarketAnalyze() {
  const { access, session, loading } = useAccess();
  const settingsQuery = useSettings();
  const analysesQuery = useAnalyses();
  const listFn = useServerFn(listMarketSymbols);
  const analyzeFn = useServerFn(analyzeMarketData);

  const [symbol, setSymbol] = useState<string>("");
  const [result, setResult] = useState<MarketAnalysis | null>(null);
  const [running, setRunning] = useState(false);

  const isAdmin = Boolean(access?.isAdmin);

  const symbolsQuery = useQuery({
    queryKey: ["market-symbols"],
    enabled: isAdmin,
    queryFn: () => listFn({}) as Promise<string[]>,
  });

  useEffect(() => {
    if (!symbol && symbolsQuery.data?.length) setSymbol(symbolsQuery.data[0]!);
  }, [symbol, symbolsQuery.data]);

  const settings = settingsQuery.data ?? { user_id: LOCAL_USER, ...DEFAULT_SETTINGS };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 size-4 animate-spin" /> Checking access…
      </div>
    );
  }

  if (!session || !isAdmin) {
    return (
      <section className="card-soft space-y-3 p-5 text-center">
        <span className="mx-auto grid size-11 place-items-center rounded-2xl bg-warn/15 text-warn">
          <ShieldCheck className="size-5" />
        </span>
        <h1 className="font-display text-xl font-semibold">Admin only</h1>
        <p className="text-sm text-muted-foreground">
          Live market analysis reads the shared market-data table and is restricted to the admin
          account.
        </p>
        <Button asChild variant="secondary" className="rounded-xl">
          <Link to="/settings">Go to settings</Link>
        </Button>
      </section>
    );
  }

  const run = async () => {
    if (!symbol) {
      toast.error("Pick a symbol first.");
      return;
    }
    setRunning(true);
    setResult(null);
    try {
      const analysis = (await analyzeFn({
        data: {
          symbol,
          minRR: Number(settings.min_rr),
          strictMode: settings.strict_mode,
          requireVolume: settings.require_volume,
        },
      })) as MarketAnalysis;
      setResult(analysis);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The market analysis failed. Try again.");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-5">
      <section className="card-soft p-5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Database className="size-3.5 text-primary" /> Admin · market data engine
        </div>
        <h1 className="mt-2 font-display text-2xl font-semibold leading-tight">
          Multi-timeframe read from live candle data
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          No screenshots. This pulls the most recent candles straight from your market-data table and
          analyses them with the same 16-point checklist.
        </p>
        <p className="mt-3 text-[11px] text-muted-foreground">{TF_LABELS}</p>
      </section>

      <section className="card-soft space-y-3 p-5">
        <div className="space-y-1.5">
          <span className="text-sm font-medium">Symbol</span>
          {symbolsQuery.isLoading ? (
            <p className="text-xs text-muted-foreground">Loading symbols…</p>
          ) : symbolsQuery.data?.length ? (
            <div className="flex flex-wrap gap-2">
              {symbolsQuery.data.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setSymbol(item)}
                  className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                    symbol === item
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-border bg-elevated text-muted-foreground"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              No symbols found in the market-data table yet.
            </p>
          )}
        </div>

        <Button className="h-12 w-full rounded-xl text-base" onClick={run} disabled={running}>
          {running ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          {running ? "Analysing candles…" : "Analyze market data"}
        </Button>
        <p className="flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-warn" />
          {DISCLAIMER}
        </p>
      </section>

      {result && (
        <>
          <section className="card-soft p-5">
            <h2 className="font-display text-base font-semibold">Market summary</h2>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {result.symbol} · data as of {result.data_as_of ? result.data_as_of.slice(0, 16) : "unknown"}
            </p>
            <p className="mt-3 text-sm leading-relaxed">{result.summary}</p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-border bg-elevated p-3">
                <p className="text-xs font-semibold text-muted-foreground">Resistance (above)</p>
                <ul className="mt-1.5 space-y-1 text-sm">
                  {result.resistance_levels.length ? (
                    result.resistance_levels.map((level) => <li key={level}>{level}</li>)
                  ) : (
                    <li className="text-muted-foreground">None identifiable.</li>
                  )}
                </ul>
              </div>
              <div className="rounded-2xl border border-border bg-elevated p-3">
                <p className="text-xs font-semibold text-muted-foreground">Support (below)</p>
                <ul className="mt-1.5 space-y-1 text-sm">
                  {result.support_levels.length ? (
                    result.support_levels.map((level) => <li key={level}>{level}</li>)
                  ) : (
                    <li className="text-muted-foreground">None identifiable.</li>
                  )}
                </ul>
              </div>
            </div>

            {result.momentum && (
              <div className="mt-3 rounded-2xl border border-border bg-elevated p-3">
                <p className="text-xs font-semibold text-muted-foreground">Momentum</p>
                <p className="mt-1.5 text-sm leading-relaxed">{result.momentum}</p>
              </div>
            )}
          </section>

          <MarketChart result={result} />

          {result.timeframe_reads.length > 0 && (
            <section className="card-soft p-5">
              <h2 className="font-display text-base font-semibold">Timeframe by timeframe</h2>
              <ul className="mt-3 space-y-3">
                {result.timeframe_reads.map((item) => (
                  <li key={item.timeframe} className="rounded-2xl border border-border bg-elevated p-3">
                    <p className="text-xs font-semibold text-primary">{item.timeframe}</p>
                    <p className="mt-1 text-sm leading-relaxed">{item.read}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="card-soft p-5">
            <h2 className="font-display text-base font-semibold">Measured statistics</h2>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Computed in code from the candles — not from the model.
            </p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-muted-foreground">
                  <tr>
                    <th className="py-1 pr-3">TF</th>
                    <th className="py-1 pr-3">Close</th>
                    <th className="py-1 pr-3">Trend</th>
                    <th className="py-1 pr-3">EMA20/50</th>
                    <th className="py-1 pr-3">ATR14</th>
                    <th className="py-1 pr-3">Range</th>
                    <th className="py-1 pr-3">Pos%</th>
                    <th className="py-1">Volume</th>
                  </tr>
                </thead>
                <tbody>
                  {result.stats.map((stat) => (
                    <tr key={stat.timeframe} className="border-t border-border/60">
                      <td className="py-1.5 pr-3 font-medium">{stat.timeframe}</td>
                      <td className="py-1.5 pr-3">{stat.last_close ?? "—"}</td>
                      <td className="py-1.5 pr-3">{stat.trend}</td>
                      <td className="py-1.5 pr-3">
                        {stat.ema20 ?? "—"} / {stat.ema50 ?? "—"}
                      </td>
                      <td className="py-1.5 pr-3">{stat.atr14 ?? "—"}</td>
                      <td className="py-1.5 pr-3">
                        {stat.range_low ?? "—"}–{stat.range_high ?? "—"}
                      </td>
                      <td className="py-1.5 pr-3">{stat.range_position_pct ?? "—"}</td>
                      <td className="py-1.5">{stat.volume_trend}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <ResultView
            result={result}
            journal={analysesQuery.data ?? []}
            settings={settings}
            savedRow={null}
          />
        </>
      )}
    </div>
  );
}
