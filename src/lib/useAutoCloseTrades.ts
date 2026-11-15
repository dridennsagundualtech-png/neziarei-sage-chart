import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { autoClosePatches } from "./auto-close";
import { useUpdateAnalysis, type AnalysisRow } from "./data";
import { checkOpenTrades, type TradeCheck } from "./trade-check.functions";

/** At most one automatic look per this long, however often the Journal re-renders. */
const EVERY_MS = 5 * 60 * 1000;
let lastLook = 0;

/**
 * The journal that fills itself in: when the Journal is open and there are open
 * trades marked "I placed this", it reads how they ended from stored prices and
 * records the ones that finished. Trades not marked as placed are never touched.
 * It needs market-data access, so it stays quiet for accounts without it.
 */
export function useAutoCloseTrades(rows: AnalysisRow[], enabled: boolean) {
  const checkFn = useServerFn(checkOpenTrades);
  const update = useUpdateAnalysis();
  const busy = useRef(false);
  const waiting = rows.filter((row) => row.placed_at && row.outcome === "OPEN").length;

  useEffect(() => {
    if (!enabled || waiting === 0 || busy.current) return;
    if (Date.now() - lastLook < EVERY_MS) return;
    busy.current = true;
    lastLook = Date.now();
    void (async () => {
      try {
        const checks = (await checkFn()) as TradeCheck[];
        const patches = autoClosePatches(rows, checks, new Date().toISOString());
        let done = 0;
        for (const item of patches) {
          try {
            await update.mutateAsync(item);
            done += 1;
          } catch {
            // Left open; the next look tries again.
          }
        }
        if (done > 0) {
          toast.success(
            `${done} placed trade${done === 1 ? "" : "s"} closed from stored prices. Check ${done === 1 ? "it" : "them"} in History.`,
          );
        }
      } catch {
        // No market data access or no connection: nothing is changed and nothing is shown.
      } finally {
        busy.current = false;
      }
    })();
    // Only the count of waiting trades should start a look, not every re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, waiting]);
}
