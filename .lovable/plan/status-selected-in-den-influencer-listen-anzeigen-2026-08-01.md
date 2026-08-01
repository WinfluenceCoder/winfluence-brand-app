# Status «selected» in den Influencer-Listen anzeigen

Die Listen `/influencers/applied` und `/influencers/current` sollen zusätzlich Creators mit Collab-Status `selected` enthalten, und das Status-Dropdown der Tabelle soll diesen Status als Filteroption anbieten.

## Frontend-Änderungen

- `src/lib/creators-list.ts`: `COLLAB_STATUSES` auf `["applied", "selected", "hired"]` erweitern (steuert die Optionen im Status-Dropdown).
- `src/routes/_authenticated/influencers.applied.tsx`: Status-Set auf `["applied", "selected"]` (Loader-Prefetch und `statuses`-Prop identisch). Damit erscheint auch das Dropdown, weil mehr als ein Status geladen wird.
- `src/routes/_authenticated/influencers.current.tsx`: Status-Set auf `["applied", "selected", "hired"]`.
- `/influencers/hired` bleibt unverändert (nur `hired`).
- `src/components/app/CreatorsTable.tsx`: `creatorStatusLabel` um den Fall `selected` ergänzen; Badge-Variante für `selected` festlegen (wie `applied`, `secondary`).
- `src/locales/de.json`: neuer Key `creatorsList.status.selected` = «Ausgewählt».

Keine Schema-Änderungen, keine Änderungen an der Datenabfrage-Logik selbst.

## Datenbank (externes Supabase-Projekt, manuell auszuführen)

Die bestehenden Lese-Policies begrenzen auf `status IN ('applied','hired')`. Ohne Anpassung liefert die Abfrage keine `selected`-Zeilen. Ich aktualisiere daher `.lovable/external-supabase-creators-read-policies.sql`, sodass beide Stellen `('applied','selected','hired')` verwenden:

- Policy `brand users read active collabs` auf `public.collabs`
- Hilfsfunktion `public.creator_has_active_collab(bigint)`

Du führst das aktualisierte Snippet im SQL-Editor des Projekts `rssnbsduduboxlrvpodw` aus; es ist idempotent (CREATE OR REPLACE / DROP POLICY IF EXISTS).

## Verifikation

Nach dem SQL-Lauf prüfe ich eingeloggt im Preview die Listen `current` und `applied`: `selected`-Einträge erscheinen, das Dropdown enthält «Ausgewählt» und filtert korrekt.
