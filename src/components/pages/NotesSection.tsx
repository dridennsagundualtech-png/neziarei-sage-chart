/**
 * Rich-text Notes: Word/Notion-style editor.
 *
 * You can select any word or phrase and apply:
 * - Bold, Italic, Underline
 * - Highlight
 * - Bullet list / Numbered list
 *
 * Body is stored as HTML in the existing `notes.body` text column.
 */
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Highlighter,
  List,
  ListOrdered,
  NotebookPen,
  Plus,
  Save,
  Trash2,
  Heading2,
  Pilcrow,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { SignInPrompt } from "@/components/SignInPrompt";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/account";
import { anyDb } from "@/lib/db-types";
import { cn } from "@/lib/utils";

const sb = anyDb(supabase);

interface NoteRow {
  id: string;
  title: string;
  body: string;
  style: Record<string, unknown> | null;
  updated_at: string;
}

/** Toolbar button that reflects active state from the editor. */
function FormatButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-lg border text-sm transition-colors",
        active
          ? "border-primary bg-primary/15 text-primary"
          : "border-border bg-card text-foreground hover:bg-muted/60",
        disabled && "opacity-40 pointer-events-none",
      )}
    >
      {children}
    </button>
  );
}

function EditorToolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-border bg-card/80 p-2">
      <FormatButton
        title="Bold (Ctrl+B)"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="size-4" />
      </FormatButton>

      <FormatButton
        title="Italic (Ctrl+I)"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="size-4" />
      </FormatButton>

      <FormatButton
        title="Underline (Ctrl+U)"
        active={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <UnderlineIcon className="size-4" />
      </FormatButton>

      <FormatButton
        title="Highlight"
        active={editor.isActive("highlight")}
        onClick={() => editor.chain().focus().toggleHighlight().run()}
      >
        <Highlighter className="size-4" />
      </FormatButton>

      <span className="mx-1 h-6 w-px bg-border" />

      <FormatButton
        title="Heading"
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 className="size-4" />
      </FormatButton>

      <FormatButton
        title="Paragraph"
        active={editor.isActive("paragraph")}
        onClick={() => editor.chain().focus().setParagraph().run()}
      >
        <Pilcrow className="size-4" />
      </FormatButton>

      <span className="mx-1 h-6 w-px bg-border" />

      <FormatButton
        title="Bullet list"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="size-4" />
      </FormatButton>

      <FormatButton
        title="Numbered list"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="size-4" />
      </FormatButton>
    </div>
  );
}

function NotesBoard() {
  const session = useSession();
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [dirty, setDirty] = useState(false);

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

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      Highlight.configure({ multicolor: false }),
      Placeholder.configure({
        placeholder: "Start writing… Select any text to bold, highlight, or make a list.",
      }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class:
          "min-h-[280px] max-h-[60vh] overflow-y-auto rounded-xl border border-border bg-background px-4 py-3 text-[15px] leading-relaxed focus:outline-none",
      },
    },
    onUpdate: () => setDirty(true),
  });

  // Load selected note into editor
  useEffect(() => {
    if (!notes.length) {
      setActiveId(null);
      setTitle("");
      editor?.commands.setContent("");
      setDirty(false);
      return;
    }
    if (!activeId || !notes.some((n) => n.id === activeId)) {
      const first = notes[0]!;
      setActiveId(first.id);
      setTitle(first.title);
      editor?.commands.setContent(first.body || "");
      setDirty(false);
    }
  }, [notes, activeId, editor]);

  const selectNote = (note: NoteRow) => {
    if (dirty) {
      const ok = window.confirm("You have unsaved changes. Discard them?");
      if (!ok) return;
    }
    setActiveId(note.id);
    setTitle(note.title);
    editor?.commands.setContent(note.body || "");
    setDirty(false);
  };

  const createNote = useMutation({
    mutationFn: async () => {
      if (!session.userId) throw new Error("Not signed in");
      const { data, error } = await sb
        .from("notes")
        .insert({
          user_id: session.userId,
          title: "Untitled note",
          body: "",
          style: {},
        })
        .select("id, title, body, style, updated_at")
        .single();
      if (error) throw error;
      return data as NoteRow;
    },
    onSuccess: (note) => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      setActiveId(note.id);
      setTitle(note.title);
      editor?.commands.setContent("");
      setDirty(false);
      toast.success("New note created");
    },
    onError: () => toast.error("Could not create note"),
  });

  const saveNote = useMutation({
    mutationFn: async () => {
      if (!activeId || !editor) throw new Error("Nothing to save");
      const html = editor.getHTML();
      const { error } = await sb
        .from("notes")
        .update({
          title: title.trim() || "Untitled note",
          body: html,
          style: {},
        })
        .eq("id", activeId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      setDirty(false);
      toast.success("Note saved");
    },
    onError: () => toast.error("Could not save note"),
  });

  const deleteNote = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await sb.from("notes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      setActiveId(null);
      setTitle("");
      editor?.commands.setContent("");
      setDirty(false);
      toast.success("Note deleted");
    },
    onError: () => toast.error("Could not delete note"),
  });

  if (notesQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
        Loading notes…
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
      {/* Sidebar: note list */}
      <aside className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-sm font-semibold flex items-center gap-1.5">
            <NotebookPen className="size-4" />
            Notes
          </h2>
          <Button
            size="sm"
            variant="secondary"
            className="h-8 rounded-lg"
            onClick={() => createNote.mutate()}
            disabled={createNote.isPending}
          >
            <Plus className="size-4" />
            New
          </Button>
        </div>

        <div className="space-y-1 max-h-[70vh] overflow-y-auto">
          {notes.length === 0 && (
            <p className="text-xs text-muted-foreground px-1 py-4">
              No notes yet. Create one to start writing.
            </p>
          )}
          {notes.map((note) => (
            <button
              key={note.id}
              type="button"
              onClick={() => selectNote(note)}
              className={cn(
                "w-full rounded-xl border px-3 py-2.5 text-left transition-colors",
                activeId === note.id
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card hover:bg-muted/40",
              )}
            >
              <p className="truncate text-sm font-medium">
                {note.title || "Untitled note"}
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {new Date(note.updated_at).toLocaleString()}
              </p>
            </button>
          ))}
        </div>
      </aside>

      {/* Editor */}
      <div className="space-y-3 min-w-0">
        {activeId ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setDirty(true);
                }}
                placeholder="Note title"
                className="h-10 flex-1 rounded-xl font-display text-base"
              />
              <Button
                size="sm"
                className="h-10 rounded-xl gap-1.5"
                onClick={() => saveNote.mutate()}
                disabled={saveNote.isPending || !dirty}
              >
                <Save className="size-4" />
                {saveNote.isPending ? "Saving…" : "Save"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-10 rounded-xl text-bear hover:bg-bear/10"
                onClick={() => {
                  if (window.confirm("Delete this note permanently?")) {
                    deleteNote.mutate(activeId);
                  }
                }}
                disabled={deleteNote.isPending}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>

            <EditorToolbar editor={editor} />

            <div className="note-editor">
              <EditorContent editor={editor} />
            </div>

            <p className="text-[11px] text-muted-foreground px-1">
              Select any text, then use the toolbar to bold, italic, underline, highlight, or make
              lists. Changes are saved only when you press Save.
            </p>

            <style>{`
              .note-editor .ProseMirror {
                min-height: 280px;
              }
              .note-editor .ProseMirror p {
                margin: 0.4em 0;
              }
              .note-editor .ProseMirror h2 {
                font-size: 1.25rem;
                font-weight: 600;
                margin: 0.8em 0 0.4em;
              }
              .note-editor .ProseMirror h3 {
                font-size: 1.1rem;
                font-weight: 600;
                margin: 0.7em 0 0.3em;
              }
              .note-editor .ProseMirror ul {
                list-style: disc;
                padding-left: 1.4em;
                margin: 0.4em 0;
              }
              .note-editor .ProseMirror ol {
                list-style: decimal;
                padding-left: 1.4em;
                margin: 0.4em 0;
              }
              .note-editor .ProseMirror mark {
                background-color: oklch(0.9 0.15 95);
                border-radius: 2px;
                padding: 0 2px;
                color: inherit;
              }
              .note-editor .ProseMirror p.is-editor-empty:first-child::before {
                content: attr(data-placeholder);
                float: left;
                color: var(--muted-foreground);
                pointer-events: none;
                height: 0;
              }
            `}</style>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border py-20 text-center">
            <NotebookPen className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Create a note to start writing with full formatting.
            </p>
            <Button onClick={() => createNote.mutate()} className="rounded-xl">
              <Plus className="size-4" />
              New note
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export function NotesSection() {
  return (
    <SignInPrompt feature="notes">
      <NotesBoard />
    </SignInPrompt>
  );
}
