-- Manuell im externen Supabase-Projekt (rssnbsduduboxlrvpodw) ausführen.
-- Setzt RLS-Policies für den Storage-Bucket `campaign-visuals` analog zu
-- `brand-logos`. Uploads/Reads/Updates/Deletes sind auf den ersten Pfad-
-- Segment = auth.uid() beschränkt (Konvention: `<uid>/visual-*.<ext>`).

-- Sicherstellen, dass RLS auf storage.objects aktiv ist (i.d.R. bereits an).
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Alte Policies mit gleichem Namen entfernen (idempotent).
DROP POLICY IF EXISTS "campaign-visuals: authenticated insert own" ON storage.objects;
DROP POLICY IF EXISTS "campaign-visuals: authenticated update own" ON storage.objects;
DROP POLICY IF EXISTS "campaign-visuals: authenticated delete own" ON storage.objects;
DROP POLICY IF EXISTS "campaign-visuals: authenticated select own" ON storage.objects;
DROP POLICY IF EXISTS "campaign-visuals: public read" ON storage.objects;

-- INSERT: authentifizierter User darf nur in seinen eigenen Ordner uploaden.
CREATE POLICY "campaign-visuals: authenticated insert own"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'campaign-visuals'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- UPDATE (upsert / overwrite): eigene Dateien.
CREATE POLICY "campaign-visuals: authenticated update own"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'campaign-visuals'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'campaign-visuals'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- DELETE: eigene Dateien.
CREATE POLICY "campaign-visuals: authenticated delete own"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'campaign-visuals'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- SELECT: eigene Dateien für authentifizierte User.
CREATE POLICY "campaign-visuals: authenticated select own"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'campaign-visuals'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Optional: öffentlicher Lesezugriff, wenn das Visual per Public-URL
-- angezeigt werden soll (z. B. im Dashboard / für Influencer). Nur ausführen,
-- wenn der Bucket bewusst öffentlich lesbar sein soll.
CREATE POLICY "campaign-visuals: public read"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING ( bucket_id = 'campaign-visuals' );

-- Alternativ (statt der public-read Policy) den Bucket selbst auf public setzen:
--   UPDATE storage.buckets SET public = true WHERE id = 'campaign-visuals';
