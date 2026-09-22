/**
 * Setup checklist with per-item "Show on chart" so you can see where
 * the Den Analyzer read each concept (sweep, BOS, FVG, etc.).
 */
import { Eye, EyeOff, ListChecks, MapPin } from "lucide-react";

import { TermTooltip } from "@/components/TermTooltip";
import { Progress } from "@/components/ui/progress";
import {
  CHECKLIST_BY_KEY,
  type AnalysisResult,
  type ChecklistKey,
} from "@/lib/analysis-types";
import type { ChecklistMarker } from "@/lib/market-types";
import { cn } from "@/lib/utils";

interface Props {
  result: AnalysisResult;
  /** Markers from MarketAnalysis (Den data mode). */
  markers?: ChecklistMarker[];
  /** Currently highlighted marker id (`${key}-${index}`) or checklist key. */
  activeMarkerId?: string;
  onSelectMarker?: (markerId: string, timeframe: string) => void;
}

function markerId(m: ChecklistMarker, index: number): string {
  return `${m.key}-${index}`;
}

export function ChecklistIllustrations({
  result,
  markers = [],
  activeMarkerId = "",
  onSelectMarker,
}: Props) {
  const byKey = new Map<string, { marker: ChecklistMarker; id: string }[]>();
  markers.forEach((m, i) => {
    const id = markerId(m, i);
    const list = byKey.get(m.key) ?? [];
    list.push({ marker: m, id });
    byKey.set(m.key, list);
  });

  return (
    <section className="animate-float-in card-soft p-4">
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary">
          <ListChecks className="size-4" />
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-base font-semibold">Setup checklist</h2>
          <p className="text-xs text-muted-foreground">
            Every component is capped at its maximum: total {result.score}/
            {result.max_score}. Tap{" "}
            <span className="font-medium text-foreground">Show on chart</span> to
            see where the rulebook read that item.
          </p>
        </div>
      </div>

      <ul className="mt-3 space-y-2">
        {result.checklist.map((item) => {
          const key = item.key as ChecklistKey;
          const spec = CHECKLIST_BY_KEY[key];
          const ratio = item.max > 0 ? (item.score / item.max) * 100 : 0;
          const anchors = byKey.get(item.key) ?? [];
          const hasAnchor = anchors.length > 0;
          const isActive = anchors.some((a) => a.id === activeMarkerId);

          return (
            <li
              key={item.key}
              className={cn(
                "panel p-3 transition-colors",
                isActive && "border-primary/50 bg-primary/5",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">
                  <TermTooltip
                    term={spec?.label ?? item.key}
                    label={spec?.label ?? item.key}
                    explanation={spec?.help}
                  />
                </p>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 font-mono text-xs",
                    ratio >= 100 && "bg-bull/15 text-bull",
                    ratio > 0 && ratio < 100 && "bg-warn/15 text-warn",
                    ratio === 0 && "bg-muted text-muted-foreground",
                  )}
                >
                  {item.score}/{item.max}
                </span>
              </div>

              <Progress value={ratio} className="mt-2 h-1.5" />
              <p className="mt-2 text-xs text-foreground/90">{item.status}</p>
              <p className="mt-1 text-xs text-muted-foreground">{item.evidence}</p>
              <p className="mt-1 text-[11px] text-muted-foreground/70">
                Evidence confidence: {item.confidence}
                {item.missing ? ` · Missing: ${item.missing}` : ""}
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                {hasAnchor ? (
                  anchors.map(({ marker, id }) => {
                    const selected = id === activeMarkerId;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => onSelectMarker?.(id, marker.timeframe)}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] transition-colors",
                          selected
                            ? "border-primary bg-primary/15 text-primary"
                            : "border-border bg-elevated text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {selected ? (
                          <Eye className="size-3" />
                        ) : (
                          <MapPin className="size-3" />
                        )}
                        {selected ? "Showing on chart" : `Show on chart (${marker.timeframe})`}
                      </button>
                    );
                  })
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground/70">
                    <EyeOff className="size-3" />
                    No chart anchor for this item
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
