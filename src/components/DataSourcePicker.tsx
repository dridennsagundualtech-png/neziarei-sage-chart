import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Database, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listDataSymbols, listDataTimeframes } from "@/lib/analyze.functions";
import {
  ageMinutes,
  classifyFreshness,
  formatAge,
  VERY_STALE_HINT,
} from "@/lib/freshness";
import { useDataFreshness } from "@/lib/useFreshness";
import { cn } from "@/lib/utils";

interface DataSourcePickerProps {
  symbol: string | null;
  timeframes: string[];
  onSymbol: (symbol: string) => void;
  onToggleTimeframe: (timeframe: string) => void;
}

export function DataSourcePicker({
  symbol,
  timeframes,
  onSymbol,
  onToggleTimeframe,
}: DataSourcePickerProps) {
  const fetchSymbols = useServerFn(listDataSymbols);
  const fetchTimeframes = useServerFn(listDataTimeframes);

  const symbolsQuery = useQuery({
    queryKey: ["ohlc-symbols"],
    queryFn: () => fetchSymbols(),
  });

  const timeframesQuery = useQuery({
    queryKey: ["ohlc-timeframes", symbol],
    queryFn: () => fetchTimeframes({ data: { symbol: symbol as string } }),
    enabled: Boolean(symbol),
  });

  const symbols = symbolsQuery.data ?? [];
  const available = timeframesQuery.data ?? [];

  return (
    <section className="card-soft space-y-4 p-4">
      <div className="flex items-center gap-2">
        <Database className="size-4 text-primary" />
        <h2 className="font-display text-sm font-semibold">Analyze from stored market data</h2>
      </div>
      <p className="text-xs text-muted-foreground">
        Uses the most recent 150 candles per selected timeframe from your price feed — no
        screenshots needed.
      </p>

      <div className="space-y-1.5">
        <Label>Symbol</Label>
        {symbolsQuery.isLoading ? (
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" /> Loading symbols…
          </p>
        ) : symbols.length === 0 ? (
          <p className="text-xs text-muted-foreground">No market data available yet.</p>
        ) : (
          <Select value={symbol ?? ""} onValueChange={onSymbol}>
            <SelectTrigger className="h-11 rounded-xl">
              <SelectValue placeholder="Pick a symbol" />
            </SelectTrigger>
            <SelectContent>
              {symbols.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {symbol && (
        <div className="space-y-1.5">
          <Label>Timeframes (one setup across timeframes)</Label>
          {timeframesQuery.isLoading ? (
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" /> Loading timeframes…
            </p>
          ) : available.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No timeframes stored for {symbol}.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {available.map((timeframe) => {
                const active = timeframes.includes(timeframe);
                return (
                  <Button
                    key={timeframe}
                    type="button"
                    size="sm"
                    variant={active ? "default" : "secondary"}
                    className={cn("rounded-full", active && "shadow-sm")}
                    onClick={() => onToggleTimeframe(timeframe)}
                  >
                    {timeframe}
                  </Button>
                );
              })}
            </div>
          )}

          {timeframes.length > 0 && (
            <div className="mt-2 space-y-1 rounded-xl border border-border bg-elevated p-2.5">
              {freshnessQuery.isLoading && (
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="size-3.5 animate-spin" /> Checking data freshness…
                </p>
              )}
              {freshness.map((row) => {
                const level = classifyFreshness(row.timeframe, row.lastTime);
                const age = ageMinutes(row.lastTime);
                return (
                  <div
                    key={row.timeframe}
                    className="flex items-center justify-between gap-2 text-[11px]"
                  >
                    <span className="font-medium">{row.timeframe}</span>
                    <span
                      className={cn(
                        "flex items-center gap-1.5 text-right",
                        level === "fresh" && "text-success",
                        level === "stale" && "text-warn",
                        level === "very-stale" && "text-destructive",
                        level === "unknown" && "text-muted-foreground",
                      )}
                    >
                      <span
                        className={cn(
                          "size-1.5 rounded-full bg-current",
                          level === "unknown" && "opacity-50",
                        )}
                      />
                      {level === "unknown"
                        ? "No candles stored"
                        : level === "very-stale"
                          ? `Last candle: ${formatAge(age)} — ${VERY_STALE_HINT}`
                          : `Last candle: ${formatAge(age)}`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
