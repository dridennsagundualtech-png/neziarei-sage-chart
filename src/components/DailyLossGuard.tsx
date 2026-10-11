import { OctagonX } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { realizedRToday } from "@/lib/stats";

type Row = Parameters<typeof realizedRToday>[0][number];

/**
 * The daily loss limit from Settings, enforced: once today's closed trades add
 * up to the limit, new analyses wait behind an explicit "analyze anyway".
 */
export function useDailyLossLock(rows: Row[], limitR: number) {
  const [overridden, setOverridden] = useState(false);
  const todayR = realizedRToday(rows);
  const hit = limitR > 0 && todayR <= -limitR;
  return {
    todayR,
    limitR,
    hit,
    locked: hit && !overridden,
    override: () => setOverridden(true),
  };
}

export function DailyLossBanner({ lock }: { lock: ReturnType<typeof useDailyLossLock> }) {
  if (lock.limitR <= 0 || lock.todayR >= 0) return null;
  const today = `${lock.todayR.toFixed(1)}R`;

  if (!lock.hit) {
    return (
      <p className="text-sm text-muted-foreground">
        Today so far: <span className="font-semibold text-bear">{today}</span> of your −
        {lock.limitR}R daily limit.
      </p>
    );
  }

  return (
    <section role="alert" className="card-soft border-bear/50">
      <h2 className="card-band text-bear">
        <OctagonX className="size-4" aria-hidden /> Daily loss limit reached
      </h2>
      <div className="space-y-3 p-4">
        <p className="text-sm">
          You are at <span className="font-semibold text-bear">{today}</span> today, past your −
          {lock.limitR}R limit. Your own rule says stop for today: the next trade is the one most
          likely to be a revenge trade.
        </p>
        {lock.locked ? (
          <Button type="button" variant="secondary" className="w-full" onClick={lock.override}>
            I understand, analyze anyway
          </Button>
        ) : (
          <p className="text-xs text-muted-foreground">
            Override on for this session. The limit is in Settings → Risk.
          </p>
        )}
      </div>
    </section>
  );
}
