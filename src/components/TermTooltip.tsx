import { HelpCircle } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { GLOSSARY, SIMPLE_TERMS } from "@/lib/analysis-types";
import { cn } from "@/lib/utils";

interface TermTooltipProps {
  term: string;
  /** Detailed/technical explanation. Optional — the glossary is used otherwise. */
  explanation?: string;
  className?: string;
  label?: string;
  /** Render only the question mark, without repeating the label. */
  iconOnly?: boolean;
}

/**
 * Every technical word gets a question mark. Tapping it shows a kid-simple
 * explanation first, then the more technical detail underneath.
 */
export function TermTooltip({
  term,
  explanation,
  className,
  label,
  iconOnly,
}: TermTooltipProps) {
  const simple = SIMPLE_TERMS[term] ?? null;
  const detail = explanation ?? GLOSSARY[term] ?? null;

  if (!simple && !detail) return <span className={className}>{label ?? term}</span>;

  return (
    <Popover>
      <PopoverTrigger
        aria-label={`What does "${term}" mean?`}
        className={cn(
          "inline-flex max-w-full items-center gap-1 text-left align-middle",
          !iconOnly && "underline decoration-dotted decoration-border underline-offset-4",
          className,
        )}
      >
        {!iconOnly && <span className="min-w-0">{label ?? term}</span>}
        <span
          aria-hidden
          className="grid size-4 shrink-0 place-items-center rounded-full bg-primary/15 text-primary"
        >
          <HelpCircle className="size-3.5" />
        </span>
      </PopoverTrigger>
      <PopoverContent className="w-72 rounded-2xl text-sm leading-relaxed" align="start">
        <p className="font-display font-semibold text-primary">{term}</p>
        {simple && (
          <div className="mt-2">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              In simple words
            </p>
            <p className="mt-0.5 text-foreground">{simple}</p>
          </div>
        )}
        {detail && (
          <div className="mt-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              A bit more detail
            </p>
            <p className="mt-0.5 text-muted-foreground">{detail}</p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
