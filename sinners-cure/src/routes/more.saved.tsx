import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, Trash2 } from "lucide-react";
import { Page } from "@/components/app-ui";
import { getVerse, parseKey, refLabel } from "@/data/bible";
import { HL_BG, useBookmarks, useHighlights, useNotes } from "@/lib/bible-store";

export const Route = createFileRoute("/more/saved")({
  head: () => ({
    meta: [
      { title: "Saved Verses — Sinner's Cure" },
      { name: "description", content: "Your highlighted verses, bookmarks and notes." },
      { property: "og:title", content: "Saved Verses — Sinner's Cure" },
      { property: "og:description", content: "Your highlighted verses, bookmarks and notes." },
    ],
  }),
  component: SavedPage,
});

function Item({ k, extra, onDelete, bg }: { k: string; extra?: string; onDelete: () => void; bg?: string }) {
  const { book, ch, v } = parseKey(k);
  return (
    <li className="flex items-start gap-2 px-4 py-3">
      <Link to="/bible" search={{ book, ch, v }} className="min-w-0 flex-1">
        <p className="font-semibold text-primary">{refLabel(k)}</p>
        <p className={`font-serif text-lg ${bg ?? ""}`}>{getVerse(k) ?? ""}</p>
        {extra && <p className="mt-1 rounded-lg bg-muted p-2">{extra}</p>}
      </Link>
      <button onClick={onDelete} className="flex size-11 shrink-0 items-center justify-center text-muted-foreground" aria-label={`Remove ${refLabel(k)}`}>
        <Trash2 className="size-5" />
      </button>
    </li>
  );
}

function Section({ title, empty, children }: { title: string; empty: boolean; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="eyebrow mb-2 px-1">{title}</h2>
      {empty ? <p className="card-surface p-4 text-muted-foreground">Nothing here yet. Tap a verse in the Bible to save it.</p> : <ul className="card-surface divide-y overflow-hidden">{children}</ul>}
    </section>
  );
}

function SavedPage() {
  const [hl, setHl] = useHighlights();
  const [marks, setMarks] = useBookmarks();
  const [notes, setNotes] = useNotes();
  const drop = <T extends Record<string, unknown>>(o: T, k: string) => {
    const c = { ...o };
    delete c[k];
    return c;
  };

  return (
    <Page title="Saved">
      <Link to="/more" className="-mt-2 mb-4 inline-flex min-h-11 items-center gap-1 text-primary">
        <ChevronLeft className="size-5" /> More
      </Link>
      <Section title="Bookmarks" empty={marks.length === 0}>
        {marks.map((k) => (
          <Item key={k} k={k} onDelete={() => setMarks((m) => m.filter((x) => x !== k))} />
        ))}
      </Section>
      <Section title="Highlights" empty={Object.keys(hl).length === 0}>
        {Object.entries(hl).map(([k, c]) => (
          <Item key={k} k={k} bg={HL_BG[c]} onDelete={() => setHl((h) => drop(h, k))} />
        ))}
      </Section>
      <Section title="Notes" empty={Object.keys(notes).length === 0}>
        {Object.entries(notes).map(([k, n]) => (
          <Item key={k} k={k} extra={n} onDelete={() => setNotes((x) => drop(x, k))} />
        ))}
      </Section>
    </Page>
  );
}
