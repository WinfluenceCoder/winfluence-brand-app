# Schritt 2/2: /campaigns/monitor/$id auf View creator_sedcard umstellen

Die Monitoring-Seite lädt Creator-Stammdaten künftig aus der View `creator_sedcard` (statt `creators`) und zeigt zusätzlich die echten Content-Kennzahlen der gelieferten Beiträge. Curate bleibt unverändert.

## Datenlayer (`src/lib/campaign-monitoring.ts`)

- Lokale `CREATOR_FIELDS`-Konstante entfernen, stattdessen `CREATOR_FIELDS` und `CurationCreator` aus `@/lib/campaign-curation` importieren.
- Neuer Typ `DeliveredContent` (id, platform, content_type, reach, likes, comments, shares, platform_link).
- `MonitoringCollab = CurationCollab & { delivery_note: string | null; content: DeliveredContent | null }`.
- Select: `id, status, price, pitch, rank, match, platform, post_type, delivery_note, creator:creator_sedcard!inner(CREATOR_FIELDS), content:creator_content(id, platform, content_type, reach, likes, comments, shares, platform_link)`; Filter unverändert (`campaign_id`, Status `hired`/`working`/`delivered`, `order("rank")`).
- Mapping: Engagement-Rates über die in `campaign-curation.ts` vorhandene Logik. Da `mapCreator`/`toNumber` dort bislang nicht exportiert sind, werden sie dort **zusätzlich exportiert** (rein additiv, keine Verhaltensänderung) und hier wiederverwendet; `content` wird zu `r.content ?? null` normalisiert.
- Neue Helfer: `contentEngagements(content)` (likes+comments+shares, `null` wenn kein Content oder alle drei `null`) und `effectiveCpe(collab)` (price / engagements, `null` bei fehlenden Werten oder 0).

## Creator-Karte (`MonitoringCreatorCard.tsx`)

Bleibt eigenständig (kein Import von `CreatorMiniCard`), rendert zwei Varianten:

- **hired / working:** Layout wie auf /curate — Avatar + Match-Badge, Zeile mit Nickname, Status-Badge und Preis, Social-Zeile (lokale `SocialStat`-Kopie: Instagram mit Follower + Rate, TikTok, YouTube; `–` bei `null`, Link nur bei vorhandener URL), «Angebot»-Zeile, Pitch mit `line-clamp-3`. Keine ECPE-Anzeige.
- **delivered / approved:** Avatar + Match-Badge, Zeile mit Nickname, schwarzem Status-Badge, External-Link-Icon (nur wenn `content.platform_link` gesetzt, öffnet neuen Tab, stoppt den Karten-Klick) und Preis. Keine Follower-Zeile. Darunter «geliefert: platform · post_type» links und hervorgehoben `eCPE: …` rechts, dann die Metrik-Zeile mit Eye/Heart/MessageCircle/Share2 (nur wenn Content vorhanden, `–` bei `null`) und schliesslich `delivery_note` mit `line-clamp-3`.

## Performance-Card (`MonitoringPerformanceCard.tsx`)

- Neue Props `{ delivered: MonitoringCollab[]; barterValue: number | null }`.
- `useMemo` summiert ausschliesslich über gelieferte Collabs: Reichweite, Likes, Kommentare, Shares (`?? 0`), daraus Engagements, effektive Engagement Rate (Engagements/Reichweite in %), Cash (Summe Preise), Barter (Anzahl × Warenwert), eCPM (Cash/Reichweite × 1000) und eCPE (Cash/Engagements); Quotienten `null`, wenn der Divisor 0 ist.
- Titel «Performance effektiv». Links 5 Zeilen (Reichweite, Likes, Kommentare, Shares, effektive Engagement Rate), rechts 5 Zeilen (Kosten Cash, Kosten Barter, eCPM, eCPE, Zielerreichung fix `--`), gleiches `Metric`-Layout wie bisher.

## Route (`campaigns.monitor.$id.tsx`)

- `campaign`-Cast um `barter_value: number | null` erweitern (identisch zur Curate-Route) und `delivered` sowie `barterValue={campaign?.barter_value ?? null}` an die Performance-Card übergeben. Reihenfolge/Position der Card bleibt; vor dem Laden ist `delivered` leer.

## i18n (`de.json`)

- Unter `campaigns.monitor` ergänzen: `deliveredLabel`, `openContent`; `performance` auf Titel «Performance effektiv» plus `reach`, `likes`, `comments`, `shares`, `effectiveEngagementRate`, `costCash`, `costBarter`, `eCpm`, `eCpe`, `goalAchievement` umstellen. Nicht mehr genutzte Keys (`impressions`, `clicks`, `engagementRate`, `cpm`, `cpe`) entfernen, nachdem geprüft ist, dass sie nirgends sonst verwendet werden. Bestehende `creatorCard.*`-Keys werden wiederverwendet.

## Absicherung

Falls das `creator_sedcard`-Embedding mit `PGRST200` fehlschlägt: Collabs ohne Embedding laden, View separat via `.in("id", ids)` abfragen und clientseitig mergen; das Ergebnis wird im Chat gemeldet. Keine Schema-Änderungen, keine Migrationen, kein Lovable Cloud; ausschliesslich der bestehende Supabase-Client.
