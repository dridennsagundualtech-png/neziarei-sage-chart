import { Check, CheckCircle2, ChevronRight, Lock, Search, Sparkles } from "lucide-react";
import { useId, useState } from "react";

import {
  BREAKTHROUGH,
  BREAKTHROUGH_TERM_COUNT,
  searchTerms,
  type BreakthroughChapter,
} from "@/lib/breakthrough";
import { breakthroughAccess, READ_FIRST } from "@/lib/breakthrough/progress";
import { cn } from "@/lib/utils";

/** The Breakthrough lesson block at the end of the learning path. */
export function BreakthroughSection({
  doneSet,
  onOpen,
}: {
  doneSet: Set<string>;
  onOpen: (chapter: BreakthroughChapter, term?: string) => void;
}) {
  const searchId = useId();
  const [query, setQuery] = useState("");
  const access = breakthroughAccess(doneSet);
  const hits = searchTerms(query, 40)
    .filter((h) => access.unlocked.has(h.chapter.id))
    .slice(0, 12);
  const chapters = BREAKTHROUGH.chapters;
  const done = chapters.filter((c) => doneSet.has(c.id)).length;
  const pct = chapters.length ? Math.round((done / chapters.length) * 100) : 0;
  const complete = done === chapters.length;

  return (
    <section className="relative" aria-labelledby={`${searchId}-title`}>
      <div className="flex gap-3">
        <div
          className={cn(
            "relative z-10 grid size-12 shrink-0 place-items-center rounded-2xl border-2 shadow-sm",
            complete && "border-bull bg-bull/15 text-bull",
            !complete && access.open && "border-foreground/40 bg-card text-foreground",
            !access.open && "border-border bg-muted text-muted-foreground",
          )}
        >
          {complete ? (
            <CheckCircle2 className="size-6" />
          ) : access.open ? (
            <Sparkles className="size-5" />
          ) : (
            <Lock className="size-5" />
          )}
        </div>

        <div className={cn("card-soft min-w-0 flex-1 p-4", !access.open && "opacity-70")}>
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 id={`${searchId}-title`} className="font-display text-base font-semibold">
                {BREAKTHROUGH.title}
              </h3>
              <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">
                {BREAKTHROUGH.blurb}
              </p>
            </div>
            <span className="shrink-0 text-[13px] font-medium tabular-nums text-muted-foreground">
              {done}/{chapters.length}
            </span>
          </div>

          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                complete ? "bg-bull" : "bg-foreground/70",
              )}
              style={{ width: `${pct}%` }}
            />
          </div>

          {!access.open ? (
            <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">
              Unlocks when {access.lastUnitTitle} is at least 60% complete (you&apos;re at{" "}
              {access.lastUnitPct}%), or when you pass the placement check. Every chapter opens at
              once; risk maths and psychology are the ones to read first.
            </p>
          ) : (
            <>
              <div className="relative mt-3">
                <label htmlFor={searchId} className="sr-only">
                  Find a term
                </label>
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id={searchId}
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={`Find a term in your open chapters (${BREAKTHROUGH_TERM_COUNT} in total)`}
                  className="h-11 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-[15px] outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              {query.trim().length >= 2 ? (
                <ul className="mt-2 divide-y divide-border" aria-live="polite">
                  {hits.length === 0 && (
                    <li className="py-3 text-[14px] text-muted-foreground">
                      No term in your open chapters matches “{query.trim()}”.
                    </li>
                  )}
                  {hits.map(({ chapter, term }) => (
                    <li key={`${chapter.id}-${term.term}`}>
                      <button
                        type="button"
                        onClick={() => onOpen(chapter, term.term)}
                        className="flex min-h-12 w-full items-center gap-2 py-2 text-left"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block text-[15px] font-medium leading-snug">
                            {term.term}
                          </span>
                          <span className="block text-[13px] text-muted-foreground">
                            {chapter.title}
                          </span>
                        </span>
                        <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <ol className="mt-3 space-y-1.5">
                  {chapters.map((chapter, i) => {
                    const isDone = doneSet.has(chapter.id);
                    return (
                      <li key={chapter.id}>
                        <button
                          type="button"
                          onClick={() => onOpen(chapter)}
                          className={cn(
                            "flex min-h-12 w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors",
                            isDone
                              ? "border-bull/30 bg-bull/5"
                              : "border-border bg-card hover:bg-muted/40",
                          )}
                        >
                          <span
                            className={cn(
                              "grid size-8 shrink-0 place-items-center rounded-full font-mono text-[13px] font-semibold",
                              isDone ? "bg-bull/20 text-bull" : "bg-muted text-foreground",
                            )}
                          >
                            {isDone ? <Check className="size-4" aria-label="Done" /> : i + 1}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-[15px] font-medium leading-snug">
                              {chapter.title}
                            </span>
                            <span className="block text-[13px] text-muted-foreground">
                              {chapter.terms.length} terms
                              {READ_FIRST.has(chapter.id) && !isDone && " · read this first"}
                            </span>
                          </span>
                          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                        </button>
                      </li>
                    );
                  })}
                </ol>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
