-- Route /invite/:id — nur Rechte + Policies, keine Schema-Änderungen.
-- Ausführen im SQL-Editor des externen Supabase-Projekts rssnbsduduboxlrvpodw.

-- 1) Brand-Users dürfen alle AKTIVEN Creators lesen (für die Einladungsliste).
GRANT SELECT ON public.creators TO authenticated;

DROP POLICY IF EXISTS "brand users read active status creators" ON public.creators;
CREATE POLICY "brand users read active status creators"
  ON public.creators FOR SELECT
  TO authenticated
  USING (
    public.is_brand_user()
    AND status::text = 'active'
  );

-- 2) Brand-Users dürfen Collabs für eigene Kampagnen anlegen (Einladungen).
--    public.brand_owns_campaign(bigint) existiert bereits
--    (siehe .lovable/external-supabase-collabs-rank-match.sql).
GRANT INSERT ON public.collabs TO authenticated;

DROP POLICY IF EXISTS "brand can insert own campaign collabs" ON public.collabs;
CREATE POLICY "brand can insert own campaign collabs"
  ON public.collabs FOR INSERT
  TO authenticated
  WITH CHECK (public.brand_owns_campaign(campaign_id));

-- 3) Bestehende Collabs dieser Kampagne müssen lesbar sein, damit die
--    Einladungsliste den Status-Badge zeigen kann (inkl. 'invited').
DROP POLICY IF EXISTS "brand reads own campaign collabs" ON public.collabs;
CREATE POLICY "brand reads own campaign collabs"
  ON public.collabs FOR SELECT
  TO authenticated
  USING (public.brand_owns_campaign(campaign_id));

-- Kontrolle
SELECT policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'public' AND tablename IN ('collabs', 'creators');
