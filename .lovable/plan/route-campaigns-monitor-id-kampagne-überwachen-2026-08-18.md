# Route /campaigns/monitor/$id — Kampagne überwachen

Die bestehende Stub-Route wird zur Monitoring-Seite ausgebaut, aufgebaut wie /campaigns/curate/$id, aber ohne Drag & Drop und ohne Mutationen.

## Seitenaufbau

1. Zurück-Button und Titel «Kampagne überwachen»; rechts auf derselben Zeile ein dezenter Hinweis:
   - `ende >= heute`: «läuft noch XY Tage» (aufgerundete Tage)
   - `ende < heute`: «am 18.08.2026 beendet» (de-CH)
   - `ende` leer: kein Hinweis
2. Wenn `campaign.status !== 'running'`: statt der Sektionen eine Card mit dezentem Hinweis (kein Redirect).
3. Sektion 1: bestehende `CampaignCard` mit denselben Props wie auf /curate.
4. Sektion 2: neue Card «Performance» mit statischen Platzhalter-KPIs (Impressions, Reichweite, Engagement Rate, Klicks / CPM, CPE, Kosten Cash, Kosten Barter) im gleichen zweispaltigen Metric-Layout wie die Kalkulations-Card auf /curate.
5. Sektion 3: zwei Cards nebeneinander (ab 1024 px):
   - links «beauftragt sind» — Collabs mit Status `hired`/`working`, nach `rank` aufsteigend
   - rechts «geliefert haben» — Collabs mit Status `delivered`, nach `rank` aufsteigend
   - je eigener Leertext; einfache Liste, kein Drag & Drop
6. Zuunterst linksbündig der Button «Kampagne beenden» (`size="lg"`) als reiner Platzhalter ohne Funktion.

## Creator-Karte (Monitoring)

Eigenständige Kopie des Karten-Layouts von /curate, ohne Griff-Icon:
- Avatar mit Foto/Fallback, darunter der Match-Badge (gleiche Farbstufen wie auf /curate)
- Nickname, direkt daneben ein Status-Badge (`hired` orange, `working` grün, `delivered` outline) mit den bestehenden Status-Labels der Influencer-Listen
- statt der Follower-Zeile eine Zeile mit Plattform und Post-Typ («instagram · Reel», fehlende Werte als «–»)
- Preis rechts als CHF, Pitch mit drei Zeilen Begrenzung
- Klick auf die Karte öffnet das bekannte Creator-Profil-Overlay

## Technische Umsetzung

- Neu `src/lib/campaign-monitoring.ts`: Query auf `collabs` (`id, status, price, pitch, rank, match, platform, post_type` + `creators!inner(...)` mit denselben Creator-Feldern wie in `campaign-curation.ts`), gefiltert auf `campaign_id` und Status `hired`/`working`/`delivered`, `order("rank")`. Typ `MonitoringCollab` = `CurationCollab` + `platform`/`post_type`. `monitoringQueryOptions(campaignId)` mit Key `["campaign-monitoring", campaignId]`. Aufteilung der Listen clientseitig nach Status.
- Neu `src/components/app/MonitoringPerformanceCard.tsx` (statische KPIs) und `src/components/app/MonitoringCreatorCard.tsx` (Karte + Profil-Dialog-Handling), beide ohne dnd-kit.
- Umbau `src/routes/_authenticated/campaigns.monitor.$id.tsx`: Kampagne über `getMyCampaign` mit `useSuspenseQuery`, Monitoring-Daten über `useQuery` mit Lade-/Fehler-/Retry-Zustand analog /curate, Layout `max-w-6xl`.
- Wiederverwendet (unverändert): `CampaignCard`, `CreatorProfileDialog`, `formatChf`, `formatMatchPercent`, `matchBadgeClasses` aus `campaign-curation.ts`, `creatorStatusLabel` aus `CreatorsTable.tsx`.
- Alle neuen Texte als Keys unter `campaigns.monitor.*` in `src/locales/de.json` (inkl. `daysRemaining` mit `{{count}}` und `endedOn` mit `{{date}}`); bestehende Keys bleiben unverändert.

## Nicht Teil dieser Änderung

Keine Schema-Änderungen, keine Migrationen, kein Lovable Cloud, keine Mutationen; echte Performance-Werte und die Funktion von «Kampagne beenden» folgen später.
