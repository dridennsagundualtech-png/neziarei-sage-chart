# Upload your own books to the Academy

Add a real book library to the Books section: you (as admin) upload PDFs of books you published, and you decide who can read them.

## What you get

**As admin, in the Books tab:**
- An "Upload a book" card: choose a PDF, set title, author, short description, cover-less is fine.
- A list of your uploaded books with, for each one:
  - A "Shared with everyone" switch — one tap to let all signed-in users read it.
  - A "Who can read it" button opening a list of users (searchable, same list used for premium management) with a checkbox per user to allow or remove access.
  - Rename / delete.

**As a regular user:**
- A "My library" area at the top of Books showing only the books shared with them (everyone-shared or individually allowed).
- Tap a book to read it in the existing in-app PDF viewer.
- The device-only personal PDF reader stays exactly as it is.

Files are stored privately; readers get a short-lived link, so books are not publicly downloadable from a guessable address.

## Technical notes

- New private storage bucket `books` (50 MB per file), paths `{admin_user_id}/{book_id}.pdf`.
- New table `library_books`: title, author, description, storage_path, size, uploaded_by, is_public, created/updated timestamps.
- New table `library_book_access`: book_id, user_id (unique pair) for individual grants.
- Grants + RLS: admins (via `has_role`) manage everything; authenticated users may read rows that are public or granted to them. Storage objects in `books` readable only through server-issued signed URLs.
- New `src/lib/library.functions.ts` server functions (all under `requireSupabaseAuth`):
  - `listMyBooks` — books visible to caller, with signed URL on demand
  - `getBookUrl` — signed URL after re-checking permission
  - admin-only: `listAllBooks`, `createBookUpload` (returns signed upload URL), `finalizeBook`, `updateBook` (title/author/description/is_public), `deleteBook`, `listBookAccess`, `setBookAccess`
  - admin checks reuse `requireAdmin` from `premium.server`
- UI: extend `src/components/pages/BooksSection.tsx` with a `LibraryBooks` block plus a new `src/components/BookLibraryAdmin.tsx`; reader reuses the iframe viewer pattern from `PersonalPdfReader`.
- Uploads go browser → signed Supabase Storage URL directly, so large PDFs don't pass through the server function.
