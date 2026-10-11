/**
 * Rich-text Notes: Word/Notion-style editor.
 *
 * You can select any word or phrase and apply:
 * - Bold, Italic, Underline
 * - Highlight
 * - Heading, bullet list, numbered list
 *
 * Body is stored as HTML in the existing `notes.body` text column.
 *
 * Layout: one screen at a time. First the list of notes, then the editor for the one you picked.
 * That works the same on a phone and on a wide screen, and the editor gets the full width.
 */
import { useEditor, useEditorState, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Bold,
  ChevronRight,
  Heading2,
  Highlighter,
  Italic,
  List,
  ListOrdered,
  NotebookPen,
  Plus,
  Save,
  Trash2,
  Underline as UnderlineIcon,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  ConfirmDialog,
  EmptyState,
  JSection,
  RowList,
  useConfirm,
} from "@/components/journal/parts";
import { SignInPrompt } from "@/components/SignInPrompt";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/account";
import { anyDb } from "@/lib/db-types";
import { relativeTime } from "@/lib/sessions";
import { cn } from "@/lib/utils";

const sb = anyDb(supabase);

interface NoteRow {
  id: string;
  title: string;
  body: string;
  style: Record<string, unknown> | null;
  updated_at: string;
}

/** First line of the note as plain text, for the list. */
function snippetOf(html: string): string {
  return html
    .replace(/<\/(p|h[1-6]|li)>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

/** 44px toolbar button. Pressed state is the inverted chip used everywhere else. */
function FormatButton({
  label,
  icon: Icon,
  active,
  onClick,
}: {
  label: string;
  icon: LucideIcon;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      title={label}
      // Keep the text selection and the keyboard where they are while tapping a format button.
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={cn(
        "inline-flex size-11 shrink-0 items-center justify-center rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active ? "bg-foreground text-background" : "text-foreground hover:bg-elevated",
      )}
    >
      <Icon className="size-5" aria-hidden />
    </button>
  );
}

function Divider() {
  return <span aria-hidden className="mx-1 h-6 w-px shrink-0 bg-border" />;
}

function EditorToolbar({ editor }: { editor: Editor }) {
  // Re-read the formatting under the cursor on every selection change.
  const on = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      bold: current.isActive("bold"),
      italic: current.isActive("italic"),
      underline: current.isActive("underline"),
      highlight: current.isActive("highlight"),
      heading: current.isActive("heading"),
      bullet: current.isActive("bulletList"),
      ordered: current.isActive("orderedList"),
    }),
  });

  return (
    <div
      role="toolbar"
      aria-label="Text formatting"
      className="sticky top-[3.95rem] z-10 -mx-4 flex items-center gap-1 overflow-x-auto border-y border-border/60 bg-background px-4 py-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <FormatButton
        label="Bold"
        icon={Bold}
        active={on.bold}
        onClick={() => editor.chain().focus().toggleBold().run()}
      />
      <FormatButton
        label="Italic"
        icon={Italic}
        active={on.italic}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      />
      <FormatButton
        label="Underline"
        icon={UnderlineIcon}
        active={on.underline}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      />
      <FormatButton
        label="Highlight"
        icon={Highlighter}
        active={on.highlight}
        onClick={() => editor.chain().focus().toggleHighlight().run()}
      />
      <Divider />
      <FormatButton
        label="Heading (tap again for normal text)"
        icon={Heading2}
        active={on.heading}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      />
      <Divider />
      <FormatButton
        label="Bullet list"
        icon={List}
        active={on.bullet}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      />
      <FormatButton
        label="Numbered list"
        icon={ListOrdered}
        active={on.ordered}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      />
    </div>
  );
}

function NotesBoard() {
  const session = useSession();
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [dirty, setDirty] = useState(false);
  const leave = useConfirm<true>();
  const removeAsk = useConfirm<true>();

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
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      Highlight.configure({ multicolor: false }),
      Placeholder.configure({
        placeholder: "Start writing… Select any text to bold it, highlight it or make a list.",
      }),
    ],
    content: "",
    editorProps: {
      attributes: {
        "aria-label": "Note body",
        class: "min-h-[45vh] py-4 text-[17px] leading-relaxed focus:outline-none",
      },
    },
    onUpdate: () => setDirty(true),
  });

  const openNote = (note: NoteRow) => {
    setActiveId(note.id);
    setTitle(note.title);
    editor?.commands.setContent(note.body || "", { emitUpdate: false });
    setDirty(false);
  };

  const closeNote = () => {
    setActiveId(null);
    setTitle("");
    editor?.commands.setContent("", { emitUpdate: false });
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
      openNote(note);
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
      removeAsk.close();
      closeNote();
      toast.success("Note deleted");
    },
    onError: () => {
      removeAsk.close();
      toast.error("Could not delete note");
    },
  });

  if (notesQuery.isLoading) {
    return <p className="py-10 text-center text-[15px] text-muted-foreground">Loading notes…</p>;
  }

  /* ------------------------------------------------------------ the list */
  if (!activeId) {
    return (
      <JSection
        className="pt-6"
        title="Notes"
        hint={
          notes.length > 0
            ? `${notes.length} ${notes.length === 1 ? "note" : "notes"}. Free writing for lessons, mistakes and ideas.`
            : "Free writing for lessons, mistakes and ideas."
        }
        action={
          notes.length > 0 ? (
            <Button
              type="button"
              className="h-11 rounded-xl px-4 text-[15px] font-semibold"
              onClick={() => createNote.mutate()}
              disabled={createNote.isPending}
            >
              <Plus className="size-5" /> New note
            </Button>
          ) : undefined
        }
      >
        {notes.length === 0 ? (
          <EmptyState
            icon={NotebookPen}
            title="No notes yet"
            action={
              <Button
                type="button"
                className="h-12 rounded-xl px-6 text-base font-semibold"
                onClick={() => createNote.mutate()}
                disabled={createNote.isPending}
              >
                <Plus className="size-5" /> Write your first note
              </Button>
            }
          >
            Notes are yours alone. Bold, highlight and lists are one tap away.
          </EmptyState>
        ) : (
          <RowList>
            {notes.map((note) => {
              const snippet = snippetOf(note.body);
              return (
                <li key={note.id}>
                  <button
                    type="button"
                    onClick={() => openNote(note)}
                    className="flex min-h-[76px] w-full items-center gap-3 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-base font-semibold">
                        {note.title || "Untitled note"}
                      </span>
                      {snippet && (
                        <span className="mt-0.5 block truncate text-[14px] text-muted-foreground">
                          {snippet}
                        </span>
                      )}
                      <span className="mt-0.5 block text-[13px] text-muted-foreground">
                        {relativeTime(note.updated_at)}
                      </span>
                    </span>
                    <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                  </button>
                </li>
              );
            })}
          </RowList>
        )}
      </JSection>
    );
  }

  /* ---------------------------------------------------------- the editor */
  return (
    <div className="pt-3">
      <Button
        type="button"
        variant="ghost"
        className="-ml-3 h-11 rounded-xl px-3 text-[15px]"
        onClick={() => (dirty ? leave.ask(true) : closeNote())}
      >
        <ArrowLeft className="size-5" /> All notes
      </Button>

      <Input
        value={title}
        aria-label="Note title"
        placeholder="Note title"
        onChange={(event) => {
          setTitle(event.target.value);
          setDirty(true);
        }}
        className="mt-1 h-14 rounded-none border-0 bg-transparent px-0 font-display text-2xl font-semibold shadow-none focus-visible:ring-0 md:text-2xl"
      />

      {editor && <EditorToolbar editor={editor} />}

      <div
        className="note-editor min-h-[45vh] cursor-text"
        onClick={() => editor?.commands.focus()}
      >
        <EditorContent editor={editor} />
      </div>

      <Button
        type="button"
        variant="ghost"
        className="mt-6 h-12 w-full justify-start rounded-xl text-base font-semibold text-bear hover:text-bear"
        onClick={() => removeAsk.ask(true)}
      >
        <Trash2 className="size-5" /> Delete this note
      </Button>

      {dirty && (
        <div className="sticky bottom-20 z-20 -mx-4 mt-6 flex items-center justify-between gap-3 border-t border-border bg-background px-4 py-3">
          <p className="text-[15px] text-muted-foreground">Not saved yet</p>
          <Button
            type="button"
            className="h-12 rounded-xl px-6 text-base font-semibold"
            onClick={() => saveNote.mutate()}
            disabled={saveNote.isPending}
          >
            <Save className="size-5" /> {saveNote.isPending ? "Saving…" : "Save note"}
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={leave.open}
        onOpenChange={(open) => !open && leave.close()}
        title="Leave without saving?"
        description="Your changes to this note will be lost."
        confirmLabel="Discard changes"
        onConfirm={() => {
          leave.close();
          closeNote();
        }}
      />
      <ConfirmDialog
        open={removeAsk.open}
        onOpenChange={(open) => !open && removeAsk.close()}
        title="Delete this note?"
        description="The note is removed for good. It cannot be undone."
        confirmLabel="Delete"
        pending={deleteNote.isPending}
        onConfirm={() => activeId && deleteNote.mutate(activeId)}
      />

      <style>{`
        .note-editor .ProseMirror { min-height: 45vh; }
        .note-editor .ProseMirror p { margin: 0.5em 0; }
        .note-editor .ProseMirror h2 { font-size: 1.4rem; font-weight: 600; margin: 1em 0 0.4em; }
        .note-editor .ProseMirror h3 { font-size: 1.15rem; font-weight: 600; margin: 0.9em 0 0.3em; }
        .note-editor .ProseMirror ul { list-style: disc; padding-left: 1.5em; margin: 0.5em 0; }
        .note-editor .ProseMirror ol { list-style: decimal; padding-left: 1.5em; margin: 0.5em 0; }
        .note-editor .ProseMirror li { margin: 0.25em 0; }
        .note-editor .ProseMirror mark {
          background-color: var(--color-primary);
          color: var(--color-primary-foreground);
          border-radius: 3px;
          padding: 0 3px;
        }
        .note-editor .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: var(--color-muted-foreground);
          pointer-events: none;
          height: 0;
        }
      `}</style>
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
