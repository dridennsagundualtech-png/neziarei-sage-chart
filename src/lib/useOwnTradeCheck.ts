import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo } from "react";

import { getDailyContext } from "./daily-context.functions";
import type { AnalysisRow, SettingsRow } from "./data";
import { fetchFxRate, instrumentOf, normalizeCurrency } from "./instruments";
import { oddsEdge } from "./odds-edge";
import { checkOwnTrade, type OwnTrade } from "./own-trade";

/**
 * Checks a typed trade against the trader's settings: looks up the exchange
 * rate for the size and the symbol's daily data for the noise check, then runs
 * checkOwnTrade. Either lookup can fail; the check then says what it couldn't do.
 */
export function useOwnTradeCheck(
  trade: OwnTrade | null,
  settings: SettingsRow,
  journal: AnalysisRow[],
) {
  const account = normalizeCurrency(settings.currency);
  const quote = trade ? instrumentOf(trade.symbol).quote : null;
  const fxQuery = useQuery({
    queryKey: ["fx-rate", quote, account],
    enabled: Boolean(quote) && quote !== account,
    staleTime: 6 * 60 * 60 * 1000,
    queryFn: () => fetchFxRate(quote!, account),
  });

  // Stored daily bars give the noise check its yardstick.
  const fetchContext = useServerFn(getDailyContext);
  const contextQuery = useQuery({
    queryKey: ["daily-context", trade?.symbol],
    enabled: Boolean(trade),
    staleTime: 10 * 60 * 1000,
    retry: false,
    queryFn: () => fetchContext({ data: { symbol: trade!.symbol } }),
  });

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

  return {
    result,
    typical: contextQuery.data?.typical_move ?? null,
    contextLoading: contextQuery.isLoading,
  };
}
