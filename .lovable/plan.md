## Ziel
Auf `/campaigns/:id/edit` einen Delete-Button hinzufügen und Button-Bereich neu anordnen. Harte Löschung nur wenn Status = `draft` und keine verknüpften `collabs` existieren.

## Änderungen

### 1. `src/lib/campaigns.functions.ts`
- Neue Server Function `getCampaignDeletability({ id })`:
  - Auth-Middleware, Brand des Users laden, Ownership prüfen.
  - Liest `status` aus `campaigns` und `count` aus `collabs` mit `campaign_id = id`.
  - Rückgabe: `{ canDelete: boolean, reason?: 'status' | 'collabs' }`.
- Neue Server Function `deleteCampaign({ id })`:
  - Auth-Middleware, Brand-Ownership prüfen.
  - Server-seitige Re-Validierung: `status === 'draft'` und `collabs`-Count = 0, sonst Error (`not-deletable-status` / `has-collabs`).
  - `delete()` auf `campaigns` mit `id` + `brand_id`-Filter.
  - Rückgabe `{ ok: true }`.

### 2. `src/components/app/CampaignForm.tsx`
- Button-Zeile: von `justify-end` auf `flex items-center gap-3` (left-aligned).
- Reihenfolge: **Speichern** (primary) → **Abbrechen** (outline) → **Kampagne löschen** (`variant="destructive"`).
- Delete-Button nur bei `mode === 'edit'` UND `getCampaignDeletability`-Query liefert `canDelete === true` (via `useQuery`).
- OnClick öffnet `AlertDialog` (shadcn) mit Warntext; Bestätigung ruft `deleteCampaign` per `useMutation`:
  - onSuccess: Toast, `queryClient.invalidateQueries(["home","campaigns"])`, `router.navigate({ to: "/" })`.
  - onError: Toast mit übersetzter Fehlermeldung.

### 3. `src/locales/de.json` — neue Keys unter `campaignForm`
- `deleteButton`: „Kampagne löschen"
- `deleteConfirmTitle`: „Kampagne löschen?"
- `deleteConfirmBody`: „Diese Aktion kann nicht rückgängig gemacht werden."
- `deleteConfirm`: „Endgültig löschen"
- `deleted`: „Kampagne gelöscht"
- `deleteError`: „Löschen fehlgeschlagen"

### 4. SQL für externe Supabase-DB — RLS DELETE-Policy
Ablage als Referenz-Snippet unter `.lovable/external-supabase-campaigns-delete-policy.sql`. **Nicht automatisch ausgeführt** — muss der User im externen Supabase-Projekt (`rssnbsduduboxlrvpodw`) manuell laufen lassen, da wir keine Schema-Änderungen aus Lovable heraus vornehmen.

```sql
-- Erlaubt einem Brand-Owner, eigene Kampagnen zu löschen.
-- Die Server Function 'deleteCampaign' erzwingt zusätzlich status='draft'
-- und das Fehlen verknüpfter collabs; die Policy muss diese Fachlogik
-- nicht duplizieren, sollte aber Ownership hart einschränken.

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
```

Hinweis: Falls bereits eine allgemeinere Owner-Policy `FOR ALL` existiert, ist die separate DELETE-Policy optional — dann reicht das `GRANT DELETE`. Der User entscheidet nach Sichtung der bestehenden Policies.

## Nicht enthalten
- Kein Soft-Delete, keine Status-Änderungen.
- Keine Änderungen an `collabs` oder anderen Routen.
- Keine automatische DB-Migration — SQL wird nur bereitgestellt.
