/**
 * Clear WAIT banner: shows what to wait for, not just "WAIT".
 */
import { Hourglass } from "lucide-react";

import type { Direction } from "@/lib/analysis-types";
import { cn } from "@/lib/utils";

interface Props {
  direction: Direction;
  /** One-line summary, e.g. "Waiting for reclaim of 0.711790 on M1" */
  waitingFor?: string | null;
  /** Full list of concrete conditions */
  confirmations?: string[];
}

export function WaitBanner({ direction, waitingFor, confirmations = [] }: Props) {
  if (direction !== "WAIT" && direction !== "INSUFFICIENT DATA") return null;

  const lines =
    confirmations.length > 0
      ? confirmations
      : waitingFor
        ? [waitingFor]
        : [
            "Waiting for a clearer confirmation on the chart (sweep reclaim or structure close). Check Required confirmation below.",
          ];

  return (
    <section
      className={cn(
        "animate-float-in card-soft border-warn/40 p-4",
      )}
    >
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl bg-warn/15 text-warn">
          <Hourglass className="size-4" />
        </span>
        <div className="min-w-0 space-y-1">
          <h2 className="font-display text-base font-semibold text-warn">
            WAIT — specific next step
          </h2>
          {waitingFor && (
            <p className="text-sm font-medium text-foreground">{waitingFor}</p>
          )}
          <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
            {lines.map((line, i) => (
              <li key={i} className="panel flex gap-2 p-2.5">
                <span className="font-display text-warn">{i + 1}.</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
          <p className="pt-1 text-[11px] text-muted-foreground">
            Do not enter until one of these conditions prints on the chart. This is not a trade
            signal.
          </p>
        </div>
      </div>
    </section>
  );
}
