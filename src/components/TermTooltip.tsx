import { HelpCircle } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { GLOSSARY } from "@/lib/analysis-types";
import { cn } from "@/lib/utils";

interface TermTooltipProps {
  term: string;
  explanation?: string;
  className?: string;
  label?: string;
}

/** Tap-friendly explainer so beginners never need to know the jargon. */
export function TermTooltip({ term, explanation, className, label }: TermTooltipProps) {
  const text = explanation ?? GLOSSARY[term] ?? "";
  if (!text) return <span className={className}>{label ?? term}</span>;

  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          "inline-flex items-center gap-1 text-left underline decoration-dotted decoration-border underline-offset-4",
          className,
        )}
      >
        {label ?? term}
        <HelpCircle className="size-3.5 shrink-0 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent className="w-72 rounded-2xl text-sm leading-relaxed">
        <p className="font-display font-semibold text-primary">{term}</p>
        <p className="mt-1 text-muted-foreground">{text}</p>
      </PopoverContent>
    </Popover>
  );
}
