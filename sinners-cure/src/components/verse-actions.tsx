import { Bookmark, Copy, NotebookPen, Share2, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Btn } from "./app-ui";
import { HL_BG, HL_COLORS, useBookmarks, useHighlights, useNotes } from "@/lib/bible-store";
import { copyText, shareText } from "@/lib/share";

function omit<T extends Record<string, unknown>>(o: T, k: string): T {
  const c = { ...o };
  delete c[k];
  return c;
}

/** Bottom sheet for a selected verse: 4 highlight colors, bookmark, note, copy, share. */
export function VerseActions({ vkey, label, text, onClose }: { vkey: string; label: string; text: string; onClose: () => void }) {
  const [hl, setHl] = useHighlights();
  const [marks, setMarks] = useBookmarks();
  const [notes, setNotes] = useNotes();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const quote = `"${text}" — ${label}`;
  const marked = marks.includes(vkey);

  return (
    <div className="fixed inset-x-0 bottom-16 z-30 border-t bg-card px-4 pb-[env(safe-area-inset-bottom)] pt-3">
      <div className="mx-auto max-w-xl">
        <div className="flex items-center justify-between">
          <p className="font-semibold">{label}</p>
          <button onClick={onClose} className="flex size-11 items-center justify-center" aria-label="Close">
            <X className="size-5" />
          </button>
        </div>
        {editing ? (
          <div className="pb-3">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              autoFocus
              className="w-full rounded-xl border border-input bg-background p-3"
              placeholder="A private note, kept on this phone"
              aria-label="Note"
            />
            <div className="mt-2 flex gap-2">
              <Btn
                className="flex-1"
                onClick={() => {
                  setNotes((n) => (draft.trim() ? { ...n, [vkey]: draft.trim() } : omit(n, vkey)));
                  setEditing(false);
                }}
              >
                Save note
              </Btn>
              <Btn variant="outline" onClick={() => setEditing(false)}>
                Cancel
              </Btn>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 py-2">
              {HL_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setHl((h) => (h[vkey] === c ? omit(h, vkey) : { ...h, [vkey]: c }))}
                  className={`size-11 rounded-full border-2 ${HL_BG[c]} ${hl[vkey] === c ? "border-foreground" : "border-border"}`}
                  aria-label={`Highlight ${c}`}
                  aria-pressed={hl[vkey] === c}
                />
              ))}
              {hl[vkey] && (
                <button onClick={() => setHl((h) => omit(h, vkey))} className="min-h-11 px-2 text-muted-foreground">
                  Clear
                </button>
              )}
            </div>
            {notes[vkey] && <p className="mb-2 rounded-lg bg-muted p-3">{notes[vkey]}</p>}
            <div className="grid grid-cols-4 gap-2 pb-3">
              <Action label={marked ? "Saved" : "Bookmark"} onClick={() => setMarks((m) => (m.includes(vkey) ? m.filter((x) => x !== vkey) : [...m, vkey]))}>
                <Bookmark className={`size-5 ${marked ? "fill-primary text-primary" : ""}`} />
              </Action>
              <Action
                label="Note"
                onClick={() => {
                  setDraft(notes[vkey] ?? "");
                  setEditing(true);
                }}
              >
                <NotebookPen className="size-5" />
              </Action>
              <Action label="Copy" onClick={() => copyText(quote)}>
                <Copy className="size-5" />
              </Action>
              <Action label="Share" onClick={() => shareText(quote)}>
                <Share2 className="size-5" />
              </Action>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Action({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button onClick={onClick} className="flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl border text-sm font-medium">
      {children}
      {label}
    </button>
  );
}

/** One tappable verse with highlight/bookmark/note markers. */
export function VerseSpan({
  vkey,
  n,
  text,
  selected,
  flash,
  onSelect,
}: {
  vkey: string;
  n: number;
  text: string;
  selected: boolean;
  flash?: boolean;
  onSelect: () => void;
}) {
  const [hl] = useHighlights();
  const [marks] = useBookmarks();
  const [notes] = useNotes();
  const color = hl[vkey];
  return (
    <span
      id={`v${n}`}
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => e.key === "Enter" && onSelect()}
      className={`cursor-pointer rounded-sm py-0.5 ${color ? HL_BG[color] : flash ? "bg-accent" : ""} ${selected ? "underline decoration-primary decoration-2 underline-offset-4" : ""}`}
    >
      <sup className="mr-1 font-sans text-[0.7em] font-semibold text-primary">{n}</sup>
      {marks.includes(vkey) && <Bookmark className="mr-1 inline size-4 fill-primary text-primary" aria-label="Bookmarked" />}
      {text}
      {notes[vkey] && <NotebookPen className="ml-1 inline size-4 text-primary" aria-label="Has note" />}{" "}
    </span>
  );
}
