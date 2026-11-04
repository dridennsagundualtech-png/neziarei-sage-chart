import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronDown, ChevronLeft, ChevronRight, Minus, Plus, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { IconBtn, ListenButton, Page, btnClass } from "@/components/app-ui";
import { VerseActions, VerseSpan } from "@/components/verse-actions";
import { PRAYERS } from "@/data/prayers";
import { BOOKS, bookById, type Testament } from "@/data/books";
import {
  TRANSLATIONS,
  refLabel,
  searchBible,
  useChapter,
  useTranslation,
  verseKey,
  type SearchHit,
} from "@/data/bible";
import { useLastRead } from "@/lib/bible-store";
import { useSettings } from "@/lib/settings";
import { t as l } from "@/lib/lang";
import { makeReading } from "@/lib/read-along";

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
  component: BiblePage,
});

function BiblePage() {
  const { book, ch, v } = Route.useSearch();
  const b = book ? bookById(book) : undefined;
  if (b && ch && ch >= 1 && ch <= b.chapters)
    return <Reader bookId={b.id} ch={ch} verse={v ?? 0} />;
  return <Library />;
}

function useBibleSearch(query: string) {
  const [state, setState] = useState<{ hits: SearchHit[]; done: boolean }>({
    hits: [],
    done: true,
  });
  const [tr] = useTranslation();
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setState({ hits: [], done: true });
      return;
    }
    const ctrl = new AbortController();
    const timer = setTimeout(() => {
      setState({ hits: [], done: false });
      void searchBible(q, {
        signal: ctrl.signal,
        onHits: (hits, done) => !ctrl.signal.aborted && setState({ hits, done }),
      });
    }, 250);
    return () => {
      ctrl.abort();
      clearTimeout(timer);
    };
  }, [query, tr]);
  return state;
}

function Library() {
  const [last] = useLastRead();
  const [tr] = useTranslation();
  const [tab, setTab] = useState<Testament>("NT");
  const [open, setOpen] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const { hits, done } = useBibleSearch(query);
  const q = query.trim().toLowerCase();
  const prayerHits =
    q.length >= 2
      ? PRAYERS.filter((p) => p.title.toLowerCase().includes(q) || p.text.toLowerCase().includes(q))
      : [];
  const lastBook = last ? bookById(last.book) : undefined;

  return (
    <Page
      title={l("Holy Bible", "Banal na Bibliya")}
      subtitle={l(
        `${TRANSLATIONS[tr].name} · all 73 books`,
        `${TRANSLATIONS[tr].name} · lahat ng 73 aklat (sa Ingles)`,
      )}
    >
      <label className="flex min-h-12 items-center gap-2 rounded-xl border border-input bg-card px-4">
        <Search className="size-5 text-muted-foreground" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={l("Search the Bible and prayers", "Maghanap sa Bibliya at mga dasal")}
          className="min-w-0 flex-1 bg-transparent py-3 outline-none"
          aria-label={l("Search the Bible and prayers", "Maghanap sa Bibliya at mga dasal")}
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label={l("Clear search", "Burahin ang hinahanap")}
            className="-mr-2 flex size-10 items-center justify-center text-muted-foreground"
          >
            <X className="size-5" aria-hidden />
          </button>
        )}
      </label>

      {q.length >= 2 ? (
        <div className="mt-5">
          {prayerHits.length > 0 && (
            <>
              <h2 className="rubric">{l("Prayers", "Mga Dasal")}</h2>
              <ul className="mb-5 mt-1 divide-y border-y">
                {prayerHits.map((p) => (
                  <li key={p.id}>
                    <Link
                      to="/prayers/$id"
                      params={{ id: p.id }}
                      className="flex min-h-12 items-center justify-between py-2 font-serif text-[1.2rem]"
                    >
                      {p.title}{" "}
                      <ChevronRight className="size-5 text-muted-foreground" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
          <h2 className="rubric">
            {l("Bible", "Bibliya")} · {hits.length}
            {hits.length >= 200 ? "+" : ""} {l(hits.length === 1 ? "verse" : "verses", "talata")}
            {!done ? l(" so far…", " sa ngayon…") : ""}
          </h2>
          <ul className="mt-1 divide-y border-y">
            {hits.map((h) => {
              const [bk, c, vv] = h.key.split(".");
              return (
                <li key={h.key}>
                  <Link
                    to="/bible"
                    search={{ book: bk ?? "", ch: Number(c), v: Number(vv) }}
                    className="block py-3"
                  >
                    <p className="font-semibold text-primary">{refLabel(h.key)}</p>
                    <p className="font-serif text-[1.15rem] leading-snug">{h.text}</p>
                  </Link>
                </li>
              );
            })}
          </ul>
          {done && hits.length === 0 && prayerHits.length === 0 && (
            <p className="mt-4 text-muted-foreground">
              {l(
                'Nothing found. Try fewer or older words, like "thee" or "charity".',
                'Walang nahanap. Ang Bibliya ay nasa Ingles: subukan ang mas kaunti o lumang salita, gaya ng "thee" o "charity".',
              )}
            </p>
          )}
        </div>
      ) : (
        <>
          {last && lastBook && (
            <Link
              to="/bible"
              search={{ book: last.book, ch: last.ch }}
              className="card-surface mt-5 flex min-h-16 items-center justify-between p-4"
            >
              <span>
                <span className="block text-[0.95rem] text-muted-foreground">
                  {l("Continue reading", "Ituloy ang pagbasa")}
                </span>
                <span className="font-serif text-[1.4rem] font-semibold">
                  {lastBook.name} {last.ch}
                </span>
              </span>
              <ChevronRight className="size-6 text-primary" aria-hidden />
            </Link>
          )}

          <div className="mt-5 grid grid-cols-2 gap-1 rounded-xl bg-secondary p-1" role="tablist">
            {(["OT", "NT"] as Testament[]).map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={`min-h-11 rounded-lg font-semibold ${tab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
              >
                {t === "OT"
                  ? l("Old Testament", "Lumang Tipan")
                  : l("New Testament", "Bagong Tipan")}
              </button>
            ))}
          </div>

          <ul className="mt-4 divide-y border-y">
            {BOOKS.filter((bk) => bk.testament === tab).map((bk) => (
              <li key={bk.id}>
                <button
                  type="button"
                  className="flex min-h-14 w-full items-center justify-between text-left"
                  onClick={() => setOpen(open === bk.id ? null : bk.id)}
                  aria-expanded={open === bk.id}
                >
                  <span className="font-serif text-[1.3rem]">{bk.name}</span>
                  <span className="flex items-center gap-2 text-muted-foreground">
                    {bk.chapters}
                    <ChevronDown
                      className={`size-5 transition-transform ${open === bk.id ? "rotate-180" : ""}`}
                      aria-hidden
                    />
                  </span>
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
    <div className="grid grid-cols-6 gap-2 pb-4">
      {Array.from({ length: bk.chapters }, (_, i) => i + 1).map((c) => (
        <Link
          key={c}
          to="/bible"
          search={{ book: bookId, ch: c }}
          className={`flex min-h-12 items-center justify-center rounded-lg font-medium ${c === current ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
        >
          {c}
        </Link>
      ))}
    </div>
  );
}

/** The Latin (Douay-Rheims) number of a psalm, for readers who know the older numbering. */
function vulgatePsalm(n: number): string {
  if (n <= 8 || n >= 148) return String(n);
  if (n === 9 || n === 10) return "9";
  if (n <= 113) return String(n - 1);
  if (n === 114 || n === 115) return "113";
  if (n === 116) return "114-115";
  if (n <= 146) return String(n - 1);
  return "146-147";
}

function Reader({ bookId, ch, verse }: { bookId: string; ch: number; verse: number }) {
  const book = bookById(bookId)!;
  const verses = useChapter(bookId, ch);
  const [, setLast] = useLastRead();
  const [tr] = useTranslation();
  const { bumpText } = useSettings();
  const [sel, setSel] = useState<number | null>(null);
  const [picker, setPicker] = useState(false);

  useEffect(() => {
    setLast({ book: bookId, ch });
    setSel(null);
    setPicker(false);
    if (!verse) window.scrollTo(0, 0);
  }, [bookId, ch, verse, setLast]);

  useEffect(() => {
    if (verse && verses) document.getElementById(`v${verse}`)?.scrollIntoView({ block: "center" });
  }, [verse, verses]);

  const idx = BOOKS.findIndex((b) => b.id === bookId);
  const pb = BOOKS[idx - 1];
  const nb = BOOKS[idx + 1];
  const prev = ch > 1 ? { book: bookId, ch: ch - 1 } : pb ? { book: pb.id, ch: pb.chapters } : null;
  const next =
    ch < book.chapters ? { book: bookId, ch: ch + 1 } : nb ? { book: nb.id, ch: 1 } : null;
  const name = book.id === "PSA" ? "Psalm" : book.name;
  // Read-along: the chapter heading, then every verse, as one reading.
  const rid = `bible-${bookId}-${ch}`;
  const reading = verses ? makeReading([`${name} ${ch}.`, ...verses]) : null;

  return (
    <main className="mx-auto max-w-xl pb-44">
      <header className="pt-safe sticky top-0 z-20 border-b bg-background/95 backdrop-blur-sm">
        <div className="flex items-center gap-1 px-2 py-1.5">
          <Link
            to="/bible"
            className="flex size-12 items-center justify-center rounded-full"
            aria-label={l("All books", "Lahat ng aklat")}
          >
            <ChevronLeft className="size-6" aria-hidden />
          </Link>
          <button
            type="button"
            onClick={() => setPicker(!picker)}
            className="flex min-h-12 min-w-0 flex-1 items-center gap-1 rounded-lg px-2 text-left font-serif text-[1.35rem] font-semibold"
            aria-expanded={picker}
          >
            <span className="truncate">
              {name} {ch}
            </span>
            <ChevronDown
              className={`size-5 shrink-0 text-muted-foreground transition-transform ${picker ? "rotate-180" : ""}`}
              aria-hidden
            />
          </button>
          <IconBtn label={l("Smaller text", "Paliitin ang teksto")} onClick={() => bumpText(-1)}>
            <Minus className="size-5" aria-hidden />
          </IconBtn>
          <IconBtn label={l("Larger text", "Palakihin ang teksto")} onClick={() => bumpText(1)}>
            <Plus className="size-5" aria-hidden />
          </IconBtn>
        </div>
        {picker && (
          <div className="max-h-[60vh] overflow-y-auto border-t px-4 pt-3">
            <ChapterGrid bookId={bookId} current={ch} />
          </div>
        )}
      </header>

      <article className="px-4 pt-6">
        <h1 className="text-center font-serif text-[2.2rem] font-semibold leading-tight">
          {name} <span className="text-rubric">{ch}</span>
        </h1>
        <p className="mt-1 text-center text-[0.92rem] text-muted-foreground">
          {TRANSLATIONS[tr].name}
          {book.id === "PSA" && vulgatePsalm(ch) !== String(ch)
            ? l(
                ` · Psalm ${vulgatePsalm(ch)} in older Catholic Bibles`,
                ` · Salmo ${vulgatePsalm(ch)} sa mas lumang mga Bibliyang Katoliko`,
              )
            : ""}
        </p>
        {verses && verses.length > 0 && reading && (
          <div className="mb-5 mt-4 flex justify-center">
            <ListenButton
              id={rid}
              lang="en"
              text={reading.text}
              label={l("Listen to this chapter", "Pakinggan ang kabanatang ito")}
            />
          </div>
        )}
        {verses === undefined && (
          <p className="mt-6 text-center text-muted-foreground">{l("Opening…", "Binubuksan…")}</p>
        )}
        {verses === null && (
          <p className="mt-6 text-center text-muted-foreground">
            {l("This chapter couldn't be opened.", "Hindi mabuksan ang kabanatang ito.")}
          </p>
        )}
        {verses && (
          <div className="scripture">
            {verses.map((t, i) =>
              t ? (
                <VerseSpan
                  key={i + 1}
                  vkey={verseKey(bookId, ch, i + 1)}
                  n={i + 1}
                  text={t}
                  selected={sel === i + 1}
                  flash={verse === i + 1}
                  onSelect={() => setSel(sel === i + 1 ? null : i + 1)}
                  rid={rid}
                  base={reading?.starts[i + 1]}
                />
              ) : null,
            )}
          </div>
        )}

        <div className="mt-10 flex justify-between gap-3">
          {prev ? (
            <Link to="/bible" search={prev} className={btnClass("outline", "px-4")}>
              <ChevronLeft className="size-5" aria-hidden /> {l("Previous", "Nakaraan")}
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link to="/bible" search={next} className={btnClass("outline", "px-4")}>
              {l("Next", "Susunod")} <ChevronRight className="size-5" aria-hidden />
            </Link>
          )}
        </div>
      </article>

      {sel && verses && (
        <VerseActions
          vkey={verseKey(bookId, ch, sel)}
          label={`${name} ${ch}:${sel}`}
          text={verses[sel - 1] ?? ""}
          onClose={() => setSel(null)}
        />
      )}
    </main>
  );
}
