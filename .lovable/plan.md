## Umsetzung

1. **Kein Crop-Dialog** — Upload bleibt wie aktuell (einfaches File-Input via `ImageUploadField`), keine Änderungen an `/profile` oder Formular.

2. **RLS-SQL für `campaign-visuals`** — neue Datei `.lovable/external-supabase-campaign-visuals-policies.sql` mit Policies analog zu `brand-logos`:
   - INSERT / UPDATE / SELECT / DELETE für `authenticated`, gescoped auf `(storage.foldername(name))[1] = auth.uid()::text`
   - Optional: öffentlicher SELECT für `anon`, falls das Visual per Public-URL angezeigt werden soll
   - Datei ist nur eine Vorlage zum manuellen Ausführen in Supabase, kein Deploy von Lovable aus.

3. **Datum/Zeit-Control für `start` und `ende`** — bereits identisch mit `apply_till` (`<Input type="datetime-local">`). Keine Code-Änderung nötig; wird im Plan festgehalten, damit klar ist, dass nichts umgestellt wird.

4. **Budget mit Tausender-Trennzeichen** in `src/components/app/CampaignForm.tsx`:
   - Anzeige-State `budgetDisplay` (String mit `de-CH`-Formatierung, `'` als Trennzeichen — konsistent mit Locale) getrennt vom Form-Wert.
   - `onChange`: nicht-numerische Zeichen strippen, roher Integer-String in `form.setValue("budget", raw)`, formatierte Anzeige via `Intl.NumberFormat("de-CH").format(Number(raw))`.
   - `onBlur`/Initialisierung: aus vorhandenem numerischem Wert formatieren.
   - `inputMode="numeric"` bleibt; Zod-Schema bleibt unverändert (validiert weiter den rohen Integer-String).

Keine Backend-/Schema-Änderungen, keine Cloud-Aktivierung.