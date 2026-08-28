import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bold, Italic, NotebookPen, Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { PageGate } from "@/components/PageGate";
import { SignInPrompt } from "@/components/SignInPrompt";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/account";
import { anyDb } from "@/lib/db-types";
import { cn } from "@/lib/utils";

const sb = anyDb(supabase);

export const Route = createFileRoute("/notes")({
  head: () => ({
    meta: [
      { title: "Trading notes — ChartPilot" },
      {
        name: "description",
        content:
          "Free-form trading notes with your own formatting: font, size, bold, italic and colour, saved to your ChartPilot account.",
      },
      { property: "og:title", content: "Trading notes — ChartPilot" },
      {
        property: "og:description",
        content: "Write anything and style it your way — fonts, bold, italic and colours.",
      },
    ],
  }),
  component: NotesPage,
});

interface NoteStyle {
  font: "sans" | "display" | "mono";
  size: number;
  bold: boolean;
  italic: boolean;
  color: string;
}

interface NoteRow {
  id: string;
  title: string;
  body: string;
  style: Partial<NoteStyle> | null;
  updated_at: string;
}

const DEFAULT_STYLE: NoteStyle = {
  font: "sans",
  size: 15,
  bold: false,
  italic: false,
  color: "foreground",
};

const FONTS: { key: NoteStyle["font"]; label: string; className: string }[] = [
  { key: "sans", label: "Sans", className: "font-sans" },
  { key: "display", label: "Display", className: "font-display" },
  { key: "mono", label: "Mono", className: "font-mono" },
];

const COLORS: { key: string; label: string; className: string; swatch: string }[] = [
  { key: "foreground", label: "Default", className: "text-foreground", swatch: "bg-foreground" },
  { key: "primary", label: "Primary", className: "text-primary", swatch: "bg-primary" },
  { key: "bull", label: "Bull", className: "text-bull", swatch: "bg-bull" },
  { key: "bear", label: "Bear", className: "text-bear", swatch: "bg-bear" },
  { key: "warn", label: "Warn", className: "text-warn", swatch: "bg-warn" },
  { key: "muted", label: "Muted", className: "text-muted-foreground", swatch: "bg-muted-foreground" },
];

function mergeStyle(style: Partial<NoteStyle> | null | undefined): NoteStyle {
  return { ...DEFAULT_STYLE, ...(style ?? {}) };
}

function styleClasses(style: NoteStyle): string {
  return cn(
    FONTS.find((font) => font.key === style.font)?.className ?? "font-sans",
    COLORS.find((color) => color.key === style.color)?.className ?? "text-foreground",
    style.bold && "font-semibold",
    style.italic && "italic",
  );
}

function NotesPage() {
  return (
    <AppShell>
      <PageGate page="/notes">
        <SignInPrompt feature="notes">
          <NotesBoard />
        </SignInPrompt>
      </PageGate>
    </AppShell>
  );
}

function NotesBoard() {
  const session = useSession();
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [style, setStyle] = useState<NoteStyle>(DEFAULT_STYLE);

  const notesQuery = useQuery({
    queryKey: ["notes", session.userId],
    enabled: Boolean(session.userId),
    queryFn: async (): Promise<NoteRow[]> => {
      const { data, error } = await sb
        .from("notes")
        .select("id, title, body, style, updated_at")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as NoteRow[];
    },
  });

  const notes = notesQuery.data ?? [];

  useEffect(() => {
    if (!notes.length) {
      setActiveId(null);
      return;
    }
    if (!activeId || !notes.some((note) => note.id === activeId)) {
      const first = notes[0]!;
      setActiveId(first.id);
      setTitle(first.title);
      setBody(first.body);
      setStyle(mergeStyle(first.style));
    }
  }, [notes, activeId]);

  const open = (note: NoteRow) => {
    setActiveId(note.id);
    setTitle(note.title);
    setBody(note.body);
    setStyle(mergeStyle(note.style));
  };

  const create = useMutation({
    mutationFn: async () => {
      const { data, error } = await sb
        .from("notes")
        .insert({
          user_id: session.userId,
          title: "Untitled note",
          body: "",
          style: DEFAULT_STYLE,
        })
        .select("id, title, body, style, updated_at")
        .single();
      if (error) throw error;
      return data as NoteRow;
    },
    onSuccess: async (note) => {
      await queryClient.invalidateQueries({ queryKey: ["notes"] });
      open(note);
    },
    onError: () => toast.error("Could not create that note."),
  });

  const save = useMutation({
    mutationFn: async () => {
      if (!activeId) return;
      const { error } = await sb
        .from("notes")
        .update({ title: title.trim() || "Untitled note", body, style })
        .eq("id", activeId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Note saved.");
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
    onError: () => toast.error("Could not save that note."),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await sb.from("notes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      setActiveId(null);
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
    onError: () => toast.error("Could not delete that note."),
  });

  const set = <K extends keyof NoteStyle>(key: K, value: NoteStyle[K]) =>
    setStyle((current) => ({ ...current, [key]: value }));

  return (
    <div className="space-y-4">
      <header className="animate-float-in card-soft p-5">
        <h1 className="flex items-center gap-2 font-display text-xl font-semibold">
          <NotebookPen className="size-5 text-primary" /> Notes
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Write anything — plans, rules, observations — and style it your way. Notes save to your
          account, so they follow you across devices.
        </p>
      </header>

      <section className="animate-float-in card-soft space-y-2 p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-base font-semibold">Your notes</h2>
          <Button
            size="sm"
            className="h-9 rounded-lg"
            onClick={() => create.mutate()}
            disabled={create.isPending}
          >
            <Plus className="size-4" /> New
          </Button>
        </div>

        {notesQuery.isLoading && <p className="text-sm text-muted-foreground">Loading notes…</p>}
        {!notesQuery.isLoading && notes.length === 0 && (
          <p className="text-sm text-muted-foreground">No notes yet — tap New to start one.</p>
        )}

        <ul className="space-y-1.5">
          {notes.map((note) => (
            <li key={note.id}>
              <button
                type="button"
                onClick={() => open(note)}
                className={cn(
                  "panel flex w-full items-center justify-between gap-2 p-3 text-left transition-colors",
                  note.id === activeId && "border-primary/50 bg-primary/10",
                )}
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{note.title}</span>
                  <span className="block text-xs text-muted-foreground">
                    {new Date(note.updated_at).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      {activeId && (
        <>
          <section className="animate-float-in card-soft space-y-3 p-4">
            <div className="space-y-1.5">
              <Label htmlFor="note-title">Title</Label>
              <Input
                id="note-title"
                className="h-11 rounded-xl"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="note-body">Note</Label>
              <Textarea
                id="note-body"
                rows={10}
                className={cn("rounded-xl leading-relaxed", styleClasses(style))}
                style={{ fontSize: `${style.size}px` }}
                placeholder="Type anything…"
                value={body}
                onChange={(event) => setBody(event.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button className="h-11 flex-1 rounded-xl" onClick={() => save.mutate()} disabled={save.isPending}>
                <Save className="size-4" /> Save note
              </Button>
              <Button
                variant="ghost"
                className="h-11 rounded-xl text-destructive"
                onClick={() => remove.mutate(activeId)}
                disabled={remove.isPending}
              >
                <Trash2 className="size-4" /> Delete
              </Button>
            </div>
          </section>

          <section className="animate-float-in card-soft space-y-3 p-4">
            <h2 className="font-display text-base font-semibold">Formatting</h2>

            <div className="space-y-1.5">
              <Label>Font</Label>
              <div className="flex flex-wrap gap-2">
                {FONTS.map((font) => (
                  <Button
                    key={font.key}
                    size="sm"
                    variant={style.font === font.key ? "default" : "secondary"}
                    className={cn("h-9 rounded-lg", font.className)}
                    onClick={() => set("font", font.key)}
                  >
                    {font.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="note-size">Text size ({style.size}px)</Label>
              <input
                id="note-size"
                type="range"
                min={12}
                max={28}
                step={1}
                className="w-full accent-primary"
                value={style.size}
                onChange={(event) => set("size", Number(event.target.value))}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Emphasis</Label>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={style.bold ? "default" : "secondary"}
                  className="h-9 rounded-lg"
                  onClick={() => set("bold", !style.bold)}
                >
                  <Bold className="size-4" /> Bold
                </Button>
                <Button
                  size="sm"
                  variant={style.italic ? "default" : "secondary"}
                  className="h-9 rounded-lg"
                  onClick={() => set("italic", !style.italic)}
                >
                  <Italic className="size-4" /> Italic
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Colour</Label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((color) => (
                  <button
                    key={color.key}
                    type="button"
                    aria-label={color.label}
                    onClick={() => set("color", color.key)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border border-border px-2.5 py-1.5 text-xs",
                      style.color === color.key ? "border-primary bg-primary/10" : "bg-card",
                    )}
                  >
                    <span className={cn("size-3.5 rounded-full", color.swatch)} />
                    {color.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="panel p-3">
              <p className="mb-1 text-xs text-muted-foreground">Preview</p>
              <p
                className={cn("whitespace-pre-wrap leading-relaxed", styleClasses(style))}
                style={{ fontSize: `${style.size}px` }}
              >
                {body || "Your note will look like this."}
              </p>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
