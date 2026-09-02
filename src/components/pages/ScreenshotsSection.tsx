import { Check, ImageIcon, Pencil, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { SignInPrompt } from "@/components/SignInPrompt";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useDeleteScreenshot,
  useRenameScreenshot,
  useScreenshots,
  type ScreenshotRow,
} from "@/lib/data";
import { relativeTime } from "@/lib/sessions";

function Screenshots() {
  const query = useScreenshots();
  const rename = useRenameScreenshot();
  const remove = useDeleteScreenshot();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const rows = query.data ?? [];

  const startEdit = (row: ScreenshotRow) => {
    setEditingId(row.id);
    setDraft(row.title);
  };

  const commit = (row: ScreenshotRow) => {
    const title = draft.trim();
    if (!title) {
      toast.error("Give the screenshot a name.");
      return;
    }
    rename.mutate(
      { id: row.id, title },
      {
        onSuccess: () => {
          setEditingId(null);
          toast.success("Renamed.");
        },
        onError: () => toast.error("Could not rename that screenshot."),
      },
    );
  };

  return (
    <div className="space-y-4">
      <header className="animate-float-in card-soft p-5">
        <h1 className="font-display text-xl font-semibold">Screenshots</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {rows.length} saved {rows.length === 1 ? "snapshot" : "snapshots"}. Capture charts from the
          Pro Charts workspace or the Den Analyzer, then rename or delete them here.
        </p>
      </header>

      {query.isLoading && (
        <p className="py-10 text-center text-sm text-muted-foreground">Loading screenshots…</p>
      )}

      {!query.isLoading && rows.length === 0 && (
        <div className="card-soft grid place-items-center gap-2 p-10 text-center">
          <ImageIcon className="size-8 text-muted-foreground" />
          <p className="font-display text-base font-semibold">No screenshots yet</p>
          <p className="text-sm text-muted-foreground">
            Use “Save screenshot to journal” on a chart and it will show up here.
          </p>
        </div>
      )}

      <ul className="grid gap-3 sm:grid-cols-2">
        {rows.map((row) => (
          <li key={row.id} className="animate-float-in card-soft overflow-hidden">
            {row.url && (
              <a href={row.url} target="_blank" rel="noreferrer">
                <img
                  src={row.url}
                  alt={row.title}
                  className="h-44 w-full border-b border-border/60 object-cover"
                />
              </a>
            )}
            <div className="space-y-2 p-3">
              {editingId === row.id ? (
                <div className="flex items-center gap-2">
                  <Input
                    autoFocus
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") commit(row);
                      if (event.key === "Escape") setEditingId(null);
                    }}
                    className="h-9 rounded-xl"
                  />
                  <Button size="icon" className="size-9 rounded-xl" onClick={() => commit(row)}>
                    <Check className="size-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="size-9 rounded-xl"
                    onClick={() => setEditingId(null)}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-display text-sm font-semibold">{row.title}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {[row.symbol, row.timeframe].filter(Boolean).join(" · ")}
                      {row.symbol || row.timeframe ? " · " : ""}
                      Taken {relativeTime(row.created_at)} ·{" "}
                      {new Date(row.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="size-9 rounded-xl"
                      aria-label="Rename screenshot"
                      onClick={() => startEdit(row)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="size-9 rounded-xl text-bear"
                      aria-label="Delete screenshot"
                      onClick={() =>
                        remove.mutate(row, {
                          onSuccess: () => toast.success("Screenshot deleted."),
                          onError: () => toast.error("Could not delete that screenshot."),
                        })
                      }
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ScreenshotsSection() {
  return (
    <SignInPrompt feature="saved screenshots">
      <Screenshots />
    </SignInPrompt>
  );
}
