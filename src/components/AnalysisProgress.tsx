import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

const STAGES = [
  "Reading chart...",
  "Checking image quality...",
  "Mapping market structure...",
  "Finding liquidity...",
  "Checking AMD...",
  "Confirming MSS/BOS...",
  "Evaluating entry...",
  "Calculating historical statistics...",
];

/** Friendly, honest loading experience — the steps mirror the real checklist. */
export function AnalysisProgress() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((current) => Math.min(current + 1, STAGES.length - 1));
    }, 2600);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="animate-float-in card-soft p-5">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-2xl bg-primary/15 text-primary">
          <Loader2 className="size-5 animate-spin" />
        </span>
        <div>
          <p className="font-display text-base font-semibold">Reading your charts carefully</p>
          <p className="text-xs text-muted-foreground">
            No guessing — only what is visible in your screenshots.
          </p>
        </div>
      </div>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full w-1/3 rounded-full bg-primary animate-sheen" />
      </div>

      <ul className="mt-4 space-y-2">
        {STAGES.map((stage, index) => (
          <li
            key={stage}
            className={cn(
              "flex items-center gap-2 text-sm transition-colors",
              index < step && "text-muted-foreground",
              index === step && "text-foreground",
              index > step && "text-muted-foreground/40",
            )}
          >
            {index < step ? (
              <Check className="size-4 text-primary" />
            ) : index === step ? (
              <Loader2 className="size-4 animate-spin text-primary" />
            ) : (
              <span className="size-4 rounded-full border border-border" />
            )}
            {stage}
          </li>
        ))}
      </ul>
    </div>
  );
}
