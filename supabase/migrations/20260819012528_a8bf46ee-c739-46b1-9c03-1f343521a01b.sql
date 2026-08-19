ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS beginner_mode boolean NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS public.learning_progress (
  user_id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  state jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.learning_progress TO authenticated;
GRANT ALL ON public.learning_progress TO service_role;

ALTER TABLE public.learning_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own learning progress" ON public.learning_progress
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER learning_progress_touch BEFORE UPDATE ON public.learning_progress
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();