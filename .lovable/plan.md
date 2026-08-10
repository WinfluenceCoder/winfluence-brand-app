# Fix: /messages?type=system zeigt "Diese Seite konnte nicht geladen werden"

## Ausgangslage (geprüft)

- Die Meldung stammt aus dem globalen `errorComponent` in `src/routes/__root.tsx` — d.h. irgendwo im Rendern/Laden der Seite fliegt eine Exception, die von keiner näheren Grenze abgefangen wird.
- Die Route existiert korrekt: `src/routes/_authenticated/messages.index.tsx` -> `/messages/`; der SSR-Request auf `/messages?type=all` antwortet mit HTTP 200 (Shell). Der Fehler passiert also clientseitig nach dem Hydrieren.
- Die Nachrichten-Route hat aktuell **kein** eigenes `errorComponent`, und die Datenfehler aus `src/lib/messages.ts` werden nirgends im UI angezeigt. Deshalb ist die konkrete Ursache aktuell nicht sichtbar (keine Console-Logs im Snapshot, keine Runtime-Errors erfasst).
- Die Ursache ist damit **noch nicht bestätigt**. Wahrscheinlichste Kandidaten: fehlende Leserechte/RLS auf `messages` in der externen Datenbank, oder ein Renderfehler bei unerwarteten Feldwerten (z. B. `type`/`prio` = NULL oder ein Wert ausserhalb der erwarteten Liste).

## Schritt 1 — Fehler sichtbar machen (zuerst)

- Eigenes `errorComponent` (und `notFoundComponent`) für die Nachrichten-Route ergänzen, das die technische Fehlermeldung im Klartext anzeigt plus "Erneut versuchen".
- In `src/lib/messages.ts` beim Fehlerfall die vollständigen Supabase-Details (message, details, hint, code) in die Fehlermeldung übernehmen, damit ein Rechte-/RLS-Problem sofort erkennbar ist.
- Danach `/messages?type=system` erneut aufrufen und die konkrete Meldung auslesen.

## Schritt 2 — Ursache beheben

Abhängig vom Ergebnis aus Schritt 1:

- **Datenzugriff (RLS/Grants) fehlt:** Kein Migrations-Code im Projekt; ich liefere ein SQL-Snippet zur Prüfung/Ergänzung der Policy für `messages` (Lesen/Update nur eigener Zeilen über `to_user_id = auth.uid()`), das Du in der externen Datenbank ausführst.
- **Unerwartete Feldwerte:** Datenschicht toleranter machen — `type` ausserhalb `system|user|moderator` als `system` behandeln, `prio` NULL als `normal`, fehlende `sent_at`/`subject`/`body` sauber abfangen; die Anzeige darf dabei nicht abbrechen.
- **Anderer Renderfehler:** an der Stelle gezielt korrigieren (minimaler Diff).

## Schritt 3 — Robustheit, damit das nicht wieder als weisse Fehlerseite endet

- Ladefehler der Liste erscheinen künftig als Inline-Hinweis in der Liste (mit "Erneut versuchen") statt als globale Fehlerseite.
- Fehler beim Statuswechsel (gelesen/ungelesen/löschen) weiterhin als Toast, wie bereits umgesetzt.
- Ungültige `type`-Werte in der URL fallen wie bisher auf "Alle" zurück.

## Technische Details

- Betroffene Dateien: `src/routes/_authenticated/messages.index.tsx` (Error-/NotFound-Boundary, Fehleranzeige), `src/lib/messages.ts` (Fehlerdetails, Normalisierung der Feldwerte), evtl. `src/components/app/MessagesList.tsx` (Fehlerzustand in der Liste).
- Keine Schema-Änderungen, keine Migrationen, keine Lovable-Cloud-Funktionen; ausschliesslich der bestehende externe Supabase-Client.
- Abschluss mit Typecheck.
