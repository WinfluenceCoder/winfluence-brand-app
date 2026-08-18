# CampaignForm UI-Refactoring

Umbau des gemeinsamen Formulars für `/campaigns/new` und `/campaigns/$id/edit`. Zod-Schema, `defaultValues` und Payload-Mapping bleiben strukturell unverändert; `canEdit(field)`- und ReadOnly-Logik bleibt bei jedem Feld erhalten (auch nach dem Verschieben und bei den neuen Dropdowns).

## Neue Sektions-Struktur (alle Card-Titel mit lucide-Icon in `text-primary`)

1. Titel, Brand & Produkt — unverändert
2. Inhalt & Briefing — ohne `budget`, `start`, `ende`; `hashtags` mit onBlur-Formatierung
3. Budget (neu, Wallet) — `budget` mit bestehender Tausender-Formatierung
4. Laufzeit & Termine (neu, Calendar) — `start`, `ende`, `apply_till` in einer 3-spaltigen Zeile
5. Influencer & Post — ohne `target_url`, `coupon`, `apply_till`; neue Dropdown-Zeile unter „Anforderungen an Influencer"
6. Promotion (neu, Megaphone, Akkordeon) — `target_url`, `coupon`
7. Barter (Akkordeon) — Reihenfolge: `barter_desc`, `barter_value`, `barter_order_url`, `barter_order_coupon`

## Verhalten im Detail

- Akkordeon-Cards (Promotion, Barter): Chevron rechts oben in der Titelzeile (down = zu, up = offen), initial zugeklappt. Der Inhalt bleibt gemountet (`hidden`-Attribut statt Conditional-Render), damit react-hook-form-Registrierungen erhalten bleiben. Beim Submit mit Validierungsfehler in einer zugeklappten Card wird diese automatisch aufgeklappt (Prüfung der Fehlerfelder je Sektion im `handleSubmit`-Fehlerpfad).
- URL-Felder `target_url` und `barter_order_url`: onBlur wird `https://` ergänzt, falls kein `http(s)://` vorangestellt ist, anschliessend normal validiert. Schema unverändert.
- `hashtags`: onBlur wird jedes Wort mit `#` versehen (sofern nicht vorhanden), Trennung mit genau einem Leerzeichen, kein führendes/abschliessendes Leerzeichen.
- Neues Dropdown „Gewünschte Plattform": Werte „keine Anforderung" (Default) und „Instagram". Reiner UI-Platzhalter im lokalen State, nicht im Formular-Schema und nicht im Payload; folgt derselben `canEdit()`-/ReadOnly-Logik.
- Dropdown „Gewünschter Post-Typ" ersetzt das Textfeld `post_type`: „keine Anforderung" (leerer Formularwert → Payload `null`), sonst wird der Anzeigetext direkt gespeichert (`Post`, `Reel`, `Story`). Beim Laden wird ein passender gespeicherter Wert vorausgewählt, sonst Default.
- Dropdown „Kampagnen-Typ" (`type`): `CAMPAIGN_TYPES = ["Engagement mit Influencer"]` wird durch die sechs Enum-Keys ersetzt — `reach`, `engagement`, `click_through`, `subscription`, `download`, `lead_gen`. Gespeichert wird der Key, angezeigt das Label aus `campaignForm.typeOptions.*`. Beim Laden: bekannter Key vorausgewählt, sonst Default `reach` (auch als neuer `defaultValues`-Fallback statt `CAMPAIGN_TYPES[0]`).

## Buttons

- `mode="create"`: Primary-Button heisst künftig „Als Entwurf speichern" (Verhalten unverändert). Direkt daneben ein Secondary-Button „Speichern & Publizieren": speichert identisch, navigiert bei Erfolg aber zu `/campaigns/publish/$id` mit der ID aus der `createCampaign`-Antwort. Umsetzung über ein Intent-Flag, das die Mutation im `onSuccess` auswertet. „Abbrechen" bleibt rechts daneben.
- `mode="edit"`: Buttons unverändert.

## Technische Notizen

- `createCampaign` in `src/lib/campaigns.functions.ts` gibt via `.select("id").single()` bereits die ID zurück — diese Datei muss daher **nicht** angepasst werden.
- `src/integrations/supabase/types.ts`: Der Block `Enums` enthält derzeit nur `app_role`; ergänzt wird `campaign_type: "reach" | "engagement" | "click_through" | "subscription" | "download" | "lead_gen"`. Die Spalte `campaigns.type` bleibt im generierten Typ wie vom Schema geliefert (`string | null`) — sie wird nicht manuell umtypisiert, damit Row/Insert/Update konsistent zum Rest der generierten Datei bleiben.
- `src/locales/de.json`: neue Keys für Sektions-Titel (`sections.budget`, `sections.schedule`, `sections.promotion`), Labels (`labels.platform`, `labels.post_type_select`), Optionen (`typeOptions.*`, `postTypeOptions.none`, `platformOptions.*`) und Buttons (`actions.saveDraft`, `actions.saveAndPublish`). Keine hartcodierten sichtbaren Strings.
- Keine Datenbank-Änderungen, keine Migrationen, keine Route-Änderungen, kein Lovable Cloud.

## Betroffene Dateien

- `src/components/app/CampaignForm.tsx`
- `src/locales/de.json`
- `src/integrations/supabase/types.ts`
