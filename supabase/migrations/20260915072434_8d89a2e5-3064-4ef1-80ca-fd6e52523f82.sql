CREATE TABLE public.library_books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT 'Untitled book',
  author text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  storage_path text NOT NULL,
  file_size bigint NOT NULL DEFAULT 0,
  uploaded_by uuid NOT NULL,
  is_public boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.library_books TO authenticated;
GRANT ALL ON public.library_books TO service_role;
ALTER TABLE public.library_books ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.library_book_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES public.library_books(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (book_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.library_book_access TO authenticated;
GRANT ALL ON public.library_book_access TO service_role;
ALTER TABLE public.library_book_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins manage books" ON public.library_books
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "readers see shared books" ON public.library_books
  FOR SELECT TO authenticated
  USING (
    is_public
    OR EXISTS (
      SELECT 1 FROM public.library_book_access a
      WHERE a.book_id = library_books.id AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "admins manage book access" ON public.library_book_access
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "users see own book access" ON public.library_book_access
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE TRIGGER library_books_touch
  BEFORE UPDATE ON public.library_books
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE POLICY "admins manage book files" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'books' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'books' AND public.has_role(auth.uid(), 'admin'));