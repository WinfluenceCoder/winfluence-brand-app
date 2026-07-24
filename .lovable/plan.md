# Publish-Seite umbauen

## 1. Neue wiederverwendbare `CampaignCard`
Neue Datei `src/components/app/CampaignCard.tsx`:
- Props: `campaign` (mit `title`, `briefing`, `campaign_visual_url`).
- Layout: Card mit Header `campaignPublish.sections.campaign`. Inhalt zweispaltig (Flex/Grid):
  - Links: quadratisches Visual (`aspect-square`, feste Breite z.B. `w-48 sm:w-56`, `object-cover`, `rounded-md`). Fallback: `Megaphone`-Icon-Kachel gleicher Größe.
  - Rechts: Titel (`text-xl font-semibold`) + Briefing (`whitespace-pre-wrap text-sm text-muted-foreground`).
- Auf Mobile stapeln (`flex-col sm:flex-row`, `gap-4`).

## 2. `campaigns.publish.$id.tsx` anpassen
- Bestehenden inline-Card-Block „Kampagne" durch `<CampaignCard campaign={campaign} />` ersetzen.
- Card „Laufzeit…": Feld `apply_till` in dasselbe Grid wie `start`/`ende` legen — statt volle Breite → `grid gap-4 sm:grid-cols-2`, `apply_till` in erster Zeile links, `start` und `ende` in zweiter Zeile. So sind alle drei Inputs gleich breit. (Reihenfolge apply_till → start → ende bleibt erhalten.)
- Card „Publizieren":
  - Vorschau-Button: als `<a href="/campaigns/preview/$id" target="_blank" rel="noopener noreferrer">` (kein Router-Link, damit neues Fenster). Button-Inhalt: Text + `ExternalLink`-Icon (lucide) rechts.
  - Unter dem Erklärungstext + Vorschau-Zeile eine Checkbox-Zeile (shadcn `Checkbox`): Label „Ich habe die [AGB](/terms) gelesen und bin damit einverstanden". `AGB` als TanStack `<Link to="/terms">` inline im Label.
  - `useState<boolean>` für `agbAccepted`. Publizieren-Button `disabled` wenn `!agbAccepted || !isDraft || submitting`.

## 3. Neue Platzhalter-Route `/terms`
Neue Datei `src/routes/terms.tsx` (öffentlich, ausserhalb `_authenticated`):
- `createFileRoute("/terms")` mit eigenem `head()` (Titel „AGB — Winfluence BrandApp", Description, og:title/og:description).
- Component: simple Platzhalterseite mit H1 „AGB" und Hinweistext „Inhalt folgt".

## 4. i18n
`src/locales/de.json` erweitern:
- `campaignPublish.previewOpenHint` (falls nötig) — sonst bestehende `previewButton` beibehalten.
- `campaignPublish.agbLabel` = „Ich habe die {{link}} gelesen und bin damit einverstanden" — oder split in `agbBefore` / `agbLinkLabel` / `agbAfter` für saubere Link-Einbettung. Ich nehme Split-Variante.
- `terms.title`, `terms.placeholder`.

## Technische Details
- Keine Backend-/Schema-Änderungen.
- Kein neues Package; `Checkbox` und Icons (`ExternalLink`) sind vorhanden.
- Preview-Link öffnet in neuem Tab per `target="_blank"` — daher bewusst `<a>` statt `<Link>`.
- Publish-Server-Fn unverändert; AGB-Zustimmung nur clientseitig (Gate für den Submit-Button).
