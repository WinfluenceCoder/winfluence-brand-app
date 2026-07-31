# Influencer-Listen: Fehlerursache sichtbar machen und beheben

## Stand der Prüfung

- `/influencers/applied` und `/influencers/current` zeigen beide die generische Fehlerseite („Diese Seite konnte nicht geladen werden“). Der Fehler tritt also nicht nur beim Brand-Filter auf, sondern in beiden Listen.
- Die Abfragen selbst sind syntaktisch gültig: dieselben PostgREST-Requests (`collabs` mit Embeds auf `creators` bzw. `campaigns`) liefern gegen die Datenbank Status 200 zurück — ohne Session allerdings ein leeres Ergebnis, weil RLS greift.
- In den aufgezeichneten Netzwerk-Requests der App taucht kein `collabs`-Request auf, und es sind keine Runtime-Fehler protokolliert. Die konkrete Fehlermeldung des eingeloggten Aufrufs ist damit noch **nicht bekannt** — die Diagnose ist offen.

Wahrscheinlichste Kandidaten (unbestätigt): die neu angelegten Policies/Funktion liefern für den eingeloggten Brand-User einen Datenbankfehler (z. B. beim Zugriff der `creators`-Policy auf `collabs`), oder ein Spaltenname im Embed passt nicht.

## Vorgehen

1. **Fehler sichtbar machen**
   - Datenabruf in `src/lib/creators-list.ts`: PostgREST-Fehler nicht mehr nur als `message` weiterwerfen, sondern `code`, `details` und `hint` mit ausgeben und zusätzlich per `console.error` loggen.
   - `src/components/app/CreatorsListPage.tsx`: statt `useSuspenseQuery` (das den Fehler an die Route-Fehlerseite weiterreicht) `useQuery` verwenden und einen Fehlerzustand direkt in der Seite rendern — Titel bleibt sichtbar, darunter eine Karte mit der Original-Fehlermeldung und einem „Erneut versuchen“-Button.
   - Loader der Routen `/influencers/current`, `/influencers/applied`, `/influencers/hired`: Prefetch so ausführen, dass ein Fehler die Route nicht mehr abbricht (Prefetch ohne Werfen), damit die Seite immer rendert.

2. **Ursache ablesen und beheben**
   - Mit der dann angezeigten Meldung (bzw. dem Console-Log) die tatsächliche Ursache bestimmen und gezielt fixen:
     - Bei Rechte-/Policy-Fehler: korrigiertes SQL-Snippet unter `.lovable/` bereitstellen (nur Rechte/Policies, keine Schema-Änderungen).
     - Bei Spalten-/Embed-Fehler: die Abfrage in `src/lib/creators-list.ts` anpassen.

3. **Verifikation**
   - Beide Routen im Preview aufrufen und prüfen, dass entweder Zeilen erscheinen oder eine verständliche Meldung statt der generischen Fehlerseite steht.

## Technische Details

- Betroffene Dateien: `src/lib/creators-list.ts`, `src/components/app/CreatorsListPage.tsx`, `src/routes/_authenticated/influencers.current.tsx`, `.applied.tsx`, `.hired.tsx`, ggf. neues SQL-Snippet unter `.lovable/`.
- Es bleibt beim bestehenden externen Supabase-Projekt, nur lesende Zugriffe, kein Lovable Cloud, keine Schema-Änderungen.
