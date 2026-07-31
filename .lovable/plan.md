# RLS-Rekursion der Influencer-Listen beheben

## Ursache

Die vorhandene SELECT-Policy `brand users read active creators` auf `creators` fragt direkt `collabs` ab. Die App lädt gleichzeitig `collabs` mit einem eingebetteten `creators`-Datensatz. Dadurch wird die `creators`-Policy über `collabs` erneut ausgewertet und PostgreSQL bricht mit `42P17 infinite recursion` ab.

## Umsetzung

1. **Rekursionsfreie Berechtigungsprüfung bereitstellen**
   - Das bestehende externe-Supabase-SQL-Snippet aktualisieren.
   - Die Prüfung „Creator hat mindestens eine aktive Collab“ in eine eng begrenzte `SECURITY DEFINER`-Hilfsfunktion verschieben, die `collabs` ohne erneute RLS-Auswertung prüft.
   - Ausführungsrechte der Funktion von `PUBLIC` und `anon` entziehen und ausschließlich `authenticated` gewähren.

2. **Creator-Policy ersetzen**
   - Die rekursive `creators`-Policy entfernen und mit einer Policy neu anlegen, die nur `is_brand_user()` und die neue Hilfsfunktion aufruft.
   - Die bestehende Einschränkung auf Collabs mit Status `applied` oder `hired` beibehalten.
   - Die `collabs`-Policy unverändert lassen, da sie selbst keine Abfrage auf `creators` enthält.

3. **Bestehendes Setup absichern**
   - Das SQL idempotent gestalten (`CREATE OR REPLACE`, `DROP POLICY IF EXISTS`), damit es im SQL-Editor des bestehenden Projekts erneut ausgeführt werden kann.
   - Keine Lovable Cloud-Aktivierung, keine neue Datenbank und keine Tabellen- oder Spaltenänderungen.

4. **Verifizieren**
   - Nach Ausführung des korrigierten SQLs `/influencers/applied`, `/influencers/current` und `/influencers/hired` als eingeloggter Brand-User prüfen.
   - Sicherstellen, dass die Listen ohne `42P17` laden, die Brand-gefilterten Routen nur passende Kampagnen zeigen und Creator-Detailseiten weiterhin lesbar sind.

## Technische Details

- Betroffene Datei: `.lovable/external-supabase-creators-read-policies.sql`
- Die Frontend-Abfrage in `src/lib/creators-list.ts` muss für diesen Fehler nicht geändert werden; sie macht den Datenbankfehler bereits korrekt sichtbar.
- Das korrigierte SQL muss anschließend manuell im SQL-Editor des verbundenen externen Supabase-Projekts ausgeführt werden.