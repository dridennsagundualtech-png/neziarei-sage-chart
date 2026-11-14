import { useEffect, useState } from "react";

import { guardRails } from "./stats";

type RailRow = Parameters<typeof guardRails>[0][number];

/**
 * The two optional guard rails from Settings › Risk, enforced the same way as
 * the daily loss limit (useDailyLossLock): at the trade limit, or inside the
 * pause after a loss, new analyses wait behind an explicit "analyze anyway".
 * GuardRailsBanner in components/DailyLossGuard.tsx shows it.
 */
export function useGuardRails(rows: RailRow[], maxTradesPerDay: number, pauseAfterLossMin: number) {
  const [overridden, setOverridden] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const rails = guardRails(rows, { maxTradesPerDay, pauseAfterLossMin }, new Date(now));

  // While pausing, look at the clock twice a minute so the wait counts down and ends by itself.
  useEffect(() => {
    if (!rails.cooling) return;
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, [rails.cooling]);

  const hit = rails.tradesHit || rails.cooling;
  return { ...rails, hit, locked: hit && !overridden, override: () => setOverridden(true) };
}
