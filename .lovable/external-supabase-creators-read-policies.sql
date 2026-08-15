-- Influencer-Listen: Data-API-GRANTs + RLS-Policies für collabs / creators
-- Ausführen im SQL-Editor des externen Supabase-Projekts rssnbsduduboxlrvpodw.
-- Keine Schema-Änderungen, nur Rechte + Policies + eine Hilfsfunktion.

-- 1) Data-API-Zugriff (PostgREST) — nur lesend, nur für eingeloggte Nutzer.
--    Kein anon: Creator-Daten sind personenbezogen.
GRANT SELECT ON public.collabs   TO authenticated;
GRANT SELECT ON public.creators  TO authenticated;
GRANT ALL    ON public.collabs   TO service_role;
GRANT ALL    ON public.creators  TO service_role;

-- 2) RLS aktivieren (idempotent)
ALTER TABLE public.collabs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creators ENABLE ROW LEVEL SECURITY;

-- 3) Hilfsfunktion: ist der eingeloggte User ein Brand-User?
CREATE OR REPLACE FUNCTION public.is_brand_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.brands b
     WHERE b.user_id = auth.uid()
  )
$$;

REVOKE ALL ON FUNCTION public.is_brand_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_brand_user() FROM anon;
GRANT EXECUTE ON FUNCTION public.is_brand_user() TO authenticated;

-- Rekursionsfreie Prüfung für die creators-Policy.
-- SECURITY DEFINER ist hier erforderlich: Eine direkte Abfrage auf collabs
-- innerhalb der creators-Policy würde beim Embed collabs -> creators erneut
-- die RLS-Policies auswerten und PostgreSQL-Fehler 42P17 auslösen.
CREATE OR REPLACE FUNCTION public.creator_has_active_collab(_creator_id bigint)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.collabs c
     WHERE c.creator_id = _creator_id
       AND c.status::text IN ('applied','selected','hired','working','delivered')
  )
$$;

REVOKE ALL ON FUNCTION public.creator_has_active_collab(bigint) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.creator_has_active_collab(bigint) FROM anon;
GRANT EXECUTE ON FUNCTION public.creator_has_active_collab(bigint) TO authenticated;

-- 4) collabs: Brand-User dürfen alle aktiven Collabs lesen (global),
--    damit /influencers/current nicht brand-gefiltert ist.
DROP POLICY IF EXISTS "brand users read active collabs" ON public.collabs;
CREATE POLICY "brand users read active collabs"
  ON public.collabs FOR SELECT
  TO authenticated
  USING (
    public.is_brand_user()
    AND status::text IN ('applied','selected','hired','working','delivered')
  );

-- 5) creators: Brand-User dürfen Creators lesen, die mindestens einen
--    aktiven Collab haben. Die Collab-Prüfung läuft über eine SECURITY
--    DEFINER-Funktion, damit keine RLS-Rekursion entsteht.
DROP POLICY IF EXISTS "brand users read active creators" ON public.creators;
CREATE POLICY "brand users read active creators"
  ON public.creators FOR SELECT
  TO authenticated
  USING (
    public.is_brand_user()
    AND public.creator_has_active_collab(id)
  );

-- Prüfung (als eingeloggter Brand-User über die App, nicht im SQL-Editor):
--   select id, status, creator_id, campaign_id from public.collabs limit 5;
