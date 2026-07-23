-- Externe Supabase-DB (rssnbsduduboxlrvpodw)
-- Manuell im Supabase SQL Editor ausführen.
--
-- Erlaubt einem Brand-Owner, eigene Kampagnen zu löschen.
-- Die Server Function 'deleteCampaign' erzwingt zusätzlich status='draft'
-- und das Fehlen verknüpfter collabs; die Policy schränkt Ownership hart ein.

DROP POLICY IF EXISTS "brand_owner_delete_campaigns" ON public.campaigns;

CREATE POLICY "brand_owner_delete_campaigns"
ON public.campaigns
FOR DELETE
TO authenticated
USING (
  brand_id IN (
    SELECT id FROM public.brands WHERE user_id = auth.uid()
  )
);

-- Sicherstellen, dass authenticated überhaupt DELETE-Recht auf die Tabelle hat
GRANT DELETE ON public.campaigns TO authenticated;

-- Hinweis: Falls bereits eine allgemeinere Owner-Policy FOR ALL existiert,
-- ist die separate DELETE-Policy optional — dann reicht das GRANT DELETE.
