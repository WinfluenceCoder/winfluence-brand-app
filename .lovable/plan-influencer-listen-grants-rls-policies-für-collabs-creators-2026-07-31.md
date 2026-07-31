# Influencer-Listen: GRANTs + RLS-Policies für `collabs` / `creators`

Die Zählabfragen liefern Daten, die API-Reads liefern leere Arrays → es fehlen Data-API-GRANTs bzw. SELECT-Policies für die Rolle `authenticated`. Zusätzlich soll `/influencers/current` global sein (alle Collabs mit Status `applied`/`hired`, nicht brand-gefiltert), also brauchen wir eine breitere Lese-Policy.

## SQL-Snippet

Ich lege den folgenden Inhalt unter `.lovable/external-supabase-creators-read-policies.sql` ab; du führst ihn im Supabase-SQL-Editor des Projekts `rssnbsduduboxlrvpodw` aus.

```sql
-- 1) Data-API-Zugriff (PostgREST) — nur lesend, nur für eingeloggte Nutzer.
--    Kein anon: Creator-Daten sind personenbezogen.
GRANT SELECT ON public.collabs   TO authenticated;
GRANT SELECT ON public.creators  TO authenticated;
GRANT ALL    ON public.collabs   TO service_role;
GRANT ALL    ON public.creators  TO service_role;

-- 2) RLS aktiv lassen/einschalten
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

REVOKE ALL ON FUNCTION public.is_brand_user() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_brand_user() TO authenticated;

-- 4) collabs: Brand-User dürfen alle aktiven Collabs lesen (global),
--    damit /influencers/current nicht brand-gefiltert ist.
DROP POLICY IF EXISTS "brand users read active collabs" ON public.collabs;
CREATE POLICY "brand users read active collabs"
  ON public.collabs FOR SELECT
  TO authenticated
  USING (public.is_brand_user() AND status IN ('applied','hired'));

-- 5) creators: Brand-User dürfen Creators lesen, die mindestens einen
--    aktiven Collab haben.
DROP POLICY IF EXISTS "brand users read active creators" ON public.creators;
CREATE POLICY "brand users read active creators"
  ON public.creators FOR SELECT
  TO authenticated
  USING (
    public.is_brand_user()
    AND EXISTS (
      SELECT 1 FROM public.collabs c
       WHERE c.creator_id = creators.id
         AND c.status IN ('applied','hired')
    )
  );
```

Hinweise zum Anpassen:

- Falls `collabs.status` ein Enum-Typ ist, muss verglichen werden mit `status IN ('applied','hired')::` bzw. `status::text IN ('applied','hired')` — beim Ausführen zeigt Postgres den Fehler sofort, ich liefere dann die Enum-Variante nach.
- Falls die Fremdschlüsselspalte in `collabs` nicht `creator_id` heißt, muss Punkt 5 entsprechend angepasst werden.
- `campaigns` ist bereits lesbar, deshalb keine Änderung dort — der `campaigns!inner`-Join für `/influencers/applied` und `/influencers/hired` funktioniert damit weiterhin.

## Frontend

`/influencers/current` bleibt wie gebaut global (`brandScoped` nicht gesetzt), `/influencers/applied` und `/influencers/hired` bleiben brand-gefiltert über `campaigns.brand_id`. Am Code ist voraussichtlich keine Änderung nötig; sollte der Join nach dem SQL-Lauf immer noch leer bleiben, prüfe ich die tatsächlichen Spaltennamen von `collabs` und passe `src/lib/creators-list.ts` an.

## Verifikation

Nach dem Ausführen des SQL prüfe ich eingeloggt im Preview die drei Listen (`current`, `applied`, `hired`) sowie die Detailseite `/influencers/:id` und melde das Ergebnis. Keine Schema-Änderungen, kein Lovable Cloud — nur GRANTs, Policies und eine Hilfsfunktion im bestehenden externen Projekt.
