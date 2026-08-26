# CollabDialog: statusabhängiger Detail-Dialog für Collabs

## Ziel
`CreatorProfileDialog` wird durch `CollabDialog` ersetzt. Der Dialog stellt die Collab in den Mittelpunkt und priorisiert Inhalte je `collabs.status`.

## Bestandsaufnahme (geprüft)
- `CreatorProfileDialog` wird nur an zwei Stellen verwendet: `src/components/app/CurationBoard.tsx:306` und `src/routes/_authenticated/campaigns.monitor.$id.tsx:197`. Nach der Umstellung ist die Datei ungenutzt und wird gelöscht.
- `/campaigns/start/$id` öffnet keinen Creator-Dialog (nur read-only Tabelle) – dort ist keine Änderung nötig.
- `common.close` ("Schliessen") existiert bereits in `de.json`; kein neuer Key nötig.
- Utilities vorhanden: `formatNumberCh`, `formatChf`, `formatMatchPercent`, `matchBadgeClasses`, `formatEcpe` (in `campaign-curation.ts`), `effectiveCpe`/`contentEngagements` (in `campaign-monitoring.ts`), `creatorStatusLabel`/`TikTokIcon` (in `CreatorsTable.tsx`).
- shadcn-Bausteine `dialog`, `badge`, `avatar`, `separator`, `collapsible`, `tooltip` sind alle vorhanden – keine neuen Pakete.

Noch nicht verifiziert: ob die View/Tabelle `creator_content` die Spalten `image_url`, `video_url`, `caption`, `uploaded_at` sowie `collabs.brand_rating`, `brand_feedback`, `creator_remark` führt. Erster Umsetzungsschritt ist daher eine Select-Probe gegen das verbundene Supabase-Projekt; fehlende Spalten werden gemeldet und im Dialog als "–" behandelt statt selektiert.

## Umsetzung

### 1. `src/lib/collab-dialog.ts` (neu)
`CollabDialogData` = `CurationCollab` plus optionale Felder `delivery_note`, `content`, `brand_rating`, `brand_feedback`, `creator_remark`. Dazu `COLLAB_STATUSES`, `CollabStatus`, `collabStatus()` (unbekannt/NULL → `applied`) und `showContact()` (erst ab `hired`). Keine weitere Phasen-Abstraktion.

### 2. `src/lib/campaign-monitoring.ts`
- `DeliveredContent` um `image_url`, `video_url`, `caption`, `uploaded_at` erweitern und im Select ergänzen.
- `brand_rating`, `brand_feedback`, `creator_remark` auf Collab-Ebene selektieren und in `MonitoringCollab` durchreichen.
- `campaign-curation.ts` bleibt unverändert (optionale Felder machen `CurationCollab` typkompatibel).

### 3. `src/components/app/CollabDialog.tsx` (neu)
Props: `collab`, `open`, `onOpenChange`, optionaler `actions`-Slot. `DialogContent`: `sm:max-w-2xl max-h-[85vh] overflow-y-auto`, `DialogTitle` als `sr-only`.

- Header (immer): Avatar 16, Nickname + Status-Badge (schwarz bei `delivered`/`approved`) + Match-Badge; Social-Zeile mit Icon-Links (Instagram Follower + Rate, TikTok, YouTube, LinkedIn nur Icon); rechts Preis gross plus `creatorCard.offer`: `platform · post_type`.
- Sektionen nach Status:

```text
applied    offen: Bewerbung
selected   offen: Bewerbung (inkl. Rang)
hired      offen: Bewerbung, Hinweis "Bestätigung ausstehend"   | eingeklappt: Kontakt
working    offen: Bewerbung, Hinweis "Lieferung ausstehend"     | eingeklappt: Kontakt
delivered  offen: (Bewertung falls brand_rating), Lieferung     | eingeklappt: Bewerbung, Kontakt
approved   offen: Bewertung, Lieferung                          | eingeklappt: Bewerbung, Kontakt
```

- Bewerbung: Pitch als Volltext (`whitespace-pre-wrap`), Fallback kursiv muted; `creator_remark` als Field; bei `selected` Rang `#rank`.
- Status-Hinweis: muted Block mit `Clock`-Icon.
- Lieferung: `delivery_note` als Volltext; Content-Karte `grid grid-cols-[96px_1fr]` mit Thumbnail (`image_url`, sonst `<video>` aus `video_url`, sonst `ImageOff`-Platzhalter), Plattform/Typ + `ExternalLink` auf `platform_link`, Caption mit `line-clamp-3` und Klick-Toggle, Metriken (Eye/Heart/MessageCircle/Share2 mit `formatNumberCh`), `uploaded_at` als `dd.MM.yyyy` und rechts hervorgehoben `eCPE`. Ohne Content: Hinweis `noContentLinked`.
- Bewertung: fünf `Star`-Icons gefüllt bis `brand_rating`, darunter `brand_feedback`.
- Kontakt (nur `showContact`): 2-Spalten-Grid mit Name, E-Mail (`mailto:`), Mobile (`tel:`), Adresse, Firma über bestehende `creatorsList.detail.*`/`columns.*`-Keys.
- Fusszeile: `Separator`, rechts `{actions}` oder Schliessen-Button.
- Lokale Bausteine: `Section`, `Field`, `SocialStat`.

### 4. Verwendung umstellen
`CurationBoard.tsx` und `campaigns.monitor.$id.tsx` auf `CollabDialog` mit `collab={profile}` umstellen; `CreatorProfileDialog.tsx` danach löschen.

### 5. i18n
Namespace `collabDialog.*` in `de.json` gemäss Vorgabe ergänzen; bestehende Keys wiederverwenden.

## Nebenwirkungen
- Nur Curate- und Monitor-Seite betroffen; Influencer-Listen und `creator-profile/*` bleiben unverändert.
- Kein Schema-Change, keine neuen Queries, kein Lovable Cloud.
- Abschluss mit Typecheck und Build.
