import type { EdgeVerdict, VerdictLevel } from "@/lib/edge-verdict";
import { cn } from "@/lib/utils";

export const VERDICT_LEVELS: Record<VerdictLevel, { label: string; border: string; text: string }> =
  {
    edge: { label: "Edge on this history", border: "border-bull/50", text: "text-bull" },
    unproven: { label: "Not proven", border: "border-warn/50", text: "text-warn" },
    none: { label: "No edge", border: "border-bear/50", text: "text-bear" },
    thin: { label: "Too little history", border: "border-border", text: "text-muted-foreground" },
  };

/** One verdict: what a set of backtested signals actually earned, against a coin flip. */
export function EdgeVerdictCard({ title, verdict }: { title: string; verdict: EdgeVerdict }) {
  const level = VERDICT_LEVELS[verdict.level];
  return (
    <div className={cn("rounded-2xl border bg-elevated p-4", level.border)}>
      <p className="text-[13px] font-medium text-muted-foreground">{title}</p>
      <p className={cn("caps mt-1 text-xl", level.text)}>{level.label}</p>
      <p className="mt-1 text-[15px] leading-relaxed">{verdict.headline}</p>
    </div>
  );
}
