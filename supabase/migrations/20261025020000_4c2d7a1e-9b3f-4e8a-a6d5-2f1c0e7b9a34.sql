-- Every edge test the app runs. The bar for calling an edge is 5% split across
-- all rows here, so trying more versions only makes passing harder. A row is
-- one look: a test, or a re-run once a tenth of its trades are new.
-- Server only (service role); no client access.
CREATE TABLE IF NOT EXISTS public.edge_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  look_key text NOT NULL UNIQUE,
  test_key text NOT NULL,
  strategy_key text NOT NULL,
  filter text NOT NULL,
  symbol text NOT NULL,
  standard boolean NOT NULL DEFAULT false,
  costs boolean NOT NULL DEFAULT false,
  trades integer NOT NULL,
  avg_r double precision,
  sd_r double precision,
  coin_flip_p double precision,
  first_trade timestamptz,
  last_trade timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON public.edge_checks FROM anon, authenticated;
GRANT ALL ON public.edge_checks TO service_role;
ALTER TABLE public.edge_checks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "No client access to edge_checks" ON public.edge_checks;
CREATE POLICY "No client access to edge_checks" ON public.edge_checks FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
CREATE INDEX IF NOT EXISTS edge_checks_test_idx ON public.edge_checks (test_key, filter, created_at DESC);
CREATE INDEX IF NOT EXISTS edge_checks_strategy_idx ON public.edge_checks (strategy_key, filter, updated_at DESC);
