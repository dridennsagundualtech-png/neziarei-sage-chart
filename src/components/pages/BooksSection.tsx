/**
 * Academy Books: reading list + study guides.
 * Does NOT host full book text (copyright). Links out to legal purchase/search.
 */
import { BookOpen, CheckCircle2, ExternalLink, Library } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  ACADEMY_BOOKS,
  BOOK_CATEGORIES,
  READING_PATH,
  type AcademyBook,
  type BookCategory,
} from "@/lib/books-content";
import { BookLibrary } from "@/components/BookLibrary";
import { PersonalPdfReader } from "@/components/PersonalPdfReader";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "chartpilot.books.read";

function loadRead(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function saveRead(ids: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    /* ignore */
  }
}

export function BooksSection() {
  const [filter, setFilter] = useState<BookCategory | "all">("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [read, setRead] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    setRead(loadRead());
  }, []);

  const toggleRead = (id: string) => {
    setRead((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      saveRead(next);
      return next;
    });
  };

  const books = useMemo(() => {
    const list =
      filter === "all" ? ACADEMY_BOOKS : ACADEMY_BOOKS.filter((b) => b.category === filter);
    return [...list].sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
  }, [filter]);

  const pathBooks = READING_PATH.map((id) => ACADEMY_BOOKS.find((b) => b.id === id)).filter(
    Boolean,
  ) as AcademyBook[];

  const doneCount = [...read].filter((id) => ACADEMY_BOOKS.some((b) => b.id === id)).length;

  return (
    <div className="space-y-4">
      <BookLibrary />

      <PersonalPdfReader />

      <header className="card-soft p-5">
        <p className="flex items-center gap-2 font-display text-xl font-semibold">
          <Library className="size-5 text-primary" />
          Books
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Curated list for trading + mindset. Study guides are original notes,{" "}
          <strong className="text-foreground">full books are not hosted here</strong> (copyright).
          Buy or borrow legally, then mark them complete.
        </p>
        <p className="mt-3 text-xs text-muted-foreground">
          {doneCount}/{ACADEMY_BOOKS.length} marked read (saved on this device)
        </p>
      </header>

      <section className="card-soft p-4">
        <p className="font-display text-sm font-semibold">Suggested path</p>
        <ol className="mt-2 space-y-1.5">
          {pathBooks.map((b, i) => (
            <li key={b.id} className="flex items-center gap-2 text-sm">
              <span className="grid size-6 place-items-center rounded-full bg-primary/15 text-[11px] font-semibold text-primary">
                {i + 1}
              </span>
              <span className={cn(read.has(b.id) && "text-muted-foreground line-through")}>
                {b.title}
              </span>
              {read.has(b.id) && <CheckCircle2 className="size-3.5 text-bull" />}
            </li>
          ))}
        </ol>
      </section>

      <div className="flex flex-wrap gap-1.5">
        {BOOK_CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setFilter(c.id)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              filter === c.id
                ? "border-primary bg-primary/15 text-primary"
                : "border-border bg-card text-muted-foreground hover:bg-muted/40",
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {books.map((book) => {
          const open = openId === book.id;
          const done = read.has(book.id);
          return (
            <article key={book.id} className="card-soft overflow-hidden">
              <button
                type="button"
                className="flex w-full items-start gap-3 p-4 text-left"
                onClick={() => setOpenId(open ? null : book.id)}
              >
                <span
                  className={cn(
                    "mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl",
                    done ? "bg-bull/15 text-bull" : "bg-primary/12 text-primary",
                  )}
                >
                  {done ? <CheckCircle2 className="size-4" /> : <BookOpen className="size-4" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-sm font-semibold">{book.title}</span>
                  <span className="block text-xs text-muted-foreground">{book.author}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">{book.blurb}</span>
                </span>
              </button>

              {open && (
                <div className="space-y-3 border-t border-border/60 px-4 pb-4 pt-3">
                  <div>
                    <p className="text-[11px] font-medium uppercase text-muted-foreground">
                      Why this helps you
                    </p>
                    <p className="mt-1 text-sm leading-relaxed">{book.why}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium uppercase text-muted-foreground">
                      Study takeaways
                    </p>
                    <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-muted-foreground">
                      {book.takeaways.map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant={done ? "secondary" : "default"}
                      className="h-9 rounded-lg"
                      onClick={() => toggleRead(book.id)}
                    >
                      {done ? "Mark unread" : "Mark as read"}
                    </Button>
                    <a
                      href={book.searchUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-sm font-medium hover:bg-muted/40"
                    >
                      Find the book <ExternalLink className="size-3.5" />
                    </a>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Tip: write 3 bullets in Notes after each chapter; your words stick better than
                    highlighting everything.
                  </p>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
