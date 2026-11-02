import { Bookmark, Copy, NotebookPen, Share2, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Btn } from "./app-ui";
import { HL_BG, HL_COLORS, useBookmarks, useHighlights, useNotes } from "@/lib/bible-store";
import { copyText, shareText } from "@/lib/share";
import { t } from "@/lib/lang";

function omit<T extends Record<string, unknown>>(o: T, k: string): T {
  const c = { ...o };
  delete c[k];
  return c;
}

/** Bottom sheet for a selected verse: 4 highlight colors, bookmark, note, copy, share. */
export function VerseActions({
  vkey,
  label,
  text,
  onClose,
}: {
  vkey: string;
  label: string;
  text: string;
  onClose: () => void;
}) {
  const [hl, setHl] = useHighlights();
  const [marks, setMarks] = useBookmarks();
  const [notes, setNotes] = useNotes();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const quote = `“${text}” ${label}`;
  const marked = marks.includes(vkey);

  return (
    <div className="pb-safe fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border-t bg-card px-4 pt-3 shadow-[0_-8px_24px_-12px_rgb(0_0_0/0.45)]">
      <div className="mx-auto max-w-xl">
        <div className="flex items-center justify-between">
          <p className="font-semibold">{label}</p>
          <button
            onClick={onClose}
            className="flex size-11 items-center justify-center"
            aria-label={t("Close", "Isara")}
          >
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
              placeholder={t(
                "A private note, kept on this phone",
                "Pribadong tala, nasa teleponong ito lamang",
              )}
              aria-label={t("Note", "Tala")}
            />
            <div className="mt-2 flex gap-2">
              <Btn
                className="flex-1"
                onClick={() => {
                  setNotes((n) => (draft.trim() ? { ...n, [vkey]: draft.trim() } : omit(n, vkey)));
                  setEditing(false);
                }}
              >
                {t("Save note", "I-save ang tala")}
              </Btn>
              <Btn variant="outline" onClick={() => setEditing(false)}>
                {t("Cancel", "Kanselahin")}
              </Btn>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 py-2">
              {HL_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() =>
                    setHl((h) => (h[vkey] === c ? omit(h, vkey) : { ...h, [vkey]: c }))
                  }
                  className={`size-11 rounded-full border-2 ${HL_BG[c]} ${hl[vkey] === c ? "border-foreground" : "border-border"}`}
                  aria-label={t(`Highlight ${c}`, `I-highlight: ${c}`)}
                  aria-pressed={hl[vkey] === c}
                />
              ))}
              {hl[vkey] && (
                <button
                  onClick={() => setHl((h) => omit(h, vkey))}
                  className="min-h-11 px-2 text-muted-foreground"
                >
                  {t("Clear", "Alisin")}
                </button>
              )}
            </div>
            {notes[vkey] && <p className="mb-2 rounded-lg bg-muted p-3">{notes[vkey]}</p>}
            <div className="grid grid-cols-4 gap-2 pb-3">
              <Action
                label={marked ? t("Saved", "Naka-save") : t("Bookmark", "I-bookmark")}
                onClick={() =>
                  setMarks((m) => (m.includes(vkey) ? m.filter((x) => x !== vkey) : [...m, vkey]))
                }
              >
                <Bookmark className={`size-5 ${marked ? "fill-primary text-primary" : ""}`} />
              </Action>
              <Action
                label={t("Note", "Tala")}
                onClick={() => {
                  setDraft(notes[vkey] ?? "");
                  setEditing(true);
                }}
              >
                <NotebookPen className="size-5" />
              </Action>
              <Action label={t("Copy", "Kopyahin")} onClick={() => copyText(quote)}>
                <Copy className="size-5" />
              </Action>
              <Action label={t("Share", "Ibahagi")} onClick={() => shareText(quote)}>
                <Share2 className="size-5" />
              </Action>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Action({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl bg-secondary text-sm font-medium"
    >
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
      <sup className="mr-1 font-sans text-[0.62em] font-semibold text-rubric">{n}</sup>
      {marks.includes(vkey) && (
        <Bookmark className="mr-1 inline size-4 fill-rubric text-rubric" aria-label={t("Bookmarked", "Naka-bookmark")} />
      )}
      {text}
      {notes[vkey] && (
        <NotebookPen className="ml-1 inline size-4 text-rubric" aria-label={t("Has note", "May tala")} />
      )}{" "}
    </span>
  );
}
