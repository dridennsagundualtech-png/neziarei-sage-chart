ALTER TABLE public.premium_access
  ADD COLUMN IF NOT EXISTS hidden_pages text[] NOT NULL DEFAULT '{}'::text[];

CREATE TABLE IF NOT EXISTS public.notes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Untitled note',
  body text NOT NULL DEFAULT '',
  style jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notes TO authenticated;
GRANT ALL ON public.notes TO service_role;

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own notes" ON public.notes;
CREATE POLICY "own notes" ON public.notes FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS notes_user_updated_idx ON public.notes (user_id, updated_at DESC);

DROP TRIGGER IF EXISTS notes_touch_updated_at ON public.notes;
CREATE TRIGGER notes_touch_updated_at BEFORE UPDATE ON public.notes
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();