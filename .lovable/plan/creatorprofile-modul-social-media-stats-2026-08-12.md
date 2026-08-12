# CreatorProfile-Modul (Social-Media-Stats)

Ziel: Wiederverwendbares Modul `<CreatorProfile creatorId={number} />` mit Instagram/TikTok/YouTube-Tabs. Die Route `/influencers/$id` rendert nur noch dieses Modul; die bisherigen Kontakt-/Adress-Karten entfallen (Kontaktinfos leben weiterhin im Kurations-Dialog).

## Datenschicht

Neue Datei `src/lib/creator-stats.ts` (Muster wie `src/lib/creators-list.ts`, Browser-Client + React Query):

- `creatorProfileQueryOptions(creatorId)` — lädt Creator-Basisdaten (`nick_name`, `foto_url`, Social-URLs, `status`, `e_mail_address`) plus alle Zeilen aus `creator_social_stats` für diesen Creator.
- Lokale TypeScript-Typen für `creator_social_stats` (Tabelle fehlt in den generierten Supabase-Typen) inkl. schmaler Typen für `raw_json` (`mentions`, `postArray`, `reelArray`, Zusatzfelder) und `raw_audience_json` (`audienceAnalysis`, `audienceAnalysisLikers`, `cpms`).
- `syncCreatorStats({ creatorId, platform?, includeAudience? })` — `supabase.functions.invoke("sync-creator-stats", …)`; erkennt `skipped_fresh` / `skipped_audience_fresh` in der Antwort und gibt sie typisiert zurück. Fehler werden mit Details (message/hint/code) geworfen und als Toast angezeigt.
- Mutationen invalidieren den Profil-Query (Refetch).

Format-Utilities in `src/lib/format.ts`: `formatNumber` (de-CH/de-DE, kompakt ab 10k: „19,9 k", „1,2 M"), `formatPercent`, `asPercent(v)` (v ≤ 1 → ×100), `formatRelativeDate` (date-fns, deutsch).

## Komponenten (`src/components/app/creator-profile/`)

- `CreatorProfile.tsx` — Header (Foto/Initialen-Avatar, Name, Ort, Sprache, Social-Icon-Links, `type_score`-Badge) + Tabs. Tabs ohne hinterlegte URL sind disabled mit Tooltip „Kein Profil hinterlegt"; Standard-Tab = erste Plattform mit Daten.
- `PlatformTab.tsx` — Zustands-Weiche nach `fetch_status`: keine Zeile (Empty-State + „Daten laden"), `pending_enrichment`/`processing` (Info-Panel mit `checked_at`, „Erneut prüfen"), `not_found` (Warn-Panel mit `handle`), `error` (Fehler-Panel + Retry), `ok` (volles Profil).
- `PlatformStats.tsx` — Stand-Zeile („Stand: vor 2 Tagen" + „Daten aktualisieren"), zwei KPI-Reihen (Follower, ER, Ø Views, Wachstum absolut+% mit Trendpfeil grün/rot; Following, Posts, Ø Likes, Ø Kommentare; bei Instagram zusätzlich Engagement Reels und Ø Plays/Reel), Bio & Kontakt (mailto/website, Gender, Sprache), Kategorien-Balken, Brand-Mentions-Tabelle (Top 15 + Expander), Content-Grid aus `postArray`/`reelArray` (Bild mit `onError`-Platzhalter, Typ-Badge, Likes/Kommentare/Plays, Datum, Link), Expander „Alle Details" mit weiteren `raw_json`-Feldern.
- `AudienceSection.tsx` (nur Instagram) — Fall A: Panel „Audience-Report laden" mit Hinweis „Verbraucht 20 API-Requests"; Fall B: Qualitäts-Cards (Credibility-Gauge, echte Personen, Mass-Follower, verdächtig, neutraler Tooltip zur Klasse), Demografie (gestapeltes Alters-Balkenchart, Median-Alter, Gender-Donut), Geografie (Länder Top 10, Städte, Sprachen, US-States im Expander), Interessen/Brand-Affinity als Chip-Cloud, Reachability-Balken, Lookalikes-Grid, Notable Audience, CPM-Tabelle (Null-Zeilen weglassen), Liker-Analyse kompakt im Expander.
- Kleine geteilte Bausteine: `KpiCard`, `BarList`, `ChipCloud`, `PersonGrid`, `SectionSkeleton`.

Charts mit recharts (bereits installiert), einfarbig in Akzentfarbe. Nur shadcn/ui + Tailwind-Tokens, Instagram-Gradient nur als schmaler Tab-Akzent.

## Route

`src/routes/_authenticated/influencers.$id.tsx` wird ersetzt: Back-Link + `<CreatorProfile creatorId={Number(id)} />`, Loader über `ensureQueryData`, `errorComponent` und `notFoundComponent` mit lesbarer Fehlermeldung.

## Defensive Regeln

Alle Felder optional behandeln (Fallback „–"), leere Sektionen komplett ausblenden, `raw_json`-Zugriffe nur mit optional chaining + Array-Checks, Bilder mit Platzhalter-Fallback, Loading-Skeletons pro Sektion.

## i18n

Neuer Zweig `creatorProfile` in `src/locales/de.json` für alle Labels, Panels, Tooltips und Toasts.

## Hinweise

- Keine Änderungen an der Datenbank und keine Edge Functions in diesem Schritt; Migration und `sync-creator-stats` müssen live sein.
- influData wird nie direkt aufgerufen — ausschließlich Supabase-Tabellen und die Edge Function.
- Abschluss mit Typecheck.
