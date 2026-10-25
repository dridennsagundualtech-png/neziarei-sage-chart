import { Check, CircleHelp, X } from "lucide-react";

import type { PlanSteps } from "@/lib/plan-steps";
import { cn } from "@/lib/utils";

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3 py-3">
      <span className="caps w-5 shrink-0 text-base text-primary" aria-hidden>
        {n}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{title}</p>
        <div className="mt-1.5 space-y-1.5 text-sm leading-snug text-muted-foreground">
          {children}
        </div>
      </div>
    </li>
  );
}

/** The conditional plan as numbered if/then steps: the rules the track record measures. */
export function PlanStepsView({ steps }: { steps: PlanSteps }) {
  const blocked = steps.checks.some((c) => c.ok === false);
  let n = 0;
  return (
    <div className="mt-4 border-t border-border pt-3">
      <p className="text-sm font-semibold">How to follow this plan</p>
      <p className="mt-1 text-xs text-muted-foreground">
        These are the rules the track record measures. Add anything else and your trades stop being
        the ones it measured.
      </p>
      <ol className="mt-1 divide-y divide-border">
        <Step n={++n} title={blocked ? "Check first: not all pass" : "Check first"}>
          {steps.checks.map((check) => (
            <p key={check.text} className="flex gap-2">
              {check.ok === true ? (
                <Check className="mt-0.5 size-4 shrink-0 text-bull" aria-label="Passes" />
              ) : check.ok === false ? (
                <X className="mt-0.5 size-4 shrink-0 text-bear" aria-label="Fails" />
              ) : (
                <CircleHelp
                  className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                  aria-label="Check yourself"
                />
              )}
              <span className={cn(check.ok === false && "text-foreground")}>{check.text}</span>
            </p>
          ))}
        </Step>
        <Step n={++n} title={`Place one order: ${steps.order}`}>
          {steps.place.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </Step>
        {steps.cancel.length > 0 && (
          <Step n={++n} title="Cancel the order if, before it fills:">
            {steps.cancel.map((line) => (
              <p key={line}>{line}</p>
            ))}
            <p className="text-xs">
              MT5 can give the order an expiry time, but it won't cancel it when a price is reached:
              set a price alert for each level above.
            </p>
          </Step>
        )}
        <Step n={++n} title="Once it fills">
          {steps.manage.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </Step>
        <Step n={++n} title="Afterwards">
          <p>
            Record it in the Journal: Win or Loss with the result in R if it filled, Missed if the
            order was cancelled, No trade if you skipped it.
          </p>
        </Step>
      </ol>
    </div>
  );
}
