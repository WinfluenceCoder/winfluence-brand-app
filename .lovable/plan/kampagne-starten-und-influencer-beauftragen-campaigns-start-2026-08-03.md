# Kampagne starten und Influencer beauftragen (`/campaigns/start/:id`)

Die bestehende Platzhalter-Route wird zur vollwertigen Seite ausgebaut. Kein Backend-Eingriff: nur Lesezugriffe über den bestehenden externen Supabase-Client bzw. die vorhandene Server-Function `getMyCampaign`.

## Seitenaufbau (von oben nach unten)

1. «← Zurück»-Link und Seitentitel «Kampagne starten und Influencer beauftragen» — gleiche Typografie/Position wie auf `/campaigns/publish/:id`.
2. **CampaignCard** — die bestehende Komponente `src/components/app/CampaignCard.tsx` wird unverändert wiederverwendet; Kampagne per `id` geladen.
3. **Card «Ausgewählte Influencers»** — read-only shadcn-Tabelle der Collabs mit `status = 'selected'`, sortiert nach `rank` aufsteigend. Spalten: Foto (rundes Avatar mit Initialen-Fallback), Nickname, Vorname, Nachname, Email, Mobile, Preis (CHF, Schweizer Format). Keine Links, kein Sortieren, kein Drag & Drop, keine Hover-Aktionen.
   Unter der Tabelle fett: «Total Kosten der Kampagne: CHF {Summe}» — client-seitig aus den geladenen Zeilen summiert.
   Existiert die Kampagne nicht oder gibt es keine `selected`-Collabs, erscheint statt der Tabelle der Hinweis «Keine ausgewählten Influencer vorhanden» und der CTA bleibt deaktiviert.
4. **Card «Starten und beauftragen»** — Aufbau/Stil wie die Card «Publizieren»:
   - Erklärtext mit eingesetzter Summe und Startdatum der Kampagne (Datum im Schweizer Format).
   - Checkbox «Ich habe die AGB gelesen und bin damit einverstanden.» mit «AGB» als internem Link auf `/terms`.
   - Linksbündig: Primary-Button «Starten & Beauftragen» (deaktiviert bis Checkbox angehakt bzw. wenn keine Influencer vorhanden) und Outline-Button «Abbrechen» (History back).
   - Der CTA hat vorerst **keine** Aktion (wird im nächsten Schritt spezifiziert).

Ladezustand: Skeletons analog `/campaigns/publish/:id`.

## Technische Umsetzung

- `src/routes/_authenticated/campaigns.start.$id.tsx`: bestehende Platzhalter-Route ausbauen; Auth-Guard über `_authenticated` bleibt unverändert, keine Router-Konfiguration nötig (File-based Routing).
- Kampagne: `useSuspenseQuery` + `useServerFn(getMyCampaign)` wie auf der Publish-Seite; Skeleton über eine `Suspense`-/`useQuery`-Variante analog Publish.
- Neue Query-Options `startSelectionQueryOptions(campaignId)` in `src/lib/campaign-curation.ts` (gleiches Modul, gleiche Muster wie `curationQueryOptions`): `collabs` gefiltert auf `campaign_id` und `status = 'selected'`, Join `creators!inner(...)`, `order('rank')`. Preisformatierung über den dort bereits vorhandenen `de-CH`-Currency-Formatter.
- Neue Tabellen-UI direkt in der Route (shadcn `Table`, `Avatar`), keine neue geteilte Komponente nötig.
- i18n: neuer Block `campaigns.start.*` in `src/locales/de.json` (`title`, `selectedInfluencers`, Spalten-Labels, `totalCost`, `sectionTitle`, `explanation`, `agbBefore`/`agbLinkLabel`/`agbAfter`, `ctaButton`, `cancelButton`, `emptyState`, `errorMessage`, `successToast`). Keine hartcodierten Strings.

## Backend

Keine Migrations, keine neuen Tabellen, keine Edge Functions, kein Lovable Cloud. Voraussetzung ist lediglich, dass die bestehenden RLS-Policies für `collabs`/`creators` (bereits für die Kurationsseite eingerichtet) `selected`-Zeilen lesbar machen.
