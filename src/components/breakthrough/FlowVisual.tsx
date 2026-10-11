import { ArrowDown, ChevronDown, RotateCcw } from "lucide-react";
import { useState } from "react";

import type { FlowSpec } from "@/lib/breakthrough/types";
import { TONE } from "./tone";

/** Cause-and-effect or step diagram. Boxes with a note can be tapped open. */
export function FlowVisual({ spec }: { spec: FlowSpec }) {
  const [open, setOpen] = useState<number | null>(null);
  const hasNotes = spec.nodes.some((n) => n.note);
  const grid = spec.layout === "grid";

  return (
    <div className="space-y-2">
      {hasNotes && <p className="text-[13px] text-muted-foreground">Tap a box to see why.</p>}
      <ol className={grid ? "grid grid-cols-1 gap-2 min-[400px]:grid-cols-2" : "space-y-0"}>
        {spec.nodes.map((node, i) => {
          const isOpen = open === i;
          const color = TONE[node.tone ?? "muted"];
          return (
            <li key={`${node.label}-${i}`}>
              {node.note ? (
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex h-full min-h-11 w-full items-start gap-3 rounded-lg border border-border bg-background px-3 py-2.5 text-left"
                  style={{ borderLeftColor: color, borderLeftWidth: 3 }}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-semibold leading-snug">
                      {node.label}
                    </span>
                    {isOpen && (
                      <span className="mt-1 block text-[14px] leading-relaxed text-muted-foreground">
                        {node.note}
                      </span>
                    )}
                  </span>
                  <ChevronDown
                    className={`mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
              ) : (
                <div
                  className="flex h-full min-h-11 items-center rounded-lg border border-border bg-background px-3 py-2.5 text-[15px] font-semibold leading-snug"
                  style={{ borderLeftColor: color, borderLeftWidth: 3 }}
                >
                  {node.label}
                </div>
              )}
              {!grid && i < spec.nodes.length - 1 && (
                <div className="flex justify-center py-1 text-muted-foreground" aria-hidden>
                  <ArrowDown className="size-4" />
                </div>
              )}
            </li>
          );
        })}
      </ol>
      {spec.loop && (
        <p className="flex items-center justify-center gap-1.5 text-[13px] text-muted-foreground">
          <RotateCcw className="size-3.5" /> and back to the top: it repeats
        </p>
      )}
      {spec.caption && (
        <p className="text-[14px] leading-relaxed text-muted-foreground">{spec.caption}</p>
      )}
    </div>
  );
}
