import { CheckCircle2, ChevronDown, TriangleAlert, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import type { BreakthroughChapter, DeepTerm } from "@/lib/breakthrough";
import { TOPIC_LABEL } from "@/lib/education-content";
import { cn } from "@/lib/utils";
import { TermVisual } from "./TermVisual";

function TermBody({ term }: { term: DeepTerm }) {
  const rows: { label: string; text: string | undefined }[] = [
    { label: "What it is", text: term.meaning },
    { label: "How to spot it", text: term.spot },
    { label: "On TradingView", text: term.tv },
    { label: "Watch out", text: term.caution },
  ];
  return (
    <div className="space-y-4 pb-5">
      <div className="rounded-2xl border border-border bg-elevated p-3">
        <TermVisual visual={term.visual} />
      </div>
      <dl className="space-y-3">
        {rows
          .filter((r) => r.text)
          .map((r) => (
            <div key={r.label}>
              <dt
                className={cn(
                  "flex items-center gap-1.5 text-[13px] font-semibold",
                  r.label === "Watch out" ? "text-warn" : "text-muted-foreground",
                )}
              >
                {r.label === "Watch out" && <TriangleAlert className="size-3.5" />}
                {r.label}
              </dt>
              <dd className="mt-0.5 text-[15px] leading-relaxed">{r.text}</dd>
            </div>
          ))}
      </dl>
    </div>
  );
}

/** Full-screen chapter reader: every term opens to its illustration and notes. */
export function BreakthroughReader({
  chapter,
  number,
  total,
  done,
  initialTerm,
  onClose,
  onComplete,
}: {
  chapter: BreakthroughChapter;
  number: number;
  total: number;
  done: boolean;
  initialTerm?: string | undefined;
  onClose: () => void;
  onComplete: () => void;
}) {
  const titleId = useId();
  const startIndex = Math.max(
    0,
    chapter.terms.findIndex((t) => t.term === initialTerm),
  );
  const [open, setOpen] = useState<Set<number>>(() => new Set([startIndex]));
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const allOpen = open.size === chapter.terms.length;

  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  // Runs once per opened chapter: jump to the searched term, otherwise focus the title.
  useEffect(() => {
    if (initialTerm) itemRefs.current[startIndex]?.scrollIntoView({ block: "start" });
    else headingRef.current?.focus();
  }, [initialTerm, startIndex]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const toggle = (i: number) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex flex-col bg-background"
    >
      <div className="border-b border-border">
        <div className="mx-auto flex w-full max-w-lg items-center gap-3 px-4 py-2">
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 items-center gap-1.5 rounded-xl px-2 text-[15px] font-medium text-foreground"
          >
            <X className="size-5" /> Close
          </button>
          <span className="ml-auto text-[13px] tabular-nums text-muted-foreground">
            Chapter {number} of {total}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-lg px-4 pb-6 pt-5">
          <p className="text-[13px] font-medium text-muted-foreground">
            Breakthrough · {TOPIC_LABEL[chapter.topic] ?? chapter.topic}
          </p>
          <h2
            id={titleId}
            ref={headingRef}
            tabIndex={-1}
            className="mt-1 font-display text-[22px] font-semibold leading-tight outline-none"
          >
            {chapter.title}
          </h2>
          <p className="mt-1.5 text-[15px] leading-relaxed text-muted-foreground">
            {chapter.summary}
          </p>

          <div className="mt-5 flex items-center justify-between">
            <span className="text-[13px] text-muted-foreground">{chapter.terms.length} terms</span>
            <button
              type="button"
              onClick={() => setOpen(allOpen ? new Set() : new Set(chapter.terms.map((_, i) => i)))}
              className="h-11 rounded-xl px-2 text-[14px] font-medium text-foreground underline underline-offset-4"
            >
              {allOpen ? "Close all" : "Open all"}
            </button>
          </div>

          <ul className="border-t border-border">
            {chapter.terms.map((term, i) => {
              const isOpen = open.has(i);
              const panelId = `${titleId}-t${i}`;
              return (
                <li
                  key={term.term}
                  ref={(el) => {
                    itemRefs.current[i] = el;
                  }}
                  className="scroll-mt-2 border-b border-border"
                >
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => toggle(i)}
                    className="flex min-h-14 w-full items-center gap-3 py-3 text-left"
                  >
                    <span className="w-6 shrink-0 font-mono text-[13px] tabular-nums text-muted-foreground">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[16px] font-semibold leading-snug">
                        {term.term}
                      </span>
                      {term.aka && (
                        <span className="mt-0.5 block text-[13px] text-muted-foreground">
                          {term.aka}
                        </span>
                      )}
                    </span>
                    <ChevronDown
                      className={cn(
                        "size-5 shrink-0 text-muted-foreground transition-transform",
                        isOpen && "rotate-180",
                      )}
                    />
                  </button>
                  {isOpen && (
                    <div id={panelId}>
                      <TermBody term={term} />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          <section className="mt-6 border-l-2 border-warn pl-3">
            <h3 className="text-[13px] font-semibold text-warn">Common mistake</h3>
            <p className="mt-1 text-[15px] leading-relaxed">{chapter.mistake}</p>
          </section>
        </div>
      </div>

      <div className="border-t border-border bg-background">
        <div className="mx-auto w-full max-w-lg px-4 py-3">
          <Button
            className="h-12 w-full rounded-2xl text-[15px] font-semibold"
            onClick={() => {
              onComplete();
              onClose();
            }}
          >
            {done ? (
              <>
                <CheckCircle2 className="size-4" /> Done
              </>
            ) : (
              "Mark chapter complete · +10 XP"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
