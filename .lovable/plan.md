# Creator 18 fehlt in /influencers/current — Ursache eingrenzen und beheben

## Was ich prüfen konnte

- Die Liste `/influencers/current` lädt über `src/lib/creators-list.ts` alle `collabs` mit `status in ('applied','selected','hired')` und einem **inner join** auf `creators`. Kein Brand-Filter (`brandScoped` ist hier nicht gesetzt).
- Zeilen ohne verknüpften Creator oder mit einem anderen Collab-Status erscheinen dadurch gar nicht; pro Creator wird nur die neueste Zeile angezeigt (Dedup über `creator_id`).
- Eine direkte Datenprüfung war mir nicht möglich: ohne angemeldete Session liefert die Datenbank durch RLS für `collabs` und `creators` leere Ergebnisse. Die konkrete Ursache ist damit **noch nicht bestätigt** — Schritt 1 klärt sie.

Mögliche Ursachen (unbestätigt, in Reihenfolge der Wahrscheinlichkeit):

1. Creator 18 hat keine Collab-Zeile mit einem der drei Status (z. B. `invited`, `declined`, `rejected`).
2. Die Collab-Zeile ist sichtbar, aber die `creators`-Leseregel greift nicht (die Hilfsfunktion `creator_has_active_collab()` deckt evtl. nicht alle drei Status ab). Beim inner join fällt die Zeile dann stillschweigend weg.
3. Die Collab-Zeile selbst ist durch die `collabs`-Policy nicht lesbar (fremde Kampagne / anderer Brand).

## Vorgehen

1. **Ursache sichtbar machen (Diagnose)**
   - Als eingeloggter Brand-User prüfen, was die Datenbank tatsächlich liefert: `collabs` für `creator_id = 18` (Status + Kampagne) sowie `creators` mit `id = 18`.
   - Ergebnis entscheidet: fehlende Daten (Fall 1) vs. Rechte-/Policy-Problem (Fall 2/3).

2. **Fix je nach Ergebnis**
   - Fall 1 (Status passt nicht): Verhalten ist korrekt — dann klären, ob `/influencers/current` weitere Status (z. B. `invited`) einschließen soll, und die Statusliste in `src/routes/_authenticated/influencers.current.tsx` entsprechend erweitern (Filter-Chips in `CreatorsTable` ziehen automatisch nach, i18n-Label ergänzen).
   - Fall 2 (creators-Policy): korrigiertes SQL-Snippet unter `.lovable/` bereitstellen, das `creator_has_active_collab()` auf alle drei Status ausweitet. Nur Policies/Funktion, keine Schema-Änderung.
   - Fall 3 (collabs-Policy): SQL-Snippet mit passender SELECT-Policy für die betroffene Sicht.

3. **Stille Ausblendung verhindern**
   - In `src/lib/creators-list.ts` beim Aufbereiten zählen, wie viele Collab-Zeilen wegen fehlendem Creator-Embed verworfen wurden, und das per `console.warn` loggen. So wird „Zeile existiert, Creator nicht lesbar" künftig sofort sichtbar statt unbemerkt.

4. **Verifikation**
   - `/influencers/current` aufrufen und prüfen, dass Creator 18 erscheint (bzw. begründet nicht erscheint).

## Technische Details

- Betroffene Dateien: `src/lib/creators-list.ts`, ggf. `src/routes/_authenticated/influencers.current.tsx`, `src/locales/de.json`, ggf. neues SQL-Snippet unter `.lovable/`.
- Weiterhin ausschließlich das bestehende externe Supabase-Projekt, keine Schema-Änderungen, kein Lovable Cloud.
