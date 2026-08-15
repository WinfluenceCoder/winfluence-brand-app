# /influencers/hired: Status um `working` und `delivered` erweitern

## Ziel
Die Liste `/influencers/hired` soll neben `hired` auch Creators einbeziehen, deren `collabs.status` den Wert `working` oder `delivered` hat. Die Status-Spalte zeigt die passenden Badges, das Status-Dropdown bietet alle drei Optionen.

## Befund: RLS blockt derzeit `working`/`delivered`
Die RLS-Policies in `.lovable/external-supabase-creators-read-policies.sql` filtern aktuell auf `status::text IN ('applied','selected','hired')` — an zwei Stellen:
- Policy `brand users read active collabs` auf `public.collabs`
- Hilfsfunktion `public.creator_has_active_collab(bigint)` (steuert die `creators`-Lese-Policy)

Das bedeutet: Selbst dass die Liste `/influencers/current` im Frontend bereits `working`/`delivered` anfragt (vorheriger Change), liefert RLS keine solchen Zeilen — sie werden serverseitig ausgefiltert. Dasselbe gilt für `/influencers/hired`. Die `status`-Spalte der Tabelle ist ein einfacher Text-Typ (`string | null`, kein Enum/CHECK), also ist keine Schema-Änderung nötig; nur die `IN (...)`-Listen der Policies.

## Änderungen

### 1. Frontend — `src/routes/_authenticated/influencers.hired.tsx`
Loader-Prefetch und `statuses`-Prop von `["hired"]` auf `["hired", "working", "delivered"]` erweitern (beide identisch). Weil nun >1 Status, erscheint das Status-Dropdown in `CreatorsTable` automatisch; die Badges für `working` (default, «In Arbeit») und `delivered` (outline, «Geliefert») sind in `CreatorsTable.tsx` bereits vorhanden.

### 2. Datenbank (externes Supabase-Projekt, manuell auszuführen)
`.lovable/external-supabase-creators-read-policies.sql` an beiden Stellen auf `('applied','selected','hired','working','delivered')` erweitern:
- `public.creator_has_active_collab(bigint)` — `WHERE ... AND c.status::text IN ('applied','selected','hired','working','delivered')`
- Policy `brand users read active collabs` — `AND status::text IN ('applied','selected','hired','working','delivered')`

Beide sind idempotent (`CREATE OR REPLACE` / `DROP POLICY IF EXISTS`). Du führst das Snippet im SQL-Editor des Projekts `rssnbsduduboxlrvpodw` aus.

Dieser RLS-Fix schliesst die Lücke auch für `/influencers/current`, sodass die dort bereits angefragten `working`/`delivered`-Zeilen endlich sichtbar werden.

## Nebenwirkungen
- Keine Schema-Änderung, keine neuen Übersetzungsschlüssel (working/delivered existieren bereits unter `creatorsList.status`).
- `/influencers/applied` (nur `applied`, `selected`) bleibt unberührt.
- Sobald die RLS-Listen erweitert sind, sehen Brand-User in allen drei Listen auch `working`/`delivered`-Collabs — das ist explizit gewollt, da diese Status eine laufende bzw. abgeschlossene Beauftragung repräsentieren.

## Verifikation
Nach dem SQL-Lauf eingeloggt im Preview prüfen: `/influencers/hired` zeigt Zeilen mit `working` und `delivered`, das Dropdown enthält «In Arbeit» und «Geliefert» und filtert korrekt; `/influencers/current` zeigt ebenfalls die zuvor fehlenden `working`/`delivered`-Zeilen.
