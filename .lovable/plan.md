## Ziel
`/campaigns/$id/edit` status-abhängig anpassen: Statusanzeige, "Live-Version"-Button, Warnhinweis bei `published`, und partielle bzw. vollständige Read-Only-Modi.

## Änderungen

### 1. `src/components/app/CampaignForm.tsx`
- `initial` Type um `status?: string | null` erweitern; `status` als Prop durchreichen (aus `initial`).
- Editierbarkeit ableiten:
  - `isDraft` (oder `mode === "create"`): alles editierbar (Status quo).
  - `isPublished` (`status === "published"`): nur diese Felder editierbar — `brand_logo_url`, `campaign_visual_url`, `budget`, `link_list`, `target_url`, `apply_till`, `barter_order_url`, `barter_order_coupon`. Alle übrigen als Read-Only-Anzeige rendern.
  - `isLocked` (`status ∈ {running, expired, ended, approved, archived}`): alle Felder read-only, Buttons (Speichern/Abbrechen/Löschen) entfernt.
- Neuer Block direkt unter `<h1>` (nur `mode === "edit"`):
  - Zeile 1: Statusanzeige links (übersetztes Label, `Badge`), rechts „Live Version anzeigen" (`Button variant="outline" asChild`, `<a target="_blank">` auf `/campaigns/preview/$id`) — nur wenn `status ∈ {published, running, expired, ended, approved, archived}`.
  - Zeile 2 (nur bei `published`): Warnhinweis mit `AlertTriangle`-Icon + i18n-Text („Daten können nur noch teilweise geändert werden …").
- Read-only Rendering: Für Felder, die im aktuellen Status gesperrt sind, statt `<Input>`/`<Textarea>`/`<Select>`/`<ImageUploadField>` eine reine Anzeige (kleiner Text-Block, bei Bild ein `<img>` mit gerundeten Ecken analog Preview-Card, bei Datum formatierter String, bei Budget mit Tausender-Trennzeichen). Ein einfacher `ReadOnlyField`-Helfer inline in derselben Datei.
- Validierung `apply_till < start` bleibt bestehen (bei `published` ist `start` gesperrt aber der Wert im Form, sodass die Cross-Field-Regel weiterhin greift).
- Submit- / Delete-Verhalten:
  - `isLocked`: gesamte Button-Leiste (inkl. AlertDialogs) nicht rendern.
  - `isPublished`: Buttons bleiben; `updateCampaign` erhält weiterhin alle Felder aus dem Form (die read-only Werte kommen aus `defaultValues`).
  - `draft`: unverändert.

### 2. `src/locales/de.json`
Neue Keys unter `campaignForm`:
- `statusLabel`: „Status"
- `viewLive`: „Live Version anzeigen"
- `partialEditWarning`: „Daten können nur noch teilweise geändert werden (Brand-Logo, Kampagnen-Visual, Budget, Links, Bewerbungsfrist, Barter Bestell-URL und Barter Gutscheincode)."
- `statuses`: { draft, published, running, expired, ended, approved, archived } — deutsche Labels.

### 3. `src/routes/_authenticated/campaigns.$id.edit.tsx`
Keine Anpassung nötig — `data` enthält bereits `status` und wird vollständig als `initial` weitergereicht.

## Nicht enthalten
- Keine Backend-/Server-Fn-Änderungen. Die serverseitige Autorisierung bleibt wie sie ist; falls in Zukunft ein „nur diese Felder bei published"-Guard serverseitig gewünscht ist, wäre das ein separater Task.
- Kampagnen-Workflow-Doku (`docs/campaign-workflow.md`) bleibt unverändert (betrifft Tabellen-Workflow, nicht das Edit-Formular).
