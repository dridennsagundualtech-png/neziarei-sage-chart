/**
 * Book library: reader for shared books, plus admin upload/sharing controls.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BookMarked, Loader2, Trash2, Upload, Users, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAccess } from "@/lib/account";
import {
  BOOKS_BUCKET,
  createBookUpload,
  deleteBook,
  finalizeBook,
  getBookUrl,
  listAllBooks,
  listMyBooks,
  setBookAccess,
  updateBook,
  type LibraryBook,
} from "@/lib/library.functions";
import { listPremiumUsers } from "@/lib/premium.functions";

function sizeLabel(bytes: number) {
  if (!bytes) return "";
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

function BookReader({ book, onClose }: { book: LibraryBook; onClose: () => void }) {
  const openFn = useServerFn(getBookUrl);
  const { data, isLoading, error } = useQuery({
    queryKey: ["bookUrl", book.id],
    queryFn: () => openFn({ data: { bookId: book.id } }),
    staleTime: 30 * 60 * 1000,
  });

  return (
    <div className="space-y-2 border-t border-border/60 pt-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Reading “{book.title}”</p>
        <Button size="sm" variant="secondary" className="h-8 rounded-lg" onClick={onClose}>
          <X className="size-3.5" /> Close
        </Button>
      </div>
      {isLoading && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Opening…
        </p>
      )}
      {error && <p className="text-sm text-destructive">Could not open this book.</p>}
      {data?.url && (
        <iframe title={book.title} src={data.url} className="h-[70vh] w-full rounded-xl border border-border" />
      )}
    </div>
  );
}

function ShareList({ book }: { book: LibraryBook }) {
  const [search, setSearch] = useState("");
  const usersFn = useServerFn(listPremiumUsers);
  const accessFn = useServerFn(setBookAccess);
  const queryClient = useQueryClient();

  const users = useQuery({
    queryKey: ["premiumUsers", search],
    queryFn: () => usersFn({ data: { search } }),
  });

  const mutate = useMutation({
    mutationFn: (vars: { userId: string; allowed: boolean }) =>
      accessFn({ data: { bookId: book.id, ...vars } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["allBooks"] }),
    onError: (e: Error) => toast.error(e.message || "Could not change access."),
  });

  const allowed = new Set(book.allowedUserIds ?? []);

  return (
    <div className="space-y-2 rounded-xl border border-border/60 p-3">
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search users by email"
        className="h-9"
      />
      <div className="max-h-56 space-y-1 overflow-y-auto">
        {(users.data ?? []).map((u) => (
          <label key={u.userId} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted/40">
            <span className="truncate">{u.email ?? u.userId}</span>
            <Switch
              checked={allowed.has(u.userId)}
              onCheckedChange={(v) => mutate.mutate({ userId: u.userId, allowed: v })}
            />
          </label>
        ))}
        {users.isLoading && <p className="text-xs text-muted-foreground">Loading users…</p>}
      </div>
    </div>
  );
}

function AdminBooks() {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [shareFor, setShareFor] = useState<string | null>(null);
  const [readingId, setReadingId] = useState<string | null>(null);

  const listFn = useServerFn(listAllBooks);
  const uploadFn = useServerFn(createBookUpload);
  const finalizeFn = useServerFn(finalizeBook);
  const updateFn = useServerFn(updateBook);
  const deleteFn = useServerFn(deleteBook);

  const books = useQuery({ queryKey: ["allBooks"], queryFn: () => listFn({}) });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["allBooks"] });
    queryClient.invalidateQueries({ queryKey: ["myBooks"] });
  };

  const upload = async () => {
    if (!file) return;
    setBusy(true);
    try {
      const { path, token } = await uploadFn({ data: { fileName: file.name } });
      const { error } = await supabase.storage.from(BOOKS_BUCKET).uploadToSignedUrl(path, token, file);
      if (error) throw new Error(error.message);
      await finalizeFn({
        data: {
          storagePath: path,
          title: title.trim() || file.name.replace(/\.pdf$/i, ""),
          author: author.trim(),
          description: description.trim(),
          fileSize: file.size,
        },
      });
      setFile(null);
      setTitle("");
      setAuthor("");
      setDescription("");
      if (fileRef.current) fileRef.current.value = "";
      refresh();
      toast.success("Book uploaded.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card-soft space-y-4 p-4">
      <div>
        <p className="font-display text-base font-semibold">Upload a book (admin)</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Upload a PDF you own the rights to, then choose who can read it.
        </p>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />
      <div className="space-y-2">
        <Button type="button" variant="secondary" className="h-10 rounded-xl" onClick={() => fileRef.current?.click()}>
          <Upload className="size-4" /> {file ? "Change PDF" : "Choose PDF"}
        </Button>
        {file && (
          <p className="truncate text-xs text-muted-foreground">
            {file.name} · {sizeLabel(file.size)}
          </p>
        )}
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="h-10" />
        <Input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Author" className="h-10" />
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Short description"
          rows={2}
        />
        <Button type="button" className="h-10 w-full rounded-xl" disabled={!file || busy} onClick={upload}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          {busy ? "Uploading…" : "Upload book"}
        </Button>
      </div>

      <div className="space-y-3 border-t border-border/60 pt-3">
        <p className="font-display text-sm font-semibold">Uploaded books</p>
        {books.isLoading && <p className="text-xs text-muted-foreground">Loading…</p>}
        {books.data?.length === 0 && <p className="text-xs text-muted-foreground">No books yet.</p>}
        {(books.data ?? []).map((book) => (
          <article key={book.id} className="space-y-2 rounded-xl border border-border/60 p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-display text-sm font-semibold">{book.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {book.author || "Unknown author"} · {sizeLabel(book.fileSize)} ·{" "}
                  {book.isPublic ? "everyone" : `${book.allowedUserIds?.length ?? 0} reader(s)`}
                </p>
              </div>
              <Switch
                checked={book.isPublic}
                onCheckedChange={async (v) => {
                  await updateFn({ data: { bookId: book.id, isPublic: v } });
                  refresh();
                }}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="secondary"
                className="h-8 rounded-lg"
                onClick={() => setReadingId(readingId === book.id ? null : book.id)}
              >
                <BookMarked className="size-3.5" /> {readingId === book.id ? "Close" : "Preview"}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="h-8 rounded-lg"
                onClick={() => setShareFor(shareFor === book.id ? null : book.id)}
              >
                <Users className="size-3.5" /> Who can read it
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="h-8 rounded-lg"
                onClick={async () => {
                  if (!confirm(`Delete “${book.title}”?`)) return;
                  await deleteFn({ data: { bookId: book.id } });
                  refresh();
                  toast.success("Book deleted.");
                }}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
            {shareFor === book.id && <ShareList book={book} />}
            {readingId === book.id && <BookReader book={book} onClose={() => setReadingId(null)} />}
          </article>
        ))}
      </div>
    </section>
  );
}

export function BookLibrary() {
  const { access } = useAccess();
  const listFn = useServerFn(listMyBooks);
  const [openId, setOpenId] = useState<string | null>(null);

  const books = useQuery({
    queryKey: ["myBooks", access?.userId],
    enabled: Boolean(access?.userId),
    queryFn: () => listFn({}),
  });

  const list = books.data ?? [];

  return (
    <div className="space-y-4">
      {list.length > 0 && (
        <section className="card-soft space-y-3 p-4">
          <p className="font-display text-base font-semibold">My library</p>
          <p className="text-xs text-muted-foreground">Books shared with you by ChartPilot.</p>
          {list.map((book) => (
            <article key={book.id} className="space-y-2 rounded-xl border border-border/60 p-3">
              <p className="font-display text-sm font-semibold">{book.title}</p>
              <p className="text-xs text-muted-foreground">{book.author || "Unknown author"}</p>
              {book.description && <p className="text-xs text-muted-foreground">{book.description}</p>}
              <Button
                size="sm"
                className="h-9 rounded-lg"
                onClick={() => setOpenId(openId === book.id ? null : book.id)}
              >
                <BookMarked className="size-3.5" /> {openId === book.id ? "Close" : "Read"}
              </Button>
              {openId === book.id && <BookReader book={book} onClose={() => setOpenId(null)} />}
            </article>
          ))}
        </section>
      )}

      {access?.isAdmin && <AdminBooks />}
    </div>
  );
}
