import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ClipboardList, TrendingDown, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";

import { GlanceCard } from "@/components/GlanceCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getDailyContext } from "@/lib/daily-context.functions";
import type { AnalysisRow, SettingsRow } from "@/lib/data";
import {
  distanceText,
  fetchFxRate,
  instrumentOf,
  levelText,
  normalizeCurrency,
} from "@/lib/instruments";
import { oddsEdge } from "@/lib/odds-edge";
import { checkOwnTrade, parsePrice, type OwnTrade } from "@/lib/own-trade";
import { cn } from "@/lib/utils";

const FIELDS = [
  { key: "entry", label: "Entry", hint: "The price you would get in at." },
  { key: "stop", label: "Stop", hint: "Where the idea is wrong." },
  { key: "target", label: "Target", hint: "Where you would take profit." },
] as const;

type Prices = Record<(typeof FIELDS)[number]["key"], string>;

/**
 * "Check my trade": the trader types their own idea and the app checks the
 * plan, the stop, the size and the odds (src/lib/own-trade.ts). It has no view
 * on direction and says so.
 */
export function OwnTradeCheck({
  settings,
  journal,
}: {
  settings: SettingsRow;
  journal: AnalysisRow[];
}) {
  const [symbol, setSymbol] = useState("");
  const [long, setLong] = useState<boolean | null>(null);
  const [prices, setPrices] = useState<Prices>({ entry: "", stop: "", target: "" });
  const [problem, setProblem] = useState<string | null>(null);
  // The trade as it was when "Check" was pressed, so the answer matches what was asked.
  const [trade, setTrade] = useState<OwnTrade | null>(null);

  const account = normalizeCurrency(settings.currency);
  const quote = trade ? instrumentOf(trade.symbol).quote : null;
  const fxQuery = useQuery({
    queryKey: ["fx-rate", quote, account],
    enabled: Boolean(quote) && quote !== account,
    staleTime: 6 * 60 * 60 * 1000,
    queryFn: () => fetchFxRate(quote!, account),
  });

  // Stored daily bars give the noise check its yardstick. Without them the check says so.
  const fetchContext = useServerFn(getDailyContext);
  const contextQuery = useQuery({
    queryKey: ["daily-context", trade?.symbol],
    enabled: Boolean(trade),
    staleTime: 10 * 60 * 1000,
    retry: false,
    queryFn: () => fetchContext({ data: { symbol: trade!.symbol } }),
  });
  const typical = contextQuery.data?.typical_move ?? null;

  // The luck check replays the journal thousands of times, so only when it changes.
  const journalEdge = useMemo(() => oddsEdge(journal).level === "edge", [journal]);

  const result = trade
    ? checkOwnTrade(trade, {
        balance: Number(settings.account_balance),
        riskPct: Number(settings.risk_pct),
        currency: settings.currency,
        minRR: Number(settings.min_rr),
        quoteToAccount: fxQuery.data ?? null,
        rateLoading: fxQuery.isLoading,
        sigma: contextQuery.data?.price_map?.sigma ?? null,
        journalEdge,
      })
    : null;

  const check = () => {
    const name = symbol.trim().toUpperCase();
    const entry = parsePrice(prices.entry);
    const stop = parsePrice(prices.stop);
    const target = parsePrice(prices.target);
    if (name.length < 3)
      return setProblem("Type the symbol you want to trade, for example EURUSD.");
    if (long === null) return setProblem("Choose Long or Short.");
    if (entry === null || stop === null || target === null) {
      return setProblem("Enter the entry, the stop and the target as prices.");
    }
    setProblem(null);
    setTrade({ symbol: name, long, entry, stop, target });
  };

  return (
    <div className="space-y-4">
      <section className="card-soft">
        <h2 className="card-band">
          <ClipboardList className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          Your trade
        </h2>
        <form
          className="space-y-4 p-4"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            check();
          }}
        >
          <p className="text-sm text-muted-foreground">
            You bring the idea. The app checks the plan, the stop, the size and the odds. It has no
            view on which way price goes.
          </p>

          <div className="space-y-1.5">
            <Label htmlFor="own-symbol">Symbol</Label>
            <Input
              id="own-symbol"
              list="own-symbols"
              autoComplete="off"
              autoCapitalize="characters"
              placeholder="EURUSD, XAUUSD…"
              className="h-11 rounded-xl uppercase"
              value={symbol}
              onChange={(event) => setSymbol(event.target.value.toUpperCase().slice(0, 24))}
            />
            <datalist id="own-symbols">
              {settings.preferred_assets.map((asset) => (
                <option key={asset} value={asset} />
              ))}
            </datalist>
          </div>

          <div role="group" aria-label="Direction" className="grid grid-cols-2 gap-2">
            {[
              { label: "Long (buy)", value: true },
              { label: "Short (sell)", value: false },
            ].map((side) => (
              <Button
                key={side.label}
                type="button"
                aria-pressed={long === side.value}
                variant={long === side.value ? "selected" : "secondary"}
                className="h-11 rounded-xl"
                onClick={() => setLong(side.value)}
              >
                {side.label}
              </Button>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {FIELDS.map((field) => (
              <div key={field.key} className="space-y-1.5">
                <Label htmlFor={`own-${field.key}`}>{field.label}</Label>
                <Input
                  id={`own-${field.key}`}
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  aria-describedby={`own-${field.key}-hint`}
                  className="h-11 rounded-xl tabular-nums"
                  value={prices[field.key]}
                  onChange={(event) =>
                    setPrices((current) => ({ ...current, [field.key]: event.target.value }))
                  }
                />
                <p id={`own-${field.key}-hint`} className="text-xs text-muted-foreground">
                  {field.hint}
                </p>
              </div>
            ))}
          </div>

          {problem && (
            <p role="alert" className="text-sm font-medium text-warn">
              {problem}
            </p>
          )}

          <Button type="submit" className="h-12 w-full rounded-xl text-base">
            Check this trade
          </Button>
        </form>
      </section>

      {trade && result && (
        <section className="animate-float-in space-y-4" aria-live="polite">
          <div>
            <h2
              className={cn(
                "flex items-center gap-2 text-4xl font-bold leading-none",
                trade.long ? "text-bull" : "text-bear",
              )}
            >
              {trade.long ? (
                <TrendingUp className="size-7" aria-hidden />
              ) : (
                <TrendingDown className="size-7" aria-hidden />
              )}
              {trade.long ? "Long" : "Short"} {trade.symbol}
            </h2>
            <p className="mt-2 text-sm font-semibold tabular-nums">
              Entry {levelText(trade.symbol, trade.entry)}
              <span className="font-normal text-muted-foreground">
                {` · Stop ${levelText(trade.symbol, trade.stop)} · Target ${levelText(trade.symbol, trade.target)}`}
              </span>
            </p>
            <p className="mt-2 text-base font-semibold">{result.headline}</p>
          </div>

          <GlanceCard rows={result.rows} title="Your trade, checked" />

          {typical && result.plan.ok && (
            <p className="text-sm leading-snug text-muted-foreground">
              Your target is {distanceText(trade.symbol, Math.abs(trade.target - trade.entry))} from
              the entry. A typical day for {trade.symbol} covers about{" "}
              {distanceText(trade.symbol, typical.median)} from high to low.
            </p>
          )}

          <p className="text-xs leading-relaxed text-muted-foreground">
            {contextQuery.isLoading
              ? "Looking up this symbol's daily data…"
              : "This checks the plan, not the idea. Whether price goes your way is your call: no test found a way to predict it, so the odds above are the ones chance gives."}
          </p>
        </section>
      )}
    </div>
  );
}
