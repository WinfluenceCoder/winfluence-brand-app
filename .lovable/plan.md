## Ziel
Formular für Anlegen und Bearbeiten von Kampagnen unter `/campaigns/new` und `/campaigns/$id/edit`, gegen die bestehende externe Supabase-Tabelle `campaigns`. Keine Cloud-Aktivierung, keine Schema-Änderungen.

## Neue / geänderte Dateien

**Neu:**
- `src/lib/campaigns.functions.ts` — Server-Functions mit `requireSupabaseAuth`:
  - `getMyCampaign({ id })` — Kampagne für den eingeloggten Brand laden (join brand_id über `brands.user_id = auth.uid()`).
  - `createCampaign(input)` — Insert mit `brand_id` des eigenen Brands, `status='draft'`.
  - `updateCampaign({ id, ...input })` — Update inkl. `updated_at = now()`, `status` bleibt unverändert.
  - Zod-Schema serverseitig (identisch zum Client-Schema).
- `src/routes/_authenticated/campaigns.$id.edit.tsx` — Edit-Route mit Loader, der die Kampagne vorlädt.
- `src/components/app/CampaignForm.tsx` — gemeinsames Formular für Create/Edit (Props: `initial?`, `mode`).
- `src/components/app/ImageUploadField.tsx` — wiederverwendbarer Upload (analog Logo-Upload in `/profile`, ohne Crop-Dialog, da Profile ebenfalls keinen hat; Bucket per Prop). Verwendet in Formular für `brand_logos` und `campaign-visuals`.

**Geändert:**
- `src/routes/_authenticated/campaigns.new.tsx` — Placeholder ersetzen durch `<CampaignForm mode="create" />`.
- `src/routes/_authenticated/index.tsx` — Tabellenzeilen klickbar → `navigate` zu `/campaigns/$id/edit`; „Neue Kampagne"-Button linkt zu `/campaigns/new` (falls noch nicht).
- `src/locales/de.json` — Block `campaignForm` mit Section-Titeln, Labels, Placeholdern (exakt wie in Spec), Buttons, Toasts, Bestätigungsdialog-Texten, Validierungsmeldungen (`endAfterStart`, `applyBeforeStart`).

## Formular-Struktur
Sections als Cards mit `<h3>`-Zwischenüberschrift:
1. **Titel, Brand & Produkt** — `title`, `brand_name` (vorbefüllt aus Brand), `brand_logo_url` (Upload, vorbefüllt), `product`.
2. **Inhalt & Briefing** — `briefing` (Textarea 10 Zeilen, resize-y), `campaign_visual_url` (Upload), `goal`, `targetgroup`, `key_message`, `budget`, `start`, `ende`, `hashtags`, `link_list`.
3. **Influencer & Post** — `requirements` (Textarea 10, resize-y), `post_type`, `type` (Select mit Enum-Werten, hartcodiert `["Engagement mit Influencer"]` da Enum extern), `target_url`, `coupon`, `apply_till`.
4. **Barter** — `barter_desc`, `barter_order_url`, `barter_order_coupon`, `barter_value`.

Aktionen unten: **Speichern** (Mutation), **Abbrechen** (bei `formState.isDirty` → `AlertDialog` bestätigen, sonst zurück zu `/`).

## Validierung (zod, Fehlermeldungen aus `de.json`)
- `title`, `brand_name`, `brand_logo_url`, `product`, `briefing`, `campaign_visual_url`, `goal`, `targetgroup`, `key_message`, `budget`, `start`, `ende`, `requirements`, `type` → erforderlich.
- `target_url`, `barter_order_url` → optional, wenn vorhanden URL-Regex.
- `budget`, `barter_value` → int ≥ 0.
- Cross-Field via `.superRefine`: `ende > start`, `apply_till < start` (jeweils nur wenn beide gesetzt).

## Verhalten
- TanStack Query: `useMutation` mit `useServerFn`; `onSuccess` → `queryClient.invalidateQueries(["my-campaigns"])`, `toast.success`, `navigate({ to: "/" })`.
- Nur Schreiboperation auf `campaigns`. Uploads gehen direkt via Client-`supabase.storage` in Buckets `brand-logos` bzw. `campaign-visuals`; die zurückgegebene Public-URL wird in das jeweilige Formularfeld gesetzt und mitgespeichert.
- Alle Texte via `t("campaignForm.…")` — keine Hardcodes.

## Datumsfelder
`start`, `ende`, `apply_till` sind `timestamptz` → `<Input type="datetime-local">` (Shadcn); Konvertierung ISO ↔ local beim Setzen/Lesen im Formular.

## Offen (nur zur Kenntnis)
`type`-Enum wird als hartcodierte Liste `["Engagement mit Influencer"]` gepflegt, weil die Enum-Werte nicht dynamisch aus Postgres gelesen werden (keine Schema-Änderung, keine RPC). Bei neuen Enum-Werten muss die Liste ergänzt werden.