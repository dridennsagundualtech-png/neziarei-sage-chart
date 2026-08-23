
DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;
CREATE POLICY "Users can read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can read codes" ON public.premium_codes;
REVOKE SELECT ON public.premium_codes FROM authenticated;

DROP POLICY IF EXISTS "Users can read own premium access" ON public.premium_access;
CREATE POLICY "Users can read own premium access" ON public.premium_access
  FOR SELECT TO authenticated USING (user_id = auth.uid());
