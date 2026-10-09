import { Check, ImageIcon, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog, EmptyState, JSection, useConfirm } from "@/components/journal/parts";
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
  const del = useConfirm<ScreenshotRow>();

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

  const runDelete = () => {
    const row = del.target;
    if (!row) return;
    remove.mutate(row, {
      onSuccess: () => {
        toast.success("Screenshot deleted.");
        del.close();
      },
      onError: () => {
        toast.error("Could not delete that screenshot.");
        del.close();
      },
    });
  };

  return (
    <div>
      <JSection
        className="pt-6"
        title="Screenshots"
        hint={
          <>
            {rows.length} saved {rows.length === 1 ? "screenshot" : "screenshots"}. Capture charts
            from the Pro Charts workspace or the Den Analyzer, then rename or delete them here.
          </>
        }
      >
        {query.isLoading && (
          <p className="py-10 text-center text-[15px] text-muted-foreground">
            Loading screenshots…
          </p>
        )}

        {!query.isLoading && rows.length === 0 && (
          <EmptyState icon={ImageIcon} title="No screenshots yet">
            Use “Save screenshot to journal” on a chart and it will show up here.
          </EmptyState>
        )}

        <ul className="grid gap-x-4 gap-y-9 sm:grid-cols-2">
          {rows.map((row) => {
            const editing = editingId === row.id;
            return (
              <li key={row.id} className="min-w-0">
                {row.url && (
                  <a
                    href={row.url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Open ${row.title} full size`}
                    className="block overflow-hidden rounded-xl border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <img
                      src={row.url}
                      alt={row.title}
                      className="aspect-[16/10] w-full object-cover"
                    />
                  </a>
                )}

                {editing ? (
                  <form
                    className="mt-3 space-y-3"
                    onSubmit={(event) => {
                      event.preventDefault();
                      commit(row);
                    }}
                  >
                    <Input
                      autoFocus
                      aria-label="Screenshot name"
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Escape") setEditingId(null);
                      }}
                      className="h-11 rounded-xl text-base md:text-base"
                    />
                    <div className="flex gap-2">
                      <Button type="submit" className="h-11 flex-1 rounded-xl text-[15px]">
                        <Check className="size-5" /> Save name
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        className="h-11 rounded-xl px-5 text-[15px]"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <>
                    <p className="mt-3 truncate text-base font-semibold">{row.title}</p>
                    <p className="mt-0.5 text-[14px] text-muted-foreground">
                      {[row.symbol, row.timeframe].filter(Boolean).join(" · ")}
                      {row.symbol || row.timeframe ? " · " : ""}
                      {relativeTime(row.created_at)}
                    </p>
                    <div className="mt-2 flex gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        className="h-11 flex-1 rounded-xl text-[15px]"
                        onClick={() => startEdit(row)}
                      >
                        <Pencil className="size-4" /> Rename
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-11 rounded-xl px-4 text-[15px] font-semibold text-bear hover:text-bear"
                        onClick={() => del.ask(row)}
                      >
                        <Trash2 className="size-4" /> Delete
                      </Button>
                    </div>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      </JSection>

      <ConfirmDialog
        open={del.open}
        onOpenChange={(open) => !open && del.close()}
        title="Delete this screenshot?"
        description={
          del.target ? `“${del.target.title}” will be removed for good. It cannot be undone.` : ""
        }
        confirmLabel="Delete"
        pending={remove.isPending}
        onConfirm={runDelete}
      />
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
