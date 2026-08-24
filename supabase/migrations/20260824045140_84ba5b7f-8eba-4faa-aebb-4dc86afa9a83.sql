-- Lock down server-only tables explicitly: no client (anon/authenticated) access.
REVOKE ALL ON public.ohlc_data FROM anon, authenticated;
REVOKE ALL ON public.premium_codes FROM anon, authenticated;
GRANT ALL ON public.ohlc_data TO service_role;
GRANT ALL ON public.premium_codes TO service_role;

ALTER TABLE public.ohlc_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.premium_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "No client access to ohlc_data" ON public.ohlc_data;
CREATE POLICY "No client access to ohlc_data"
  ON public.ohlc_data FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "No client access to premium_codes" ON public.premium_codes;
CREATE POLICY "No client access to premium_codes"
  ON public.premium_codes FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);