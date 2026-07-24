## Ziel

Die bestehende Platzhalter-Route `/campaigns/publish/$id` zu einer funktionalen Publizieren-Seite ausbauen: Kampagnendaten read-only anzeigen, Fristen-/Laufzeit-Felder editierbar mit angepasster Validierung, und Publish-Aktion, die den Status auf `published` setzt.

## Änderungen

### 1. `src/lib/campaigns.functions.ts`

Neue Server-Funktion `publishCampaign`:

- Input: `{ id: number, apply_till: string, start: string, ende: string }` (alle drei required, ISO-Strings)
- Middleware: `requireSupabaseAuth`
- Validiert Ownership via `loadOwnedCampaign` und wirft `not-publishable-status`, falls Status ≠ `draft`.
- Server-seitige Datums-Checks parallel zu Client-Validierung:
  - `apply_till >= heute + 1 Tag`
  - `start > apply_till`
  - `ende > start`
- Update: setzt `status = 'published'`, `apply_till`, `start`, `ende`, `updated_at`.

### 2. `src/routes/_authenticated/campaigns.publish.$id.tsx`

Platzhalter durch vollwertige Seite ersetzen.

**Layout (`mx-auto max-w-4xl space-y-6 p-8`):**

1. **Zurück-Link** oben (`ChevronLeft` + `common.back`, `router.history.back()`).
2. **Header-Zeile** (`flex items-center justify-between`):
   - Links: `<h1>` „Kampagne publizieren"
   - Rechts: Button „Kampagne bearbeiten" → `/campaigns/$id/edit` (`variant="outline"`)
3. **Read-only-Card „Kampagne"**:
   - Visual (`campaign_visual_url`) als abgerundetes Bild
   - Titel als großer Text unterhalb
   - Briefing als Fließtext (`whitespace-pre-wrap text-sm`)
4. **Card „Laufzeit und Fristen bestätigen"** — Feldreihenfolge:
   1. `apply_till` (Bewerbung bis) — **alleine auf einer Zeile** (volle Breite)
   2. `start` und `ende` — **nebeneinander** in `grid gap-4 sm:grid-cols-2`
   - Alle drei `datetime-local`, alle required, gleiche Label/Placeholder wie in `CampaignForm`.
   - Validierung via Zod + `superRefine`:
     - `apply_till` required → `validation.required`
     - `apply_till < heute + 1 Tag` → „Bewerbungsfrist muss mindestens 1 Tag betragen"
     - `start` required
     - `start <= apply_till` → „Kampagne kann erst nach der Bewerbungsfrist starten"
     - `ende` required
     - `ende <= start` → bestehender Key `campaignForm.errors.endAfterStart`
5. **Card „Publizieren"**:
   - Zeile (`flex items-center justify-between`): Erklärungstext links („Durch das Publizieren…") + Button „Vorschau anzeigen" rechts (`variant="outline"`, Link zu `/campaigns/preview/$id`).
   - Darunter Buttons linksbündig: „Publizieren" (primary, submit) + „Abbrechen" (`variant="outline"`, `router.history.back()`).

**Verhalten:**

- Daten-Load via `useSuspenseQuery` + `getMyCampaign` (Pattern wie Edit-Route).
- Default-Werte für `apply_till`, `start`, `ende` aus geladener Kampagne via lokalem `toLocal()`-Helper.
- Publizieren-Mutation → neue `publishCampaign` server-fn. onSuccess: `qc.invalidateQueries({ queryKey: ["campaigns"] })` + `["home", "campaigns"]`, Toast, Navigation zu `/campaigns?status=published`.
- Fehler-Toasts: `not-publishable-status` → spezifische Meldung, sonst generisch.
- Wenn `status !== 'draft'`: Publish-Button `disabled` + Hinweistext.

### 3. Neue Platzhalter-Route `src/routes/_authenticated/campaigns.preview.$id.tsx`

Minimaler Platzhalter: Zurück-Link, `h1` „Kampagnen-Vorschau", Kurztext „Inhalt folgt.", Anzeige der ID. Keine Backend-Logik.

### 4. `src/locales/de.json`

Neue Keys unter `campaignPublish`:

- `title`, `editButton`, `sections.campaign`, `sections.schedule`, `sections.publish`
- `explanation`, `previewButton`, `publishButton`, `notDraftHint`
- `published`, `publishError`, `publishErrorStatus`
- `previewTitle`, `previewPlaceholder`
- `errors.applyTillMin`: „Bewerbungsfrist muss mindestens 1 Tag betragen"
- `errors.startAfterApply`: „Kampagne kann erst nach der Bewerbungsfrist starten"

Labels für `apply_till`/`start`/`ende` und `endAfterStart` werden aus bestehendem `campaignForm.*` wiederverwendet.

### 5. Keine Änderung an

- `src/components/app/CampaignsTable.tsx` (Menüeintrag verlinkt bereits korrekt)
- Datenbank / RLS
- `src/components/app/CampaignForm.tsx`

## Technische Hinweise

- `toLocal`/`fromLocal`-Helper in der Publish-Route lokal duplizieren (klein, gleiche Semantik wie in `CampaignForm`).
- „heute + 1 Tag"-Schwelle: `const minApply = new Date(); minApply.setDate(minApply.getDate() + 1);` — Vergleich auf Zeitstempel-Ebene (nicht Kalendertag), damit clientseitig direkt nutzbar. Server-seitig identisch prüfen.
- `publishCampaign` prüft Status server-seitig (Race-Safety); RLS erzwingt Ownership über `brand_id`.
