import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { listDataFreshness } from "@/lib/analyze.functions";
import type { FreshnessRow } from "@/lib/freshness";

/**
 * Shared query for the last stored candle time per timeframe. Both the picker
 * and the Analyze action read the same cache entry.
 */
export function useDataFreshness(symbol: string | null, timeframes: string[]) {
  const fetchFreshness = useServerFn(listDataFreshness);
  const sorted = [...timeframes].sort();

  return useQuery({
    queryKey: ["ohlc-freshness", symbol, sorted.join(",")],
    queryFn: async () =>
      (await fetchFreshness({
        data: { symbol: symbol as string, timeframes: sorted },
      })) as FreshnessRow[],
    enabled: Boolean(symbol) && sorted.length > 0,
    refetchInterval: 60_000,
  });
}
