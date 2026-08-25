# Curate-Seite auf View `creator_sedcard` umstellen (Schritt 1/2)

Echte Social-Zahlen statt Platzhalter auf `/campaigns/curate/$id`, plus berechnete KPI-Card.

## Was sich für dich ändert

- Creator-Karten zeigen echte Follower/Abonnenten pro Plattform mit Engagement-Rate, z. B. `85'805 (11.3%)`. Fehlen Daten, steht `–` (nie 0).
- Neue Zeile «Angebot: instagram · reel» über dem Pitch, nur wenn Plattform oder Post-Typ gesetzt sind.
- Kennzahlen-Card rechnet live aus der linken Liste: Follower-Summe, gewichtete Engagement Rate, Kosten Cash/Barter, CPM, CPE. Matching-Werte zeigen bis auf Weiteres `n/a`. Keine hartkodierten Zahlen mehr.
- `/campaigns/start/$id` nutzt dieselbe Datenquelle und lädt weiter unverändert.

## Technische Umsetzung

### `src/lib/campaign-curation.ts`
- `FOLLOWER_PLACEHOLDER` entfernen (nur hier, in `CreatorMiniCard` und `CampaignCalculationCard` verwendet — Monitoring nutzt es nicht).
- `CurationCreator` um `instagram_followers`, `instagram_engagement_rate`, `tiktok_followers`, `tiktok_engagement_rate`, `youtube_subscribers`, `youtube_engagement_rate`, `stats_fetched_at` erweitern (alle nullable).
- `CurationCollab` um `platform` und `post_type` erweitern.
- `CREATOR_FIELDS` um die sieben KPI-Spalten ergänzen und exportieren (Schritt 2 importiert sie).
- `fetchCurationCollabs` und `fetchSelectedCollabs` selektieren `creator:creator_sedcard!inner(${CREATOR_FIELDS})` plus `platform, post_type`; `Raw`-Typ und Mapping entsprechend anpassen. `numeric`-Spalten (Engagement Rates) kommen von PostgREST als String und werden per `Number()` zu `number | null` gemappt, `null` bleibt `null`.

### `src/components/app/CreatorMiniCard.tsx`
- `SocialStat` erhält `value: number | null` und optional `rate?: number | null`: ohne URL nichts, mit URL aber ohne Wert `–` gedämpft, sonst `formatNumberCh(value)` und bei vorhandener Rate ` (10.4%)`. `title` über `creatorCard.followers` bzw. für YouTube `creatorCard.subscribers`.
- Angebots-Zeile zwischen Social-Zeile und Pitch, bedingt gerendert.

### `src/components/app/CampaignCalculationCard.tsx`
- Berechnung in einem `useMemo` aus `selected` (Instagram-Zahlen): Follower-Summe, follower-gewichtete Engagement Rate (nur Creator mit Followern **und** Rate), Cash-Summe, Barter, `CPM = cash/followers*1000`, `CPE = cash/(followers*rate/100)`. Fehlende Basis → `–`.
- `Metric` bleibt unverändert; Matching-Zeilen fix `n/a`.

### i18n
- Neuer Block `creatorCard` in `src/locales/de.json` mit `followers`, `subscribers`, `offer`.

### Fallback
Sollte PostgREST das Embedding mit `PGRST200` ablehnen, lade ich `collabs` ohne Embedding (inkl. `creator_id`), hole `creator_sedcard` in derselben `queryFn` per `.in("id", creatorIds)` und führe clientseitig zusammen — und melde den gewählten Weg im Chat.

## Nicht Teil dieses Schritts
Monitoring-Dateien, Creator-Profil-Komponenten, `creator-stats.ts`, `CreatorProfileDialog.tsx`; keine Schema- oder Policy-Änderungen.
