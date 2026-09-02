CREATE TABLE public.screenshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Screenshot',
  storage_path text not null,
  symbol text,
  timeframe text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.screenshots TO authenticated;
GRANT ALL ON public.screenshots TO service_role;
ALTER TABLE public.screenshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own screenshots" ON public.screenshots FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER screenshots_touch BEFORE UPDATE ON public.screenshots FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX screenshots_user_created_idx ON public.screenshots (user_id, created_at DESC);