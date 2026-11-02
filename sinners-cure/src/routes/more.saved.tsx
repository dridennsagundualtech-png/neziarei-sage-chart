import { createFileRoute, Link } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { IconBtn, Page, Section } from "@/components/app-ui";
import { parseKey, refLabel, useVerseText } from "@/data/bible";
import { HL_BG, useBookmarks, useHighlights, useNotes } from "@/lib/bible-store";

export const Route = createFileRoute("/more/saved")({
  component: SavedPage,
});

function Item({
  k,
  extra,
  onDelete,
  bg,
}: {
  k: string;
  extra?: string;
  onDelete: () => void;
  bg?: string;
}) {
  const { book, ch, v } = parseKey(k);
  const text = useVerseText(k);
  return (
    <li className="flex items-start gap-2 py-3">
      <Link to="/bible" search={{ book, ch, v }} className="min-w-0 flex-1">
        <p className="font-semibold text-primary">{refLabel(k)}</p>
        <p className={`font-serif text-[1.15rem] leading-snug ${bg ?? ""}`}>{text ?? "…"}</p>
        {extra && <p className="mt-2 rounded-lg bg-secondary p-3">{extra}</p>}
      </Link>
      <IconBtn label={`Remove ${refLabel(k)}`} onClick={onDelete}>
        <Trash2 className="size-5" aria-hidden />
      </IconBtn>
    </li>
  );
}

function Group({
  title,
  empty,
  children,
}: {
  title: string;
  empty: boolean;
  children: React.ReactNode;
}) {
  return (
    <Section title={title}>
      {empty ? (
        <p className="text-muted-foreground">
          Nothing yet. Tap a verse in the Bible or the Mass readings to save it.
        </p>
      ) : (
        <ul className="divide-y border-y">{children}</ul>
      )}
    </Section>
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
    <Page back={{ to: "/more", label: "More" }} title="Saved verses">
      <Group title="Bookmarks" empty={marks.length === 0}>
        {marks.map((k) => (
          <Item key={k} k={k} onDelete={() => setMarks((m) => m.filter((x) => x !== k))} />
        ))}
      </Group>
      <Group title="Highlights" empty={Object.keys(hl).length === 0}>
        {Object.entries(hl).map(([k, c]) => (
          <Item key={k} k={k} bg={HL_BG[c]} onDelete={() => setHl((h) => drop(h, k))} />
        ))}
      </Group>
      <Group title="Notes" empty={Object.keys(notes).length === 0}>
        {Object.entries(notes).map(([k, n]) => (
          <Item key={k} k={k} extra={n} onDelete={() => setNotes((x) => drop(x, k))} />
        ))}
      </Group>
    </Page>
  );
}
