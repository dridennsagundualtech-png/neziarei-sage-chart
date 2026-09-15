/**
 * Book library — admin-uploaded PDFs stored privately in Supabase Storage,
 * readable only by users the admin allows (or everyone when made public).
 */
import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { anyDb, type AnyDb } from "@/lib/db-types";

export const BOOKS_BUCKET = "books";

export interface LibraryBook {
  id: string;
  title: string;
  author: string;
  description: string;
  storagePath: string;
  fileSize: number;
  isPublic: boolean;
  createdAt: string;
  allowedUserIds?: string[];
}

interface BookRow {
  id: string;
  title: string;
  author: string;
  description: string;
  storage_path: string;
  file_size: number;
  is_public: boolean;
  created_at: string;
}

function toBook(row: BookRow): LibraryBook {
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    description: row.description,
    storagePath: row.storage_path,
    fileSize: Number(row.file_size ?? 0),
    isPublic: Boolean(row.is_public),
    createdAt: row.created_at,
  };
}

async function adminClient() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return anyDb(supabaseAdmin);
}

async function ensureAdmin(db: AnyDb, userId: string, email: string | null) {
  const { requireAdmin } = await import("./premium.server");
  await requireAdmin(db, userId, email);
}

async function canRead(db: AnyDb, userId: string, bookId: string): Promise<BookRow | null> {
  const { data } = await db.from("library_books").select("*").eq("id", bookId).maybeSingle();
  if (!data) return null;
  if (data.is_public) return data as BookRow;
  const { data: grant } = await db
    .from("library_book_access")
    .select("id")
    .eq("book_id", bookId)
    .eq("user_id", userId)
    .maybeSingle();
  return grant ? (data as BookRow) : null;
}

/** Books the caller may read (shared with everyone or with them). */
export const listMyBooks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<LibraryBook[]> => {
    const db = await adminClient();
    const [{ data: publicRows }, { data: grants }] = await Promise.all([
      db.from("library_books").select("*").eq("is_public", true),
      db.from("library_book_access").select("book_id").eq("user_id", context.userId),
    ]);
    const ids = (grants ?? []).map((g: { book_id: string }) => g.book_id);
    let grantedRows: BookRow[] = [];
    if (ids.length) {
      const { data } = await db.from("library_books").select("*").in("id", ids);
      grantedRows = (data ?? []) as BookRow[];
    }
    const byId = new Map<string, BookRow>();
    for (const row of [...((publicRows ?? []) as BookRow[]), ...grantedRows]) byId.set(row.id, row);
    return [...byId.values()]
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map(toBook);
  });

/** Short-lived signed URL for reading a book the caller is allowed to open. */
export const getBookUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { bookId: string }) => ({ bookId: String(data.bookId ?? "") }))
  .handler(async ({ data, context }): Promise<{ url: string }> => {
    const db = await adminClient();
    const email = (context.claims["email"] as string | undefined) ?? null;
    let row = await canRead(db, context.userId, data.bookId);
    if (!row) {
      await ensureAdmin(db, context.userId, email);
      const { data: adminRow } = await db
        .from("library_books")
        .select("*")
        .eq("id", data.bookId)
        .maybeSingle();
      row = (adminRow ?? null) as BookRow | null;
    }
    if (!row) throw new Error("Book not found");
    const { data: signed, error } = await db.storage
      .from(BOOKS_BUCKET)
      .createSignedUrl(row.storage_path, 60 * 60);
    if (error || !signed?.signedUrl) throw new Error(error?.message ?? "Could not open this book");
    return { url: signed.signedUrl };
  });

/** Admin: every book plus who it is shared with. */
export const listAllBooks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<LibraryBook[]> => {
    const db = await adminClient();
    const email = (context.claims["email"] as string | undefined) ?? null;
    await ensureAdmin(db, context.userId, email);
    const [{ data: rows }, { data: grants }] = await Promise.all([
      db.from("library_books").select("*").order("created_at", { ascending: false }),
      db.from("library_book_access").select("book_id, user_id"),
    ]);
    const byBook = new Map<string, string[]>();
    for (const g of (grants ?? []) as { book_id: string; user_id: string }[]) {
      byBook.set(g.book_id, [...(byBook.get(g.book_id) ?? []), g.user_id]);
    }
    return ((rows ?? []) as BookRow[]).map((row) => ({
      ...toBook(row),
      allowedUserIds: byBook.get(row.id) ?? [],
    }));
  });

/** Admin: signed upload URL so big PDFs go browser → storage directly. */
export const createBookUpload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { fileName: string }) => ({ fileName: String(data.fileName ?? "book.pdf") }))
  .handler(async ({ data, context }) => {
    const db = await adminClient();
    const email = (context.claims["email"] as string | undefined) ?? null;
    await ensureAdmin(db, context.userId, email);
    const safe = data.fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80) || "book.pdf";
    const path = `${context.userId}/${crypto.randomUUID()}-${safe}`;
    const { data: signed, error } = await db.storage
      .from(BOOKS_BUCKET)
      .createSignedUploadUrl(path);
    if (error || !signed) throw new Error(error?.message ?? "Could not start the upload");
    return { path, token: signed.token };
  });

/** Admin: record an uploaded file as a book. */
export const finalizeBook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: {
    storagePath: string;
    title: string;
    author: string;
    description: string;
    fileSize: number;
  }) => data)
  .handler(async ({ data, context }): Promise<LibraryBook> => {
    const db = await adminClient();
    const email = (context.claims["email"] as string | undefined) ?? null;
    await ensureAdmin(db, context.userId, email);
    const { data: row, error } = await db
      .from("library_books")
      .insert({
        storage_path: String(data.storagePath),
        title: String(data.title || "Untitled book").slice(0, 200),
        author: String(data.author ?? "").slice(0, 200),
        description: String(data.description ?? "").slice(0, 2000),
        file_size: Math.max(0, Math.round(Number(data.fileSize) || 0)),
        uploaded_by: context.userId,
        is_public: false,
      })
      .select("*")
      .single();
    if (error || !row) throw new Error(error?.message ?? "Could not save the book");
    return toBook(row as BookRow);
  });

/** Admin: edit details or flip "shared with everyone". */
export const updateBook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: {
    bookId: string;
    title?: string;
    author?: string;
    description?: string;
    isPublic?: boolean;
  }) => data)
  .handler(async ({ data, context }) => {
    const db = await adminClient();
    const email = (context.claims["email"] as string | undefined) ?? null;
    await ensureAdmin(db, context.userId, email);
    const patch: Record<string, unknown> = {};
    if (data.title !== undefined) patch["title"] = String(data.title).slice(0, 200);
    if (data.author !== undefined) patch["author"] = String(data.author).slice(0, 200);
    if (data.description !== undefined) patch["description"] = String(data.description).slice(0, 2000);
    if (data.isPublic !== undefined) patch["is_public"] = Boolean(data.isPublic);
    if (!Object.keys(patch).length) return { ok: true };
    const { error } = await db.from("library_books").update(patch).eq("id", data.bookId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Admin: delete the book row and its stored file. */
export const deleteBook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { bookId: string }) => ({ bookId: String(data.bookId ?? "") }))
  .handler(async ({ data, context }) => {
    const db = await adminClient();
    const email = (context.claims["email"] as string | undefined) ?? null;
    await ensureAdmin(db, context.userId, email);
    const { data: row } = await db
      .from("library_books")
      .select("storage_path")
      .eq("id", data.bookId)
      .maybeSingle();
    if (row?.storage_path) {
      await db.storage.from(BOOKS_BUCKET).remove([row.storage_path]);
    }
    await db.from("library_books").delete().eq("id", data.bookId);
    return { ok: true };
  });

/** Admin: allow or remove one user for one book. */
export const setBookAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { bookId: string; userId: string; allowed: boolean }) => data)
  .handler(async ({ data, context }) => {
    const db = await adminClient();
    const email = (context.claims["email"] as string | undefined) ?? null;
    await ensureAdmin(db, context.userId, email);
    if (data.allowed) {
      const { error } = await db
        .from("library_book_access")
        .upsert({ book_id: data.bookId, user_id: data.userId }, { onConflict: "book_id,user_id" });
      if (error) throw new Error(error.message);
    } else {
      const { error } = await db
        .from("library_book_access")
        .delete()
        .eq("book_id", data.bookId)
        .eq("user_id", data.userId);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });
