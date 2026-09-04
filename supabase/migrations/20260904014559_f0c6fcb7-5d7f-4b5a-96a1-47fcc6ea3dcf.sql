CREATE TABLE public.den_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  components jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, name)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.den_presets TO authenticated;
GRANT ALL ON public.den_presets TO service_role;

ALTER TABLE public.den_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own den presets" ON public.den_presets
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);