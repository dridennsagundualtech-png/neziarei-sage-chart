import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Minus, Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { ListenButton, Page, btnClass } from "@/components/app-ui";
import { VerseActions, VerseSpan } from "@/components/verse-actions";
import { PRAYERS } from "@/data/prayers";
import { searchMass } from "@/data/mass";
import { BOOKS, bookById, type Testament } from "@/data/books";
import { getChapter, refLabel, searchBible, verseKey } from "@/data/bible";
import { useLastRead } from "@/lib/bible-store";
import { useSettings } from "@/lib/settings";

interface BibleSearch {
  book?: string;
  ch?: number;
  v?: number;
}

export const Route = createFileRoute("/bible")({
  validateSearch: (s: Record<string, unknown>): BibleSearch => {
    const out: BibleSearch = {};
    if (typeof s["book"] === "string") out.book = s["book"];
    const ch = Number(s["ch"]);
    if (ch > 0) out.ch = ch;
    const v = Number(s["v"]);
    if (v > 0) out.v = v;
    return out;
  },
  head: () => ({
    meta: [
      { title: "Holy Bible — Sinner's Cure" },
      { name: "description", content: "All 73 books of the Catholic Bible with highlights, bookmarks, notes and search." },
      { property: "og:title", content: "Holy Bible — Sinner's Cure" },
      { property: "og:description", content: "All 73 books of the Catholic Bible with highlights, bookmarks, notes and search." },
    ],
  }),
  component: BiblePage,
});

function BiblePage() {
  const { book, ch, v } = Route.useSearch();
  const b = book ? bookById(book) : undefined;
  if (b && ch && ch >= 1 && ch <= b.chapters) return <Reader bookId={b.id} ch={ch} verse={v ?? 0} />;
  return <Library />;
}

function Library() {
  const [last] = useLastRead();
  const [tab, setTab] = useState<Testament>("OT");
  const [open, setOpen] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const hits = searchBible(query);
  const q = query.trim().toLowerCase();
  const prayerHits = q.length >= 2 ? PRAYERS.filter((p) => p.title.toLowerCase().includes(q) || p.text.toLowerCase().includes(q)) : [];
  const massHits = searchMass(query);

  return (
    <Page title="Holy Bible">
      <label className="mb-4 flex min-h-12 items-center gap-2 rounded-xl border border-input bg-card px-4">
        <Search className="size-5 text-muted-foreground" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search Bible, prayers, readings"
          className="min-w-0 flex-1 bg-transparent py-3 outline-none"
          aria-label="Search Bible, prayers and readings"
        />
      </label>

      {query.trim().length >= 2 ? (
        <div className="space-y-2">
          {prayerHits.length > 0 && <h2 className="eyebrow pt-2">Prayers</h2>}
          {prayerHits.map((p) => (
            <Link key={p.id} to="/prayers/$id" params={{ id: p.id }} className="card-surface block p-4 font-semibold">
              {p.title}
            </Link>
          ))}
          {massHits.length > 0 && <h2 className="eyebrow pt-2">Mass readings</h2>}
          {massHits.slice(0, 10).map((h) => (
            <div key={h.date + h.key} className="card-surface p-4">
              <p className="font-semibold text-primary">
                {refLabel(h.key)} · {h.date}
              </p>
              <p className="font-serif text-lg">{h.text}</p>
            </div>
          ))}
          <h2 className="eyebrow pt-2">Bible · {hits.length} verse{hits.length === 1 ? "" : "s"}</h2>
          {hits.map((h) => {
            const [bk, c, vv] = h.key.split(".");
            return (
              <Link key={h.key} to="/bible" search={{ book: bk ?? "", ch: Number(c), v: Number(vv) }} className="card-surface block p-4">
                <p className="font-semibold text-primary">{refLabel(h.key)}</p>
                <p className="font-serif text-lg">{h.text}</p>
              </Link>
            );
          })}
        </div>
      ) : (
        <>
          {last && bookById(last.book) && (
            <Link to="/bible" search={{ book: last.book, ch: last.ch }} className="card-surface mb-4 flex min-h-16 items-center justify-between p-4">
              <span>
                <span className="eyebrow block">Continue reading</span>
                <span className="font-serif text-xl font-semibold">
                  {bookById(last.book)?.name} {last.ch}
                </span>
              </span>
              <ChevronRight className="size-6 text-primary" />
            </Link>
          )}

          <div className="mb-4 grid grid-cols-2 gap-1 rounded-xl bg-muted p-1" role="tablist">
            {(["OT", "NT"] as Testament[]).map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={`min-h-11 rounded-lg font-semibold ${tab === t ? "bg-card text-foreground" : "text-muted-foreground"}`}
              >
                {t === "OT" ? "Old Testament" : "New Testament"}
              </button>
            ))}
          </div>

          <ul className="card-surface divide-y overflow-hidden">
            {BOOKS.filter((bk) => bk.testament === tab).map((bk) => (
              <li key={bk.id}>
                <button
                  className="flex min-h-14 w-full items-center justify-between px-4 text-left text-lg"
                  onClick={() => setOpen(open === bk.id ? null : bk.id)}
                  aria-expanded={open === bk.id}
                >
                  <span className="font-serif text-xl">{bk.name}</span>
                  <span className="text-muted-foreground">{bk.chapters}</span>
                </button>
                {open === bk.id && <ChapterGrid bookId={bk.id} />}
              </li>
            ))}
          </ul>
        </>
      )}
    </Page>
  );
}

function ChapterGrid({ bookId, current }: { bookId: string; current?: number }) {
  const bk = bookById(bookId)!;
  return (
    <div className="grid grid-cols-5 gap-2 px-4 pb-4">
      {Array.from({ length: bk.chapters }, (_, i) => i + 1).map((c) => (
        <Link
          key={c}
          to="/bible"
          search={{ book: bookId, ch: c }}
          className={`flex min-h-12 items-center justify-center rounded-lg border font-medium ${c === current ? "border-primary bg-primary text-primary-foreground" : getChapter(bookId, c) ? "bg-card" : "bg-muted text-muted-foreground"}`}
        >
          {c}
        </Link>
      ))}
    </div>
  );
}

function Reader({ bookId, ch, verse }: { bookId: string; ch: number; verse: number }) {
  const book = bookById(bookId)!;
  const verses = getChapter(bookId, ch);
  const [, setLast] = useLastRead();
  const { bumpText } = useSettings();
  const [sel, setSel] = useState<number | null>(null);
  const [picker, setPicker] = useState(false);

  useEffect(() => {
    setLast({ book: bookId, ch });
    setSel(null);
    setPicker(false);
    if (verse) document.getElementById(`v${verse}`)?.scrollIntoView({ block: "center" });
    else window.scrollTo(0, 0);
  }, [bookId, ch, verse, setLast]);

  const idx = BOOKS.findIndex((b) => b.id === bookId);
  const pb = BOOKS[idx - 1];
  const nb = BOOKS[idx + 1];
  const prev = ch > 1 ? { book: bookId, ch: ch - 1 } : pb ? { book: pb.id, ch: pb.chapters } : null;
  const next = ch < book.chapters ? { book: bookId, ch: ch + 1 } : nb ? { book: nb.id, ch: 1 } : null;

  return (
    <main className="mx-auto max-w-xl pb-44">
      <header className="sticky top-0 z-20 flex items-center gap-1 border-b bg-background px-2 py-2">
        <Link to="/bible" className="flex size-12 items-center justify-center" aria-label="All books">
          <ChevronLeft className="size-6" />
        </Link>
        <button onClick={() => setPicker(!picker)} className="min-h-12 flex-1 truncate rounded-lg px-2 text-left font-serif text-xl font-semibold" aria-expanded={picker}>
          {book.name} {ch} <span className="text-base text-muted-foreground">▾</span>
        </button>
        <button onClick={() => bumpText(-1)} className="flex size-12 items-center justify-center rounded-lg border" aria-label="Smaller text">
          <Minus className="size-5" />
        </button>
        <button onClick={() => bumpText(1)} className="flex size-12 items-center justify-center rounded-lg border" aria-label="Larger text">
          <Plus className="size-5" />
        </button>
      </header>

      {picker && (
        <div className="border-b bg-card pt-4">
          <p className="eyebrow mb-2 px-4">Choose a chapter</p>
          <ChapterGrid bookId={bookId} current={ch} />
        </div>
      )}

      <article className="px-4 pt-5">
        <h1 className="mb-2 text-center font-serif text-3xl font-semibold">
          {book.name} <span className="text-primary">{ch}</span>
        </h1>
        {verses && (
          <div className="mb-4 flex justify-center">
            <ListenButton id={`bible-${bookId}-${ch}`} text={`${book.name}, chapter ${ch}. ${verses.join(" ")}`} label="Listen to chapter" />
          </div>
        )}
        {verses ? (
          <div className="scripture">
            {verses.map((t, i) => (
              <VerseSpan
                key={i + 1}
                vkey={verseKey(bookId, ch, i + 1)}
                n={i + 1}
                text={t}
                selected={sel === i + 1}
                flash={verse === i + 1}
                onSelect={() => setSel(sel === i + 1 ? null : i + 1)}
              />
            ))}
          </div>
        ) : (
          <div className="card-surface p-5 text-center">
            <p>This chapter is not included in the sample text yet.</p>
            <p className="mt-1 text-muted-foreground">The full Bible will be added later.</p>
          </div>
        )}

        <div className="mt-8 flex justify-between gap-3">
          {prev ? (
            <Link to="/bible" search={prev} className={btnClass("outline")}>
              <ChevronLeft className="size-5" /> Previous
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link to="/bible" search={next} className={btnClass("outline")}>
              Next <ChevronRight className="size-5" />
            </Link>
          )}
        </div>
      </article>

      {sel && verses && (
        <VerseActions vkey={verseKey(bookId, ch, sel)} label={`${book.name} ${ch}:${sel}`} text={verses[sel - 1] ?? ""} onClose={() => setSel(null)} />
      )}
    </main>
  );
}
