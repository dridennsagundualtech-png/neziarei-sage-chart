import { AlertTriangle, BookOpen, Eye, HelpCircle, Lightbulb, ShieldX } from "lucide-react";

import { CONCEPT_BY_ID, type Concept } from "@/lib/education-content";
import type { ChecklistKey } from "@/lib/analysis-types";
import { cn } from "@/lib/utils";

/** Maps every checklist component to the concept that explains it. */
export const CHECKLIST_CONCEPT: Record<ChecklistKey, string> = {
  htf_structure: "market_structure",
  support_resistance: "support",
  liquidity: "liquidity",
  amd: "amd",
  liquidity_sweep: "liquidity_sweep",
  mss_bos: "mss",
  displacement: "displacement",
  fvg: "fvg",
  volume: "volume",
  risk_reward: "risk_reward",
};

export function conceptFor(key: ChecklistKey): Concept | null {
  return CONCEPT_BY_ID[CHECKLIST_CONCEPT[key]] ?? null;
}

interface ConceptCardProps {
  concept: Concept;
  /** Extra chart-specific evidence from the current analysis, when available. */
  observed?: string | null;
  observedMissing?: string | null;
  className?: string;
  beginner?: boolean;
}

function Row({
  icon: Icon,
  label,
  text,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  text: string;
  tone?: "warn" | "bear" | "primary";
}) {
  return (
    <div className="flex gap-2">
      <Icon
        className={cn(
          "mt-0.5 size-3.5 shrink-0",
          tone === "warn" && "text-warn",
          tone === "bear" && "text-bear",
          (!tone || tone === "primary") && "text-primary",
        )}
      />
      <p className="text-xs leading-relaxed text-muted-foreground">
        <span className="font-medium text-foreground/90">{label}: </span>
        {text}
      </p>
    </div>
  );
}

export function ConceptCard({
  concept,
  observed,
  observedMissing,
  className,
  beginner = false,
}: ConceptCardProps) {
  return (
    <div className={cn("panel space-y-2 p-3", className)}>
      <p className="font-display text-sm font-semibold">{concept.name}</p>

      <Row icon={Lightbulb} label="In simple words" text={concept.simple} />
      {!beginner && <Row icon={BookOpen} label="Technical" text={concept.technical} />}
      <Row icon={Eye} label="Where it appears" text={concept.where} />
      <Row icon={HelpCircle} label="Why it matters" text={concept.why} />
      <Row icon={Eye} label="Evidence that supports it" text={observed?.trim() || concept.evidence} />
      <Row
        icon={AlertTriangle}
        label="Evidence that is missing"
        text={observedMissing?.trim() || concept.missing}
        tone="warn"
      />
      <Row icon={ShieldX} label="What would invalidate it" text={concept.invalidates} tone="bear" />
      <Row icon={AlertTriangle} label="Common beginner mistake" text={concept.mistake} tone="warn" />
      {!beginner && <Row icon={BookOpen} label="Example" text={concept.example} />}
    </div>
  );
}
