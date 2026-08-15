import { ShieldAlert } from "lucide-react";

import { UNCERTAINTY_PRINCIPLES } from "@/lib/education-content";
import { cn } from "@/lib/utils";

/** Repeated, deliberate reminder that nothing here is certain. */
export function UncertaintyNote({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  if (compact) {
    return (
      <p className={cn("flex items-start gap-2 rounded-xl bg-warn/8 p-3 text-[11px] leading-relaxed text-muted-foreground", className)}>
        <ShieldAlert className="mt-0.5 size-3.5 shrink-0 text-warn" />
        A score is not a prediction. AI confidence is not win probability. A losing trade does not
        prove the analysis was wrong, and a winning trade does not prove it was right. When evidence is
        insufficient or conflicting: wait.
      </p>
    );
  }

  return (
    <section className={cn("card-soft p-4", className)}>
      <p className="flex items-center gap-2 font-display text-sm font-semibold">
        <ShieldAlert className="size-4 text-warn" /> What ChartPilot will never claim
      </p>
      <ul className="mt-2 space-y-1.5">
        {UNCERTAINTY_PRINCIPLES.map((line) => (
          <li key={line} className="flex gap-2 text-xs leading-relaxed text-muted-foreground">
            <span className="text-warn">•</span>
            {line}
          </li>
        ))}
      </ul>
    </section>
  );
}
