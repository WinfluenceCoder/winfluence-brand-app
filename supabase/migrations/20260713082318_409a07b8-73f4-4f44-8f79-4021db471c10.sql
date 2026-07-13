CREATE POLICY "brand-logos public read" ON storage.objects FOR SELECT
  USING (bucket_id = 'brand-logos');
CREATE POLICY "brand-logos owner insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'brand-logos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "brand-logos owner update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'brand-logos' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'brand-logos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "brand-logos owner delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'brand-logos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "user_fotos public read" ON storage.objects FOR SELECT
  USING (bucket_id = 'user_fotos');
CREATE POLICY "user_fotos owner insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'user_fotos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "user_fotos owner update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'user_fotos' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'user_fotos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "user_fotos owner delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'user_fotos' AND (storage.foldername(name))[1] = auth.uid()::text);