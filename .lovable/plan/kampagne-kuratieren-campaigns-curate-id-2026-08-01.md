# Kampagne kuratieren — /campaigns/curate/$id

Ausbau der bestehenden Platzhalter-Route zu einer Kurations-Seite: Bewerbungen prüfen und Creators per Drag & Drop auswählen.

## Voraussetzung (durch dich)

In der verbundenen Datenbank (rssnbsduduboxlrvpodw) fehlen in `collabs` noch die Spalten `rank` und `match` — du legst sie an (beide integer, nullable). Ich lege dafür ein SQL-Snippet unter `.lovable/external-supabase-collabs-rank-match.sql` ab (inkl. Hinweis auf UPDATE-Policy für `collabs`, damit Statuswechsel und Rank-Schreibvorgänge erlaubt sind) und passe danach die generierten Typen an. Kein Lovable Cloud, keine automatische Migration.

## Seitenaufbau

1. Zurück-Link und Titel «Kampagne kuratieren»
2. Bestehende `CampaignCard` (Visual, Titel, Briefing) für `campaigns.id = $id`
3. Card «Kennzahlen und erwartete Performance», zweispaltig:
   - links: erreichte Followers (Summe Platzhalter 1234 pro selected Creator, de-CH mit Tausender-Trennzeichen), Engagement Rate «12.4%», Matching Zielgruppe «88.7%», Matching Region «92.2%»
   - rechts: Kosten Cash (Summe `collabs.price` der selected), Kosten Barter (Anzahl selected × `campaigns.barter_value`), CPM «CHF 12.91», CPE «CHF 3.17»
   - Werte berechnen sich aus dem aktuellen Query-Ergebnis und aktualisieren sich nach jeder Statusänderung sofort
4. Zwei Listen-Cards, ab 1024 px nebeneinander, darunter gestapelt:
   - links «ausgewählt sind» (`status = 'selected'`, sortiert nach `rank` aufsteigend), leer: «Influencers per Drag & Drop für die Kampagne auswählen»
   - rechts «beworben haben sich» (`status = 'applied'`, sortiert nach `match` absteigend), leer: «Influencers per Drag & Drop zurückstellen»

## Drag & Drop

- Umsortieren innerhalb der linken Liste schreibt `rank` 1..n direkt in die Datenbank.
- Umsortieren rechts wird nur im Browser (localStorage, Key pro Kampagne) gespeichert.
- rechts → links: `status = 'selected'`, Einfügen an Drop-Position, alle `rank` der linken Liste neu schreiben.
- links → rechts: `status = 'applied'`.
- Nach jedem Schreibvorgang wird der Kurations-Query invalidiert, Kennzahlen rechnen neu. Optimistisches UI-Update, bei Fehler Rollback + Toast.

## CreatorCard (kompakt)

- Zeile 1: rundes Foto (`creators.foto_url`, Fallback-Icon), rechts daneben `nick_name`, ganz rechts `collabs.price` als CHF; darunter Instagram/TikTok/YouTube-Icon je mit Link und Follower-Platzhalter 1'234 (nur wenn URL vorhanden).
- Zeile 2: `collabs.pitch` mit `line-clamp-3`.
- Klick auf die Card öffnet das Creator-Profil als Dialog-Overlay (read-only, gleiche Felder wie `/influencers/$id`).
- Social-Icon-Klicks öffnen neuen Tab und stoppen Propagation sowie Drag-Start.
- Drag-Kennzeichnung: links auf der Card ein Griff-Icon (`GripVertical` aus lucide-react) in gedämpfter Farbe, das beim Hover deutlicher wird; Cursor `grab` bzw. `grabbing` beim Ziehen. Das Icon ist der dnd-kit Drag-Handle, sodass Ziehen bewusst darüber startet und der Card-Klick (Profil-Overlay) davon unberührt bleibt. Tooltip/`aria-label` «Zum Verschieben ziehen».

## Technische Umsetzung

- Neu: `src/lib/campaign-curation.ts` — Query (`collabs` + `creators` join, campaign-scoped, über bestehenden Supabase-Client) und Mutationen `setCollabStatus`, `saveRanks`.
- Neu: `src/components/app/CreatorMiniCard.tsx`, `src/components/app/CreatorProfileDialog.tsx`, `src/components/app/CurationBoard.tsx` (dnd-kit), `src/components/app/CampaignCalculationCard.tsx`.
- Umbau: `src/routes/_authenticated/campaigns.curate.$id.tsx`.
- `bun add @dnd-kit/core @dnd-kit/sortable @dnd-kit/modifiers`.
- Alle Labels als neue Keys unter `campaigns.curate.*` in `src/locales/de.json`; Formatierung über `Intl.NumberFormat('de-CH')` bzw. CHF-Currency in `src/lib/utils.ts`.
- Fehler- und Ladezustände wie in `CreatorsListPage` (Card mit Meldung + Retry), damit RLS-Fehler sichtbar bleiben.

## Nicht in diesem Schritt

Einladen/Favoriten, echte Formeln für Engagement/Matching/CPM/CPE, Pin-/Sidebar-Funktion des Overlays.
